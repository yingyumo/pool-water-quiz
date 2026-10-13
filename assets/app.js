/* ============================================================
   泳池水质人格 · 主程序
   流程：卡密门 → 选版本 → 答题（可回退）→ 结果 → 保存长图 / 分享链接
   ============================================================ */
(function () {
  'use strict';
  var Q = window.PoolQuiz;
  var QS = Q.state;                       // computeScores 读取的就是这个对象
  var CFG = window.POOL_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  var lastScore = null;                   // 当前结果
  var sharedMode = false;                 // 是否是打开别人的分享链接
  var pendingImage = null;                // 待保存的 PNG

  /* ---------------- 视图切换 ---------------- */
  function show(id) {
    ['view-gate', 'view-cover', 'view-quiz', 'view-result'].forEach(function (v) {
      var el = $(v); if (el) el.classList.toggle('on', v === id);
    });
    var bar = $('actionbar');
    if (bar) bar.classList.toggle('on', id === 'view-result' && !sharedMode);
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function toast(msg, ms) {
    var t = $('toast'); if (!t) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(t._t); t._t = setTimeout(function () { t.classList.remove('on'); }, ms || 2200);
  }

  /* ---------------- 卡密门 ---------------- */
  function gateMsg(html, cls) {
    var el = $('gateHint');
    el.className = 'hint' + (cls ? ' ' + cls : '');
    el.innerHTML = html;
    el.style.display = 'block';
  }

  function reasonText(r) {
    switch (r.reason) {
      case 'empty': return '请先输入卡密。';
      case 'notfound': return '这个卡密不在有效清单里，请核对后重试。<br>注意区分数字 <b>0</b> 和字母 <b>O</b>，本店卡密不使用 <b>0 / O / I / L / 1</b>。';
      case 'out': return '这个卡密的使用次数已经用完了（' + r.limit + ' 次）。<br>如需继续测试，请重新购买或联系客服。';
      case 'nolist': return '站点还没有导入卡密清单（assets/keys.js），请联系管理员。';
      case 'neterr': return '网络连接失败，请检查网络后重试。';
      default: return '核验失败，请稍后重试。';
    }
  }

  function renderLicBadge() {
    var s = window.Store.getSession();
    var el = $('licBadge');
    if (!el) return;
    if (!s) { el.textContent = ''; el.style.display = 'none'; return; }
    el.style.display = '';
    el.textContent = '剩余 ' + Math.max(0, s.limit - s.used) + ' / ' + s.limit + ' 次';
  }

  function onGateSubmit() {
    var raw = ($('keyInput').value || '').trim();
    if (!raw) { gateMsg('请先输入卡密。', 'warn'); return; }
    var btn = $('gateBtn');
    btn.disabled = true; btn.textContent = '正在核验…';

    window.Store.verify(raw).then(function (r) {
      btn.disabled = false; btn.textContent = '开始测试';
      if (!r.ok) { gateMsg(reasonText(r), 'warn'); return; }
      window.Store.setSession({
        key: window.Store.normalize(raw),
        used: r.used, limit: r.limit,
        sessionOpen: false, at: Date.now()
      });
      gateMsg('核验通过，本卡密剩余 <b>' + r.remain + '</b> 次。', 'ok');
      renderLicBadge();
      setTimeout(function () { show('view-cover'); }, 320);
    });
  }

  /* ---------------- 开始测试 ---------------- */
  function startQuiz(mode) {
    var sess = window.Store.getSession();
    if (!sess) { show('view-gate'); return; }

    if (sess.sessionOpen) {          // 刷新回到未完成的测试，不重复扣次
      QS.mode = mode || QS.mode;
      show('view-quiz'); renderQuiz(); return;
    }

    window.Store.consume(sess.key).then(function (c) {
      if (!c.ok) {
        if (c.reason === 'neterr') { toast('网络异常，请检查网络后重试', 3200); return; }
        toast('这个卡密的使用次数已经用完了'); show('view-cover'); return;
      }
      sess.used = c.used; sess.limit = c.limit; sess.sessionOpen = true;
      window.Store.setSession(sess);
      renderLicBadge();

      QS.mode = mode || 'full';
      QS.idx = 0; QS.answers = {}; QS.mistakes = {};
      window.Store.clearProgress();
      saveProgress();
      show('view-quiz'); renderQuiz();
      toast('这是第 ' + c.used + ' 次测试，本卡密还剩 ' + c.remain + ' 次');
    });
  }

  function saveProgress() {
    window.Store.saveProgress({
      mode: QS.mode, idx: QS.idx, answers: QS.answers, mistakes: QS.mistakes
    });
  }

  /* ---------------- 答题 ---------------- */
  function totalCount() {
    return Q.activeQuestions().length + Q.MISTAKES.length;
  }

  function renderQuiz() {
    var qs = Q.activeQuestions();
    var total = totalCount();
    var i = QS.idx;
    var isMistake = i >= qs.length;
    var cur = isMistake ? Q.MISTAKES[i - qs.length] : qs[i];
    var picked = isMistake ? QS.mistakes[cur.id] : QS.answers[cur.id];

    $('qCount').textContent = (i + 1) + ' / ' + total;
    $('qDim').textContent = isMistake ? '误区识别' : Q.DIMS[cur.dim].name;
    $('pbarIn').style.width = Math.round(i / total * 100) + '%';
    $('qText').textContent = cur.t || cur.q;

    var box = $('opts');
    box.innerHTML = cur.o.map(function (o, k) {
      return '<button type="button" class="opt' + (picked === k ? ' sel' : '') + '" data-k="' + k + '">' +
        '<span class="dot">✓</span><span>' + Q.esc(o[0]) + '</span></button>';
    }).join('');
    box.onclick = function (e) {
      var b = e.target.closest('.opt'); if (!b) return;
      var k = Number(b.dataset.k);
      if (isMistake) QS.mistakes[cur.id] = k; else QS.answers[cur.id] = k;
      Array.prototype.forEach.call(box.children, function (c) { c.classList.remove('sel'); });
      b.classList.add('sel');
      $('nextBtn').disabled = false;
      saveProgress();
    };

    $('prevBtn').disabled = (i === 0);
    $('nextBtn').disabled = (picked === undefined);
    $('nextBtn').textContent = (i === total - 1) ? '查看结果' : '下一题';
  }

  function goNext() {
    if (QS.idx < totalCount() - 1) { QS.idx++; saveProgress(); renderQuiz(); }
    else { finishQuiz(); }
  }
  function goPrev() { if (QS.idx > 0) { QS.idx--; saveProgress(); renderQuiz(); } }

  function finishQuiz() {
    var s = Q.computeScores();
    lastScore = s;
    var sess = window.Store.getSession();
    if (sess) { sess.sessionOpen = false; window.Store.setSession(sess); }
    renderLicBadge();
    renderResult(s, (QS.mistakes || {}), false);
    show('view-result');
  }

  /* ---------------- 结果渲染 ---------------- */
  function renderResult(s, mistakes, isShared) {
    sharedMode = !!isShared;
    var T = Q.TYPES[s.key];
    var dimKeys = ['A', 'B', 'C', 'D', 'E'];

    var dimRows = dimKeys.map(function (k) {
      var v = s.dim[k];
      return '<div class="dim"><i>' + Q.DIMS[k].name + '</i>' +
        '<span class="track"><b class="' + (v < 45 ? 'low' : '') + '" style="width:' + v + '%"></b></span>' +
        '<span class="v">' + v + '</span></div>';
    }).join('');

    var knowHtml = Q.MISTAKES.map(function (m) {
      var k = mistakes ? mistakes[m.id] : undefined;
      var got = (k !== undefined) && m.o[k] && m.o[k][1] === 2;
      var chosen = (k !== undefined) ? m.o[k][0] : '未作答';
      return '<div class="item ' + (got ? 'right' : 'wrong') + '">' +
        '<p class="q">' + Q.esc(m.q) + '</p>' +
        '<span class="verdict">' + (got ? '✓ 你判断对了' : '✗ 这里有点偏差') + ' · 你选的是「' + Q.esc(chosen) + '」</span>' +
        '<p class="exp"><b>' + Q.esc(m.verdict) + '</b><br>' + m.exp + '</p></div>';
    }).join('');

    var badge = s.insider >= 67 ? '水质内行' : (s.insider >= 34 ? '略知一二' : '需要补课');

    var leadHtml = (CFG.showLeadForm && !isShared) ? (
      '<div class="card" id="leadCard">' +
        '<h3 style="font-size:17px;color:var(--ink);margin-bottom:6px">' + Q.esc(CFG.leadTitle) + '</h3>' +
        '<p class="tiny" style="margin-bottom:14px">' + Q.esc(CFG.leadSub) + '</p>' +
        '<div style="display:flex;gap:9px;flex-wrap:wrap">' +
          '<input id="leadPhone" type="tel" inputmode="numeric" maxlength="11" placeholder="请输入手机号" style="flex:1;min-width:160px">' +
          '<button class="btn sm" id="leadBtn" style="flex:0 0 auto">提交</button>' +
        '</div>' +
        '<p class="tiny" style="margin:10px 0 0">仅用于本次评估联系，不作他用。</p>' +
      '</div>'
    ) : '';

    $('resultBody').innerHTML =
      '<div class="card">' +
        '<div class="rtype">' +
          (T.hidden ? '<div class="hidden-badge">✦ 隐藏款 · 低概率触发</div><br>' : '') +
          Q.mascot(s.key, 180) +
          '<h1 class="typename" style="color:' + T.accent + '">' + Q.esc(T.name) + '</h1>' +
          '<p class="typesub">' + Q.esc(T.sub) + '</p>' +
          '<div class="tags">' +
            '<span class="tag good">天赋 · ' + Q.esc(Q.TALENT[s.top]) + '</span>' +
            '<span class="tag bad">隐患 · ' + Q.esc(Q.RISK[s.bottom]) + '</span>' +
            '<span class="tag">内行指数 ' + s.insider + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +

      (isShared ? '<div class="hint" style="margin-top:14px">这是好友分享给你的测评结果。' +
        '想知道你自己的池子是什么性格？<b>点右下角「再测一次」</b>。</div>' : '') +

      '<div class="card">' +
        '<div class="sect-h" style="margin-bottom:14px"><span class="n">1</span><b>五维水质画像</b></div>' +
        '<div class="radar-wrap">' +
          '<div class="radar">' + Q.radarSVG(s.dim, 220) + '</div>' +
          '<div class="dimlist">' + dimRows + '</div>' +
        '</div>' +
        '<p class="tiny" style="margin-top:14px">整体运维水平 ' + s.L + ' 分，最高分与最低分相差 ' + s.spread + ' 分。' +
          (s.spread > 25 ? '维度差异较大，说明你的强项和空白都很明显。' : '五个维度比较均衡。') + '</p>' +
      '</div>' +

      '<div class="card">' +
        '<div class="sect-h" style="margin-bottom:14px"><span class="n">2</span><b>你的水质画像</b></div>' +
        '<div class="portrait">' + T.portrait.map(function (p) {
          return '<div><em>' + Q.esc(p[0]) + '</em><span>' + p[1] + '</span></div>';
        }).join('') + '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="sect-h" style="margin-bottom:14px"><span class="n">3</span><b>你的池子正在发生什么</b></div>' +
        '<div class="theory"><p class="tt">' + Q.esc(T.theory.t) + '</p>' +
          T.theory.p.map(function (p) { return '<p>' + p + '</p>'; }).join('') + '</div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="sect-h" style="margin-bottom:14px"><span class="n">4</span><b>针对你这一型的建议</b></div>' +
        '<ul class="advice">' + T.advice.map(function (a) {
          return '<li><span><b>' + Q.esc(a[0]) + '</b>' + (a[2] === 'free' ? '<span class="free">不花钱</span>' : '') +
            '<span class="sub">' + Q.esc(a[1]) + '</span></span></li>';
        }).join('') + '</ul>' +
      '</div>' +

      '<div class="card">' +
        '<div class="sect-h" style="margin-bottom:10px"><span class="n">5</span><b>顺手纠正 3 个常见误区</b></div>' +
        '<p class="tiny" style="margin-bottom:14px">这三题不计入维度分，只用来算「内行指数」：' + s.insider + ' 分 · ' + badge + '</p>' +
        '<div class="know">' + knowHtml + '</div>' +
      '</div>' +

      leadHtml +

      '<div class="footnote">' +
        '本测评由泳池水处理从业者与内容团队共同设计，题目与解读参考 GB 37488-2019 对人工游泳池水的常规指标要求，' +
        '以及泳池水处理领域的成熟概念。所有内容仅为趣味科普与自我检视，<b>不构成水质检测报告、卫生评价结论或任何专业诊断</b>。' +
        '实际水质状况请以具备 CMA / CNAS 资质的检测机构出具的报告为准。' +
      '</div>';

    if ($('leadBtn')) {
      $('leadBtn').onclick = function () {
        var el = $('leadPhone'), btn = $('leadBtn');
        var v = (el.value || '').trim();
        if (!/^1[3-9]\d{9}$/.test(v)) { toast('请输入正确的手机号'); return; }
        btn.disabled = true; btn.textContent = '提交中…';
        window.Store.submitLead(v, s.key, s.insider, s.mode || QS.mode).then(function (r) {
          btn.disabled = false; btn.textContent = '提交';
          if (r && r.ok) {
            toast('已收到，稍后会有专人与你联系');
            el.value = '';
          } else if (r && r.reason === 'neterr') {
            toast('网络不太顺畅，请稍后再试一次');
          } else if (r && r.reason === 'badphone') {
            toast('手机号格式好像不太对');
          } else {
            toast('提交失败，请稍后再试');
          }
        });
      };
    }

    // 分享模式下隐藏「复制结果链接」（本身就是同一个链接）
    if ($('btnCopy')) $('btnCopy').style.display = isShared ? 'none' : '';
  }

  /* ---------------- 分享链接 ---------------- */
  function b64urlEncode(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64urlDecode(str) {
    var s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s), out = [];
    for (var i = 0; i < bin.length; i++) out.push(bin.charCodeAt(i));
    return out;
  }

  var TYPE_ORDER = ['juanwang', 'buyap', 'laoganbu', 'yishi', 'jiuhuo', 'huntang', 'lvshui'];

  function encodeResult(s, mode, mistakes) {
    mistakes = mistakes || {};
    return b64urlEncode([
      1,
      TYPE_ORDER.indexOf(s.key),
      s.dim.A, s.dim.B, s.dim.C, s.dim.D, s.dim.E,
      s.insider,
      (mistakes.M1 === undefined ? 3 : mistakes.M1),
      (mistakes.M2 === undefined ? 3 : mistakes.M2),
      (mistakes.M3 === undefined ? 3 : mistakes.M3),
      'ABCDE'.indexOf(s.top),
      'ABCDE'.indexOf(s.bottom),
      mode === 'quick' ? 1 : 0
    ]);
  }

  function decodeResult(code) {
    try {
      var b = b64urlDecode(code);
      if (b.length < 14 || b[0] !== 1) return null;
      var dim = { A: b[2], B: b[3], C: b[4], D: b[5], E: b[6] };
      var vals = [dim.A, dim.B, dim.C, dim.D, dim.E];
      var L = Math.round(vals.reduce(function (a, c) { return a + c; }, 0) / 5);
      var spread = Math.max.apply(null, vals) - Math.min.apply(null, vals);
      var mistakes = {};
      if (b[8] !== 3) mistakes.M1 = b[8];
      if (b[9] !== 3) mistakes.M2 = b[9];
      if (b[10] !== 3) mistakes.M3 = b[10];
      return {
        key: TYPE_ORDER[b[1]],
        dim: dim, insider: b[7], L: L, spread: spread,
        top: 'ABCDE'[b[11]], bottom: 'ABCDE'[b[12]],
        mode: b[13] === 1 ? 'quick' : 'full',
        mistakes: mistakes
      };
    } catch (e) { return null; }
  }

  function resultLink() {
    var s = lastScore; if (!s) return null;
    var base = location.href.split('#')[0];
    return base + '#r=' + encodeResult(s, QS.mode, QS.mistakes || {});
  }

  function copyLink() {
    var url = resultLink();
    if (!url) { toast('结果还没生成'); return; }
    var isFile = location.protocol === 'file:';
    function done() {
      toast(isFile
        ? '链接已复制。注意：本地文件链接只有部署到网上后才能分享给他人'
        : '结果链接已复制，发给别人即可查看', 3000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url, done); });
    } else { fallbackCopy(url, done); }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-9999px;opacity:0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败，请手动复制地址栏链接'); }
    document.body.removeChild(ta);
  }

  /* ---------------- 长图 ---------------- */
  function svgToPng(svgStr, w, h) {
    return new Promise(function (resolve, reject) {
      var maxPixels = 15000000;
      var scale = Math.min(2, Math.sqrt(maxPixels / (w * h)));
      if (scale < 1) scale = 1;
      var blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var img = new Image();
      img.onload = function () {
        try {
          var c = document.createElement('canvas');
          c.width = Math.round(w * scale);
          c.height = Math.round(h * scale);
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#F3FAFB';
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          resolve({ dataUrl: c.toDataURL('image/png'), w: c.width, h: c.height });
        } catch (e) { URL.revokeObjectURL(url); reject(e); }
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('render')); };
      img.src = url;
    });
  }

  function isMobile() {
    return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) ||
      /Android|iPhone|iPad|iPod|MicroMessenger|HarmonyOS/i.test(navigator.userAgent);
  }

  function saveLongImage() {
    if (!lastScore) { toast('结果还没生成'); return; }
    toast('正在生成长图…', 6000);
    var p = window.Poster.build(lastScore, { mistakes: QS.mistakes || {} });
    svgToPng(p.svg, p.width, p.height).then(function (out) {
      pendingImage = out;
      var name = '泳池水质人格-' + Q.TYPES[lastScore.key].name + '.png';
      if (isMobile()) {
        openImageModal(out.dataUrl, name);
      } else {
        download(out.dataUrl, name);
        toast('长图已保存到下载目录（共 ' + out.w + '×' + out.h + '）', 3000);
        openImageModal(out.dataUrl, name, true);
      }
    }, function () {
      toast('长图生成失败，请改用截屏保存', 3200);
    });
  }

  function download(dataUrl, name) {
    var a = document.createElement('a');
    a.href = dataUrl; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  function openImageModal(dataUrl, name, desktopToo) {
    $('imgStage').src = dataUrl;
    var img = new Image();
    img.onload = function () {
      if ($('imgSize')) $('imgSize').textContent = img.width + ' × ' + img.height + ' 像素';
    };
    img.src = dataUrl;
    $('imgTip').style.display = isMobile() ? 'block' : 'none';
    $('imgTip').textContent = '长按上方图片 → 选择「保存图片」即可存入相册';
    $('imgDownload').style.display = isMobile() ? 'block' : (desktopToo ? 'block' : 'none');
    $('imgShare').style.display = (navigator.canShare && window.File) ? 'block' : 'none';
    $('imgDownload').onclick = function () { download(dataUrl, name); toast('已开始下载'); };
    $('imgShare').onclick = function () { shareImage(dataUrl, name); };
    $('modalImg').classList.add('on');
  }

  function dataUrlToFile(dataUrl, name) {
    var arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1];
    var bin = atob(arr[1]), u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new File([u8], name, { type: mime });
  }

  function shareImage(dataUrl, name) {
    try {
      var file = dataUrlToFile(dataUrl, name);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: CFG.brand || '泳池水质人格' }).catch(function () {});
      } else {
        toast('当前浏览器不支持直接分享图片，请长按图片保存');
      }
    } catch (e) { toast('分享失败，请长按图片保存'); }
  }

  /* ---------------- 弹窗 ---------------- */
  function openGift() {
    var g = CFG.gift || {};
    $('giftTitle').textContent = g.title || '好评有礼';
    $('giftLead').textContent = g.lead || '';
    $('giftSteps').innerHTML = (g.steps || []).map(function (t, i) {
      return '<li><span class="no">' + (i + 1) + '</span><span>' + Q.esc(t) + '</span></li>';
    }).join('');
    $('giftRefundTitle').textContent = g.refundTitle || '好评后全额返现';
    $('giftRefundSub').textContent = g.refundSub || '';
    $('giftNotice').textContent = g.notice || '';
    $('giftCta').textContent = g.cta || '复制客服微信';
    /* 微信号与二维码只要配了其中一个，弹窗就能正常工作 */
    var wx = String(CFG.serviceWechat || '').trim();
    var hasWx = !!wx && wx.indexOf('请') !== 0;
    if (hasWx) {
      $('wechatId').textContent = wx;
      $('giftCta').textContent = g.cta || '复制客服微信';
    } else if (CFG.qrImage) {
      $('wechatId').textContent = '微信扫码添加客服';
      $('giftCta').textContent = '怎么添加？';
    } else {
      $('wechatId').textContent = '请填写客服微信号';
      $('giftCta').textContent = g.cta || '复制客服微信';
    }
    if ($('serviceTipLine')) $('serviceTipLine').textContent = CFG.serviceTip || '';

    var qr = $('qrSlot');
    if (CFG.qrImage) {
      qr.className = 'qr-slot has-img';
      qr.innerHTML = '<img src="' + CFG.qrImage + '" alt="客服二维码">';
    } else {
      qr.className = 'qr-slot';
      qr.innerHTML = '客服二维码位置<br>把图片放到 assets/ 后<br>在 config.js 里填写路径';
    }

    $('modalGift').classList.add('on');
  }

  function closeModal(id) { $(id).classList.remove('on'); }

  /* ---------------- 结果链接进入（分享模式） ---------------- */
  function trySharedResult() {
    var m = /[#&]r=([A-Za-z0-9\-_]+)/.exec(location.hash || '');
    if (!m) return false;
    var s = decodeResult(m[1]);
    if (!s) return false;
    lastScore = s;
    QS.mode = s.mode;
    QS.mistakes = s.mistakes || {};
    renderResult(s, s.mistakes || {}, true);
    show('view-result');
    // 分享页也要能保存长图 / 再测一次
    $('actionbar').classList.add('on');
    $('btnSave').style.display = '';
    $('btnCopy').style.display = 'none';
    return true;
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    var bt = $('boot'); if (bt) bt.style.display = 'none';
    if ($('brandName') && CFG.brand) $('brandName').textContent = CFG.brand;
    if (document.title && CFG.brand) document.title = CFG.brand + ' · 你家池子是什么性格？';

    // 弹窗与按钮绑定
    $('gateBtn').onclick = onGateSubmit;
    $('keyInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') onGateSubmit(); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-mode]'), function (b) {
      b.onclick = function () { startQuiz(b.dataset.mode); };
    });
    $('prevBtn').onclick = goPrev;
    $('nextBtn').onclick = goNext;
    $('btnSave').onclick = saveLongImage;
    $('btnCopy').onclick = copyLink;
    $('btnRetest').onclick = function () {
      var sess = window.Store.getSession();
      if (!sess) { show('view-gate'); return; }
      sess.sessionOpen = false; window.Store.setSession(sess);
      startQuiz(QS.mode || 'full');
    };
    $('btnGift').onclick = openGift;
    $('giftCta').onclick = function () {
      var txt = String(CFG.serviceWechat || '').trim();
      var hasWx = !!txt && txt.indexOf('请') !== 0;
      if (hasWx) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(
            function () { toast('客服微信已复制：' + txt, 2500); },
            function () { toast('复制失败，请长按微信号手动复制', 3000); });
        } else {
          toast('请长按微信号手动复制', 3000);
        }
        return;
      }
      if (CFG.qrImage) {
        toast('长按上面的二维码保存到相册，再用微信「扫一扫」→ 右上角「相册」识别添加', 4500);
        return;
      }
      toast('客服微信还没配置，请在 config.js 里填写', 3000);
    };
    Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function (b) {
      b.onclick = function () { closeModal(b.dataset.close); };
    });
    Array.prototype.forEach.call(document.querySelectorAll('.modal-mask'), function (m) {
      m.onclick = function () { m.parentNode.classList.remove('on'); };
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        Array.prototype.forEach.call(document.querySelectorAll('.modal.on'), function (m) { m.classList.remove('on'); });
      }
    });

    // 分享链接优先
    if (trySharedResult()) return;

    // 恢复会话
    var sess = window.Store.getSession();
    renderLicBadge();

    if (sess) {
      window.Store.verify(sess.key).then(function (r) {
        if (r.reason === 'neterr') {
          // 云端模式连不上时，不要误判成「次数用完」或「卡密无效」
          renderLicBadge();
          show('view-cover');
          toast('暂时连不上服务器，请检查网络后重试', 3500);
          return;
        }
        if (!r.ok && r.reason === 'out') {
          // 次数用完且没有未完成会话
          var p0 = window.Store.loadProgress();
          if (!p0) { window.Store.clearSession(); show('view-gate'); return; }
        }
        if (r.reason === 'notfound') { window.Store.clearSession(); show('view-gate'); return; }
        sess.used = r.used; sess.limit = r.limit;
        window.Store.setSession(sess);
        renderLicBadge();
        var p = window.Store.loadProgress();
        if (sess.sessionOpen && p && p.answers && Object.keys(p.answers).length) {
          QS.mode = p.mode; QS.idx = p.idx; QS.answers = p.answers; QS.mistakes = p.mistakes || {};
          show('view-quiz'); renderQuiz();
          toast('已恢复上次未完成的答题');
        } else {
          show('view-cover');
        }
      });
    } else {
      show('view-gate');
      $('keyInput').focus();
    }
  }

  /* 调试接口：方便在浏览器控制台排查问题，也可用于二次开发 */
  window.PoolApp = {
    encodeResult: encodeResult,
    decodeResult: decodeResult,
    resultLink: resultLink,
    startQuiz: startQuiz,
    saveLongImage: saveLongImage,
    getScore: function () { return lastScore; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
