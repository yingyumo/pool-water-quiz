/* ============================================================
   卡密哈希（前端本地模式用）
   ------------------------------------------------------------
   为什么需要它：
     纯前端模式下，卡密清单必须随网页下发。如果清单是明文，
     任何人「查看网页源代码」就能把没用过的卡密全部拿走。
     所以 index.html 只加载卡密的哈希值 —— 看不到明文，
     也无法从哈希反推出卡密（32^8 的组合量，暴力枚举不现实）。

   注意：这是「防顺手牵羊」，不是密码学级别的防护。
        真正不可绕过的方案是云端模式（见 store.js 的切换说明）。
   ============================================================ */
(function (global) {
  'use strict';

  /* 归一化：转大写 + 只保留字母数字。
     这样 POOL-7A6E-MAM7 / pool7a6emam7 / POOL 7A6E MAM7 / 全角连字符
     全都能识别成同一个卡密，客户怎么输都不会卡住。 */
  function normalizeKey(s) {
    return String(s == null ? '' : s)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  }

  function hex8(n) {
    var s = (n >>> 0).toString(16);
    while (s.length < 8) s = '0' + s;
    return s;
  }

  /* 双通道 32 位混合 + 三轮迭代，输出 16 位十六进制 */
  function keyHash(key) {
    var k = normalizeKey(key) + '|poolq.v2';
    var h1 = 0x811c9dc5, h2 = 0x01000193;
    for (var r = 0; r < 3; r++) {
      for (var i = 0; i < k.length; i++) {
        var c = k.charCodeAt(i);
        h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
        h2 = (h2 + c) >>> 0;
        h2 = Math.imul(h2 ^ (h2 >>> 13), 2246822519) >>> 0;
      }
      h1 = (h1 ^ (h2 >>> 7)) >>> 0;
      h2 = (h2 ^ (h1 >>> 11)) >>> 0;
    }
    return hex8(h1) + hex8(h2);
  }

  /* 卡密字符集：剔除容易混淆的 0 O I L 1，共 31 个字符 */
  var CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  /* 均匀取随机字符（拒绝采样，避免取模偏置） */
  function randomBlock(n) {
    var out = '', buf = new Uint8Array(n * 2), limit = Math.floor(256 / CHARSET.length) * CHARSET.length;
    var hasCrypto = !!(global.crypto && global.crypto.getRandomValues);
    var guard = 0;
    while (out.length < n && guard++ < 200) {
      if (hasCrypto) global.crypto.getRandomValues(buf);
      else for (var j = 0; j < buf.length; j++) buf[j] = Math.floor(Math.random() * 256);
      for (var i = 0; i < buf.length && out.length < n; i++) {
        if (buf[i] < limit) out += CHARSET[buf[i] % CHARSET.length];
      }
    }
    return out;
  }

  /* 生成一个卡密：PREFIX-XXXX-XXXX */
  function makeKey(prefix) {
    return (prefix || 'POOL').toUpperCase() + '-' + randomBlock(4) + '-' + randomBlock(4);
  }

  global.keyHash = keyHash;
  global.normalizeKey = normalizeKey;
  global.makeKey = makeKey;
  global.KEY_CHARSET = CHARSET;
})(window);
