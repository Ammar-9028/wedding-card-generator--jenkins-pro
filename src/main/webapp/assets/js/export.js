/* Download helpers: SVG -> PNG/JPEG (fonts embedded), multi-page PDF and ZIP writers. No libraries needed. */
(function (g) {
  'use strict';
  var SCS = g.SCS = g.SCS || {};
  var cssCache = null, fontCache = {};

  function b64(buf) { var b = new Uint8Array(buf), s = '', i; for (i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }

  // Embed only the Latin subset of the Google fonts a card uses, so the exported image looks identical.
  function fontCss(fams) {
    return Promise.resolve().then(function () {
      return cssCache ? cssCache : fetch(SCS.FONTS_URL).then(function (r) { return r.text(); }).then(function (t) { return (cssCache = t); });
    }).then(function (css) {
      var re = /\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g, m, jobs = [];
      while ((m = re.exec(css))) {
        if (m[1] !== 'latin') continue;
        var fam = /font-family:\s*'([^']+)'/.exec(m[2]), url = /url\(([^)]+)\)/.exec(m[2]), w = /font-weight:\s*([^;]+)/.exec(m[2]);
        if (fam && url && fams.indexOf(fam[1]) >= 0) jobs.push({ fam: fam[1], url: url[1].replace(/['"]/g, ''), w: w ? w[1].trim() : '400' });
      }
      return Promise.all(jobs.map(function (j) {
        if (fontCache[j.url]) return;
        return fetch(j.url).then(function (r) { return r.arrayBuffer(); }).then(function (b) { fontCache[j.url] = b64(b); });
      })).then(function () {
        return jobs.map(function (j) { return "@font-face{font-family:'" + j.fam + "';font-weight:" + j.w + ";font-style:normal;src:url(data:font/woff2;base64," + fontCache[j.url] + ") format('woff2');}"; }).join('');
      });
    }).catch(function () { return ''; });   // offline: falls back to installed fonts
  }

  SCS.toBlob = function (svgEl, fams, scale, mime, q) {
    return fontCss(fams).then(function (css) {
      var vb = svgEl.viewBox.baseVal, W = vb.width, H = vb.height, clone = svgEl.cloneNode(true);
      clone.setAttribute('width', W * scale); clone.setAttribute('height', H * scale);
      var xml = new XMLSerializer().serializeToString(clone).replace(/^(<svg[^>]*>)/, '$1<style>' + css + '</style>');
      var url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })), img = new Image();
      return new Promise(function (res, rej) { img.onload = res; img.onerror = function () { rej(new Error('render failed')); }; img.src = url; })
        .then(function () { return img.decode ? img.decode().catch(function () {}) : 0; })
        .then(function () { return new Promise(function (r) { setTimeout(r, 80); }); })
        .then(function () {
          var c = document.createElement('canvas'); c.width = W * scale; c.height = H * scale;
          var x = c.getContext('2d'); if (mime === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
          x.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
          return new Promise(function (r) { c.toBlob(r, mime, q); });
        });
    });
  };

  // ---- ZIP (store, no compression; PNGs are already compressed) ----
  var CRC = (function () { var t = [], n, k, c; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF, i; for (i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  SCS.makeZip = function (files) {
    var enc = new TextEncoder(), parts = [], cd = [], off = 0, d = new Date();
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1), date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.data), h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true); h.setUint16(10, time, true); h.setUint16(12, date, true);
      h.setUint32(14, crc, true); h.setUint32(18, f.data.length, true); h.setUint32(22, f.data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, time, true); c.setUint16(14, date, true);
      c.setUint32(16, crc, true); c.setUint32(20, f.data.length, true); c.setUint32(24, f.data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      parts.push(new Uint8Array(h.buffer), name, f.data); cd.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + f.data.length;
    });
    var cdLen = cd.reduce(function (a, b) { return a + b.length; }, 0), e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cdLen, true); e.setUint32(16, off, true);
    return new Blob(parts.concat(cd, [new Uint8Array(e.buffer)]), { type: 'application/zip' });
  };

  // ---- PDF (one JPEG per page) ----
  SCS.makePdf = function (pages) {
    var enc = new TextEncoder(), chunks = [], offs = [], len = 0;
    function push(x) { var b = typeof x === 'string' ? enc.encode(x) : x; chunks.push(b); len += b.length; }
    var n = pages.length, kids = pages.map(function (p, i) { return (3 + i * 3) + ' 0 R'; }).join(' ');
    push('%PDF-1.4\n');
    offs[1] = len; push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    offs[2] = len; push('2 0 obj\n<< /Type /Pages /Kids [' + kids + '] /Count ' + n + ' >>\nendobj\n');
    pages.forEach(function (p, i) {
      var pw = 420, ph = Math.round(420 * p.h / p.w * 100) / 100, o = 3 + i * 3, content = 'q ' + pw + ' 0 0 ' + ph + ' 0 0 cm /Im0 Do Q';
      offs[o] = len; push(o + ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw + ' ' + ph + '] /Resources << /XObject << /Im0 ' + (o + 2) + ' 0 R >> >> /Contents ' + (o + 1) + ' 0 R >>\nendobj\n');
      offs[o + 1] = len; push((o + 1) + ' 0 obj\n<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream\nendobj\n');
      offs[o + 2] = len; push((o + 2) + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.jpeg.length + ' >>\nstream\n');
      push(p.jpeg); push('\nendstream\nendobj\n');
    });
    var total = 3 + n * 3, xref = len, s = 'xref\n0 ' + total + '\n0000000000 65535 f \n', i;
    for (i = 1; i < total; i++) s += ('0000000000' + offs[i]).slice(-10) + ' 00000 n \n';
    push(s + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
    return new Blob(chunks, { type: 'application/pdf' });
  };

  SCS.save = function (blob, name) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  };
  SCS.bytes = function (blob) { return blob.arrayBuffer().then(function (b) { return new Uint8Array(b); }); };
  if (typeof module !== 'undefined') module.exports = SCS;
})(typeof window !== 'undefined' ? window : globalThis);
