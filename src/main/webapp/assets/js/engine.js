/* Card engine: turns form data + a random "spec" into a unique animated SVG wedding card. */
(function (g) {
  'use strict';
  var SCS = g.SCS = g.SCS || {};

  SCS.FONTS_URL = 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Allura&family=Pinyon+Script&family=Alex+Brush&family=Parisienne&family=Cormorant+Garamond:wght@500;700&family=Cinzel:wght@500;700&family=Playfair+Display:wght@500;700&family=Marcellus&family=Lora:wght@500;700&display=swap';

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  SCS.rng = mulberry32;
  var E = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var f1 = function (n) { return Math.round(n * 10) / 10; };

  var THEMES = SCS.THEMES = [
    { n: 'Royal Maroon', d: 1, bg1: '#6b1226', bg2: '#2a050f', ink: '#fff1da', acc: '#e9c46a', nm: '#f0cc78', hi: '#fffbe6' },
    { n: 'Emerald Gold', d: 1, bg1: '#0f5a45', bg2: '#04241b', ink: '#fbf4df', acc: '#e6c36a', nm: '#efd07f', hi: '#fffbe8' },
    { n: 'Midnight Rose', d: 1, bg1: '#1b1850', bg2: '#090820', ink: '#ffeef0', acc: '#f2b8a6', nm: '#f6c6b6', hi: '#fff4ef' },
    { n: 'Blush Rose', d: 0, bg1: '#fff3ee', bg2: '#fbd5cf', ink: '#5b2230', acc: '#b8862f', nm: '#a02848', hi: '#e8a0b0' },
    { n: 'Ivory Sage', d: 0, bg1: '#fbf6e8', bg2: '#dfe8d2', ink: '#2e3f31', acc: '#9a7424', nm: '#3f6b4a', hi: '#a9cfa0' },
    { n: 'Imperial Purple', d: 1, bg1: '#45176a', bg2: '#1a0830', ink: '#fbeeff', acc: '#f1c65e', nm: '#f6d27a', hi: '#fff7dc' },
    { n: 'Teal Copper', d: 1, bg1: '#0e5560', bg2: '#052a31', ink: '#fff0e4', acc: '#e8a063', nm: '#f1b27a', hi: '#ffe6cf' },
    { n: 'Noir Gold', d: 1, bg1: '#1c1c1c', bg2: '#050505', ink: '#f6ecd2', acc: '#d8b45c', nm: '#e6c675', hi: '#fff6d6' },
    { n: 'Peach Coral', d: 0, bg1: '#fff0e2', bg2: '#ffc9b3', ink: '#5c2a1c', acc: '#c2552f', nm: '#c2410c', hi: '#ffb089' },
    { n: 'Royal Blue Silver', d: 1, bg1: '#173a82', bg2: '#0a1a45', ink: '#f3f7ff', acc: '#d7e0f0', nm: '#e6edf9', hi: '#ffffff' }
  ];
  var LAYOUTS = SCS.LAYOUTS = ['Classic Frame', 'Royal Arch', 'Medallion', 'Palace Banner', 'Modern Monogram', 'Royal Gate'];
  var SCRIPTS = { 'Great Vibes': 1, 'Allura': 1.05, 'Pinyon Script': .95, 'Alex Brush': 1, 'Parisienne': .92 };
  var SERIFS = { 'Cormorant Garamond': .42, 'Cinzel': .64, 'Playfair Display': .52, 'Marcellus': .56, 'Lora': .52 };

  var TRAD = SCS.TRADITIONS = {
    universal: { inv: ['Together with their families', 'With love and gratitude'], line: ['request the pleasure of your company at the wedding of', 'joyfully invite you to celebrate the wedding of'] },
    hindu: { inv: ['|| Shree Ganeshay Namah ||', '|| Om Shree Ganeshay Namah ||'], line: ['With the blessings of the Almighty and our elders, we invite you to bless the wedding of', 'request your gracious presence to bless the wedding of'] },
    muslim: { inv: ['Bismillah ir-Rahman ir-Rahim', 'In the name of Allah, the Most Gracious'], line: ['With the blessings of Allah, we request your presence at the Nikah of', 'joyfully invite you to witness the Nikah of'] },
    sikh: { inv: ['Waheguru Ji Ka Khalsa, Waheguru Ji Ki Fateh', 'Ik Onkar Satnam Waheguru'], line: ['With the grace of Waheguru, we invite you to the Anand Karaj of', 'request your presence to bless the union of'] },
    christian: { inv: ['Where there is love, there is God', 'Love is patient, love is kind'], line: ['Together with their families, request the honour of your presence at the marriage of', 'joyfully invite you to celebrate the marriage of'] }
  };

  // ---------- drawing helpers (return SVG strings) ----------
  function star4(x, y, r, fill, extra) {
    return '<path d="M' + f1(x) + ' ' + f1(y - r) + 'Q' + f1(x) + ' ' + f1(y) + ' ' + f1(x + r) + ' ' + f1(y) + 'Q' + f1(x) + ' ' + f1(y) + ' ' + f1(x) + ' ' + f1(y + r) + 'Q' + f1(x) + ' ' + f1(y) + ' ' + f1(x - r) + ' ' + f1(y) + 'Q' + f1(x) + ' ' + f1(y) + ' ' + f1(x) + ' ' + f1(y - r) + 'Z" fill="' + fill + '" ' + (extra || '') + '/>';
  }
  function mandala(r, col, op, spin, sw) {
    var s = '<g fill="none" stroke="' + col + '" stroke-width="' + (sw || 1.6) + '" opacity="' + op + '"><g' + (spin ? ' class="spin"' : '') + '>', i;
    s += '<circle r="' + r + '"/><circle r="' + f1(r * .94) + '" stroke-dasharray="2 8"/><circle r="' + f1(r * .5) + '" stroke-dasharray="1 6"/><circle r="' + f1(r * .14) + '"/>';
    for (i = 0; i < 12; i++) s += '<ellipse cy="' + f1(-r * .72) + '" rx="' + f1(r * .1) + '" ry="' + f1(r * .2) + '" transform="rotate(' + i * 30 + ')"/>';
    for (i = 0; i < 12; i++) s += '<path d="M0 ' + f1(-r * .5) + 'Q' + f1(r * .1) + ' ' + f1(-r * .62) + ' 0 ' + f1(-r * .78) + 'Q' + f1(-r * .1) + ' ' + f1(-r * .62) + ' 0 ' + f1(-r * .5) + 'Z" transform="rotate(' + (i * 30 + 15) + ')"/>';
    for (i = 0; i < 8; i++) s += '<ellipse cy="' + f1(-r * .34) + '" rx="' + f1(r * .07) + '" ry="' + f1(r * .15) + '" transform="rotate(' + i * 45 + ')"/>';
    return s + '</g></g>';
  }
  function lotus(x, y, sc, col) {
    var p = 'M0 0C-14-10-14-34 0-48C14-34 14-10 0 0Z', s = '<g transform="translate(' + x + ' ' + y + ') scale(' + sc + ')" fill="none" stroke="' + col + '" stroke-width="1.6">';
    [-70, 70, -35, 35, 0].forEach(function (a) { s += '<path d="' + p + '" transform="rotate(' + a + ')"/>'; });
    return s + '</g>';
  }
  function divider(x, y, w, col) {
    return '<g stroke="' + col + '" stroke-width="1.5" fill="' + col + '"><line x1="' + f1(x - w / 2) + '" y1="' + y + '" x2="' + f1(x - 22) + '" y2="' + y + '"/><line x1="' + f1(x + 22) + '" y1="' + y + '" x2="' + f1(x + w / 2) + '" y2="' + y + '"/><path d="M' + x + ' ' + (y - 8) + 'L' + (x + 8) + ' ' + y + 'L' + x + ' ' + (y + 8) + 'L' + (x - 8) + ' ' + y + 'Z" stroke="none"/><circle cx="' + (x - 16) + '" cy="' + y + '" r="2" stroke="none"/><circle cx="' + (x + 16) + '" cy="' + y + '" r="2" stroke="none"/></g>';
  }
  var CORNER = '<g fill="none" stroke-linecap="round"><path d="M4 4C70 4 125 22 160 78M4 4C4 70 22 125 78 160"/><path d="M4 4C50 14 84 40 100 84M4 4C14 50 40 84 84 100" opacity=".6"/><circle cx="10" cy="10" r="6"/><path d="M40 28q22-16 44-2q-22 16-44 2zM28 40q-16 22-2 44q16-22 2-44z"/><circle cx="108" cy="46" r="3" fill="currentColor"/><circle cx="46" cy="108" r="3" fill="currentColor"/></g>';
  function corner(x, y, sx, sy, col, sc) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + sx * sc + ' ' + sy * sc + ')" stroke="' + col + '" color="' + col + '" stroke-width="2.2">' + CORNER + '</g>'; }
  function corners(W, H, ins, col, sc) { return corner(ins, ins, 1, 1, col, sc) + corner(W - ins, ins, -1, 1, col, sc) + corner(ins, H - ins, 1, -1, col, sc) + corner(W - ins, H - ins, -1, -1, col, sc); }
  function frame(W, H, ins, col, sw, op, dash) { return '<rect x="' + ins + '" y="' + ins + '" width="' + (W - 2 * ins) + '" height="' + (H - 2 * ins) + '" rx="8" fill="none" stroke="' + col + '" stroke-width="' + sw + '" opacity="' + (op || 1) + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>'; }
  function scallopBand(W, y, h, flip, col, op) {
    var r = 25, s = 'M0 ' + (flip ? y : y) + 'H' + W, x;
    var yb = flip ? y + h : y + h;
    s = flip ? 'M0 ' + y + ' ' : 'M0 ' + y + ' ';
    // band from y to y+h with scalloped inner edge
    var d = flip ? 'M0 ' + (y + h) + 'H' + W + 'V' + y : 'M0 ' + y + 'H' + W + 'V' + (y + h);
    if (!flip) { for (x = W; x > 0; x -= 50) d += 'A' + r + ' ' + r + ' 0 0 1 ' + (x - 50) + ' ' + (y + h); d += 'Z'; }
    else { d = 'M0 ' + (y + h) + 'H' + W + 'V' + y; for (x = W; x > 0; x -= 50) d += 'A' + r + ' ' + r + ' 0 0 0 ' + (x - 50) + ' ' + y; d += 'Z'; }
    return '<path d="' + d + '" fill="' + col + '" opacity="' + op + '"/>';
  }
  var PAISLEY = 'M0 0C14-8 30 4 24 22C19 36 2 40-5 28C-10 18-1 10 7 14C13 17 11 24 5 23';
  function paisleyRow(x1, x2, y, n, col, op) {
    var s = '<g fill="' + col + '" fill-opacity=".12" stroke="' + col + '" stroke-width="1.6" opacity="' + op + '">', i, step = (x2 - x1) / (n - 1);
    for (i = 0; i < n; i++) s += '<path d="' + PAISLEY + '" transform="translate(' + f1(x1 + i * step) + ' ' + y + ') scale(' + (i % 2 ? -1.1 : 1.1) + ' 1.1) rotate(' + (i % 2 ? 10 : -10) + ')"/>';
    return s + '</g>';
  }

  // ---------- layouts: draw decoration, return content box ----------
  var layoutFns = [
    function classic(c) {
      var W = c.W, H = c.H, t = c.t;
      c.back.push('<g transform="translate(' + W / 2 + ' ' + H / 2 + ')">' + mandala(Math.min(W, H) * .42, t.acc, .13, true, 1.4) + '</g>');
      c.back.push(frame(W, H, 34, t.acc, 3, 1) + frame(W, H, 52, t.acc, 1.2, .7, '3 7') + corners(W, H, 62, t.acc, .85));
      c.back.push(lotus(W / 2, 136, 1.1, t.acc) + divider(W / 2, H - 112, 360, t.acc));
      return { top: 190, bottom: H - 150, maxW: 700 };
    },
    function arch(c) {
      var W = c.W, H = c.H, t = c.t, x0 = 110, x1 = 890, top = 120, r = 390, b = H - 100;
      var d = function (i) { return 'M' + (x0 + i) + ' ' + b + 'V' + (top + r) + 'A' + (r - i) + ' ' + (r - i) + ' 0 0 1 ' + (x1 - i) + ' ' + (top + r) + 'V' + b + 'Z'; };
      c.back.push('<path d="' + d(0) + '" fill="' + (t.d ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.55)') + '" stroke="' + t.acc + '" stroke-width="3.5"/><path d="' + d(20) + '" fill="none" stroke="' + t.acc + '" stroke-width="1.3" stroke-dasharray="2 8" stroke-linecap="round"/>');
      c.back.push('<g transform="translate(' + W / 2 + ' ' + (top + 150) + ')">' + mandala(100, t.acc, .75, true, 1.6) + '</g>');
      c.back.push(frame(W, H, 30, t.acc, 1.4, .5) + paisleyRow(150, 850, b + 4, 9, t.acc, .0));
      return { top: top + 290, bottom: b - 60, maxW: 560 };
    },
    function medallion(c) {
      var W = c.W, H = c.H, t = c.t, cy = 330, R = 250, ini = (c.ini[0] + ' & ' + c.ini[1]);
      c.back.push('<circle cx="' + W / 2 + '" cy="' + cy + '" r="' + (R + 20) + '" fill="none" stroke="' + t.acc + '" stroke-width="1.4" stroke-dasharray="1 9" stroke-linecap="round"/>');
      c.back.push('<circle cx="' + W / 2 + '" cy="' + cy + '" r="' + R + '" fill="' + (t.d ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.55)') + '" stroke="' + t.acc + '" stroke-width="3"/>');
      c.back.push('<g transform="translate(' + W / 2 + ' ' + cy + ')">' + mandala(R - 14, t.acc, .7, true, 1.5) + '</g>');
      c.back.push('<text x="' + W / 2 + '" y="' + (cy + 52) + '" text-anchor="middle" font-family="\'' + c.fonts.script + '\',cursive" font-size="150" fill="url(#nm' + c.uid + ')">' + E(ini) + '</text>');
      c.back.push(frame(W, H, 30, t.acc, 2, .8) + paisleyRow(100, 900, H - 70, 9, t.acc, .85));
      return { top: cy + R + 50, bottom: H - 120, maxW: 740 };
    },
    function banner(c) {
      var W = c.W, H = c.H, t = c.t;
      c.back.push(scallopBand(W, 0, 190, false, t.acc, .22) + scallopBand(W, H - 190, 190, true, t.acc, .22));
      c.back.push(paisleyRow(90, 910, 70, 9, t.acc, .95) + paisleyRow(90, 910, H - 135, 9, t.acc, .95));
      c.back.push('<line x1="64" y1="240" x2="64" y2="' + (H - 240) + '" stroke="' + t.acc + '" stroke-width="1.4" stroke-dasharray="1 8" stroke-linecap="round"/><line x1="' + (W - 64) + '" y1="240" x2="' + (W - 64) + '" y2="' + (H - 240) + '" stroke="' + t.acc + '" stroke-width="1.4" stroke-dasharray="1 8" stroke-linecap="round"/>');
      c.back.push('<g transform="translate(' + W / 2 + ' ' + H / 2 + ')">' + mandala(330, t.acc, .1, true, 1.3) + '</g>');
      return { top: 250, bottom: H - 250, maxW: 760 };
    },
    function modern(c) {
      var W = c.W, H = c.H, t = c.t;
      c.back.push('<text x="' + W / 2 + '" y="' + (H / 2 + 230) + '" text-anchor="middle" font-family="\'' + c.fonts.script + '\',cursive" font-size="760" fill="' + t.acc + '" opacity=".08">' + E(c.ini[0]) + '</text>');
      c.back.push(frame(W, H, 50, t.acc, 1.6, 1) + '<line x1="' + W / 2 + '" y1="50" x2="' + W / 2 + '" y2="150" stroke="' + t.acc + '" stroke-width="1.6"/><line x1="' + W / 2 + '" y1="' + (H - 150) + '" x2="' + W / 2 + '" y2="' + (H - 50) + '" stroke="' + t.acc + '" stroke-width="1.6"/>');
      c.back.push('<rect x="' + (W / 2 - 7) + '" y="140" width="14" height="14" transform="rotate(45 ' + W / 2 + ' 147)" fill="' + t.acc + '"/><rect x="' + (W / 2 - 7) + '" y="' + (H - 154) + '" width="14" height="14" transform="rotate(45 ' + W / 2 + ' ' + (H - 147) + ')" fill="' + t.acc + '"/>');
      [[50, 50], [W - 50, 50], [50, H - 50], [W - 50, H - 50]].forEach(function (p) { c.back.push('<rect x="' + (p[0] - 9) + '" y="' + (p[1] - 9) + '" width="18" height="18" fill="' + t.acc + '"/>'); });
      return { top: 200, bottom: H - 200, maxW: 720 };
    },
    function gate(c) {
      var W = c.W, H = c.H, t = c.t, i, s = '';
      for (i = 0; i < W / 50 + 1; i++) s += '<path d="M' + (i * 50) + ' 0A25 25 0 0 0 ' + (i * 50 + 50) + ' 0" transform="translate(0 70)" fill="none" stroke="' + t.acc + '" stroke-width="1.6"/>';
      c.back.push(scallopBand(W, 0, 90, false, t.acc, .3) + s);
      for (i = 0; i < 19; i++) { var x = 25 + i * 50, len = 30 + c.rng() * 60; c.back.push('<line x1="' + x + '" y1="95" x2="' + x + '" y2="' + (95 + len) + '" stroke="' + t.acc + '" stroke-width="1.2" opacity=".8"/><circle cx="' + x + '" cy="' + (95 + len + 5) + '" r="4.5" fill="' + t.acc + '"/>'); }
      [[40, 130], [W - 110, 130]].forEach(function (p) {
        var px = p[0], py = p[1], ph = H - 130 - 70, n = Math.floor(ph / 70), j;
        c.back.push('<rect x="' + px + '" y="' + py + '" width="70" height="' + ph + '" rx="6" fill="' + t.acc + '" fill-opacity=".1" stroke="' + t.acc + '" stroke-width="2"/>');
        for (j = 0; j < n; j++) c.back.push('<path d="M' + (px + 35) + ' ' + (py + 12 + j * 70) + 'l22 23l-22 23l-22-23z" fill="none" stroke="' + t.acc + '" stroke-width="1.4"/>');
      });
      c.back.push(divider(W / 2, H - 100, 340, t.acc) + lotus(W / 2, 205, 1, t.acc));
      return { top: 260, bottom: H - 140, maxW: 600 };
    }
  ];

  // ---------- content ----------
  function fmtDate(v) {
    if (!v) return '';
    var p = v.split('-'); if (p.length !== 3) return v;
    var dt = new Date(+p[0], +p[1] - 1, +p[2]);
    try { return dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return v; }
  }
  function fmtTime(v) {
    if (!v) return '';
    var p = v.split(':'), h = +p[0], m = p[1] || '00', ap = h >= 12 ? 'PM' : 'AM';
    return (h % 12 || 12) + ':' + m + ' ' + ap;
  }
  function items(d, rng, fonts) {
    var tr = TRAD[d.tradition] || TRAD.universal, pick = function (a) { return a[Math.floor(rng() * a.length)]; };
    var A = d.order === 'groom' ? { n: d.groom, p: d.groomParents, r: 'Son of' } : { n: d.bride, p: d.brideParents, r: 'Daughter of' };
    var B = d.order === 'groom' ? { n: d.bride, p: d.brideParents, r: 'Daughter of' } : { n: d.groom, p: d.groomParents, r: 'Son of' };
    var m = SCRIPTS[fonts.script] || 1, it = [];
    it.push({ f: 'r', text: pick(tr.inv), size: 26, col: 'acc', ls: 1.5, gap: 20, w: 700 });
    it.push({ f: 'r', text: pick(tr.line), size: 26, col: 'ink', gap: 20, op: .92 });
    it.push({ f: 's', text: A.n, size: 124 * m, col: 'nm', fit: 1, gap: 0 });
    it.push({ f: 's', text: '&', size: 60, col: 'acc', gap: 0 });
    it.push({ f: 's', text: B.n, size: 124 * m, col: 'nm', fit: 1, gap: 14 });
    if (A.p) it.push({ f: 'r', text: A.r + ' ' + A.p, size: 23, col: 'ink', gap: 4, op: .85 });
    if (B.p) it.push({ f: 'r', text: B.r + ' ' + B.p, size: 23, col: 'ink', gap: 6, op: .85 });
    it.push({ t: 'div' });
    (d.events || []).forEach(function (e) {
      if (!(e.label || e.date || e.venue)) return;
      if (e.label) it.push({ f: 'r', text: e.label, size: 27, col: 'acc', up: 1, ls: 6, gap: 6, w: 700 });
      if (e.date) it.push({ f: 'r', text: fmtDate(e.date), size: 34, col: 'ink', gap: 2 });
      if (e.time) it.push({ f: 'r', text: 'at ' + fmtTime(e.time), size: 28, col: 'ink', gap: 4, op: .92 });
      if (e.venue) it.push({ f: 'r', text: e.venue, size: 30, col: 'ink', gap: 0, w: 700 });
      if (e.addr) it.push({ f: 'r', text: e.addr, size: 23, col: 'ink', gap: 0, op: .85 });
      it.push({ t: 'sp', h: 22 });
    });
    if (d.dress) it.push({ f: 'r', text: 'Dress code: ' + d.dress, size: 24, col: 'acc', gap: 8 });
    if (d.message) it.push({ f: 'r', text: d.message, size: 25, col: 'ink', gap: 10, op: .92 });
    if (d.rsvp) it.push({ f: 'r', text: 'RSVP: ' + d.rsvp, size: 25, col: 'acc', ls: 1, gap: 0, w: 700 });
    return it;
  }
  function wrap(s, maxC) {
    var words = s.split(/\s+/), lines = [], cur = '';
    words.forEach(function (w) { if (cur && (cur + ' ' + w).length > maxC) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; });
    if (cur) lines.push(cur); return lines;
  }
  function flow(its, maxW, sc, fonts) {
    var out = [], h = 0;
    its.forEach(function (it) {
      if (it.t === 'sp') { out.push({ t: 'sp', h: it.h * sc }); h += it.h * sc; return; }
      if (it.t === 'div') { out.push({ t: 'div', h: 56 * sc }); h += 56 * sc; return; }
      var fam = it.f === 's' ? fonts.script : fonts.serif, cw = it.f === 's' ? .4 : SERIFS[fam], size = it.size * sc, ls = (it.ls || 0) * sc;
      var s = it.up ? it.text.toUpperCase() : it.text, lines;
      if (it.fit) { size = Math.min(size, (maxW / Math.max(1, s.length) - ls) / cw); lines = [s]; }
      else { lines = wrap(s, Math.max(6, Math.floor(maxW / (cw * size + ls)))); }
      var lh = size * (it.f === 's' ? 1.1 : 1.32), gap = (it.gap || 0) * sc;
      out.push({ it: it, fam: fam, size: size, ls: ls, lines: lines, lh: lh, gap: gap });
      h += lines.length * lh + gap;
    });
    return { list: out, h: h };
  }

  // ---------- main build ----------
  SCS.build = function (d, spec) {
    var W = 1000, H = spec.H, t = THEMES[spec.theme], rng = mulberry32(spec.seed + 7), uid = 'c' + spec.seed.toString(36);
    var fonts = spec.fonts, defs = [], back = [], front = [];
    var ini = [(d.order === 'groom' ? d.groom : d.bride).trim().charAt(0).toUpperCase() || 'A', (d.order === 'groom' ? d.bride : d.groom).trim().charAt(0).toUpperCase() || 'B'];
    var c = { W: W, H: H, t: t, uid: uid, back: back, rng: rng, fonts: fonts, ini: ini };

    // background + pattern
    if (spec.bg === 1) defs.push('<radialGradient id="bg' + uid + '" cx=".5" cy=".42" r=".8"><stop offset="0" stop-color="' + t.bg1 + '"/><stop offset="1" stop-color="' + t.bg2 + '"/></radialGradient>');
    else defs.push('<linearGradient id="bg' + uid + '" x1="0" y1="0" x2="' + (spec.bg ? 1 : 0) + '" y2="1"><stop offset="0" stop-color="' + t.bg1 + '"/><stop offset="1" stop-color="' + t.bg2 + '"/></linearGradient>');
    defs.push('<linearGradient id="nm' + uid + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + W + '" y2="0"><stop offset=".34" stop-color="' + t.nm + '"/><stop offset=".5" stop-color="' + t.hi + '"/><stop offset=".66" stop-color="' + t.nm + '"/><animateTransform attributeName="gradientTransform" type="translate" from="-1100 0" to="1100 0" dur="5s" repeatCount="indefinite"/></linearGradient>');
    var pat = ['', 'jali', 'dots', 'stars', 'waves'][spec.pattern], pop = t.d ? .09 : .13;
    if (pat) {
      var shape = { jali: '<path d="M30 2L58 30L30 58L2 30Z" fill="none" stroke="' + t.acc + '" stroke-width="1.2"/>', dots: '<circle cx="30" cy="30" r="2.6" fill="' + t.acc + '"/>', stars: star4(30, 30, 9, t.acc), waves: '<path d="M0 30Q15 12 30 30T60 30" fill="none" stroke="' + t.acc + '" stroke-width="1.2"/>' }[pat];
      defs.push('<pattern id="pt' + uid + '" width="60" height="60" patternUnits="userSpaceOnUse">' + shape + '</pattern>');
    }
    back.push('<rect width="' + W + '" height="' + H + '" fill="url(#bg' + uid + ')"/>');
    if (pat) back.push('<rect width="' + W + '" height="' + H + '" fill="url(#pt' + uid + ')" opacity="' + pop + '"/>');

    var box = layoutFns[spec.layout](c);

    // text flow
    var its = items(d, rng, fonts), areaH = box.bottom - box.top, sc = 1, L = flow(its, box.maxW, sc, fonts);
    if (L.h > areaH) { sc = Math.max(.5, areaH / L.h * .96); L = flow(its, box.maxW, sc, fonts); }
    else if (L.h < areaH * .78) { sc = Math.min(1.22, areaH * .9 / L.h); L = flow(its, box.maxW, sc, fonts); if (L.h > areaH) { sc = sc * areaH / L.h * .96; L = flow(its, box.maxW, sc, fonts); } }
    var y = box.top + Math.max(0, (areaH - L.h) / 2), cx = W / 2, n = 0, delay = .3;
    var tb = { x0: cx - box.maxW / 2 - 10, x1: cx + box.maxW / 2 + 10, y0: y - 10, y1: y + L.h + 10 };
    L.list.forEach(function (o) {
      if (o.t === 'sp') { y += o.h; return; }
      if (o.t === 'div') { front.push('<g class="rise" style="animation-delay:' + delay.toFixed(2) + 's">' + divider(cx, f1(y + o.h / 2), 300, t.acc) + '</g>'); y += o.h; delay += .12; return; }
      var it = o.it, fill = it.col === 'nm' ? 'url(#nm' + uid + ')' : (it.col === 'acc' ? t.acc : t.ink);
      var fam = o.fam + (it.f === 's' ? "',cursive" : "',serif"), w = o.fam === 'Marcellus' ? 400 : (it.w || 500);
      o.lines.forEach(function (ln, i) {
        front.push('<text class="rise" style="animation-delay:' + delay.toFixed(2) + 's" x="' + cx + '" y="' + f1(y + i * o.lh + o.size * .82) + '" text-anchor="middle" font-family="\'' + fam + '" font-size="' + f1(o.size) + '" font-weight="' + w + '" fill="' + fill + '"' + (o.ls ? ' letter-spacing="' + f1(o.ls) + '"' : '') + (it.op ? ' fill-opacity="' + it.op + '"' : '') + '>' + E(ln) + '</text>');
        delay += .09;
      });
      y += o.lines.length * o.lh + o.gap;
    });

    // effects overlay
    var fx = [], i;
    var cnt = 16 + Math.floor(rng() * 10);
    var free = function (px, py, r) { return !(px + r > tb.x0 && px - r < tb.x1 && py + r > tb.y0 && py - r < tb.y1); };
    for (i = 0; i < cnt; i++) {
      var sx = rng() * W, sy = rng() * H, sr = 5 + rng() * 13;
      if (!free(sx, sy, sr)) continue;
      fx.push(star4(sx, sy, sr, rng() < .5 ? t.hi : t.acc, 'class="tw" style="animation-delay:' + (rng() * 4).toFixed(2) + 's;animation-duration:' + (2 + rng() * 3).toFixed(1) + 's;transform-origin:' + f1(sx) + 'px ' + f1(sy) + 'px"'));
    }
    if (spec.petals) {
      var pcols = t.d ? ['#f9a8b8', '#ffb703', '#ffd6a5', '#ffffff'] : ['#e5446d', '#ff9f1c', '#f48fb1', '#c2185b'];
      for (i = 0; i < 12; i++) {
        var px = rng() * W, py = rng() * H;
        fx.push('<g transform="translate(' + f1(px) + ' ' + f1(py) + ')"><g class="petal" style="--y0:' + f1(py) + 'px;--h:' + H + 'px;--dx:' + Math.round(-90 + rng() * 180) + 'px;animation-duration:' + (9 + rng() * 8).toFixed(1) + 's;animation-delay:-' + (rng() * 12).toFixed(1) + 's"><path d="M0 0C10-14 22-14 28 0C22 14 10 14 0 0Z" fill="' + pcols[i % 4] + '" opacity=".8" transform="scale(' + (.7 + rng() * .8).toFixed(2) + ') rotate(' + Math.round(rng() * 360) + ')"/></g></g>');
      }
    }
    if (spec.bokeh) for (i = 0; i < 10; i++) { var bx = rng() * W, by = H * .3 + rng() * H * .7, br = 10 + rng() * 26; if (!free(bx, by, br)) continue; fx.push('<circle cx="' + f1(bx) + '" cy="' + f1(by) + '" r="' + f1(br) + '" fill="' + t.acc + '" opacity=".14" class="float" style="animation-duration:' + (10 + rng() * 10).toFixed(1) + 's;animation-delay:-' + (rng() * 10).toFixed(1) + 's"/>'); }

    var title = 'Wedding invitation of ' + d.bride + ' and ' + d.groom;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="cardsvg" role="img" aria-label="' + E(title) + '"><defs>' + defs.join('') + '</defs>' + back.join('') + '<g>' + front.join('') + '</g><g pointer-events="none">' + fx.join('') + '</g></svg>';
    return { svg: svg, fonts: [fonts.script, fonts.serif], label: LAYOUTS[spec.layout] + ' · ' + t.n, W: W, H: H };
  };

  // ---------- planning: unique combos per batch ----------
  function shuffle(a, rng) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  SCS.plan = function (n, H, base) {
    var rng = mulberry32(base), L = shuffle([0, 1, 2, 3, 4, 5], rng), T = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], rng), out = [], i;
    var sk = Object.keys(SCRIPTS), rk = Object.keys(SERIFS);
    for (i = 0; i < n; i++) {
      out.push({ seed: Math.floor(rng() * 1e9) + 1, H: H, layout: L[i % 6], theme: T[(i + Math.floor(i / 6) * 3) % 10], pattern: Math.floor(rng() * 5), bg: Math.floor(rng() * 3),
        petals: rng() < .55, bokeh: rng() < .4, fonts: { script: sk[Math.floor(rng() * sk.length)], serif: rk[Math.floor(rng() * rk.length)] } });
    }
    return out;
  };
  if (typeof module !== 'undefined') module.exports = SCS;
})(typeof window !== 'undefined' ? window : globalThis);
