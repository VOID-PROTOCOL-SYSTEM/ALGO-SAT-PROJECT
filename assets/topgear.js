/* MEMO ARCHIVE — v11 TOP GEAR pack.
   Enter: rail button DO_NOT_PRESS_PRODUCTION_HAZARD.sh · terminal `topgear` / `grandtour` · type "topgear" anywhere.
   Optional assets (nothing breaks if missing): assets/topgear/trio.jpg, trio-gt.jpg, clarkson.mp3, pillock.mp3, outro.mp3 */
(function () {
  var FX = window.ArchiveFX = window.ArchiveFX || {}, U = FX.u; if (!U) return;
  var $ = U.$, $$ = U.$$, pick = U.pick, lget = U.lget, lset = U.lset, root = document.documentElement;
  var cmds = FX.cmds || {};
  function P(t, c) { FX.print && FX.print(t, c); }
  function R(a, b) { return a + Math.random() * (b - a); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function sndOn() { return !!(FX.sound && FX.sound.on); }
  function tone(f, f2, d, ty, v, dl) { if (sndOn() && FX.sound.tone) FX.sound.tone(f, f2, d, ty || 'square', v || .05, dl || 0); }
  function actx() { if (!FX.sound) return null; FX.sound.init(); return FX.sound.ctx; }
  function xp(id, n) { if (lget('tgx-' + id)) return; lset('tgx-' + id, '1'); FX.gainXP && FX.gainXP(n || 5); }
  function noise(dur, vol, hp) {
    var c = sndOn() && actx(); if (!c) return;
    var b = c.createBuffer(1, Math.max(1, c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0), i;
    for (i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    var s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter(); f.type = hp ? 'highpass' : 'lowpass'; f.frequency.value = hp || 900;
    g.gain.value = vol || .15; s.buffer = b; s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  }
  function clang() { tone(1800, 900, .5, 'square', .06); tone(2700, 1200, .4, 'square', .04, .02); noise(.25, .12, 2000); }
  function boom() { tone(90, 30, 1, 'sawtooth', .09); noise(.9, .3); }
  function speak(t) { try { if (sndOn() && window.speechSynthesis) { var u = new SpeechSynthesisUtterance(t); u.pitch = .5; u.rate = .85; speechSynthesis.speak(u); } } catch (e) {} }
  function clip(name, fallback) {
    if (!sndOn()) return; var done = false, a = new Audio('assets/topgear/' + name + '.mp3');
    function fb() { if (!done) { done = true; speak(fallback); } }
    a.onerror = fb; var p = a.play(); if (p && p.catch) p.catch(fb);
  }
  function engine(base) {
    var c = sndOn() && actx(); if (!c) return null;
    var o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = .0001;
    o.connect(f); o2.connect(f); f.connect(g); g.connect(c.destination); o.start(); o2.start(); g.gain.exponentialRampToValueAtTime(.06, c.currentTime + .2);
    var api = { rev: function (r) { var t = c.currentTime; o.frequency.setTargetAtTime(base + r * base * 5, t, .05); o2.frequency.setTargetAtTime(base * 1.5 + r * base * 6, t, .05); f.frequency.setTargetAtTime(400 + r * 2500, t, .05); },
      stop: function () { try { g.gain.setTargetAtTime(.0001, c.currentTime, .1); setTimeout(function () { o.stop(); o2.stop(); }, 400); } catch (e) {} } };
    api.rev(0); return api;
  }

  var on = false, entering = false, variant = 'tg', t0 = 0, silent = false, revs = 0, crashes = parseInt(lget('tg-crashes') || '0', 10) || 0;
  var modes = {}, ovs = [], swaps = [], act = {}, timers = [], dash, garage, ctxInfo = { game: '', card: '', cmds: [] };
  var SOME = ['Some say he can read your source code in the dark.', 'Some say his only fear is a Reliant Robin on a banked corner.', 'Some say he sorts his socks with a merge sort.', 'Some say the bug mascot is his cousin.', 'Some say he has never once used a semicolon wrongly.', 'Some say if you listen closely you can hear him compiling.', 'Some say he lapped the Wayback Machine. Twice.', 'Some say he does not blink. Ever. The eye is jealous.'];

  function toast(t, ms) { $$('.tg-toast').forEach(function (n) { n.remove(); }); var d = el('div', 'tg-toast', t); document.body.appendChild(d); setTimeout(function () { d.classList.add('out'); setTimeout(function () { d.remove(); }, 400); }, ms || 2600); }
  function openOv(cls, html, onClose) {
    var d = el('div', 'tg-ov ' + cls, html); document.body.appendChild(d);
    var o = { d: d, close: function () { var i = ovs.indexOf(o); if (i < 0) return; ovs.splice(i, 1); d.remove(); onClose && onClose(); } };
    ovs.push(o); return o;
  }
  function skipT(t) { return !t || !t.closest || !!t.closest('.tg-dash,.tg-garage,.tg-ov,.term,.arc,[class*="nl-"],.tg-ext,.tg-toast,.tg-warn,.tg-rev,.tg-backbar,.tg-tonight,.tg-board'); }
  function inGame() { return !!$('.arc .arc-stage'); }
  function later(fn, ms) { var id = setTimeout(fn, ms); timers.push(id); return id; }

  /* ── 0. optional photo, otherwise a deliberately crude drawing of three men ── */
  function trioSVG() {
    var d = el('div', '', '<svg class="tg-trio-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="tgs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15151c"/><stop offset="1" stop-color="#46301c"/></linearGradient></defs>' +
      '<rect width="1000" height="600" fill="url(#tgs)"/><rect y="470" width="1000" height="130" fill="#1b1b1b"/>' +
      '<g stroke="#000" stroke-width="3"><rect x="240" y="300" width="100" height="120" rx="14" fill="#4a5a3a"/><rect x="252" y="420" width="34" height="100" fill="#3a4a6a"/><rect x="296" y="420" width="34" height="100" fill="#3a4a6a"/><circle cx="290" cy="255" r="42" fill="#d9a67e"/><path d="M250 245 Q290 190 332 245 Q300 222 250 245Z" fill="#3a2a1a"/>' +
      '<rect x="440" y="248" width="124" height="172" rx="16" fill="#26385c"/><rect x="452" y="420" width="40" height="120" fill="#4b6b9b"/><rect x="512" y="420" width="40" height="120" fill="#4b6b9b"/><circle cx="502" cy="192" r="48" fill="#d9a67e"/><path d="M455 185 Q502 130 550 185 Q520 160 455 185Z" fill="#8a8a8a"/><rect x="470" y="205" width="64" height="14" rx="7" fill="#7a2020"/>' +
      '<rect x="670" y="285" width="104" height="135" rx="14" fill="#6f2b2b"/><rect x="684" y="420" width="34" height="105" fill="#2e2e3a"/><rect x="728" y="420" width="34" height="105" fill="#2e2e3a"/><circle cx="722" cy="240" r="44" fill="#d9a67e"/><path d="M676 235 Q690 175 770 215 Q760 262 740 205 Q705 196 676 245Z" fill="#6b4a2a"/></g>' +
      '<g font-family="Permanent Marker, Comic Sans MS, cursive" fill="#fff" text-anchor="middle" stroke="#000" stroke-width="1"><text x="290" y="565" font-size="36">RICHARD</text><text x="502" y="580" font-size="40">JEREMY</text><text x="722" y="565" font-size="36">JAMES</text><text x="500" y="70" font-size="54" fill="#e10600">THE HOLY TRINITY</text><text x="500" y="108" font-size="20">(drawn by someone in a hurry. drop a real photo in assets/topgear/trio.jpg)</text></g></svg>');
    return d.firstChild;
  }
  function trioEl(v) {
    var img = el('img', 'tg-trio'), tries = v === 'gt' ? ['assets/topgear/trio-gt.jpg', 'assets/topgear/trio.jpg'] : ['assets/topgear/trio.jpg'], i = 0;
    img.alt = ''; img.onerror = function () { if (++i < tries.length) img.src = tries[i]; else img.replaceWith(trioSVG()); }; img.src = tries[0]; return img;
  }

  /* ── 1. the hijack ── */
  function enter(v) {
    if (on || entering) return; entering = true; variant = v || 'tg';
    FX.closeTerm && FX.closeTerm(); var rp = $('.pill[data-fx=rain].on'); if (rp) rp.click();
    root.classList.add('tg-hijack');
    var o = el('div', 'tg-load'); o.appendChild(trioEl(variant));
    o.appendChild(el('div', 'tg-ring')); o.appendChild(el('div', 'tg-ltxt', variant === 'gt' ? 'A tent. A field. Ambitious but rubbish execution in progress...' : 'Ambitious but rubbish execution in progress...'));
    o.appendChild(el('div', 'tg-lsub', pick(SOME) + '  (click to skip)')); document.body.appendChild(o);
    var eng = engine(38), r = 0, iv = setInterval(function () { r = Math.min(1, r + .06); eng && eng.rev(Math.random() * r); }, 120), done = false;
    function fin() {
      if (done) return; done = true; clearInterval(iv); eng && eng.stop(); o.classList.add('out');
      setTimeout(function () { o.remove(); }, 500); root.classList.remove('tg-hijack'); start();
    }
    o.addEventListener('click', fin); setTimeout(fin, 4600);
  }
  function setText() {
    swaps.forEach(function (s) { s[0].textContent = s[1]; s[0].setAttribute && s[2] != null && s[0].setAttribute('style', s[2]); }); swaps = [];
    function sw(n, t) { if (n) { swaps.push([n, n.textContent, n.getAttribute('style') || '']); n.textContent = t; } }
    var gt = variant === 'gt', h1 = $('.hero h1'), tag = $('.hero .tagline'), name = $('.brand-name'), lede = $('.hero .lede');
    sw(h1, gt ? 'THE GRAND MEMO' : 'MEMO GEAR'); sw(name, gt ? 'GRAND MEMO' : 'MEMO GEAR');
    if (tag) { var t = gt ? '> a tent. a field. six notebooks.' : '> the most exciting memo archive on earth'; sw(tag, t); tag.style.setProperty('--w', t.length + 'ch'); tag.style.setProperty('--n', t.length); }
    sw(lede, gt ? 'Filmed in a tent, under a deadline, over budget. Pick a notebook. Try not to crash it.' : 'Nothing here is reasonably priced. Pick a notebook, press the red button, regret it.');
    var labs = gt ? ['EPISODES', 'WEIGHT', 'LAP CLOCK', 'STATUS'] : ['CARS', 'WEIGHT', 'LAP CLOCK', 'STATUS'];
    $$('.hud-k').forEach(function (k, i) { if (labs[i]) sw(k, labs[i]); });
    $$('.card-link .go').forEach(function (g) { sw(g, 'FLOOR IT \u25B6'); });
    document.title = (gt ? 'THE GRAND MEMO' : 'MEMO GEAR');
  }
  function start() {
    on = true; entering = false; t0 = Date.now(); silent = false;
    root.classList.add('tg', 'tg-shift'); root.classList.toggle('tg-gt', variant === 'gt'); setTimeout(function () { root.classList.remove('tg-shift'); }, 1100);
    window.__tgTitle = window.__tgTitle || document.title;
    setText(); buildDash(); buildGarage(); addBomb(); schedule(); tone(300, 900, .3, 'sawtooth', .06);
    toast(variant === 'gt' ? 'WELCOME TO THE TENT' : 'AND WELCOME TO MEMO GEAR', 2400); xp('enter', 10);
    if (variant === 'gt') xp('gt', 5);
  }
  function leave() {
    if (!on) return; panic(true); on = false; clearInterval(pollIv); clearInterval(spIv); timers.forEach(clearTimeout); timers = [];
    swaps.forEach(function (s) { s[0].textContent = s[1]; s[0].setAttribute('style', s[2]); }); swaps = []; if (window.__tgTitle) document.title = window.__tgTitle;
    root.classList.remove('tg', 'tg-gt', 'tg-backup', 'tg-stig'); dash && dash.remove(); garage && garage.remove(); var b = $('.tg-bomb'); b && b.remove();
    var s = Math.round((Date.now() - t0) / 1000); P('lap time: ' + Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2) + '. the stig would have been quicker.'); toast('BACK TO THE MATRIX'); pollIv = spIv = null;
  }

  /* ── dashboard + garage ── */
  var pollIv, spIv, sy = 0, mph = 0;
  var DIAL = '<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="36" fill="#0a0a0a" stroke="#888" stroke-width="2"/><path d="M14 62 A36 36 0 1 1 66 62" fill="none" stroke="#555" stroke-width="3"/><path d="M62 14 A36 36 0 0 1 66 62" fill="none" stroke="#e10600" stroke-width="4"/><g class="tg-needle"><line x1="40" y1="40" x2="40" y2="14" stroke="#ff3b30" stroke-width="2.5" stroke-linecap="round"/></g><circle cx="40" cy="40" r="4" fill="#ddd"/></svg>';
  var HELM = '<svg viewBox="0 0 32 32" width="26" height="26"><path d="M4 20 Q4 5 17 5 Q29 5 29 20 L29 25 L8 25 Q4 25 4 20Z" fill="#fff" stroke="#222" stroke-width="1.5"/><path d="M15 12 H29 V19 H13 Q13 12 15 12Z" fill="#111"/></svg>';
  function needle(g, pct) { var n = $('.tg-needle', g); if (n) n.style.transform = 'rotate(' + (-130 + Math.max(0, Math.min(1, pct)) * 260) + 'deg)'; }
  function buildDash() {
    dash = el('div', 'tg-dash', '<div class="tg-gauge" id="tg-sp">' + DIAL + '<small>MPH</small><b>0</b></div><div class="tg-gauge" id="tg-rv">' + DIAL + '<small>PAGE REVS</small><b>0</b></div>' +
      '<div class="tg-mid"><button class="tg-btn big" data-a="speed">SPEEEEED</button><button class="tg-btn" data-a="garage">GARAGE</button><button class="tg-btn tg-helmet" data-a="stig" title="The Stig: silent mode">' + HELM + '</button></div>' +
      '<div class="tg-crash">HAMMOND CRASHES<br><b id="tg-cr">' + crashes + '</b><br><span class="tg-btn" data-a="leave" style="display:inline-block;margin-top:2px;padding:3px 8px;font-size:10px">\u25C0 BACK TO THE MATRIX</span></div>');
    document.body.appendChild(dash);
    dash.addEventListener('click', function (e) { var b = e.target.closest('[data-a]'); if (!b) return; var a = b.getAttribute('data-a'); if (a === 'garage') garage.classList.toggle('open'); else act[a] && act[a](); });
    var lastS = scrollY;
    pollIv = setInterval(poll, 350);
    spIv = setInterval(function () {
      var d = Math.abs(scrollY - lastS); lastS = scrollY; mph = mph * .7 + Math.min(200, d * .9) * .3;
      var s = $('#tg-sp'), r = $('#tg-rv'); if (!s) return; needle(s, mph / 200); $('b', s).textContent = Math.round(mph);
      revs = Math.max(0, revs - .08 + Math.min(1.5, d / 600)); needle(r, revs / 100); $('b', r).textContent = Math.round(revs); if (revs >= 98) crash();
    }, 100);
  }
  var GAR = [['speed', 'SPEEEEED', 'overclock the arcade, then fire'], ['slow', 'CAPTAIN SLOW', 'downgrade + sort. slowly'], ['revs', 'HAMMOND REVS', '+35 page revs. redline = ditch'], ['robin', 'RELIANT ROBIN', 'mouse fast. fall over'],
    ['hammerhead', 'HAMMERHEAD-i-THRUST', 'aerodynamic geometry'], ['caravan', 'CARAVAN', 'send one now. do not hover'], ['ballpein', 'BALL-PEIN HAMMER', 'fixed with engineering'], ['peugeot', 'PEUGEOT MODE', 'buttons dodge you'],
    ['coolwall', 'COOL WALL', 'sort the algorithms'], ['tonight', 'TONIGHT ON...', 'intro generator'], ['clarkson', 'CLARKSON!', 'alarm-o-matic'], ['billboard', 'ALABAMA PATCH', 'hand-painted slogans'],
    ['v8', 'V8 BLENDER', 'scroll = rev'], ['backup', 'BACKUP CAR', 'pink punishment (beat snake)'], ['channel', 'CHANNEL TUNNEL', 'keep them afloat'], ['howhard', 'HOW HARD CAN IT BE?', 'auto-compile everything'],
    ['bombshell', 'BOMBSHELL', 'and on that...'], ['somesay', 'SOME SAY...', 'a fact about the stig'], ['gt', 'GRAND TOUR', 'swap to the tent'], ['dust', 'DUST STORM', 'botswana, gradually']];
  function buildGarage() {
    garage = el('div', 'tg-garage', '<h4>THE GARAGE</h4><div class="tg-grid"></div>'); var g = $('.tg-grid', garage);
    GAR.forEach(function (r) { var b = el('button', 'tg-btn', r[1] + '<i>' + r[2] + '</i>'); b.setAttribute('data-a', r[0]); g.appendChild(b); });
    var sl = el('div', 'tg-slide', 'BOTSWANA SALT PAN <input type="range" min="0" max="100" value="0" id="tg-dustr">'); g.appendChild(sl);
    $('input', sl).addEventListener('input', function (e) { setDust(e.target.value / 100); xp('dustr', 4); });
    garage.addEventListener('click', function (e) { var b = e.target.closest('button[data-a]'); if (b) { var a = b.getAttribute('data-a'); act[a] && act[a](); garage.classList.remove('open'); } });
    document.body.appendChild(garage);
  }

  /* ── game watcher: leaderboard, revs, clarkson, backup car, armed overdrive ── */
  var st = { game: false, dead: false, name: '', t: 0 }, suppressQuit = false;
  function poll() {
    var g = inGame(), m = $('.arc .arc-msg h3'), dead = !!(m && /GAME OVER|YOU WIN/.test(m.textContent)), name = ($('.arc .arc-sub') || {}).textContent || '';
    if (g && (!st.game || (st.dead && !dead))) gameStart(name);
    if (g && dead && !st.dead) { var p = $('.arc .arc-msg p'), sc = p ? parseInt((p.textContent.match(/SCORE\s+(-?\d+)/) || [0, 0])[1], 10) : 0; gameEnd(name, sc, /WIN/.test(m.textContent)); }
    if (!g && st.game && !st.dead && !suppressQuit && Date.now() - st.t > 2000) gameQuit(st.name);
    st.game = g; st.dead = g ? dead : false; if (g) st.name = name;
  }
  function gameStart(name) { st.t = Date.now(); ctxInfo.game = name; revs = Math.min(100, revs + 8); if (armed) fireOverdrive(); }
  function gameEnd(name, sc, win) {
    revs = Math.min(100, revs + 20); board(name, sc);
    if (backupOn && /SNAKE/i.test(name)) backupOff();
    if (!win && (/STACKTRIS/i.test(name) || Math.random() < .5)) alarm();
  }
  function gameQuit(name) { if (!backupOn && !modes.backup) act.backup(true); }

  /* ── 5. reasonably priced car leaderboard ── */
  var CEL = [['Tom Cruise', 82.1], ['Usain Bolt', 86.6], ['Jay Kay', 91], ['Jenson Button', 93.4], ['Rowan Atkinson', 95.8], ['Gordon Ramsay', 101.2], ['Brian Cox', 106.1], ['Chris Evans', 112.4], ['Hugh Grant', 117.9], ['John Prescott', 131]];
  function fmt(s) { return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60).toFixed(1); }
  function board(name, score) {
    var old = $('.tg-board'); old && old.remove();
    var lap = Math.max(60, Math.min(160, 140 - 22 * Math.log10(1 + Math.max(0, score)))), rows = CEL.map(function (c) { return { n: c[0], t: c[1], me: 0 }; }); rows.push({ n: 'YOU (' + name + ')', t: lap, me: 1 });
    rows.sort(function (a, b) { return a.t - b.t; }); var rk = rows.findIndex(function (r) { return r.me; }) + 1;
    var line = rk === 1 ? 'NEW COURSE RECORD. The Stig demands a recount.' : rk <= 3 ? 'Podium. Clarkson is quietly furious.' : rk <= 6 ? 'Respectable. Hammond would have crashed.' : rk < rows.length ? 'Mediocre. James would have been slower, with more dignity.' : 'Slower than John Prescott in the wet.';
    var b = el('div', 'tg-board', '<div class="bh">STAR IN A REASONABLY PRICED CAR</div>' + rows.map(function (r, i) { return '<div class="br' + (r.me ? ' me' : '') + '"><span>' + (i + 1) + '. ' + r.n.replace(/</g, '&lt;') + '</span><span>' + fmt(r.t) + '</span></div>'; }).join('') + '<div class="bf">' + line + '</div>');
    b.addEventListener('click', function () { b.remove(); }); document.body.appendChild(b); setTimeout(function () { b.remove(); }, 9000); xp('board', 6); if (rk === rows.length) xp('prescott', 6);
  }

  /* ── 14. CLARKSON! alarm ── */
  var lastAlarm = 0;
  function alarm() {
    if (Date.now() - lastAlarm < 4000) return; lastAlarm = Date.now(); var pil = Math.random() < .45;
    toast(pil ? 'You infantile pillock!' : 'CLARKSON!', 1800); clip(pil ? 'pillock' : 'clarkson', pil ? 'You infantile pillock!' : 'Clarkson!'); tone(220, 90, .4, 'sawtooth', .06); xp('alarm', 5);
  }
  window.addEventListener('error', function (e) { if (on && e && e.message) alarm(); });
  window.addEventListener('unhandledrejection', function () { if (on) alarm(); });
  act.clarkson = alarm;

  /* ── 1. SPEEEEED ── */
  var od = false, armed = false, _raf = window.requestAnimationFrame, base0 = 0;
  function patch(on_) {
    if (on_) { base0 = performance.now(); window.requestAnimationFrame = function (cb) { return _raf.call(window, function (t) { cb(cb.name === 'loop' && FX.arcadeOpen && FX.arcadeOpen() ? base0 + (t - base0) * 5 : t); }); }; }
    else window.requestAnimationFrame = _raf;
  }
  act.speed = function () {
    if (od) return; if (!FX.arcadeOpen || !FX.arcadeOpen()) FX.arcade && FX.arcade();
    if (!inGame()) { armed = true; toast('OVERDRIVE ARMED. START A GAME.', 3000); return; } fireOverdrive();
  };
  function fireOverdrive() {
    armed = false; od = true; patch(true); var v = el('div', 'tg-vig'), box = $('.arc-box'); document.body.appendChild(v); box && box.classList.add('tg-shake');
    toast('SPEEEEEEED!', 1800); speak('Speeeeed!'); tone(120, 900, 2.5, 'sawtooth', .07); noise(2.5, .08); xp('speed', 8);
    later(function () {
      v.remove(); suppressQuit = true; box && box.classList.remove('tg-shake'); var e1 = { key: 'Escape', bubbles: true, cancelable: true };
      document.dispatchEvent(new KeyboardEvent('keydown', e1)); document.dispatchEvent(new KeyboardEvent('keydown', e1)); patch(false); od = false;
      var o = openOv('tg-fire', '<h2>ENGINE FIRE</h2><p style="font-size:22px;letter-spacing:.1em">catastrophic. the layout has been reset.</p>'); boom();
      later(function () { o.close(); panic(true); suppressQuit = false; root.classList.add('tg-shift'); setTimeout(function () { root.classList.remove('tg-shift'); }, 1100); }, 2400);
    }, 5000);
  }

  /* ── 2. captain slow ── */
  function slowMode() {
    root.classList.add('tg-slowmode'); var box = el('div', 'tg-slowbox', '<h5>CAPTAIN SLOW \u2014 RE-SORTING YOUR HTML</h5>by alphabetical atomic weight.<div class="tg-bar"><i></i></div><pre></pre>'), pre = $('pre', box), bar = $('i', box); document.body.appendChild(box);
    var names = ['SECTION', 'DIV', 'H2', 'ARTICLE', 'A', 'CANVAS', 'IMG', 'ASIDE', 'SPAN', 'BUTTON', 'FOOTER', 'NAV'], i = 0, swapsN = 0, done = false, total = 60;
    var iv = setInterval(function () {
      i++; var a = pick(names), b = pick(names); swapsN++; pre.textContent = '<' + a + '> \u21C4 <' + b + '>  (atomic weight ' + R(1, 118).toFixed(2) + ')\n' + pre.textContent.split('\n').slice(0, 5).join('\n'); bar.style.width = Math.min(99, i / total * 100) + '%';
      if (i === 8) toast('James is checking the manual', 1800); if (i === 30) toast('James has made tea instead', 1800);
      if (i >= total && !done) { done = true; pre.textContent = 'sorted. nothing has changed. it was perfect before.'; bar.style.width = '100%'; xp('slow', 6); }
    }, 700);
    xp('slow1', 3); return function () { clearInterval(iv); box.remove(); root.classList.remove('tg-slowmode'); };
  }

  /* ── 3. hammond crash ── */
  function crash() {
    if (modes.flip) return; revs = 0; crashes++; lset('tg-crashes', String(crashes)); var c = $('#tg-cr'); c && (c.textContent = crashes);
    var o = openOv('tg-fire', '<h2>\u26A0 EMERGENCY \u26A0</h2><p style="font-size:24px;letter-spacing:.06em;max-width:80vw">Hammond has inverted a hypercar into a ditch.</p>'); boom(); xp('crash', 8);
    later(function () {
      o.close(); root.classList.add('tg-flipping'); root.style.setProperty('--tg-flip', '180deg');
      var b = el('div', 'tg-ext', 'FIRE EXTINGUISHER'); document.body.appendChild(b);
      function fix() { b.remove(); document.body.appendChild(el('div', 'tg-foam')); setTimeout(function () { $$('.tg-foam').forEach(function (f) { f.remove(); }); }, 1300); noise(.8, .15, 3000); root.style.setProperty('--tg-flip', '0deg'); delete modes.flip; setTimeout(function () { root.classList.remove('tg-flipping'); }, 1400); toast('"I\'m fine!" \u2014 Hammond', 2200); xp('ext', 6); }
      b.onclick = fix; modes.flip = function () { fix(); };
    }, 2300);
  }
  act.revs = function () { revs = Math.min(100, revs + 35); toast('PAGE REVS: ' + Math.round(revs), 1200); tone(200, 700, .4, 'sawtooth', .05); };

  /* ── 4. the stig ── */
  var stigState = 0, stigAud = null, stigWas = false;
  function stopStigAudio() { if (stigAud) { stigAud.stop(); stigAud = null; } }
  act.stig = function () {
    stigState = (stigState + 1) % 3;
    if (stigState === 0) { stopStigAudio(); root.classList.remove('tg-stig'); var t = $('.tg-stigtag'); t && t.remove(); silent = false; if (FX.sound && stigWas) FX.sound.on = true; $('.tg-helmet') && $('.tg-helmet').classList.remove('on'); return; }
    if (stigState === 1) { stigWas = sndOn(); if (FX.sound) FX.sound.on = false; silent = true; root.classList.add('tg-stig'); $('.tg-helmet').classList.add('on'); var tg = el('div', 'tg-stigtag', 'SOME SAY HE\u2019S ALREADY READ YOUR SOURCE CODE \u00B7 helmet: idle \u2192 soft rock \u2192 off'); document.body.appendChild(tg); xp('stig', 6); }
    stopStigAudio(); var c = actx(); if (!c) return; stigAud = stigState === 1 ? idleAudio(c) : rockAudio(c);
  };
  function idleAudio(c) {
    var o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(), l = c.createOscillator(), lg = c.createGain(); o.type = 'sawtooth'; o.frequency.value = 34; f.type = 'lowpass'; f.frequency.value = 160; g.gain.value = .12; l.frequency.value = 7; lg.gain.value = 4;
    l.connect(lg); lg.connect(o.frequency); o.connect(f); f.connect(g); g.connect(c.destination); o.start(); l.start(); return { stop: function () { try { o.stop(); l.stop(); } catch (e) {} } };
  }
  function rockAudio(c) {
    var ch = [[110, 131, 165, 220], [87.3, 131, 175, 220], [130.8, 165, 196, 262], [98, 123, 196, 247]], beat = 0, alive = true;
    function n(f, d, ty, v) { var o = c.createOscillator(), g = c.createGain(), t = c.currentTime; o.type = ty; o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + d); }
    var iv = setInterval(function () { if (!alive) return; var cd = ch[Math.floor(beat / 8) % 4], k = beat % 8; if (k === 0) { n(cd[0] / 2, 3.4, 'triangle', .1); n(cd[1], 3.4, 'triangle', .035); n(cd[2], 3.4, 'triangle', .035); } n(cd[(k % 3) + 1] * 2, .5, 'sine', .05); if (k % 4 === 2) noise(.1, .05, 4000); beat++; }, 430);
    return { stop: function () { alive = false; clearInterval(iv); } };
  }

  /* ── toggle helper ── */
  function tog(name, fn, msg) {
    return function (force) {
      if (modes[name]) { modes[name](); return; }
      var off = fn(); modes[name] = function () { delete modes[name]; off && off(); }; msg && toast(msg, 2000);
    };
  }
  function panic(quiet) {
    Object.keys(modes).forEach(function (k) { modes[k] && modes[k](); }); setDust(0); od && (patch(false), od = false); armed = false; backupOn && backupOff(true);
    $$('.tg-van,.tg-flame,.tg-warn,.tg-bills,.tg-chan,.tg-rev,.tg-board,.tg-toast').forEach(function (n) { n.remove(); }); if (!quiet) toast('ALL CLEAR. THE STIG TOOK OVER.', 1400);
  }

  /* ── 6. reliant robin ── */
  act.robin = tog('robin', function () {
    var lx = null, ly = 0, vel = 0, tilt = 0, rolled = false, raf;
    function mm(e) { if (lx != null) vel = Math.max(vel, Math.hypot(e.clientX - lx, e.clientY - ly)); lx = e.clientX; ly = e.clientY; }
    function frame() {
      raf = requestAnimationFrame(frame); if (rolled) return; tilt += (Math.min(16, vel * .22) - tilt) * .25; if (vel > 95 && tilt > 13) roll(); vel *= .8; root.style.setProperty('--tg-tilt', (-tilt) + 'deg');
    }
    function roll() { rolled = true; root.style.setProperty('--tg-tilt', '-92deg'); clang(); noise(.7, .2); toast('ROLLED. AGAIN.', 1600); xp('robin', 6); later(function () { rolled = false; tilt = 0; vel = 0; root.style.setProperty('--tg-tilt', '0deg'); }, 2400); }
    document.addEventListener('mousemove', mm); raf = requestAnimationFrame(frame);
    return function () { document.removeEventListener('mousemove', mm); cancelAnimationFrame(raf); root.style.setProperty('--tg-tilt', '0deg'); };
  }, 'RELIANT ROBIN: DO NOT MOVE THE MOUSE FAST');

  /* ── 7. hammerhead-i-thrust ── */
  act.hammerhead = tog('hh', function () {
    var els = $$('.card-link,.hud-tile,.term-box,.tl li a,.search-row,.rail-link,.hero p.lede'), iv;
    function go() { els.forEach(function (e) { var a = R(0, 55), b = R(0, 55), c = R(45, 100), d = R(45, 100); e.style.clipPath = 'polygon(' + a + '% 0,100% ' + c + '%,' + b + '% 100%' + (Math.random() < .5 ? ',0 ' + d + '%' : '') + ')'; }); }
    go(); iv = setInterval(go, 5000); root.classList.add('tg-tri'); xp('hh', 6);
    return function () { clearInterval(iv); els.forEach(function (e) { e.style.clipPath = ''; }); root.classList.remove('tg-tri'); };
  }, 'AERODYNAMICALLY OPTIMISED');

  /* ── 8. botswana dust ── */
  var dustEl = null, dustIv = null;
  function setDust(v) {
    if (v <= 0) { dustEl && dustEl.remove(); dustEl = null; var r = $('#tg-dustr'); r && (r.value = 0); return; }
    if (!dustEl) { dustEl = el('div', 'tg-dustov'); document.body.appendChild(dustEl); } dustEl.style.setProperty('--tg-dust', v); var s = $('#tg-dustr'); s && (s.value = v * 100);
  }
  act.dust = function () {
    if (dustIv) { clearInterval(dustIv); dustIv = null; setDust(0); return; } var v = 0; toast('DRIVING ACROSS A SALT PAN', 2000); xp('dust', 5);
    dustIv = setInterval(function () { v += .01; setDust(v); if (v >= 1) { clearInterval(dustIv); dustIv = null; later(function () { setDust(0); }, 4000); } }, 200);
  };
  modes.dustiv = function () { if (dustIv) { clearInterval(dustIv); dustIv = null; } };

  /* ── 9. caravan ── */
  var VAN = '<svg viewBox="0 0 120 60"><rect x="6" y="8" width="96" height="38" rx="8" fill="#f3ecd8" stroke="#555" stroke-width="2"/><rect x="18" y="16" width="26" height="16" fill="#8cc4e8" stroke="#555"/><rect x="54" y="16" width="26" height="16" fill="#8cc4e8" stroke="#555"/><rect x="102" y="30" width="14" height="6" fill="#777"/><circle cx="40" cy="48" r="9" fill="#222"/><circle cx="76" cy="48" r="9" fill="#222"/></svg>';
  var scorched = [];
  function explode(x, y) {
    boom(); toast('CARAVAN FIRE. OF COURSE.', 2000); xp('van', 8);
    for (var i = 0; i < 9; i++) { var f = el('div', 'tg-flame'); f.style.left = (x + R(-70, 70)) + 'px'; f.style.top = (y + R(-10, 20)) + 'px'; f.style.animationDelay = R(0, .5) + 's'; document.body.appendChild(f); (function (ff) { setTimeout(function () { ff.remove(); }, 4500); })(f); }
    $$('p,h1,h2,h3,li,a,.card-name,.card-desc,.hud-v,.hud-k,.term-line,.rail-link,.tl-name,.blurb').forEach(function (n) {
      if (skipT(n)) return; var r = n.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > innerHeight) return;
      if (Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y) < 280) { n.classList.add('tg-scorch'); scorched.push(n); }
    });
    later(unscorch, 25000);
  }
  function unscorch() { scorched.forEach(function (n) { n.classList.remove('tg-scorch'); }); scorched = []; }
  act.caravan = function () {
    var v = el('div', 'tg-van', VAN); document.body.appendChild(v); var gone = false;
    v.addEventListener('mouseenter', function () { if (gone) return; gone = true; var r = v.getBoundingClientRect(); v.remove(); explode(r.left + r.width / 2, r.top + 10); });
    v.addEventListener('animationend', function () { v.remove(); });
  };
  modes.scorch = unscorch;

  /* ── 10. ball-pein hammer debugger ── */
  act.ballpein = tog('pein', function () {
    var last = 0;
    function h(e) {
      if (skipT(e.target)) return; e.preventDefault(); e.stopPropagation(); clang(); var t = e.target; t.classList.add('tg-dent'); setTimeout(function () { t.classList.remove('tg-dent'); }, 380);
      if (Date.now() - last > 1500) { last = Date.now(); toast('Fixed with mechanical engineering.', 1500); } xp('pein', 5);
    }
    root.classList.add('tg-pein'); document.addEventListener('click', h, true);
    return function () { root.classList.remove('tg-pein'); document.removeEventListener('click', h, true); };
  }, 'BALL-PEIN HAMMER EQUIPPED');

  /* ── 11. peugeot driver ── */
  act.peugeot = tog('peug', function () {
    var moved = [];
    function h(e) {
      var t = e.target.closest && e.target.closest('.pill,.swatch,.rail-link,.card-link,.tl a,.tg-bomb'); if (!t || skipT(t)) return; e.preventDefault(); e.stopImmediatePropagation();
      var r = t.getBoundingClientRect(), dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY, m = Math.hypot(dx, dy) || 1, k = parseFloat(t.dataset.tgx || 0), l = parseFloat(t.dataset.tgy || 0);
      k += dx / m * 50 + R(-20, 20); l += dy / m * 50 + R(-20, 20); t.dataset.tgx = k; t.dataset.tgy = l; t.style.transition = 'transform .2s'; t.style.transform = 'translate(' + k + 'px,' + l + 'px) rotate(' + R(-8, 8) + 'deg)'; if (moved.indexOf(t) < 0) moved.push(t);
      tone(320, 90, .25, 'sawtooth', .04); noise(.2, .05, 3000); xp('peug', 5);
    }
    document.addEventListener('click', h, true);
    return function () { document.removeEventListener('click', h, true); moved.forEach(function (t) { t.style.transform = ''; delete t.dataset.tgx; delete t.dataset.tgy; }); };
  }, 'PEUGEOT MODE: STEERING NOT INCLUDED');

  /* ── 12. cool wall ── */
  var NO = '<svg viewBox="0 0 400 300"><ellipse cx="130" cy="150" rx="70" ry="80" fill="#d9a67e" stroke="#000" stroke-width="5"/><path d="M62 130 Q130 50 200 130 Q150 100 62 130Z" fill="#6b5b4b" stroke="#000" stroke-width="4"/><ellipse cx="108" cy="145" rx="7" ry="9" fill="#000"/><ellipse cx="158" cy="145" rx="7" ry="9" fill="#000"/><path d="M96 124 L124 134 M168 124 L142 134" stroke="#000" stroke-width="6"/><ellipse cx="132" cy="195" rx="26" ry="30" fill="#400" stroke="#000" stroke-width="4"/><rect x="190" y="150" width="46" height="70" rx="14" fill="#d9a67e" stroke="#000" stroke-width="5" transform="rotate(-25 210 185)"/><path d="M250 40 h130 a14 14 0 0 1 14 14 v90 a14 14 0 0 1 -14 14 h-90 l-30 30 v-30 h-10 a14 14 0 0 1 -14 -14 v-90 a14 14 0 0 1 14 -14Z" fill="#fff" stroke="#000" stroke-width="5"/><text x="326" y="128" font-family="Oswald, Impact, sans-serif" font-size="78" font-weight="700" text-anchor="middle" fill="#e10600">NO!</text></svg>';
  act.coolwall = function () {
    var COLS = ['SUB-ZERO', 'COOL', 'UNCOOL', 'SERIOUSLY UNCOOL'], FAV = 'SORTING NETWORK', items = [FAV, 'BFS', 'DFS', 'DIJKSTRA', 'QUICKSORT', 'BUBBLE SORT', 'BINARY SEARCH TREE', 'LINKED LIST', 'NESTED LOOP', 'RECURSION', 'SNAKE', 'STACKTRIS', 'PONG', 'THE BUG MASCOT', 'MEMO 03 WORKBOOK'], S = {};
    try { S = JSON.parse(lget('tg-wall') || '{}'); } catch (e) {} S[FAV] = S[FAV] != null ? S[FAV] : 0;
    var o = openOv('tg-wall', '<div class="tg-x">\u00D7</div><h3>THE COOL WALL</h3><div class="tg-cols"></div><div class="tg-pile"></div><p style="color:#aaa;font:500 14px \'Barlow Condensed\',sans-serif">drag things onto the wall. do not touch the sorting network.</p>'), cols = $('.tg-cols', o.d), pile = $('.tg-pile', o.d);
    $('.tg-x', o.d).onclick = o.close; COLS.forEach(function (c, i) { var d = el('div', 'tg-col', '<h6>' + c + '</h6>'); d.dataset.i = i; cols.appendChild(d); }); xp('wall', 6);
    function render() { $$('.tg-chip', o.d).forEach(function (c) { c.remove(); }); items.forEach(function (n) { var c = el('div', 'tg-chip' + (n === FAV ? ' fav' : ''), n.replace(/</g, '&lt;')); c.dataset.n = n; var i = S[n]; (i != null && i >= 0 ? $$('.tg-col', o.d)[i] : pile).appendChild(c); }); lset('tg-wall', JSON.stringify(S)); }
    render();
    o.d.addEventListener('pointerdown', function (e) {
      var c = e.target.closest('.tg-chip'); if (!c) return; e.preventDefault(); var n = c.dataset.n, r = c.getBoundingClientRect(), g = c.cloneNode(true), ox = e.clientX - r.left, oy = e.clientY - r.top;
      g.classList.add('drag'); g.style.left = r.left + 'px'; g.style.top = r.top + 'px'; document.body.appendChild(g); c.style.opacity = .3;
      function mv(ev) { g.style.left = (ev.clientX - ox) + 'px'; g.style.top = (ev.clientY - oy) + 'px'; }
      function up(ev) {
        document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); g.remove(); var t = document.elementFromPoint(ev.clientX, ev.clientY), col = t && t.closest && t.closest('.tg-col'), pl = t && t.closest && t.closest('.tg-pile'), to = col ? parseInt(col.dataset.i, 10) : pl ? -1 : null;
        if (to == null) { render(); return; }
        if (n === FAV && S[n] === 0 && to !== 0) { var no = el('div', 'tg-no', NO); document.body.appendChild(no); setTimeout(function () { no.remove(); }, 1000); clang(); speak('No!'); toast('DO NOT TOUCH THE SORTING NETWORK', 1800); xp('no', 8); render(); return; }
        S[n] = to; render(); tone(600, 300, .1, 'triangle', .04);
      }
      document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
    });
  };

  /* ── 13. tonight on top gear ── */
  var TS = ['a binary search tree', 'a linked list', 'Dijkstra', 'a recursive function', 'the bug mascot', 'a 404 page', 'a sorting network', 'the neural eye', 'a div that will not centre', 'a dangling pointer'];
  var TM = ['goes too fast round a corner', 'catches fire for no reason', 'is driven into a lake', 'is bolted to a Reliant Robin', 'is declared slower than a milk float', 'is reviewed by a very confused engineer', 'tries to cross the Channel'];
  var TR = ['wears a hat made of CSS code', 'crashes something expensive again', 'builds a V8 out of a for-loop', 'gets stuck in a hedge of semicolons', 'is set on fire, fine'];
  var TJ = ['gets lost inside a nested loop', 'explains why this is all slightly wrong', 'sorts the garage alphabetically', 'puts the kettle on and misses everything', 'discusses gearboxes at length'];
  function tLine() {
    var k = Math.random(), g = ctxInfo.game, c = ctxInfo.card, cm = ctxInfo.cmds.length ? pick(ctxInfo.cmds) : '';
    if (g && k < .3) return 'Tonight, Jeremy takes ' + g + ' far too seriously, Richard ' + pick(TR) + ', and James ' + pick(TJ) + '.';
    if (c && k < .55) return 'Tonight, we review \u201C' + c + '\u201D, which Jeremy calls \u201Cadequate, if you enjoy things that work\u201D, Richard ' + pick(TR) + ', and James ' + pick(TJ) + '.';
    if (cm && k < .75) return 'Tonight, somebody typed \u201C' + cm + '\u201D into a terminal, ' + pick(TS) + ' ' + pick(TM) + ', and James ' + pick(TJ) + '.';
    return 'Tonight, ' + pick(TS) + ' ' + pick(TM) + ', Richard ' + pick(TR) + ', and James ' + pick(TJ) + '.';
  }
  act.tonight = tog('tonight', function () {
    var w = el('div', 'tg-tonight', '<div class="tb"><span>TONIGHT ON MEMO GEAR</span><i>\u00D7</i></div><div class="tl2"></div>'), body = $('.tl2', w); document.body.appendChild(w); $('i', w).onclick = function () { modes.tonight && modes.tonight(); };
    function add() { var d = el('div', '', '> ' + tLine()); body.appendChild(d); while (body.children.length > 5) body.firstChild.remove(); } add(); var iv = setInterval(function () { if (!silent) add(); }, 6500); xp('tonight', 5);
    return function () { clearInterval(iv); w.remove(); };
  });

  /* ── 15. alabama billboard patch (silly slogans only) ── */
  var SLOGANS = ['SWEET TEA IS TEA WITH A SUGAR PROBLEM', 'TABS ARE BETTER THAN SPACES', 'THE TOASTER OVEN IS A REAL OVEN', 'PINEAPPLE BELONGS ON TRAINS', 'JAVASCRIPT IS A TYPO THAT SHIPPED', 'GRAVY IS SOUP FOR OPTIMISTS', 'THIS TRUCK HAS TOO MANY WHEELS', 'BEIGE IS A PERSONALITY', 'FIRST GEAR IS A SUGGESTION'];
  act.billboard = tog('bill', function () {
    var layer = el('div', 'tg-bills'), warn = el('div', 'tg-warn', 'Drive faster, the locals are throwing rocks at our server source code.'), iv, ri;
    document.body.appendChild(layer); document.body.appendChild(warn);
    function paint() { layer.textContent = ''; for (var i = 0; i < 7; i++) { var s = el('span', '', pick(SLOGANS)); s.style.left = R(-5, 55) + '%'; s.style.top = R(4, 88) + '%'; s.style.transform = 'rotate(' + R(-14, 14) + 'deg)'; layer.appendChild(s); } }
    paint(); iv = setInterval(paint, 4200); ri = setInterval(function () { var r = el('div', 'tg-rock'); r.style.left = R(0, 100) + 'vw'; document.body.appendChild(r); setTimeout(function () { r.remove(); }, 1700); if (Math.random() < .3) tone(200, 100, .1, 'square', .03); }, 650);
    later(function () { modes.bill && modes.bill(); }, 26000); xp('bill', 6);
    return function () { clearInterval(iv); clearInterval(ri); layer.remove(); warn.remove(); $$('.tg-rock').forEach(function (r) { r.remove(); }); };
  });

  /* ── 16. v8 blender ── */
  act.v8 = tog('v8', function () {
    var meter = el('div', 'tg-rev', 'V8 ' + (sndOn() ? '' : '(turn Sound on to hear it)') + '<i><b></b></i>'), bar = $('b', meter), eng = engine(45), ly = scrollY, blown = false, hot = 0, iv;
    document.body.appendChild(meter);
    iv = setInterval(function () {
      var d = Math.abs(scrollY - ly); ly = scrollY; var r = Math.min(1, d / 160); bar.style.width = (blown ? 100 : r * 100) + '%'; eng && !blown && eng.rev(r);
      if (!blown && d > 240 && ++hot >= 2) { blown = true; eng && eng.stop(); eng = null; toast('GASKET BLOWN', 2000); boom(); xp('v8', 8); meter.firstChild.textContent = 'GASKET BLOWN \u2014 MUTED'; later(function () { blown = false; hot = 0; eng = engine(45); meter.firstChild.textContent = 'V8 '; }, 6000); } if (d < 120) hot = 0;
    }, 80);
    return function () { clearInterval(iv); eng && eng.stop(); meter.remove(); };
  }, 'V8 BLENDER: SCROLL TO REV');

  /* ── 17. backup car ── */
  var backupOn = false;
  act.backup = function (auto) {
    if (backupOn) { backupOff(); return; } backupOn = true; modes.backup = function () { backupOff(true); }; root.classList.add('tg-backup');
    var bar = el('div', 'tg-backbar', auto === true ? 'YOU QUIT A GAME. HERE IS A PINK PORSCHE 928.' : 'BACKUP CAR ISSUED.'); bar.innerHTML += '<br>Finish a full game of Snake to get your car back. <u>OPEN SNAKE</u>'; document.body.appendChild(bar);
    $('u', bar).onclick = function () { FX.arcade && FX.arcade(); setTimeout(function () { document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true, cancelable: true })); }, 300); }; xp('backup', 6);
  };
  function backupOff(quiet) { if (!backupOn) return; backupOn = false; delete modes.backup; root.classList.remove('tg-backup'); var b = $('.tg-backbar'); b && b.remove(); if (!quiet) { toast('YOUR CAR HAS BEEN RETURNED', 2200); xp('backup2', 6); } }

  /* ── 18. channel tunnel ── */
  act.channel = tog('chan', function () {
    var cv = el('canvas', 'tg-chan'); cv.width = innerWidth; cv.height = Math.round(innerHeight * .3); document.body.appendChild(cv); var cx = cv.getContext('2d'), W = cv.width, H = cv.height, lineY = H * .35, raf, mx = -999, my = -999, ms = 0, t = 0, lost = 0, started = Date.now();
    var names = ['SNAKE', 'PONG', 'STACKTRIS', 'DRIFT', 'MERGE'], tk = names.map(function (n, i) { return { n: n, x: W * (i + 1) / 6, y: lineY - 12, vy: 0, alive: true }; });
    function mm(e) { var cy = e.clientY - (innerHeight - H); ms = Math.hypot(e.clientX - mx, cy - my); mx = e.clientX; my = cy; }
    document.addEventListener('mousemove', mm);
    function frame() {
      raf = requestAnimationFrame(frame); t += .05; cx.clearRect(0, 0, W, H); var alive = 0;
      tk.forEach(function (k) {
        if (!k.alive) return; alive++; k.vy += .018 + R(0, .01); if (Math.hypot(mx - k.x, my - k.y) < 70) { k.vy -= Math.min(.7, ms * .03); } k.vy = Math.max(-3, Math.min(2, k.vy * .98)); k.y += k.vy; k.x += Math.sin(t + k.x) * .3;
        if (k.y > H - 8) { k.alive = false; lost++; toast('AMPHIBIOUS ATTEMPT #' + lost + ': SUNK', 1400); tone(300, 60, .5, 'sawtooth', .05); }
        cx.fillStyle = '#fff'; cx.strokeStyle = '#000'; cx.lineWidth = 2; cx.beginPath(); cx.rect(k.x - 44, k.y - 14, 88, 26); cx.fill(); cx.stroke(); cx.fillStyle = '#000'; cx.font = '700 13px Oswald, Impact, sans-serif'; cx.textAlign = 'center'; cx.fillText(k.n, k.x, k.y + 5);
      });
      cx.fillStyle = 'rgba(30,120,220,.55)'; cx.beginPath(); cx.moveTo(0, H); for (var x = 0; x <= W; x += 12) cx.lineTo(x, lineY + Math.sin(x * .02 + t) * 6); cx.lineTo(W, H); cx.fill();
      if (!alive || Date.now() - started > 45000) { cancelAnimationFrame(raf); var n = alive; toast(n ? n + ' SURVIVED THE CROSSING. RICHARD IS FINE.' : 'ALL SUNK. THE FRENCH ARE LAUGHING.', 3000); if (n) xp('chan', 10); later(function () { modes.chan && modes.chan(); }, 3200); }
    }
    raf = requestAnimationFrame(frame); toast('KEEP THEM AFLOAT. WAVE THE MOUSE UNDER THEM.', 3200);
    return function () { cancelAnimationFrame(raf); document.removeEventListener('mousemove', mm); cv.remove(); };
  });

  /* ── 19. how hard can it be ── */
  act.howhard = function () {
    if (modes.hh2) { modes.hh2(); return; } var o = openOv('', '<h2 style="font-size:34px;letter-spacing:.08em">COMPILING ALL CODE UPDATES...</h2><div style="width:min(420px,70vw);height:12px;border:1px solid #fff"><i style="display:block;height:100%;width:0;background:#e10600" id="tg-hb"></i></div>'), p = 0;
    var iv = setInterval(function () { var hb = $('#tg-hb'); if (!hb) { clearInterval(iv); return; } p += R(8, 24); hb.style.width = Math.min(100, p) + '%'; if (p >= 100) { clearInterval(iv); o.close(); scramble(); } }, 260);
  };
  function scramble() {
    var els = $$('.card-link,.hud-tile,.rail-link,.hero h1,.hero p,.tl li,.term-box,.group h2,.search-row,.pill,.rail .brand'), old = [];
    els.forEach(function (e) { old.push([e, e.getAttribute('style')]); if (getComputedStyle(e).position === 'static') e.style.position = 'relative'; e.style.zIndex = Math.floor(R(1, 99)); e.style.transform = 'translate(' + R(-40, 40) + 'px,' + R(-24, 24) + 'px) rotate(' + R(-5, 5) + 'deg)'; });
    toast('Well, it turns out it\u2019s quite hard.', 2800); xp('hh2', 6);
    modes.hh2 = function () { delete modes.hh2; old.forEach(function (o) { if (o[1] == null) o[0].removeAttribute('style'); else o[0].setAttribute('style', o[1]); }); };
  }

  /* ── 20. and on that bombshell ── */
  function addBomb() { var f = $('.main .foot'), b = el('button', 'tg-bomb', 'And on that bombshell\u2026'); b.onclick = function () { act.bombshell(); }; f ? f.parentNode.insertBefore(b, f) : $('.main').appendChild(b); }
  var CRED = [['PRESENTED BY', 'a man who shouts'], ['ALSO PRESENTED BY', 'a man who crashes'], ['AND', 'a man who explains'], ['EXECUTIVE PRODUCER', 'the bug mascot'], ['CARS DAMAGED', 'fourteen'], ['STUNT COORDINATOR', 'gravity'], ['CATERING', 'one (1) biscuit'], ['SPECIAL THANKS', 'the sorting network, for staying cool'], ['NO CARAVANS WERE HARMED', '(several were)']];
  act.bombshell = function () {
    if (modes.bomb) return; var a = null, o = openOv('', '<div class="tg-x">\u00D7</div><h2 style="font-size:clamp(28px,6vw,64px);letter-spacing:.06em">And on that bombshell\u2026</h2>'); o.d.style.overflow = 'hidden'; o.d.style.background = '#000'; $('.tg-x', o.d).onclick = o.close;
    modes.bomb = function () { delete modes.bomb; a && a.stop(); a = null; o.close(); };
    if (sndOn()) { var au = new Audio('assets/topgear/outro.mp3'), c = actx(), ok = false; au.onerror = function () { if (!ok) { ok = true; a = chordAudio(c); } }; var pr = au.play(); if (pr && pr.catch) pr.catch(function () { if (!ok) { ok = true; a = chordAudio(c); } }); var prev = a; a = { stop: function () { au.pause(); prev && prev.stop(); } }; }
    xp('bomb', 10);
    later(function () { if (!modes.bomb) return; var hh = $('h2', o.d); if (hh) { hh.style.transition = 'opacity 1s'; hh.style.opacity = 0; } var cr = el('div', 'tg-credits', CRED.map(function (r) { return '<b>' + r[0] + '</b>' + r[1]; }).join('')); o.d.appendChild(cr); },
      2600);
    later(function () { if (!modes.bomb) return; try { window.close(); } catch (e) {} o.d.textContent = ''; o.d.className = 'tg-ov tg-freeze'; o.d.innerHTML = '<h2 style="font-size:30px;letter-spacing:.08em">THIS PAGE HAS STOPPED RESPONDING</h2><div class="tg-ring" style="width:50px;height:50px;border:6px solid #333;border-top-color:#fff;border-radius:50%;animation:tg-spin 1s linear infinite"></div><button>REBOOT</button>'; $('button', o.d).onclick = function () { location.reload(); }; }, 20000);
  };
  function chordAudio(c) {
    if (!c) return null; var nodes = [], g = c.createGain(); g.gain.value = .0001; g.connect(c.destination); g.gain.exponentialRampToValueAtTime(.12, c.currentTime + 2.5);
    [110, 220, 277.2, 329.6, 415.3, 554.4].forEach(function (f) { var o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.connect(g); o.start(); nodes.push(o); });
    return { stop: function () { g.gain.setTargetAtTime(.0001, c.currentTime, .3); setTimeout(function () { nodes.forEach(function (o) { try { o.stop(); } catch (e) {} }); }, 1500); } };
  }

  /* ── extras: some say, grand tour, random events ── */
  act.somesay = function () { toast(pick(SOME), 4200); xp('some', 3); };
  act.gt = function () { variant = variant === 'gt' ? 'tg' : 'gt'; root.classList.toggle('tg-gt', variant === 'gt'); setText(); toast(variant === 'gt' ? 'WELCOME TO THE TENT' : 'BACK TO THE TEST TRACK', 2000); xp('gt', 5); };
  act.leave = leave;
  act.garage = function () { garage && garage.classList.toggle('open'); };
  var EVENTS = [['caravan', 3], ['clarkson', 1], ['somesay', 2], ['revs', 2], ['tonightline', 1]];
  function schedule() {
    var d = R(70, 180) * 1000; later(function () {
      if (!on) return; if (!silent && !ovs.length && !inGame() && !$('.chx-ov')) { var bag = []; EVENTS.forEach(function (e) { for (var i = 0; i < e[1]; i++) bag.push(e[0]); }); var ev = pick(bag); if (ev === 'tonightline') toast(tLine(), 5000); else act[ev](); }
      schedule();
    }, d);
  }
  act.event = function () { var ev = pick(['caravan', 'clarkson', 'somesay', 'revs']); act[ev](); };
  document.addEventListener('mouseover', function (e) { var c = e.target.closest && e.target.closest('.card-link'); if (c) { var n = $('.card-name', c), t = $('.card-tag', c); ctxInfo.card = (t ? t.textContent + ' ' : '') + (n ? n.textContent : ''); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && on && !FX.arcadeActive) { if (ovs.length) ovs[ovs.length - 1].close(); else { if (garage && garage.classList.contains('open')) garage.classList.remove('open'); else panic(); } } });

  /* ── wiring: terminal, typed words, rail button ── */
  function guard(fn, nm) { return function (a) { if (!on) { P('enter the studio first: type topgear'); return; } if (nm) { ctxInfo.cmds.push(nm); ctxInfo.cmds = ctxInfo.cmds.slice(-6); } FX.closeTerm && FX.closeTerm(); setTimeout(function () { fn(a || []); }, 260); }; }
  Object.keys(act).forEach(function (k) { cmds[k] = guard(act[k], k); });
  cmds.speeeed = cmds.speed; cmds.crash = guard(function () { revs = 100; }, 'crash');
  cmds.topgear = function () { P('hijacking the page...'); FX.closeTerm && FX.closeTerm(); setTimeout(function () { enter('tg'); }, 260); };
  cmds.grandtour = function () { P('pitching a tent...'); FX.closeTerm && FX.closeTerm(); setTimeout(function () { enter('gt'); }, 260); };
  cmds.thrust = cmds.hammerhead;
  cmds.gear = function () {
    ['topgear / grandtour  hijack the page (rail button works too)', 'speed  slow  revs [crash]  robin  hammerhead  dust  caravan  ballpein  peugeot', 'coolwall  tonight  clarkson  billboard  v8  backup  channel  howhard  bombshell', 'somesay  gt (swap theme)  garage  stig  event (random)  leave', 'Esc = the Stig takes the wheel and resets everything'].forEach(function (l) { P('  ' + l); });
  };
    FX.helpExtra = (FX.helpExtra || []).concat(['  topgear | grandtour  the Top Gear pack (then: gear)']);
  var buf = '';
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1 || /INPUT|TEXTAREA|SELECT/.test(t.tagName || '') || t.isContentEditable || on || FX.arcadeActive) return;
    buf = (buf + e.key.toLowerCase()).slice(-12); if (buf.slice(-7) === 'topgear') { buf = ''; enter('tg'); } else if (buf.slice(-9) === 'grandtour') { buf = ''; enter('gt'); }
  });
  var brand = $('.rail .brand'); if (brand) { var hz = el('button', 'tg-hazard', 'DO_NOT_PRESS_PRODUCTION_HAZARD.sh'); hz.title = 'seriously'; hz.onclick = function () { enter('tg'); }; brand.insertAdjacentElement('afterend', hz); }
})();
