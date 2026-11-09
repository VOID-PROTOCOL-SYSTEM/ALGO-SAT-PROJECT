/* MEMO ARCHIVE — six extra themes with secret codes: Windows 95, Synthwave, Blueprint, VHS, Noir, Tokyo night */
(function () {
  var FX = window.ArchiveFX; if (!FX || !FX.u) return;
  var U = FX.u, $ = U.$, $$ = U.$$, pick = U.pick, lget = U.lget, lset = U.lset, reduce = U.reduce, root = document.documentElement;
  var UP = 'ArrowUp', DN = 'ArrowDown', LT = 'ArrowLeft', RT = 'ArrowRight';
  function beep(f, f2, d, type, v, delay) { var s = FX.sound; if (s && s.on && s.tone) s.tone(f, f2 || 0, d || .08, type || 'square', v || .03, delay || 0); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function say(t) { FX.say && FX.say(t, true); }
  var cur = null, savedHue = 'cyan', prevPersona = null, wasRain = false, timers = [], rafs = [], nodes = [], handlers = [];
  function addNode(n) { document.body.appendChild(n); nodes.push(n); return n; }
  function every(fn, ms) { var t = setInterval(fn, ms); timers.push(t); return t; }
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function listen(tgt, ev, fn, opt) { tgt.addEventListener(ev, fn, opt); handlers.push([tgt, ev, fn, opt]); }
  function cleanup() { timers.forEach(function (t) { clearInterval(t); clearTimeout(t); }); timers = []; rafs.forEach(cancelAnimationFrame); rafs = []; nodes.forEach(function (n) { n.remove(); }); nodes = []; handlers.forEach(function (h) { h[0].removeEventListener(h[1], h[2], h[3]); }); handlers = []; }
  function noise(opacity, fps) {
    var c = el('canvas', 'th-noise'); c.width = 160; c.height = 90; c.style.cssText = 'z-index:9088;opacity:' + opacity + ';mix-blend-mode:screen;image-rendering:pixelated'; addNode(c); var x = c.getContext('2d'); if (!x) return;
    function draw() { var im = x.createImageData(160, 90), d = im.data; for (var i = 0; i < d.length; i += 4) { var v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } x.putImageData(im, 0, 0); } draw(); if (!reduce) every(draw, 1000 / fps);
  }
  function rainState() { var p = $('[data-fx=rain]'); return !!(p && p.classList.contains('on')); }

  /* ═════════ WINDOWS 95 ═════════ */
  var TIPS = ['Did you know? Typing "arcade" anywhere opens a hidden arcade. (Or up, up, down, down, B, A.)', 'The neural link eye has 11 personalities. Say "personas" in the chat to meet them.', 'Tip: Press the ` key to open the terminal. It cannot format C:. Probably.', 'Bug squashing is a valid career path. Click the little bugs.', 'The eye grows a crown at 1000 xp. Say "mission" for orders.', 'Fatal exception 0E has occurred at 0028:C0011E36. Just kidding. Everything is fine.', 'To exit this theme, click Start, then Shut Down. Or press the same code again.'];
  function w95On() {
    var boot = addNode(el('div', 't95-boot', '<div class="t95-logo">Memo Archive <i>95</i></div><div class="t95-prog"><span></span></div><div>Starting Memo Archive 95...</div>'));
    beep(262, 0, .25, 'triangle', .05); beep(330, 0, .25, 'triangle', .05, .18); beep(392, 0, .3, 'triangle', .05, .36); beep(523, 0, .7, 'triangle', .05, .54);
    later(function () { boot.remove(); }, 2000);
    var bar = addNode(el('div', 't95-bar')), st = el('div', 't95-btn', '<i class="t95-flag"></i>Start'), task = el('div', 't95-btn t95-task', '\uD83D\uDCC1 Memo Archive'), clock = el('div', 't95-clock', '');
    bar.appendChild(st); bar.appendChild(task); bar.appendChild(clock);
    function tick() { var d = new Date(), h = d.getHours() % 12 || 12, m = ('0' + d.getMinutes()).slice(-2); clock.textContent = h + ':' + m + ' ' + (d.getHours() < 12 ? 'AM' : 'PM'); } tick(); every(tick, 15000);
    var menu = null;
    function closeMenu() { if (menu) { menu.remove(); menu = null; st.classList.remove('on'); } }
    st.addEventListener('click', function (e) {
      e.stopPropagation(); if (menu) { closeMenu(); return; } st.classList.add('on'); beep(500, 0, .03, 'square', .02);
      menu = addNode(el('div', 't95-menu', '<div class="t95-side">Memo<b>95</b></div>')); var list = el('div', 't95-list'); menu.appendChild(list);
      function item(label, fn) { var i = el('div', 't95-item', label); i.addEventListener('click', function () { closeMenu(); fn(); }); list.appendChild(i); }
      $$('a.card-link').forEach(function (a) { var nm = $('.card-name', a); item('\uD83D\uDCC4 ' + (nm ? nm.textContent : 'Notebook'), function () { a.click(); }); });
      list.appendChild(el('div', 't95-sep')); item('\uD83D\uDD79 Arcade...', function () { FX.arcade && FX.arcade(); }); item('\u2328 MS-DOS Prompt', function () { var t = $('.term'); if (t) { t.classList.add('open'); var i = $('input', t); i && i.focus(); } }); item('\u2753 Tip of the Day', function () { tip(); });
      list.appendChild(el('div', 't95-sep')); item('\u23FB Shut Down...', function () { shut(); });
    });
    listen(document, 'click', function (e) { if (menu && !(e.target.closest && e.target.closest('.t95-menu'))) closeMenu(); });
    function drag(win, bar2) { var ox, oy, on = false; bar2.addEventListener('pointerdown', function (e) { if (e.target.closest('.t95-x')) return; on = true; var r = win.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top; bar2.setPointerCapture(e.pointerId); }); bar2.addEventListener('pointermove', function (e) { if (!on) return; win.style.left = Math.max(0, Math.min(innerWidth - 80, e.clientX - ox)) + 'px'; win.style.top = Math.max(0, Math.min(innerHeight - 60, e.clientY - oy)) + 'px'; }); bar2.addEventListener('pointerup', function () { on = false; }); }
    function tip() {
      var w = addNode(el('div', 't95-win', '<div class="t95-title"><span>Tip of the Day</span><span class="t95-x">\u00D7</span></div><div class="t95-body"><span class="t95-ico">\uD83D\uDCA1</span><b>Did you know...</b><br>' + pick(TIPS) + '</div><div class="t95-ok"><span class="t95-btn">OK</span> <span class="t95-btn">Next Tip</span></div>'));
      w.style.left = Math.max(10, innerWidth / 2 - 120 + R2(-60, 60)) + 'px'; w.style.top = Math.max(10, innerHeight / 3 + R2(-40, 40)) + 'px'; drag(w, $('.t95-title', w));
      $('.t95-x', w).addEventListener('click', function () { w.remove(); }); var bs = $$('.t95-btn', w); bs[0].addEventListener('click', function () { w.remove(); beep(440, 0, .04, 'square', .02); }); bs[1].addEventListener('click', function () { $('.t95-body', w).innerHTML = '<span class="t95-ico">\uD83D\uDCA1</span><b>Did you know...</b><br>' + pick(TIPS); });
    }
    function R2(a, b) { return a + Math.random() * (b - a); }
    function shut() { var o = addNode(el('div', 't95-off', 'It\'s now safe to turn off<br>your computer.')); beep(392, 262, .6, 'triangle', .05); later(function () { o.remove(); setTheme(null); }, 2200); }
    later(tip, 2300);
  }

  /* ═════════ SYNTHWAVE ═════════ */
  function synthOn() { if (!rainState()) { /* keep rain off; theme brings its own sky */ } beep(110, 220, .8, 'sawtooth', .04); beep(165, 330, .8, 'sawtooth', .03, .15); }

  /* ═════════ BLUEPRINT ═════════ */
  function bpOn() {
    var b = addNode(el('div', 'bp-block', '<div class="t">MEMO ARCHIVE</div><div>DRAWN: RUNNER</div><div>SCALE 1:1</div><div>SHEET 1 OF 1</div><div>REV ' + (new Date().toISOString().slice(0, 10)) + '</div>'));
    var h = addNode(el('div', 'bp-dim bp-dh', '<span></span>')), v = addNode(el('div', 'bp-dim bp-dv', '<span></span>'));
    function show(c) { var r = c.getBoundingClientRect(); h.style.left = r.left + 'px'; h.style.width = r.width + 'px'; h.style.top = Math.max(2, r.top - 20) + 'px'; h.firstChild.textContent = Math.round(r.width) + ' PX'; v.style.left = Math.max(46, r.left - 18) + 'px'; v.style.top = r.top + 'px'; v.style.height = r.height + 'px'; v.firstChild.textContent = Math.round(r.height) + ' PX'; h.classList.add('on'); v.classList.add('on'); }
    function hide() { h.classList.remove('on'); v.classList.remove('on'); }
    listen(document, 'mouseover', function (e) { var c = e.target.closest && e.target.closest('a.card-link,.hud-tile'); if (c) show(c); else hide(); });
    listen(window, 'scroll', hide, { passive: true }); beep(900, 0, .03, 'square', .02); beep(1200, 0, .03, 'square', .02, .05);
  }

  /* ═════════ VHS ═════════ */
  function vhsOn() {
    var blue = addNode(el('div', 'th-blue', 'PLAY \u25B6<br><span style="opacity:.7;font-size:20px">SP</span>'));
    addNode(el('div', 'vhs-track')); noise(.055, 14);
    var tl = addNode(el('div', 'vhs-osd tl', '<span class="blink">\u25B6</span> PLAY')), tr = addNode(el('div', 'vhs-osd tr', '')), bl = addNode(el('div', 'vhs-osd bl', ''));
    var t0 = Date.now(), M = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    function osd() { var s = Math.floor((Date.now() - t0) / 1000), p = function (n) { return ('0' + n).slice(-2); }, d = new Date(); tr.textContent = 'SP 0:' + p(Math.floor(s / 60) % 60) + ':' + p(s % 60); bl.innerHTML = p(d.getHours() % 12 || 12) + ':' + p(d.getMinutes()) + (d.getHours() < 12 ? ' AM' : ' PM') + '<br>' + M[d.getMonth()] + '. ' + d.getDate() + ' ' + d.getFullYear(); } osd(); every(osd, 1000);
    function glitch() { root.classList.add('vhs-glitch'); later(function () { root.classList.remove('vhs-glitch'); }, 110 + Math.random() * 120); later(glitch, 2500 + Math.random() * 5500); } later(glitch, 2500);
    beep(180, 90, .5, 'sawtooth', .03); later(function () { blue.remove(); }, 1300);
  }
  function vhsOff() { var b = el('div', 'th-blue', '\u25A0 STOP'); document.body.appendChild(b); setTimeout(function () { b.remove(); }, 1300); beep(120, 60, .4, 'sawtooth', .03); }

  /* ═════════ NOIR ═════════ */
  function noirOn() {
    addNode(el('div', 'noir-blinds')); var light = addNode(el('div', 'noir-light')); noise(.04, 12);
    addNode(el('div', 'noir-stamp', 'CASE FILE No. ' + (1000 + new Date().getDate() * 7 + new Date().getMonth()) + '<br>CLASSIFIED'));
    var mx = innerWidth / 2, my = innerHeight * .38, pend = 0; function mv(e) { mx = e.clientX; my = e.clientY; if (!pend) pend = requestAnimationFrame(function () { pend = 0; light.style.setProperty('--mx', mx + 'px'); light.style.setProperty('--my', my + 'px'); }); } listen(window, 'pointermove', mv);
    wasRain = rainState(); if (!wasRain && FX.rain) FX.rain(true);
    prevPersona = FX.nlState ? FX.nlState().persona : null; FX.setPersona && FX.setPersona('noir');
    beep(98, 82, 1.2, 'sawtooth', .03);
  }
  function noirOff() { if (!wasRain && FX.rain) FX.rain(false); FX.setPersona && FX.setPersona(prevPersona || 'default'); }

  /* ═════════ TOKYO NIGHT ═════════ */
  function tokyoOn() {
    addNode(el('div', 'tk-puddle')); addNode(el('div', 'tk-sign p', '\u8A18\u61B6'));                       /* 記憶 memory */
    addNode(el('div', 'tk-sign c', '\u30A2\u30FC\u30AB\u30A4\u30D6'));                                       /* アーカイブ archive */
    addNode(el('div', 'tk-sign y', '\u96FB\u8133\u591C'));                                                   /* 電脳夜 cyber night */
    var c = el('canvas', 'th-glass'); c.style.zIndex = 9084; addNode(c); var W = c.width = innerWidth, H = c.height = innerHeight, x = c.getContext('2d'); if (!x) return;
    var drops = []; for (var i = 0; i < 70; i++) drops.push(mk(true)); function mk(init) { return { x: Math.random() * W, y: init ? Math.random() * H : -10, r: 1.5 + Math.random() * 3.5, v: 0, hold: Math.random() * 240, tr: [] }; }
    listen(window, 'resize', function () { W = c.width = innerWidth; H = c.height = innerHeight; });
    function frame() { rafs[0] = requestAnimationFrame(frame); x.clearRect(0, 0, W, H);
      drops.forEach(function (d, i) { if (d.hold > 0) d.hold--; else { d.v = Math.min(3.2, d.v + .05 + Math.random() * .08); d.y += d.v; d.x += (Math.random() - .5) * .4; d.tr.push([d.x, d.y]); if (d.tr.length > 22) d.tr.shift(); if (Math.random() < .012) { d.hold = 40 + Math.random() * 180; d.v = 0; } }
        if (d.y > H + 20) { drops[i] = mk(false); return; }
        if (d.tr.length > 1) { x.strokeStyle = 'rgba(160,200,255,.07)'; x.lineWidth = d.r * .7; x.beginPath(); x.moveTo(d.tr[0][0], d.tr[0][1]); d.tr.forEach(function (p) { x.lineTo(p[0], p[1]); }); x.stroke(); }
        var g = x.createRadialGradient(d.x - d.r * .3, d.y - d.r * .3, d.r * .1, d.x, d.y, d.r * 1.2); g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(.35, 'rgba(170,200,255,.18)'); g.addColorStop(1, 'rgba(20,30,80,.35)'); x.fillStyle = g; x.beginPath(); x.arc(d.x, d.y, d.r, 0, 7); x.fill(); }); }
    if (reduce) { frame(); cancelAnimationFrame(rafs[0]); rafs = []; } else frame();
    beep(70, 55, 1, 'sawtooth', .03);
  }

  /* ═════════ registry ═════════ */
  var T = {
    win95: { label: 'Windows 95', on: w95On, line: 'C:\\> loading MEMO95.EXE ... it is 1995 and your computer is a beige box. a tip of the day awaits.', off: 'shutting down. it is now safe to turn off your computer. (you are back in the future.)' },
    synth: { label: 'Synthwave Sunset', on: synthOn, line: 'a striped sun, a chrome horizon, an infinite grid. i am now legally required to say "outrun".', off: 'the sun sets for real this time. back to the regular neon.' },
    bp: { label: 'Blueprint', on: bpOn, line: 'blueprint mode. hover any card and i will measure it. scale 1:1. precision: dubious.', off: 'drawings filed. back to colour.' },
    vhs: { label: 'VHS Tape', on: vhsOn, off: 'stop. eject. be kind, rewind.', line: 'PLAY. tracking is a little off. that is normal. that is the charm.' , offFx: vhsOff },
    noir: { label: 'Noir', on: noirOn, off: 'the case is closed. the city goes back to colour. it never really does.', line: 'black and white. rain on the window. the flashlight follows your cursor. someone in this archive is lying.', offFx: noirOff },
    tokyo: { label: 'Tokyo Night', on: tokyoOn, off: 'the rain stops. the neon dims. back home.', line: 'tokyo, 2am. rain on the glass. neon in the puddles. i could stay here forever. (i cannot. i am an eye.)' }
  };
  var CLS = { win95: 't-win95', synth: 't-synth', bp: 't-bp', vhs: 't-vhs', noir: 't-noir', tokyo: 't-tokyo' };
  function setTheme(id) {
    if (id && !T[id]) return false;
    if (cur) { var old = cur; if (T[old].offFx) T[old].offFx(); cleanup(); root.classList.remove(CLS[old], 'vhs-glitch'); cur = null; if (!id) { FX.hue && FX.hue(savedHue); say(T[old].off); return true; } }
    if (!id) return false;
    if (FX.isGameboy && FX.isGameboy()) FX.gameboy(false); if (FX.isUpside && FX.isUpside()) FX.upsideDown(false);
    if (!old) { var sw = $('.swatch.on'); savedHue = (sw && sw.dataset.hue) || 'cyan'; }
    cur = id; FX.hue && FX.hue('cyan'); root.classList.add(CLS[id]); lset('arc-flag-t-' + id, '1'); T[id].on(); later(function () { say(T[id].line); }, id === 'win95' ? 2100 : 800); return true;
  }
  FX.setTheme = function (id) { return id === cur ? setTheme(null) : setTheme(id); }; FX.clearTheme = function () { if (cur) setTheme(null); }; FX.currentTheme = function () { return cur; };
  FX.themeList = function () { return Object.keys(T).map(function (k) { return k; }).join(', '); };

  /* ═════════ codes, words, terminal ═════════ */
  var SEQ = { win95: [LT, LT, RT, RT, 'b', 'a'], synth: [DN, DN, UP, UP, 'b', 'a'], bp: ['b', 'b', 'a', 'a', LT, RT], vhs: ['a', 'a', 'b', 'b', UP, DN], noir: [UP, DN, UP, DN, 'b', 'a'], tokyo: [LT, UP, RT, DN, 'b', 'a'] }, kbuf = [];
  window.addEventListener('keydown', function (e) {
    if (FX.arcadeActive || FX.bossActive || FX.advActive || $('.bossfight') || $('.adv') || e.ctrlKey || e.metaKey || e.altKey) return; var t = e.target; if (t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName || '') || t.isContentEditable)) return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; kbuf.push(k); if (kbuf.length > 12) kbuf.shift();
    Object.keys(SEQ).forEach(function (n) { var s = SEQ[n]; if (kbuf.length >= s.length && kbuf.slice(-s.length).join('|') === s.join('|')) { kbuf = []; FX.setTheme(n); } });
  }, true);
  var ALIAS = { win95: 'win95', windows95: 'win95', win: 'win95', synthwave: 'synth', synth: 'synth', vaporwave: 'synth', outrun: 'synth', blueprint: 'bp', bp: 'bp', vhs: 'vhs', vcr: 'vhs', noir: 'noir', tokyo: 'tokyo', tokyonight: 'tokyo' };
  var cmds = FX.cmds || {}, P = function (t) { FX.print && FX.print(t); };
  Object.keys(ALIAS).forEach(function (a) { if (a === 'synth' || a === 'bp' || a === 'win') return; cmds[a] = function () { P(cur === ALIAS[a] ? 'leaving ' + T[ALIAS[a]].label + '...' : 'entering ' + T[ALIAS[a]].label + '...'); FX.setTheme(ALIAS[a]); }; });
  var oldTheme = cmds.theme; cmds.theme = function (a) { var h = (a[0] || '').toLowerCase().replace(/[^a-z0-9]/g, ''); if (ALIAS[h]) { if (cur !== ALIAS[h]) FX.setTheme(ALIAS[h]); else P('already in ' + T[cur].label + '.'); return; } if (h === 'normal' || h === 'default') { FX.clearTheme(); } if (h === 'list' || h === 'themes') { P('themes: win95, synthwave, blueprint, vhs, noir, tokyo, gameboy, upside, normal'); return; } return oldTheme ? oldTheme(a) : null; };
  FX.helpExtra = (FX.helpExtra || []).concat(['  win95 synthwave blueprint vhs noir tokyo   six themes (or: theme <name>)']);
  var SEC = FX.secrets || {}; SEC.win95 = function () { FX.setTheme('win95'); }; SEC.synthwave = function () { FX.setTheme('synth'); }; SEC.blueprint = function () { FX.setTheme('bp'); }; SEC.vhs = function () { FX.setTheme('vhs'); }; SEC.noir = function () { FX.setTheme('noir'); }; SEC.tokyo = function () { FX.setTheme('tokyo'); }; FX.secrets = SEC;
})();
