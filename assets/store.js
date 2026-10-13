/* ============================================================
   泳池水质人格 · 存储与授权层
   ------------------------------------------------------------
   设计目标：默认纯前端零部署；把「云端模式」预留成改一行配置即可切换。

   切换方法：
     把下面 CONFIG.MODE 改成 'cloud'，填好 SUPABASE.url / anonKey，
     并在云端建好表（SQL 见「部署与使用说明.md」）即可，
     业务代码（app.js）完全不用改 —— 它只依赖下面这组 Promise 接口：

       Store.verify(key)            -> { ok, reason, used, limit, remain }
       Store.consume(key)           -> { ok, reason, used, limit, remain }
       Store.status(key)            -> { used, limit, remain }
       Store.getSession()           -> { key, used, limit, sessionOpen } | null
       Store.setSession(obj)
       Store.clearSession()
       Store.saveProgress(obj) / Store.loadProgress() / Store.clearProgress()

   两种模式的差别（要如实告知使用者）：
     · local ：使用次数记在用户浏览器 localStorage 里。清缓存 / 换设备
               可以重置。适合 9.9–29 元的虚拟商品。
     · cloud ：使用次数记在云端数据库，清缓存和换设备都绕不过，
               还能在后台看到每个卡密被用了几次。适合客单价更高的产品。
   ============================================================ */
