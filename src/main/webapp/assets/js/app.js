(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var cards = [], seq = 0, KEY = 'shaadi-card-studio-v1';
  var SAMPLE = { bride: 'Aanya', groom: 'Rohan', order: 'bride', tradition: 'hindu', brideParents: 'Mr. & Mrs. Sharma', groomParents: 'Mr. & Mrs. Verma',
    events: [{ label: 'Wedding', date: '2026-12-14', time: '19:00', venue: 'The Grand Palace', addr: 'MG Road, Nashik, Maharashtra' }, { label: 'Reception', date: '2026-12-15', time: '20:00', venue: 'Sky Lawns', addr: 'College Road, Nashik' }],
    rsvp: '+91 98765 43210', dress: 'Traditional', message: 'Aapki maujoodgi hamari khushi dugni kar degi.' };

  // ---- petals background ----
  var cv = $('#bg'), cx = cv.getContext('2d'), W, H, P = [];
  function rs() { W = cv.width = innerWidth; H = cv.height = innerHeight; } rs(); addEventListener('resize', rs);
  for (var i = 0; i < 26; i++) P.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, s: 5 + Math.random() * 9, v: .3 + Math.random() * .7, d: Math.random() * 6, r: Math.random() * 6, c: ['233,196,106', '240,138,155', '255,255,255'][i % 3] });
  (function loop() {
    cx.clearRect(0, 0, W, H);
    P.forEach(function (p) { p.y += p.v; p.d += .02; p.r += .015; p.x += Math.sin(p.d) * .6; if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = 'rgba(' + p.c + ',.35)'; cx.beginPath(); cx.ellipse(0, 0, p.s, p.s * .5, 0, 0, 6.3); cx.fill(); cx.restore(); });
    if (!matchMedia('(prefers-reduced-motion:reduce)').matches) requestAnimationFrame(loop);
  })();

  // ---- events rows ----
  var LABELS = ['Wedding', 'Nikah', 'Reception', 'Walima', 'Mehndi', 'Haldi', 'Sangeet', 'Baraat', 'Anand Karaj', 'Engagement'];
  function addEvent(e) {
    if ($$('.ev').length >= 4) { say('Maximum 4 events allowed hain.'); return; }
    e = e || {}; var d = document.createElement('div'); d.className = 'ev';
    d.innerHTML = '<button class="del" type="button" aria-label="Event hatao">&times;</button><label class="w3">Event<input class="e-label" list="lbls" maxlength="24" placeholder="Wedding"></label><label>Date<input class="e-date" type="date"></label><label>Time<input class="e-time" type="time"></label>' +
      '<label class="w2">Venue<input class="e-venue" maxlength="50" placeholder="The Grand Palace"></label><label class="w3">Address<input class="e-addr" maxlength="90" placeholder="Road, City, State"></label>';
    $('#events').appendChild(d);
    $('.e-label', d).value = e.label || ''; $('.e-date', d).value = e.date || ''; $('.e-time', d).value = e.time || ''; $('.e-venue', d).value = e.venue || ''; $('.e-addr', d).value = e.addr || '';
    $('.del', d).onclick = function () { d.remove(); save(); };
  }
  var dl = document.createElement('datalist'); dl.id = 'lbls'; dl.innerHTML = LABELS.map(function (l) { return '<option value="' + l + '">'; }).join(''); document.body.appendChild(dl);

  function read() {
    return { bride: $('#bride').value.trim(), groom: $('#groom').value.trim(), order: $('#order').value, tradition: $('#tradition').value, brideParents: $('#brideParents').value.trim(), groomParents: $('#groomParents').value.trim(),
      rsvp: $('#rsvp').value.trim(), dress: $('#dress').value.trim(), message: $('#message').value.trim(),
      events: $$('.ev').map(function (d) { return { label: $('.e-label', d).value.trim(), date: $('.e-date', d).value, time: $('.e-time', d).value, venue: $('.e-venue', d).value.trim(), addr: $('.e-addr', d).value.trim() }; }) };
  }
  function fill(d) {
    ['bride', 'groom', 'order', 'tradition', 'brideParents', 'groomParents', 'rsvp', 'dress', 'message'].forEach(function (k) { $('#' + k).value = d[k] || ''; });
    $('#events').innerHTML = ''; (d.events && d.events.length ? d.events : [{}]).forEach(addEvent);
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(read())); } catch (e) {} }
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function say(t) { $('#msg').textContent = t || ''; }

  // ---- cards ----
  function slug(s) { return (s || 'card').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function fname(d, n, ext) { return slug(d.bride) + '-weds-' + slug(d.groom) + '-card-' + n + '.' + ext; }
  function makeCard(d, spec) {
    var r = SCS.build(d, spec), id = ++seq, el = document.createElement('figure');
    el.className = 'card'; el.style.setProperty('--i', cards.length % 12);
    el.innerHTML = '<div class="sv" title="Bada karke dekho">' + r.svg + '</div><figcaption><span class="tag">' + r.label + ' &middot; ' + spec.fonts.script + '</span><div class="acts"><button data-a="png">PNG</button><button data-a="pdf">PDF</button><button data-a="share">Share</button><button data-a="roll">Naya design</button></div></figcaption>';
    var c = { id: id, spec: spec, r: r, el: el, d: d }; el.__c = c; tilt(el);
    return c;
  }
  function tilt(el) {
    var sv = $('.sv', el);
    el.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; var b = sv.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5; sv.style.transform = 'rotateY(' + (x * 10).toFixed(1) + 'deg) rotateX(' + (-y * 10).toFixed(1) + 'deg)'; });
    el.addEventListener('pointerleave', function () { sv.style.transform = ''; });
  }
  function generate(append, quiet) {
    var d = read();
    if (!d.bride || !d.groom) { say('Pehle dulhan aur dulha ka naam daalo.'); return; }
    say(''); save();
    var n = +$('#count').value, H = +$('#format').value, specs = SCS.plan(n, H, Math.floor(Math.random() * 1e9));
    $('#results').hidden = false;
    var g = $('#grid'); if (!append) { g.innerHTML = ''; cards = []; }
    var btn = $('#gen'); btn.disabled = true; btn.textContent = 'Ban rahe hain...';
    var sk = []; specs.forEach(function () { var s = document.createElement('div'); s.className = 'skel'; g.appendChild(s); sk.push(s); });
    if (!quiet) $('#results').scrollIntoView({ behavior: 'smooth' });
    var i = 0;
    (function next() {
      if (i >= specs.length) { btn.disabled = false; btn.textContent = 'Cards generate karo'; stat(); return; }
      setTimeout(function () { var c = makeCard(d, specs[i]); cards.push(c); sk[i].replaceWith(c.el); i++; stat(); next(); }, 140);
    })();
  }
  function stat() { $('#stat').textContent = cards.length + ' unique cards. Kisi par click karke bada dekho, ya "Naya design" se sirf wahi badlo.'; }

  function blobFor(c, kind) {
    var svg = $('svg', c.el);
    return kind === 'jpg' ? SCS.toBlob(svg, c.r.fonts, 1, 'image/jpeg', .93) : SCS.toBlob(svg, c.r.fonts, 1.5, 'image/png');
  }
  function busy(btn, on, label) { if (btn) { btn.disabled = on; if (label) btn.textContent = on ? '...' : label; } }
  $('#grid').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-a]'), card = e.target.closest('.card');
    if (!card) return;
    var c = card.__c, n = cards.indexOf(c) + 1;
    if (!b) { if (e.target.closest('.sv')) openModal(c); return; }
    var a = b.dataset.a, old = b.textContent;
    if (a === 'roll') {
      var s = SCS.plan(1, c.spec.H, Math.floor(Math.random() * 1e9))[0]; s.H = c.spec.H;
      var nc = makeCard(c.d, s); nc.el.style.animationDelay = '0s'; cards[cards.indexOf(c)] = nc; card.replaceWith(nc.el); return;
    }
    busy(b, true, old);
    if (a === 'png') blobFor(c, 'png').then(function (bl) { SCS.save(bl, fname(c.d, n, 'png')); }).catch(fail).then(function () { busy(b, false, old); });
    if (a === 'pdf') pdfOf([c]).then(function (bl) { SCS.save(bl, fname(c.d, n, 'pdf')); }).catch(fail).then(function () { busy(b, false, old); });
    if (a === 'share') blobFor(c, 'png').then(function (bl) {
      var f = new File([bl], fname(c.d, n, 'png'), { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], title: 'Shaadi ka card' });
      SCS.save(bl, fname(c.d, n, 'png')); say('Is device par direct share nahi hota, isliye card download ho gaya.');
    }).catch(function (er) { if (er && er.name !== 'AbortError') fail(er); }).then(function () { busy(b, false, old); });
  });
  function fail() { say('Download mein dikkat aayi. Dobara try karo.'); }
  function pdfOf(list) {
    return Promise.all(list.map(function (c) { return blobFor(c, 'jpg').then(SCS.bytes).then(function (u) { return { jpeg: u, w: Math.round(c.r.W * 1), h: Math.round(c.r.H * 1) }; }); })).then(SCS.makePdf);
  }
  $('#zip').onclick = function () {
    if (!cards.length) return; var b = this; busy(b, true); var d = cards[0].d, files = [], i = 0;
    (function next() {
      if (i >= cards.length) { SCS.save(SCS.makeZip(files), slug(d.bride) + '-' + slug(d.groom) + '-wedding-cards.zip'); busy(b, false); b.textContent = 'Sab PNG (ZIP)'; return; }
      b.textContent = (i + 1) + '/' + cards.length + '...';
      blobFor(cards[i], 'png').then(SCS.bytes).then(function (u) { files.push({ name: fname(d, i + 1, 'png'), data: u }); i++; next(); }).catch(function () { fail(); busy(b, false); b.textContent = 'Sab PNG (ZIP)'; });
    })();
  };
  $('#pdf').onclick = function () {
    if (!cards.length) return; var b = this; busy(b, true); b.textContent = 'PDF ban rahi hai...';
    pdfOf(cards).then(function (bl) { SCS.save(bl, slug(cards[0].d.bride) + '-' + slug(cards[0].d.groom) + '-wedding-cards.pdf'); }).catch(fail).then(function () { busy(b, false); b.textContent = 'Sab PDF'; });
  };

  // ---- modal ----
  function openModal(c) { $('#mbody').innerHTML = $('.sv', c.el).innerHTML; $('#modal').hidden = false; }
  $('#modal').addEventListener('click', function (e) { if (e.target.id === 'modal' || e.target.className === 'x') this.hidden = true; });
  addEventListener('keydown', function (e) { if (e.key === 'Escape') $('#modal').hidden = true; });

  // ---- wiring ----
  $('#addEvent').onclick = function () { addEvent(); };
  $('#gen').onclick = function () { generate(false); };
  $('#more').onclick = function () { generate(true); };
  $('#sample').onclick = function () { fill(SAMPLE); save(); say('Sample details bhar di gayi hain. Ab naam badal lo.'); };
  $('#count').oninput = function () { $('#cntv').textContent = this.value; };
  document.addEventListener('input', function (e) { if (e.target.closest('#studio')) save(); });
  var saved = load(); fill(saved && saved.bride ? saved : SAMPLE);
  if (!(saved && saved.bride)) { $('#count').value = 4; $('#cntv').textContent = 4; setTimeout(function () { generate(false, true); $('#count').value = 6; $('#cntv').textContent = 6; }, 400); }
})();
