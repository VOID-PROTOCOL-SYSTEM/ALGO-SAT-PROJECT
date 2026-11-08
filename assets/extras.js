/* MEMO ARCHIVE — v3 extras: rain, sound, terminal, secret modes, page wipe */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DATA = { items: [], about: [], handle: 'OPERATOR' };
  try { DATA = JSON.parse($('#archive-data').textContent); } catch (e) {}
  var FX = window.ArchiveFX = window.ArchiveFX || {};
  function lget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ── toast ── */
  var toastEl = document.createElement('div'); toastEl.className = 'toast toast--b'; document.body.appendChild(toastEl);
  var tt; function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { toastEl.classList.remove('show'); }, 2800); }
  FX.toast = toast;

  /* ── sound (synth blips, muted by default) ── */
  var Snd = { on: false, ctx: null, last: 0,
    init: function () {
      if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    tone: function (f1, f2, dur, type, vol, delay) {
      if (!this.on) return; this.init(); var c = this.ctx; if (!c) return;
      var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(f1, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      g.gain.setValueAtTime(vol || .04, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur);
    },
    hover: function () { var n = Date.now(); if (n - this.last < 70) return; this.last = n; this.tone(1500, 2100, .045, 'sine', .022); },
    click: function () { this.tone(720, 260, .12, 'square', .035); },
    ok:    function () { this.tone(660, 0, .09, 'triangle', .05); this.tone(990, 0, .14, 'triangle', .05, .09); },
    err:   function () { this.tone(190, 80, .26, 'sawtooth', .045); }
  };
  FX.sound = Snd;
  document.addEventListener('mouseover', function (e) { if (Snd.on && e.target.closest && e.target.closest('.card-link,.rail-link,.swatch,.pill,.pal-item,.tl a')) Snd.hover(); });
  document.addEventListener('click', function (e) { if (Snd.on && e.target.closest && e.target.closest('a,.swatch,.pill')) Snd.click(); });

  /* ── digital rain ── */
  var rainOn = false, canvas = $('#rain'), ctx2 = canvas && canvas.getContext('2d'), cols, drops, fs = 16, raf, lastT = 0;
  var GL = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789ABCDEF<>/\\{}';
  function size() { canvas.width = innerWidth; canvas.height = innerHeight; cols = Math.ceil(canvas.width / fs);
    drops = []; for (var i = 0; i < cols; i++) drops.push(Math.random() * -40); }
  function frame(t) {
    if (!rainOn) return; raf = requestAnimationFrame(frame);
    if (t - lastT < 45) return; lastT = t;
    ctx2.globalCompositeOperation = 'destination-out'; ctx2.fillStyle = 'rgba(0,0,0,.14)'; ctx2.fillRect(0, 0, canvas.width, canvas.height);
    ctx2.globalCompositeOperation = 'source-over'; ctx2.font = fs + 'px "Share Tech Mono", monospace';
    for (var i = 0; i < cols; i++) {
      var ch = GL.charAt(Math.floor(Math.random() * GL.length));
      ctx2.fillStyle = Math.random() > .97 ? '#ffffff' : '#00f5ff';
      ctx2.fillText(ch, i * fs, drops[i] * fs);
      if (drops[i] * fs > canvas.height && Math.random() > .975) drops[i] = 0;
      drops[i]++;
    }
  }
  function setRain(on) {
    if (!canvas) return; rainOn = !!on && !reduce; lset('fx-rain', rainOn ? '1' : '0');
    $$('.pill[data-fx=rain]').forEach(function (p) { p.classList.toggle('on', rainOn); });
    if (rainOn) { size(); canvas.classList.add('on'); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
    else { canvas.classList.remove('on'); cancelAnimationFrame(raf); setTimeout(function () { if (!rainOn) ctx2.clearRect(0, 0, canvas.width, canvas.height); }, 650); }
  }
  addEventListener('resize', function () { if (rainOn) size(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) cancelAnimationFrame(raf); else if (rainOn) raf = requestAnimationFrame(frame); });
  FX.rain = setRain;

  /* ── CRT / rainbow / sound setters ── */
  function setCrt(on) { root.classList.toggle('crt', !!on); lset('fx-crt', on ? '1' : '0'); $$('.pill[data-fx=crt]').forEach(function (p) { p.classList.toggle('on', !!on); }); }
  function setSound(on) { Snd.on = !!on; lset('fx-sound', on ? '1' : '0'); $$('.pill[data-fx=sound]').forEach(function (p) { p.classList.toggle('on', !!on); }); if (on) Snd.ok(); }
  FX.crt = setCrt; FX.setSound = setSound;

  $$('.pill').forEach(function (p) {
    function flip() {
      var k = p.dataset.fx, now = p.classList.contains('on');
      if (k === 'rain') setRain(!now); else if (k === 'crt') setCrt(!now); else if (k === 'sound') setSound(!now);
    }
    p.addEventListener('click', flip);
    p.addEventListener('keydown', function (e) { if (e.key === 'Enter') flip(); });
  });

  /* ── page wipe ── */
  var wipeEl = $('#wipe');
  function go(href) {
    if (FX.transition) { FX.transition(href); return; }
    if (reduce || !wipeEl) { location.href = href; return; }
    wipeEl.classList.add('on'); setTimeout(function () { location.href = href; }, 280);
  }
  FX.go = go;
  addEventListener('pageshow', function () { if (wipeEl) wipeEl.classList.remove('on'); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    var h = a.getAttribute('href'); if (!h || h.indexOf('notebooks/') !== 0) return;
    e.preventDefault(); go(h);
  });

  /* ── terminal ── */
  var term = document.createElement('div'); term.className = 'term'; term.id = 'term';
  term.innerHTML = '<div class="term-bar"><span>MEMO_ARCHIVE // TERMINAL — type <b>help</b></span><i id="term-x" role="button" title="close">&times;</i></div>' +
    '<div class="term-out" id="term-out"></div><div class="term-in"><span>&gt;</span><input id="term-input" type="text" spellcheck="false" autocomplete="off" autocapitalize="off"></div>';
  document.body.appendChild(term);
  var out = $('#term-out'), inp = $('#term-input'), hist = [], hi = 0;
  function print(txt, cls) { var d = document.createElement('div'); if (cls) d.className = cls; d.textContent = txt; out.appendChild(d); out.scrollTop = out.scrollHeight; }
  function pad(s, n) { s = String(s); while (s.length < n) s += ' '; return s; }
  var HUES = ['cyan', 'violet', 'amber', 'green'];
  function resolve(arg) {
    if (!arg) return null; var n = parseInt(arg, 10), its = DATA.items;
    if (!isNaN(n) && n >= 1 && n <= its.length) return its[n - 1];
    arg = arg.toLowerCase().replace(/\s+/g, '');
    return its.filter(function (i) { return (i.file + i.tag + i.name).toLowerCase().replace(/[\s_.\-]/g, '').indexOf(arg.replace(/[_.\-]/g, '')) !== -1; })[0] || null;
  }
  var CMDS = {
    help: function () {
      ['commands:', '  ls                  list notebooks', '  open <n|name>       open a notebook  (e.g. open 3, open supp)',
       '  about               operator profile', '  theme <hue>         cyan | violet | amber | green', '  rain [on|off]       digital rain',
       '  crt [on|off]        retro scanline mode', '  sound [on|off]      synth blips', '  date | whoami | status', '  clear | exit'].concat(FX.helpExtra || []).forEach(function (l) { print(l, 'dim'); });
    },
    ls: function () {
      DATA.items.forEach(function (it, i) { print((i + 1 < 10 ? '0' : '') + (i + 1) + '  ' + pad(it.file, 26) + pad(it.size, 10) + it.status); });
    },
    open: function (a) {
      var it = resolve(a.join(' ')); if (!it) { Snd.err(); return print('open: no such notebook. try "ls".', 'err'); }
      print('opening ' + it.file + ' ...'); Snd.ok(); setTimeout(function () { go(it.href); }, 250);
    },
    about: function () { DATA.about.forEach(function (r) { print(pad(r[0], 12) + '.... ' + r[1]); }); },
    theme: function (a) {
      var h = (a[0] || '').toLowerCase(); if (HUES.indexOf(h) === -1) { Snd.err(); return print('usage: theme <' + HUES.join('|') + '>', 'err'); }
      FX.hue && FX.hue(h); print('hue -> ' + h);
    },
    rain: function (a) { var v = a[0] ? a[0] === 'on' : !rainOn; setRain(v); print('rain ' + (rainOn ? 'on' : 'off') + (reduce ? ' (blocked: reduced-motion)' : '')); },
    crt: function (a) { var v = a[0] ? a[0] === 'on' : !root.classList.contains('crt'); setCrt(v); print('crt ' + (v ? 'on' : 'off')); },
    sound: function (a) { var v = a[0] ? a[0] === 'on' : !Snd.on; setSound(v); print('sound ' + (v ? 'on' : 'off')); },
    date: function () { print(new Date().toString()); },
    whoami: function () { print(String(DATA.handle || 'operator').toLowerCase() + '@' + (DATA.title || 'archive').toLowerCase().replace(/\s+/g, '-')); },
    status: function () { print('nodes: ' + DATA.items.length + '   rain: ' + (rainOn ? 'on' : 'off') + '   crt: ' + (root.classList.contains('crt') ? 'on' : 'off') + '   sound: ' + (Snd.on ? 'on' : 'off')); },
    clear: function () { out.innerHTML = ''; },
    exit: function () { closeTerm(); },
    sudo: function () { Snd.err(); print('permission denied: nice try, runner.', 'err'); },
    hack: function () { FX.storm && FX.storm(); print('// override accepted'); },
    matrix: function () { setRain(true); FX.hue && FX.hue('green'); print('wake up, runner...'); }
  };
  FX.cmds = CMDS; FX.resolve = resolve; FX.print = print;
  function run(line) {
    line = line.trim(); if (!line) return;
    print('> ' + line, 'cmd'); hist.push(line); hi = hist.length;
    var parts = line.split(/\s+/), c = parts.shift().toLowerCase();
    if (CMDS[c]) CMDS[c](parts); else { Snd.err(); print('command not found: ' + c + '  (try "help")', 'err'); FX.snark && FX.snark('badcmd'); }
  }
  function openTerm() { term.classList.add('open'); if (!out.childNodes.length) { print('MEMO_ARCHIVE terminal v3.0 — type "help" for commands', 'dim'); } inp.focus(); }
  function closeTerm() { term.classList.remove('open'); inp.blur(); }
  FX.openTerm = openTerm; FX.closeTerm = closeTerm;
  $('#term-x').addEventListener('click', closeTerm);
  inp.addEventListener('keydown', function (e) {
    e.stopPropagation();
    if (e.key === 'Enter') { run(inp.value); inp.value = ''; }
    else if (e.key === 'Escape') closeTerm();
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) inp.value = hist[--hi]; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); inp.value = hi < hist.length - 1 ? hist[++hi] : (hi = hist.length, ''); }
    else if (e.key === 'Tab') { e.preventDefault(); var v = inp.value.toLowerCase(), m = Object.keys(CMDS).filter(function (k) { return k.indexOf(v) === 0; }); if (m.length === 1) inp.value = m[0]; }
  });
  var ot = $('#open-term'); if (ot) ot.addEventListener('click', function () { term.classList.contains('open') ? closeTerm() : openTerm(); });

  /* ── global keys: backtick toggles terminal; typed secret words ── */
  var buf = '';
  var SECRETS = {
    matrix: function () { setRain(true); FX.hue && FX.hue('green'); toast('// FOLLOW THE WHITE RABBIT'); },
    crt: function () { var v = !root.classList.contains('crt'); setCrt(v); toast(v ? '// CRT MODE ENGAGED' : '// CRT OFF'); },
    retro: function () { setCrt(true); FX.hue && FX.hue('amber'); toast('// 1984 CALLED. IT WANTS ITS PHOSPHOR BACK'); },
    rainbow: function () { root.classList.toggle('rainbow'); toast(root.classList.contains('rainbow') ? '// SPECTRUM OVERLOAD' : '// SPECTRUM NORMALISED'); },
    glitch: function () { FX.storm && FX.storm(); }
  };
  FX.secrets = SECRETS;
  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    if (/INPUT|TEXTAREA/.test(tag)) return;
    if (e.key === '`') { e.preventDefault(); term.classList.contains('open') ? closeTerm() : openTerm(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    buf = (buf + e.key.toLowerCase()).slice(-10);
    Object.keys(SECRETS).forEach(function (w) { if (buf.slice(-w.length) === w) { buf = ''; SECRETS[w](); Snd.ok(); } });
  });

  /* ── restore saved prefs ── */
  if (lget('fx-sound') === '1') Snd.on = true;
  $$('.pill[data-fx=sound]').forEach(function (p) { p.classList.toggle('on', Snd.on); });
  if (lget('fx-crt') === '1') setCrt(true);
  if (lget('fx-rain') === '1') setRain(true);
})();