(function (global) {
  'use strict';

  var APP = global.POOL_CONFIG || {};
  var BE = APP.backend || {};

  var CONFIG = {
    MODE: BE.mode || 'local',          // 'local' | 'cloud'（在 assets/config.js 里改）
    SUPABASE: {
      url: (BE.supabaseUrl || '').replace(/\/+$/, ''),
      anonKey: BE.supabaseAnonKey || '',
      checkFn: 'pool_check_key',       // 只读校验函数
      consumeFn: 'pool_consume_key'    // 原子扣次函数
    },
    // 本地模式下的兜底次数上限（keys.js 里没写 limit 时使用）
    DEFAULT_LIMIT: 3,
    TIMEOUT: BE.timeout || 8000
  };

  var cloudErr = '';                    // 最近一次云端错误，供界面提示用

  var LS = {
    session: 'poolq_session_v1',
    usage: 'poolq_usage_v1',
    progress: 'poolq_progress_v1'
  };

  /* ---------------- 基础工具 ---------------- */
  function readJSON(k, def) {
    try { var s = localStorage.getItem(k); return s ? JSON.parse(s) : def; }
    catch (e) { return def; }
  }
  function writeJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 隐私模式忽略 */ }
  }
  function rm(k) { try { localStorage.removeItem(k); } catch (e) {} }

  /* 卡密归一化：转大写 + 只保留字母数字，客户怎么输都能对上 */
  function normalize(input) {
    if (typeof global.normalizeKey === 'function') return global.normalizeKey(input);
    return String(input == null ? '' : input).toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function poolKeys() { return global.POOL_KEYS || {}; }
  /* 清单是否为哈希模式（防源码里直接看到明文卡密） */
  function isHashed() {
    return !!poolKeys().hashed && typeof global.keyHash === 'function';
  }
  function keyList() {
    var k = poolKeys();
    if (!Array.isArray(k.keys)) return [];
    return isHashed()
      ? k.keys.map(function (h) { return String(h).toLowerCase(); })
      : k.keys.map(normalize);
  }
  /* 卡密是否在有效清单里 */
  function keyExists(nk) {
    if (poolKeys().hashed && typeof global.keyHash !== 'function') {
      console.error('[泳池水质人格] keys.js 是哈希模式，但 keyhash.js 没有加载。请检查页面是否引入了 assets/keyhash.js。');
      return false;
    }
    if (isHashed()) return keyList().indexOf(global.keyHash(nk).toLowerCase()) !== -1;
    return keyList().indexOf(nk) !== -1;
  }
  function limitOf() {
    var n = parseInt(poolKeys().limit, 10);
    return (n > 0) ? n : CONFIG.DEFAULT_LIMIT;
  }

  /* ---------------- 本地使用次数 ---------------- */
  function usageMap() { return readJSON(LS.usage, {}); }
  function usedOf(key) {
    var m = usageMap();
    return parseInt(m[key], 10) || 0;
  }
  function bumpUsage(key) {
    var m = usageMap();
    m[key] = (parseInt(m[key], 10) || 0) + 1;
    writeJSON(LS.usage, m);
    return m[key];
  }
  function setUsage(key, n) {
    var m = usageMap();
    m[key] = n;
    writeJSON(LS.usage, m);
  }

  /* ---------------- 统一返回体 ---------------- */
  function pack(key, used, extra) {
    var limit = limitOf();
    var r = {
      ok: used < limit,
      used: used,
      limit: limit,
      remain: Math.max(0, limit - used),
      reason: '',
      mode: CONFIG.MODE
    };
    if (!r.ok) r.reason = 'out';
    return Object.assign(r, extra || {});
  }

  /* ---------------- 云端接口 ---------------- */
  function cloudReady() {
    return CONFIG.MODE === 'cloud' && !!CONFIG.SUPABASE.url && !!CONFIG.SUPABASE.anonKey;
  }

  /* 统一请求封装：带超时，避免网络卡住时界面一直转圈 */
  function sb(path, opt) {
    opt = opt || {};
    var url = CONFIG.SUPABASE.url + path;
    var headers = {
      'apikey': CONFIG.SUPABASE.anonKey,
      'Authorization': 'Bearer ' + CONFIG.SUPABASE.anonKey,
      'Content-Type': 'application/json'
    };
    if (opt.body) headers['Prefer'] = 'return=representation';

    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, CONFIG.TIMEOUT) : null;

    return fetch(url, {
      method: opt.method || 'GET',
      headers: Object.assign(headers, opt.headers || {}),
      body: opt.body ? JSON.stringify(opt.body) : undefined,
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      if (timer) clearTimeout(timer);
      if (r.status === 429) throw new Error('ratelimit');
      if (r.status === 401 || r.status === 403) throw new Error('unauthorized');
      if (!r.ok) throw new Error('http ' + r.status);
      cloudErr = '';
      return r.status === 204 ? null : r.json();
    }, function (e) {
      if (timer) clearTimeout(timer);
      throw new Error(e && e.name === 'AbortError' ? 'timeout' : 'network');
    });
  }

  /* 把 RPC 返回的 json 统一成 {ok,used,limit,remain,reason,mode} */
  function fromRpc(res) {
    if (!res || typeof res !== 'object') {
      return { ok: false, reason: 'neterr', used: 0, limit: CONFIG.DEFAULT_LIMIT, remain: 0, mode: 'cloud' };
    }
    var used = parseInt(res.used, 10) || 0;
    var lim = parseInt(res.limit, 10) || CONFIG.DEFAULT_LIMIT;
    return {
      ok: !!res.ok,
      reason: res.reason || (res.ok ? '' : 'out'),
      used: used,
      limit: lim,
      remain: Math.max(0, lim - used),
      mode: 'cloud'
    };
  }

  function cloudFail(e) {
    cloudErr = (e && e.message) || 'network';
    return { ok: false, reason: 'neterr', used: 0, limit: CONFIG.DEFAULT_LIMIT, remain: 0, mode: 'cloud' };
  }

  var Store = {
    CONFIG: CONFIG,
    normalize: normalize,
    mode: function () { return cloudReady() ? 'cloud' : 'local'; },

    /* 校验卡密是否有效，并返回剩余次数（不消耗） */
    verify: function (input) {
      var key = normalize(input);
      if (!key) return Promise.resolve({ ok: false, reason: 'empty', used: 0, limit: limitOf(), remain: 0 });

      if (cloudReady()) {
        // 只调用服务端函数，卡密表对外完全不可读
        return sb('/rest/v1/rpc/' + CONFIG.SUPABASE.checkFn, { method: 'POST', body: { p_key: key } })
          .then(fromRpc, cloudFail);
      }

      var key = normalize(input);
      if (!key) return Promise.resolve({ ok: false, reason: 'empty', used: 0, limit: limitOf(), remain: 0 });
      if (!keyList().length) return Promise.resolve({ ok: false, reason: 'nolist', used: 0, limit: limitOf(), remain: 0 });
      if (!keyExists(key)) return Promise.resolve({ ok: false, reason: 'notfound', used: 0, limit: limitOf(), remain: 0 });
      return Promise.resolve(pack(key, usedOf(key)));
    },

    /* 消耗一次机会（开始一次测试时调用） */
    consume: function (input) {
      var key = normalize(input);

      if (cloudReady()) {
        // 服务端原子扣次（update ... where used < limit），并发下不会多扣也不会少扣
        return sb('/rest/v1/rpc/' + CONFIG.SUPABASE.consumeFn, { method: 'POST', body: { p_key: key } })
          .then(fromRpc, cloudFail);
      }

      var key = normalize(input);
      if (!keyExists(key)) return Promise.resolve({ ok: false, reason: 'notfound', used: 0, limit: limitOf(), remain: 0 });
      var used = usedOf(key);
      if (used >= limitOf()) return Promise.resolve(pack(key, used));
      var now = bumpUsage(key);
      return Promise.resolve(pack(key, now, { ok: true, reason: '' }));
    },

    /* 只读查询剩余次数 */
    status: function (input) {
      var key = normalize(input);
      if (cloudReady()) {
        return sb('/rest/v1/rpc/' + CONFIG.SUPABASE.checkFn, { method: 'POST', body: { p_key: key } })
          .then(function (res) {
            var r = fromRpc(res);
            return { used: r.used, limit: r.limit, remain: r.remain };
          }, function () { return { used: 0, limit: CONFIG.DEFAULT_LIMIT, remain: 0 }; });
      }
      var u = usedOf(key);
      return Promise.resolve({ used: u, limit: limitOf(), remain: Math.max(0, limitOf() - u) });
    },

    /* ---------------- 本机授权会话 ---------------- */
    getSession: function () { return readJSON(LS.session, null); },
    setSession: function (o) { writeJSON(LS.session, o); },
    clearSession: function () { rm(LS.session); },

    /* ---------------- 答题进度（刷新不丢） ---------------- */
    saveProgress: function (o) { writeJSON(LS.progress, o); },
    loadProgress: function () { return readJSON(LS.progress, null); },
    clearProgress: function () { rm(LS.progress); },

    /* ---------------- 管理后台用 ---------------- */
    _usageAll: function () { return usageMap(); },
    _setUsage: function (key, n) { setUsage(normalize(key), n); },
    _clearAllUsage: function () { rm(LS.usage); },
    _clearOne: function (key) {
      var m = usageMap(); delete m[normalize(key)]; writeJSON(LS.usage, m);
    },
    _keys: function () { return keyList(); },
    _limit: function () { return limitOf(); }
  };

  global.Store = Store;
})(window);
