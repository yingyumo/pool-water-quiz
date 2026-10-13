/* ============================================================
   泳池水质人格 · 结果长图生成器
   ------------------------------------------------------------
   把整份结果（类型 + 画像 + 雷达 + 理论 + 建议 + 误区）排成一张
   750px 宽的竖版长图，输出为独立 SVG 字符串，由 app.js 转 PNG。
   不依赖 html2canvas 之类第三方库 —— 排版完全可控，中文不会错位。
   ============================================================ */
(function (global) {
  'use strict';
  var Q = global.PoolQuiz;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function isLatin(ch) { return /[\x00-\xff]/.test(ch); }
  function charW(ch, size) { return isLatin(ch) ? size * 0.55 : size; }
  function stripTags(s) { return String(s || '').replace(/<[^>]+>/g, ''); }

  /* 把带 <b> 的字符串拆成 [{t,b}] 片段 */
  function parseRich(str) {
    var out = [], re = /<b>(.*?)<\/b>/g, last = 0, m;
    str = String(str == null ? '' : str);
    while ((m = re.exec(str))) {
      if (m.index > last) out.push({ t: str.slice(last, m.index), b: false });
      out.push({ t: m[1], b: true });
      last = re.lastIndex;
    }
    if (last < str.length) out.push({ t: str.slice(last), b: false });
    return out.length ? out : [{ t: '', b: false }];
  }

  /* 按像素宽度折行 -> [[{t,b}, ...], ...] */
  function layoutRich(strOrSegs, maxW, size) {
    var segs = typeof strOrSegs === 'string' ? parseRich(strOrSegs) : strOrSegs;
    var lines = [], line = [], w = 0;
    for (var i = 0; i < segs.length; i++) {
      var g = segs[i], buf = '';
      for (var j = 0; j < g.t.length; j++) {
        var ch = g.t[j], cw = charW(ch, size);
        if (w + cw > maxW && (line.length || buf)) {
          if (buf) { line.push({ t: buf, b: g.b }); buf = ''; }
          lines.push(line); line = []; w = 0;
        }
        buf += ch; w += cw;
      }
      if (buf) line.push({ t: buf, b: g.b });
    }
    if (line.length) lines.push(line);
    return lines.length ? lines : [[{ t: '', b: false }]];
  }

  /* 把已折行的内容渲染成 <text> */
  function renderLayout(L, x, y0, o) {
    var size = o.size, lh = o.lh || Math.round(size * 1.72);
    var base = o.fill || '#2A4A54', bold = o.boldFill || base;
    var weight = o.weight || 400, boldWeight = o.boldWeight || 600;
    var svg = '';
    for (var i = 0; i < L.length; i++) {
      svg += '<text x="' + x + '" y="' + (y0 + i * lh) + '" font-size="' + size + '" fill="' + base + '"' +
        (weight !== 400 ? ' font-weight="' + weight + '"' : '') + '>';
      for (var j = 0; j < L[i].length; j++) {
        var sg = L[i][j];
        svg += '<tspan fill="' + (sg.b ? bold : base) + '" font-weight="' + (sg.b ? boldWeight : weight) + '">' + esc(sg.t) + '</tspan>';
      }
      svg += '</text>';
    }
    return svg;
  }

  /* 一次性完成：折行 + 渲染，返回 {svg, h} */
  function block(str, x, y0, o) {
    var L = layoutRich(str, o.maxW, o.size);
    o.lh = o.lh || Math.round(o.size * 1.72);
    return { svg: renderLayout(L, x, y0, o), h: L.length * o.lh, n: L.length, L: L };
  }

  /* 量高（不渲染） */
  function measure(str, maxW, size, lh) {
    return layoutRich(str, maxW, size).length * (lh || Math.round(size * 1.72));
  }

  /* ---------------- 雷达图 ---------------- */
  function radar(dim, S) {
    var c = S / 2, cy = S / 2, R = S * 0.30, keys = ['A', 'B', 'C', 'D', 'E'], n = 5;
    function pt(i, r) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / n;
      return [c + Math.cos(a) * r, cy + Math.sin(a) * r];
    }
    function pts(rad) {
      return keys.map(function (_, i) {
        return pt(i, rad).map(function (v) { return v.toFixed(1); }).join(',');
      }).join(' ');
    }
    var g = '';
    [0.5, 1].forEach(function (f) {
      g += '<polygon points="' + pts(R * f) + '" fill="none" stroke="rgba(18,49,58,.12)" stroke-width="1.2"/>';
    });
    keys.forEach(function (_, i) {
      var p = pt(i, R);
      g += '<line x1="' + c + '" y1="' + cy + '" x2="' + p[0].toFixed(1) + '" y2="' + p[1].toFixed(1) + '" stroke="rgba(18,49,58,.12)" stroke-width="1.2"/>';
    });
    g += '<polygon points="' + keys.map(function (k, i) {
      return pt(i, R * Math.max(0.07, dim[k] / 100)).map(function (v) { return v.toFixed(1); }).join(',');
    }).join(' ') + '" fill="rgba(14,143,168,.22)" stroke="#0E8FA8" stroke-width="2.2" stroke-linejoin="round"/>';
    keys.forEach(function (k, i) {
      var p = pt(i, R * Math.max(0.07, dim[k] / 100));
      g += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.2" fill="#0E8FA8"/>';
      var lp = pt(i, R + 22);
      g += '<text x="' + lp[0].toFixed(1) + '" y="' + lp[1].toFixed(1) + '" text-anchor="middle" dominant-baseline="central" ' +
        'font-size="13" fill="#4A6B75">' + esc(Q.DIMS[k].short) + ' ' + dim[k] + '</text>';
    });
    return '<g>' + g + '</g>';
  }

  /* ============================================================
     主函数  build(score, ctx)  ctx = { mistakes: {M1:idx,...} }
     ============================================================ */
  function build(s, ctx) {
    var T = Q.TYPES[s.key];
    var picked = (ctx && ctx.mistakes) || {};
    var W = 750, PAD = 48, CW = W - PAD * 2;
    var body = [];
    var y = 0;
    function put(str) { body.push(str); }
    function head(no, title) {
      y += 26;
      put('<rect x="' + PAD + '" y="' + (y - 18) + '" width="26" height="26" rx="8" fill="#E1F4F8"/>' +
          '<text x="' + (PAD + 13) + '" y="' + (y - 5) + '" text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="600" fill="#0A6E82">' + no + '</text>' +
          '<text x="' + (PAD + 38) + '" y="' + (y - 5) + '" dominant-baseline="central" font-size="17" font-weight="600" fill="#12313A">' + esc(title) + '</text>');
      y += 20;
    }

    /* ---------- 头部 ---------- */
    var hidden = !!T.hidden;
    var nameY = hidden ? 298 : 282;
    var subY = nameY + 38;
    var headH = subY + 34;

    put('<rect x="0" y="0" width="' + W + '" height="' + headH + '" fill="' + T.accentL + '"/>');
    put('<path d="M0 ' + (headH - 16) + ' q62 -14 125 0 t125 0 t125 0 t125 0 t125 0 t125 0 v20 H0 z" fill="#F3FAFB"/>');
    put('<text x="' + (W / 2) + '" y="52" text-anchor="middle" font-size="17" font-weight="500" fill="#4A6B75" letter-spacing="4">泳 池 水 质 人 格</text>');
    put('<g transform="translate(' + ((W - 150) / 2) + ',66) scale(' + (150 / 120) + ')">' + Q.mascotInner(s.key) + '</g>');
    if (hidden) {
      put('<rect x="' + (W / 2 - 70) + '" y="222" width="140" height="28" rx="14" fill="#FCF0D6"/>' +
          '<text x="' + (W / 2) + '" y="237" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="600" fill="#7A5410">隐藏款 · 低概率触发</text>');
    }
    put('<text x="' + (W / 2) + '" y="' + nameY + '" text-anchor="middle" font-size="50" font-weight="700" fill="' + T.accent + '" letter-spacing="-1">' + esc(T.name) + '</text>');
    put('<text x="' + (W / 2) + '" y="' + subY + '" text-anchor="middle" font-size="20" fill="#4A6B75">' + esc(T.sub) + '</text>');
    y = headH;

    /* ---------- 标签条 ---------- */
    y += 28;
    var tagH = 106;
    put('<rect x="' + PAD + '" y="' + y + '" width="' + CW + '" height="' + tagH + '" rx="16" fill="#FFFFFF" stroke="rgba(18,49,58,.10)"/>');
    put('<text x="' + (PAD + 26) + '" y="' + (y + 42) + '" font-size="19" font-weight="600" fill="#3F7A2E">天赋 · ' + esc(Q.TALENT[s.top]) + '</text>');
    put('<text x="' + (PAD + 26) + '" y="' + (y + 80) + '" font-size="19" font-weight="600" fill="#A8442A">隐患 · ' + esc(Q.RISK[s.bottom]) + '</text>');
    put('<text x="' + (W - PAD - 26) + '" y="' + (y + 40) + '" text-anchor="end" font-size="14" fill="#4A6B75">内行指数</text>');
    put('<text x="' + (W - PAD - 26) + '" y="' + (y + 84) + '" text-anchor="end" font-size="36" font-weight="600" fill="#0E8FA8">' + s.insider + '</text>');
    y += tagH;

    /* ---------- 1 五维得分 ---------- */
    head('1', '五维水质画像');
    var RS = 250;
    put('<g transform="translate(' + ((W - RS) / 2) + ',' + (y + 10) + ')">' + radar(s.dim, RS) + '</g>');
    y += RS + 28;
    ['A', 'B', 'C', 'D', 'E'].forEach(function (k) {
      var v = s.dim[k], barW = CW - 210, fillW = Math.max(3, barW * v / 100);
      put('<text x="' + PAD + '" y="' + (y + 13) + '" font-size="14" fill="#4A6B75">' + esc(Q.DIMS[k].name) + '</text>');
      put('<rect x="' + (PAD + 128) + '" y="' + (y + 5) + '" width="' + barW + '" height="8" rx="4" fill="#E1EDF1"/>');
      put('<rect x="' + (PAD + 128) + '" y="' + (y + 5) + '" width="' + fillW.toFixed(1) + '" height="8" rx="4" fill="' + (v < 45 ? '#D98C5F' : '#0E8FA8') + '"/>');
      put('<text x="' + (W - PAD) + '" y="' + (y + 14) + '" text-anchor="end" font-size="15" font-weight="600" fill="#4A6B75">' + v + '</text>');
      y += 32;
    });
    y += 6;
    var sumTxt = '整体运维水平 ' + s.L + ' 分，最高分与最低分相差 ' + s.spread + ' 分。' +
      (s.spread > 25 ? '维度差异较大，说明你的强项和空白都很明显。' : '五个维度比较均衡。');
    var sumB = block(sumTxt, PAD, y + 8, { size: 13, maxW: CW, fill: '#8AA6AE', lh: 22 });
    put(sumB.svg); y += sumB.h + 14;

    /* ---------- 2 水质画像 ---------- */
    head('2', '你的水质画像');
    T.portrait.forEach(function (p) {
      var b = block(p[1], PAD + 126, y + 4, { size: 14.5, maxW: CW - 126, lh: 25, fill: '#2A4A54' });
      put('<text x="' + PAD + '" y="' + (y + 4) + '" font-size="14.5" font-weight="600" fill="#0E8FA8">' + esc(p[0]) + '</text>');
      put(b.svg);
      y += Math.max(28, b.h) + 10;
    });

    /* ---------- 3 理论依据 ---------- */
    head('3', '你的池子正在发生什么');
    var inner = CW - 36;
    var items = [T.theory.t].concat(T.theory.p);
    var opac = items.map(function (p, i) {
      return { size: i ? 14.5 : 15, lh: i ? 25 : 26, fill: i ? '#2A4A54' : '#0A6E82', weight: i ? 400 : 600 };
    });
    var lays = items.map(function (p, i) { return layoutRich(p, inner, opac[i].size); });
    var hts = lays.map(function (L, i) { return L.length * opac[i].lh; });
    var boxH = 28;
    hts.forEach(function (h, i) { boxH += h + (i ? 12 : 0); });
    boxH += 24;
    put('<rect x="' + PAD + '" y="' + y + '" width="' + CW + '" height="' + boxH + '" rx="12" fill="#FBFDFE" stroke="rgba(18,49,58,.10)"/>');
    put('<rect x="' + PAD + '" y="' + y + '" width="4" height="' + boxH + '" rx="2" fill="#9AD9E4"/>');
    var ty = y + 30;
    lays.forEach(function (L, i) {
      put(renderLayout(L, PAD + 18, ty, opac[i]));
      ty += hts[i] + (i ? 12 : 12);
    });
    y += boxH + 8;

    /* ---------- 4 建议 ---------- */
    head('4', '针对你这一型的建议');
    T.advice.forEach(function (a, i) {
      put('<rect x="' + PAD + '" y="' + (y + 2) + '" width="22" height="22" rx="7" fill="#E1F4F8"/>');
      put('<text x="' + (PAD + 11) + '" y="' + (y + 13) + '" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="600" fill="#0A6E82">' + (i + 1) + '</text>');
      put('<text x="' + (PAD + 32) + '" y="' + (y + 13) + '" dominant-baseline="central" font-size="16" font-weight="600" fill="#12313A">' + esc(a[0]) + '</text>');
      if (a[2] === 'free') {
        var tw = 0, title = a[0];
        for (var ci = 0; ci < title.length; ci++) tw += charW(title[ci], 16);
        put('<rect x="' + (PAD + 32 + tw + 12) + '" y="' + (y + 2) + '" width="60" height="22" rx="6" fill="#E8F5E4"/>');
        put('<text x="' + (PAD + 32 + tw + 42) + '" y="' + (y + 13) + '" text-anchor="middle" dominant-baseline="central" font-size="12" font-weight="600" fill="#3F7A2E">不花钱</text>');
      }
      y += 30;
      var b = block(a[1], PAD + 32, y + 4, { size: 14, maxW: CW - 32, lh: 24, fill: '#4A6B75' });
      put(b.svg); y += b.h + 22;
    });

    /* ---------- 5 误区纠正 ---------- */
    head('5', '顺手纠正 3 个常见误区');
    Q.MISTAKES.forEach(function (m) {
      var k = picked[m.id];
      var got = (k !== undefined) && m.o[k] && m.o[k][1] === 2;
      var Lq = layoutRich(m.q, CW - 36, 15);
      var Lv = layoutRich(m.verdict, CW - 36, 14);
      var Le = layoutRich(m.exp, CW - 36, 14);
      var hq = Lq.length * 26, hv = Lv.length * 24, he = Le.length * 24;
      var h = 28 + hq + 14 + 24 + 12 + hv + 10 + he + 24;

      put('<rect x="' + PAD + '" y="' + y + '" width="' + CW + '" height="' + h + '" rx="12" fill="#FDFEFE" stroke="rgba(18,49,58,.10)"/>');
      var t2 = y + 30;
      put(renderLayout(Lq, PAD + 18, t2, { size: 15, lh: 26, fill: '#12313A', weight: 600 }));
      t2 += hq + 14;
      put('<rect x="' + (PAD + 18) + '" y="' + (t2 - 16) + '" width="' + (got ? 96 : 130) + '" height="26" rx="7" fill="' + (got ? '#E8F5E4' : '#FBE9E4') + '"/>');
      put('<text x="' + (PAD + 32) + '" y="' + (t2 - 2) + '" dominant-baseline="central" font-size="13" font-weight="600" fill="' + (got ? '#3F7A2E' : '#A8442A') + '">' +
        (got ? '判断对了' : '这里有点偏差') + '</text>');
      t2 += 12;
      put(renderLayout(Lv, PAD + 18, t2, { size: 14, lh: 24, fill: '#12313A', weight: 600 }));
      t2 += hv + 10;
      put(renderLayout(Le, PAD + 18, t2, { size: 14, lh: 24, fill: '#4A6B75' }));
      y += h + 14;
    });

    /* ---------- 页脚 ---------- */
    y += 22;
    var footH = 156;
    put('<rect x="' + PAD + '" y="' + y + '" width="' + CW + '" height="' + footH + '" rx="16" fill="#FFFFFF" stroke="rgba(18,49,58,.10)"/>');
    put('<text x="' + (PAD + 26) + '" y="' + (y + 50) + '" font-size="20" font-weight="600" fill="#12313A">你家池子是什么性格？</text>');
    put('<text x="' + (PAD + 26) + '" y="' + (y + 84) + '" font-size="15" fill="#4A6B75">30 道情景题 · 5 个水质维度 · 7 种池格</text>');
    put('<text x="' + (PAD + 26) + '" y="' + (y + 116) + '" font-size="13" fill="#8AA6AE">仅供趣味科普，不构成水质检测结论</text>');
    /* 二维码：SVG 里只画一个白色底框，真正的二维码图案由 app.js 在 canvas 上叠加绘制。
       这样既不会踩「SVG 内嵌图片异步加载可能画不出来」的坑，
       也不会因为外部图片跨域而污染画布导致导出失败。 */
    var QR_BOX = 82, QR_SIZE = 70, QR_CX = W - PAD - 65, QR_Y = y + 28;
    put('<rect x="' + (QR_CX - QR_BOX / 2) + '" y="' + QR_Y + '" width="' + QR_BOX + '" height="' + QR_BOX + '" rx="10" fill="#FFFFFF" stroke="rgba(18,49,58,.12)"/>');
    put('<text x="' + QR_CX + '" y="' + (y + 126) + '" text-anchor="middle" font-size="12" fill="#8AA6AE">扫码测一测</text>');
    y += footH + 32;

    var H = Math.round(y);
    var header = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" ' +
      "font-family=\"system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif\">" +
      '<rect width="' + W + '" height="' + H + '" fill="#F3FAFB"/>';
    return {
      svg: header + body.join('') + '</svg>',
      width: W, height: H,
      /* 交给 app.js 在 canvas 上叠加二维码用的坐标（SVG 坐标系） */
      qr: { x: QR_CX - QR_SIZE / 2, y: QR_Y + (QR_BOX - QR_SIZE) / 2, size: QR_SIZE }
    };
  }

  global.Poster = { build: build, esc: esc };
})(window);
