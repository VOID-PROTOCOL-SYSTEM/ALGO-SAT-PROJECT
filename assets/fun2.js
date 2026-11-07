/* MEMO ARCHIVE — fun pack (part 2): neural link, popups, bug, runner ID, hack, synth, thunder, commands */
(function () {
  var FX = window.ArchiveFX = window.ArchiveFX || {}, U = FX.u; if (!U) return;
  var $ = U.$, $$ = U.$$, rnd = U.rnd, pick = U.pick, lget = U.lget, lset = U.lset, reduce = U.reduce, hash = U.hash, seeded = U.seeded;
  var root = document.documentElement, DATA = { items: [] };
  try { DATA = JSON.parse($('#archive-data').textContent); } catch (e) {}
  function snd() { return FX.sound || { on: false, tone: function () {}, init: function () {} }; }
  function busy() { return !!($('.term.open') || $('.pal-wrap.open') || $('.hack') || $('.slices')); }

  /* ═════════ NEURAL LINK (snark) ═════════ */
  var LINES = {
    greet: ['NEURAL LINK online. you found the archive. try not to break anything.', 'boot complete. i have opinions about your browsing. none of them good.'],
    greetBack: ['welcome back, runner. i kept your seat warm. it was cold.', 'oh. you again. i missed you. (that is a lie. it is a feature.)'],
    big: ['warning: this file weighs {s}. bring snacks.', '{s}?! that notebook has been eating well.', 'this one is {s}. your wifi may file a complaint.'],
    small: ['a lightweight. suspicious.', 'tiny file. big energy. or no energy. unclear.'],
    many: ['{n} sections. someone was thorough. or caffeinated.', '{n} sections?! that is not a notebook, that is a lifestyle.'],
    first: ['bold choice.', 'interesting. most runners start with the other one.'],
    idle1: ['are you still alive, runner?', 'hello? blink twice if you are being held hostage by a spreadsheet.'],
    idle2: ['i have started counting your pixels. so far: all of them.', 'still here. still judging. still lovely.'],
    idle3: ['going into low-power mode. wake me with a click.', 'i will be over here, contemplating the void. carry on.'],
    term: ['ah, a hacker. or someone who lost the mouse.', 'terminal engaged. try "help". or "sudo". i dare you.'],
    pal: ['ctrl+k. the fast lane. respect.', 'a power user. i can smell the keyboard shortcuts.'],
    rain: ['ah. atmospheric.', 'rain on. now it is a mood.'],
    crt: ['squint to enhance the nostalgia.', 'crt mode. 1987 called, it wants its pixels back.'],
    sound: ['audio enabled. my beeps are best-in-class.', 'sound on. i have been practising my boops.'],
    synth: ['dropping the beat. the grid is listening.', 'procedural bangers, no royalties. you are welcome.'],
    storm: ['i did not order a thunderstorm. enjoy.', 'lightning: free. electricity bill: not my problem.'],
    hue: ['ooh, new colors. same you.', 'a fresh coat of neon. suits you.'],
    nomatch: ['zero matches. the void stares back.', 'nothing found. even the search is confused.'],
    squash: ['bug squashed. the ecosystem weeps.', 'splat. that one had a family. probably.', 'one less bug. a thousand more in the codebase.'],
    squash5: ['five bugs. you are basically a pest controller.'],
    mega: ['you hurt the mega-bug. it is not happy.', 'it grew. it is angry. i recommend running.'],
    megadead: ['the mega-bug is dead. long live the mega-bug.'],
    popup: ['do not worry about those. they are mostly harmless. mostly.', 'popups are a feature. a bad one. but a feature.'],
    popups: ['popups cleared. you monster.'],
    speed: ['slow down, speed racer.', 'whoa. my retinas have chromatic aberration now.'],
    logo: ['ow.', 'hands off the logo. it is sensitive.', 'that tickles.'],
    hack: ['mainframe breached. i did not see anything. i am legally blind.', 'hacking in progress. this is a fictional crime.'],
    id: ['identity issued. guard it with your life. or do not, it is fake.', 'new runner ID. now with 30% more attitude.'],
    quip: ['i run on spite and 12 volts.', 'fun fact: i have no idea what is in these notebooks.', 'if you are reading this, you are procrastinating. nice.',
           'i would offer you advice but i am a cartoon eye.', 'the archive is watching. i am the archive. hi.', 'every click is logged. (no it is not. i am just dramatic.)']
  };
  var used = {}, muted = lget('nl-muted') === '1', lastSay = 0, hideT, typeT;
  var nl = document.createElement('div'); nl.className = 'nl' + (muted ? ' muted' : '');
  nl.innerHTML = '<div class="nl-bubble"><small>NEURAL LINK</small><span class="nl-msg"></span></div>' +
    '<div class="nl-eye" role="button" tabindex="0" title="Neural link — click for a quip"><svg viewBox="0 0 32 32"><path d="M2 16 Q16 3 30 16 Q16 29 2 16Z" fill="none" stroke="#ff2d78" stroke-width="1.6"/><circle class="iris" cx="16" cy="16" r="5"/><circle cx="17.5" cy="14.5" r="1.4" fill="#04060a"/></svg></div>';
  document.body.appendChild(nl);
  var bub = $('.nl-bubble', nl), msgEl = $('.nl-msg', nl);
  function say(txt, force) {
    if (muted && !force) return; var now = Date.now(); if (!force && now - lastSay < 6500) return; lastSay = now;
    clearInterval(typeT); clearTimeout(hideT); msgEl.textContent = ''; bub.classList.add('show'); var i = 0;
    typeT = setInterval(function () { msgEl.textContent = txt.slice(0, ++i); if (i >= txt.length) clearInterval(typeT); }, 20);
    hideT = setTimeout(function () { bub.classList.remove('show'); }, 3800 + txt.length * 45);
  }
  function snark(cat, vars, force) {
    var arr = LINES[cat]; if (!arr) return; used[cat] = ((used[cat] || 0) + 1) % arr.length;
    var t = arr[used[cat]]; if (vars) Object.keys(vars).forEach(function (k) { t = t.replace('{' + k + '}', vars[k]); }); say(t, force);
  }
  FX.snark = snark; FX.say = say;
  function setMuted(m) { muted = m; lset('nl-muted', m ? '1' : '0'); nl.classList.toggle('muted', m); if (m) bub.classList.remove('show'); }
  $('.nl-eye', nl).addEventListener('click', function () {
    if (muted) { setMuted(false); say('neural link restored. i was only sulking.', true); } else snark('quip', null, true);
  });
  $('.nl-eye', nl).addEventListener('contextmenu', function (e) { e.preventDefault(); setMuted(!muted); if (!muted) say('neural link restored.', true); });
  // triggers
  var visits = parseInt(lget('visits') || '0', 10) + 1; lset('visits', String(visits));
  setTimeout(function () { snark(visits > 1 ? 'greetBack' : 'greet'); }, root.classList.contains('booting') ? 5200 : 2200);
  var seenCards = {};
  document.addEventListener('mouseover', function (e) {
    var c = e.target.closest && e.target.closest('.card-link'); if (!c || seenCards[c.href]) return; seenCards[c.href] = 1;
    var txt = ($('.size', c) || {}).textContent || '', mb = /([\d.]+)\s*MB/.exec(txt), sec = /(\d+)\s*SECTIONS/.exec(txt);
    if (sec && +sec[1] >= 50) snark('many', { n: sec[1] }); else if (mb && +mb[1] >= 10) snark('big', { s: mb[0] });
    else if (mb && +mb[1] < 1) snark('small'); else if (Object.keys(seenCards).length === 1) snark('first');
  });
  var idleN = 0, idleT; function idleReset() { clearTimeout(idleT); idleN = 0; idleT = setTimeout(idleTick, 45000); }
  function idleTick() { idleN++; snark(['idle1', 'idle2', 'idle3'][Math.min(idleN, 3) - 1]); if (idleN < 3) idleT = setTimeout(idleTick, 45000); }
  ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(function (ev) { addEventListener(ev, idleReset, { passive: true }); }); idleReset();
  function watch(sel, cls, cat) {
    var el = $(sel); if (!el) return;
    new MutationObserver(function () { if (el.classList.contains(cls)) snark(cat); }).observe(el, { attributes: true, attributeFilter: ['class'] });
  }
  watch('#term', 'open', 'term'); watch('#empty', 'show', 'nomatch');
  (function () { var iv = setInterval(function () { var p = $('.pal-wrap'); if (p) { clearInterval(iv); watch('.pal-wrap', 'open', 'pal'); } }, 400); setTimeout(function () { clearInterval(iv); }, 6000); })();
  document.addEventListener('click', function (e) {
    var p = e.target.closest && e.target.closest('.pill'), s = e.target.closest && e.target.closest('.swatch'), l = e.target.closest && e.target.closest('.logo');
    if (p) setTimeout(function () { if (p.classList.contains('on')) snark(p.dataset.fx); }, 80);
    if (s) snark('hue'); if (l) snark('logo');
  });
  var os = FX.storm; if (os) FX.storm = function () { os(); snark('storm'); };

  /* ═════════ FAKE ERROR POPUPS ═════════ */
  var POPS = [['CRITICAL ERROR', 'coffee.exe not found. please insert caffeine.'], ['WARNING', 'memo.exe has stopped caring.'],
    ['SYSTEM ALERT', 'your vibes are 3% below recommended levels.'], ['ERROR 418', "i'm a teapot. this is a notebook archive. things are strange."],
    ['NOTICE', 'a glitch was detected in the simulation. it was you.'], ['FATAL', 'ctrl+z is not available in real life.'],
    ['WARNING', 'too much neon detected. proceed anyway?'], ['ERROR', 'the cake is a lie. the notebooks are real.'],
    ['NOTICE', 'this popup is not a virus. probably.'], ['ALERT', 'your cursor has been flagged for excessive style.']];
  var BTNS = ['IGNORE', 'BLAME MARIMO', 'I ACCEPT THE RISK', 'MORE NEON', 'WHATEVER', 'DEFINITELY NOT'];
  var extraSpawns = 0;
  function closePop(p, spawnMore) {
    if (!p.parentNode) return; p.classList.add('out'); setTimeout(function () { p.remove(); }, 260); snark('popup');
    if (spawnMore && Math.random() < .12 && extraSpawns < 5 && $$('.popup').length < 3) { extraSpawns++; setTimeout(function () { spawnPop(['OKAY FINE', 'you closed one. two have been dispatched.']); }, 500); }
  }
  function spawnPop(def) {
    var d = def || pick(POPS), p = document.createElement('div'); p.className = 'popup';
    p.style.left = Math.max(10, rnd(30, innerWidth - 330)) + 'px'; p.style.top = Math.max(60, rnd(70, innerHeight - 240)) + 'px';
    p.innerHTML = '<div class="pop-head"><span></span><i class="pop-x" role="button">&times;</i></div><div class="popup-body"><div class="pop-ico">!</div><div class="pop-msg"></div></div><div class="pop-btns"><span class="pop-btn">OK</span><span class="pop-btn"></span></div>';
    $('.pop-head span', p).textContent = d[0]; $('.pop-msg', p).textContent = d[1]; $$('.pop-btn', p)[1].textContent = pick(BTNS);
    document.body.appendChild(p); snd().tone(240, 120, .18, 'square', .04);
    $('.pop-x', p).addEventListener('click', function () { closePop(p, true); });
    $$('.pop-btn', p).forEach(function (b) { b.addEventListener('click', function () { closePop(p, true); }); });
    var h = $('.pop-head', p);
    h.addEventListener('mousedown', function (e) {
      var ox = e.clientX - p.offsetLeft, oy = e.clientY - p.offsetTop;
      function mv(ev) { p.style.left = (ev.clientX - ox) + 'px'; p.style.top = (ev.clientY - oy) + 'px'; }
      function up() { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); }
      addEventListener('mousemove', mv); addEventListener('mouseup', up); e.preventDefault();
    });
    setTimeout(function () { closePop(p, false); }, 26000);
  }
  FX.popup = function () { spawnPop(); };
  (function popLoop(first) { setTimeout(function () { if (!document.hidden && !busy() && $$('.popup').length < 2) spawnPop(); popLoop(false); }, first ? rnd(55000, 95000) : rnd(90000, 170000)); })(true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('.popup')) { $$('.popup').forEach(function (p) { p.remove(); }); snark('popups'); } });

  /* ═════════ BUG MASCOT ═════════ */
  var bugCount = parseInt(lget('bugs') || '0', 10), bugEl = null, bugRaf = 0, mouse = { x: -999, y: -999 };
  function showCount() { $$('#bug-count').forEach(function (e) { e.textContent = bugCount; }); } showCount();
  addEventListener('mousemove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
  var BUG_SVG = '<svg viewBox="0 0 12 12" shape-rendering="crispEdges"><g class="legs" fill="#00f5ff"><rect x="1" y="3" width="2" height="1"/><rect x="0" y="6" width="3" height="1"/><rect x="1" y="9" width="2" height="1"/>' +
    '<rect x="9" y="3" width="2" height="1"/><rect x="9" y="6" width="3" height="1"/><rect x="9" y="9" width="2" height="1"/></g>' +
    '<g fill="#00ff9f"><rect x="4" y="1" width="4" height="1"/><rect x="3" y="2" width="6" height="8"/><rect x="4" y="10" width="4" height="1"/></g>' +
    '<g fill="#04060a"><rect x="5" y="2" width="1" height="1"/><rect x="7" y="2" width="1" height="1"/><rect x="5" y="5" width="2" height="4"/></g><g fill="#ff2d78"><rect x="5" y="2" width="1" height="1"/><rect x="7" y="2" width="1" height="1"/></g></svg>';
  var SPLAT = '<svg viewBox="0 0 46 46"><g fill="#00ff9f"><circle cx="23" cy="23" r="10"/><circle cx="10" cy="14" r="4"/><circle cx="36" cy="10" r="3"/><circle cx="38" cy="32" r="5"/><circle cx="12" cy="36" r="3.5"/><circle cx="26" cy="41" r="2.5"/></g><g fill="#ff2d78"><circle cx="21" cy="21" r="4"/></g></svg>';
  function spawnBug(forceMad) {
    if (bugEl || reduce) return;
    var mad = !!forceMad || (bugCount > 0 && bugCount % 10 === 0);
    var b = { x: 0, y: 0, tx: 0, ty: 0, ang: 0, pause: 0, age: 0, hp: mad ? 3 : 1, mad: mad, sc: mad ? 1.7 : 1, spd: mad ? 170 : 85, leaving: false };
    var side = Math.floor(Math.random() * 4), w = innerWidth, h = innerHeight;
    b.x = side === 0 ? -30 : side === 1 ? w + 30 : rnd(0, w); b.y = side === 2 ? -30 : side === 3 ? h + 30 : rnd(0, h);
    b.tx = rnd(60, w - 60); b.ty = rnd(60, h - 60);
    var el = document.createElement('div'); el.className = 'bug' + (mad ? ' mad' : ''); el.innerHTML = BUG_SVG; document.body.appendChild(el); bugEl = el;
    el.addEventListener('click', function (e) {
      e.stopPropagation(); b.hp--;
      if (b.hp > 0) { b.spd *= 1.25; snark('mega'); snd().tone(260, 90, .1, 'sawtooth', .05); return; }
      squash(b);
    });
    var last = performance.now();
    function step(t) {
      if (!bugEl) return; bugRaf = requestAnimationFrame(step); var dt = Math.min(.05, (t - last) / 1000); last = t; b.age += dt;
      var dx = b.tx - b.x, dy = b.ty - b.y, dist = Math.hypot(dx, dy), sp = b.spd;
      var mdx = b.x - mouse.x, mdy = b.y - mouse.y, md = Math.hypot(mdx, mdy);
      if (md < 130 && !b.leaving) { b.tx = Math.max(30, Math.min(innerWidth - 30, b.x + mdx / md * 260)); b.ty = Math.max(30, Math.min(innerHeight - 30, b.y + mdy / md * 260)); sp *= 1.9; b.pause = 0; }
      if (b.pause > 0) { b.pause -= dt; } else if (dist < 8) {
        if (b.leaving) { el.remove(); bugEl = null; cancelAnimationFrame(bugRaf); setTimeout(spawnBug, rnd(10000, 25000)); return; }
        b.pause = rnd(.3, 1.8); b.tx = rnd(50, innerWidth - 50); b.ty = rnd(50, innerHeight - 50);
      } else {
        b.x += dx / dist * sp * dt; b.y += dy / dist * sp * dt; b.ang = Math.atan2(dy, dx) + Math.PI / 2;
      }
      if (b.age > 35 && !b.leaving) { b.leaving = true; var edge = [[-60, b.y], [innerWidth + 60, b.y], [b.x, -60], [b.x, innerHeight + 60]][Math.floor(Math.random() * 4)]; b.tx = edge[0]; b.ty = edge[1]; }
      el.style.transform = 'translate(' + b.x.toFixed(1) + 'px,' + b.y.toFixed(1) + 'px) rotate(' + b.ang.toFixed(2) + 'rad) scale(' + b.sc + ')';
    }
    bugRaf = requestAnimationFrame(step);
    if (mad) snark('mega', null, true);
  }
  function squash(b) {
    var sp = document.createElement('div'); sp.className = 'splat'; sp.innerHTML = SPLAT; sp.style.left = b.x + 'px'; sp.style.top = b.y + 'px';
    if (b.mad) sp.style.transform = 'scale(1.8)'; document.body.appendChild(sp);
    setTimeout(function () { sp.classList.add('fade'); }, 40); setTimeout(function () { sp.remove(); }, 4600);
    bugEl.remove(); bugEl = null; cancelAnimationFrame(bugRaf);
    bugCount++; lset('bugs', String(bugCount)); showCount();
    snd().tone(320, 55, .16, 'sawtooth', .06); snd().tone(90, 40, .2, 'square', .05, .02);
    if (b.mad) snark('megadead', null, true); else snark(bugCount === 5 ? 'squash5' : 'squash', null, bugCount === 5);
    setTimeout(spawnBug, rnd(9000, 20000));
  }
  FX.bug = function () { if (!bugEl) spawnBug(false); }; FX.bugCount = function () { return bugCount; };
  if (!reduce) setTimeout(spawnBug, 9000);

  /* ═════════ RUNNER ID ═════════ */
  var ADJ = ['NEON', 'CHROME', 'GHOST', 'VOID', 'STATIC', 'CYBER', 'RAZOR', 'PIXEL', 'SILENT', 'TOXIC', 'LUCID', 'HOLLOW', 'RAPID', 'FERAL', 'QUANTUM'];
  var NOUN = ['VIPER', 'FOX', 'WRAITH', 'COMET', 'SPARROW', 'MANTIS', 'DRIFTER', 'JACKAL', 'PHANTOM', 'CIPHER', 'ORACLE', 'HORNET', 'RONIN', 'LYNX', 'GOLEM'];
  var FACT = ['THE LAMPLIGHTERS', 'NULL COLLECTIVE', 'CHROME SYNOD', 'GRID WALKERS', 'STATIC SAINTS', 'BYTE BANDITS'];
  var HUECOL = ['#00f5ff', '#ff2d78', '#b44dff', '#00ff9f'];
  function newId() {
    var o = { handle: pick(ADJ) + '-' + pick(NOUN) + '-' + (1000 + Math.floor(Math.random() * 8999)), level: 1 + Math.floor(Math.random() * 5),
              faction: pick(FACT), issued: new Date().toISOString().slice(0, 10) };
    lset('runner-id', JSON.stringify(o)); return o;
  }
  function getId() { try { var o = JSON.parse(lget('runner-id')); if (o && o.handle) return o; } catch (e) {} return newId(); }
  function renderId() {
    var host = $('#id-card'); if (!host) return; var o = getId(), r = seeded(hash(o.handle)), col = HUECOL[hash(o.handle) % 4], i, j, cells = '';
    for (i = 0; i < 5; i++) for (j = 0; j < 3; j++) if (r() > .5) { cells += '<rect x="' + j * 20 + '" y="' + i * 20 + '" width="20" height="20"/>'; if (j < 2) cells += '<rect x="' + (4 - j) * 20 + '" y="' + i * 20 + '" width="20" height="20"/>'; }
    var bars = '', x = 0, on = true; while (x < 220) { var w = 1 + Math.floor(r() * 3); if (on) bars += '<rect x="' + x + '" y="0" width="' + w + '" height="38"/>'; x += w; on = !on; }
    host.innerHTML = '<div class="id-card"><svg class="id-face" viewBox="0 0 100 100" shape-rendering="crispEdges" fill="' + col + '">' + cells + '</svg>' +
      '<div class="id-info"><div class="id-key">Runner handle</div><div class="id-val big"></div>' +
      '<div class="id-row"><div><div class="id-key">Clearance</div><div class="id-val"></div></div><div><div class="id-key">Issued</div><div class="id-val"></div></div>' +
      '<div><div class="id-key">Affiliation</div><div class="id-val"><span class="cp-redacted cp-redacted--hot"></span></div></div></div>' +
      '<svg class="id-bar" viewBox="0 0 220 38" preserveAspectRatio="none" fill="' + col + '">' + bars + '</svg></div>' +
      '<div class="id-actions"><i class="pill" role="button" tabindex="0" id="id-new">Regenerate</i><span class="id-key">stored only in your browser</span></div></div>';
    var v = $$('.id-val', host); v[0].textContent = o.handle; v[1].textContent = 'LEVEL-' + o.level; v[2].textContent = o.issued; $('.cp-redacted', host).textContent = o.faction;
    $('#id-new', host).addEventListener('click', function () { newId(); renderId(); snark('id'); });
  }
  renderId(); FX.id = function (fresh) { if (fresh) { newId(); renderId(); snark('id'); } return getId(); };

  /* ═════════ HACK SEQUENCE ═════════ */
  function hack(arg) {
    if ($('.hack')) return; var it = (arg && FX.resolve && FX.resolve(arg)) || pick(DATA.items); if (!it) return;
    FX.closeTerm && FX.closeTerm();
    var o = document.createElement('div'); o.className = 'hack';
    o.innerHTML = '<pre class="hack-feed"></pre><div class="hack-phase"></div><div class="hack-bar"><b></b></div><div class="hack-pct"></div><div class="hack-big">ACCESS GRANTED</div>';
    document.body.appendChild(o); var feed = $('.hack-feed', o), ph = $('.hack-phase', o), bar = $('.hack-bar b', o), pc = $('.hack-pct', o);
    var PH = [[0, 'scanning ports'], [18, 'spoofing MAC address'], [36, 'injecting payload'], [55, 'bypassing ICE'], [76, 'cracking memo encryption'], [94, 'extracting ' + it.file]];
    var p = 0, boost = 1, done = false, lines = [], hexs = '0123456789abcdef';
    function hx(n) { var s = ''; while (n--) s += hexs[Math.floor(Math.random() * 16)]; return s; }
    function line() { var a = ''; for (var i = 0; i < 8; i++) a += hx(2) + ' '; var asc = ''; for (i = 0; i < 8; i++) asc += String.fromCharCode(33 + Math.floor(Math.random() * 90)); return '0x' + hx(4) + '  ' + a + ' |' + asc + '|'; }
    var iv = setInterval(function () {
      for (var k = 0; k < 3; k++) lines.push(line()); if (lines.length > 60) lines = lines.slice(-60); feed.textContent = lines.join('\n');
      if (done) return; p = Math.min(100, p + rnd(.4, 1.3) * boost); var name = PH[0][1]; PH.forEach(function (q) { if (p >= q[0]) name = q[1]; });
      ph.textContent = '> ' + name + '…'; bar.style.width = p + '%'; pc.textContent = Math.floor(p) + '%  //  TARGET: ' + it.file.toUpperCase();
      if (p >= 100) { done = true; o.classList.add('done'); snd().tone(660, 0, .1, 'triangle', .06); snd().tone(990, 0, .2, 'triangle', .06, .1); snark('hack', null, true);
        setTimeout(function () { clearInterval(iv); location.href = it.href; }, 1100); }
    }, 40);
    function key(e) { if (e.key === 'Escape') { clearInterval(iv); o.remove(); removeEventListener('keydown', key); } else boost = 4; }
    addEventListener('keydown', key); o.addEventListener('click', function () { boost = 4; });
    addEventListener('pageshow', function () { clearInterval(iv); o.remove(); }, { once: true });
  }
  FX.hack = hack;

  /* ═════════ SYNTH (audio-reactive grid) ═════════ */
  var Syn = { on: false, ctx: null, master: null, an: null, data: null, delay: null, noise: null, step: 0, bar: 0, next: 0, timer: 0, raf: 0, env: 0 };
  var SCALE = [55, 65.41, 73.42, 82.41, 98, 110];
  var BASSP = [[0, 0, 2, 0, 0, 3, 0, 2], [0, 0, 0, 2, 0, 0, 4, 3], [0, 2, 0, 3, 0, 4, 3, 2]];
  Syn.start = function () {
    if (this.on) return; var S = this;
    try { this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    var c = this.ctx; if (c.state === 'suspended') c.resume();
    this.master = c.createGain(); this.master.gain.setValueAtTime(0, c.currentTime); this.master.gain.linearRampToValueAtTime(.34, c.currentTime + .8);
    this.an = c.createAnalyser(); this.an.fftSize = 256; this.data = new Uint8Array(this.an.frequencyBinCount);
    var d = c.createDelay(1); d.delayTime.value = .28; var fb = c.createGain(); fb.gain.value = .38; d.connect(fb); fb.connect(d);
    var dg = c.createGain(); dg.gain.value = .5; d.connect(dg); dg.connect(this.master); this.delay = d;
    this.master.connect(this.an); this.an.connect(c.destination);
    var buf = c.createBuffer(1, c.sampleRate, c.sampleRate), ch = buf.getChannelData(0); for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; this.noise = buf;
    this.on = true; this.step = 0; this.bar = 0; this.next = c.currentTime + .1;
    this.timer = setInterval(function () { S.sched(); }, 25);
    (function f() { if (!S.on) { root.style.setProperty('--beat', '0'); return; } S.an.getByteFrequencyData(S.data); var s = 0; for (var i = 0; i < 5; i++) s += S.data[i];
      var v = Math.min(1, (s / 5) / 255 * 1.2); S.env = Math.max(v, S.env * .88); root.style.setProperty('--beat', S.env.toFixed(3)); S.raf = requestAnimationFrame(f); })();
  };
  Syn.stop = function () {
    if (!this.on) return; var c = this.ctx, S = this; this.master.gain.cancelScheduledValues(c.currentTime); this.master.gain.linearRampToValueAtTime(0, c.currentTime + .3);
    clearInterval(this.timer); setTimeout(function () { S.on = false; root.style.setProperty('--beat', '0'); }, 350);
  };
  Syn.sched = function () {
    var c = this.ctx, spb = 60 / 108;
    while (this.next < c.currentTime + .12) { this.play(this.step, this.next); this.next += spb / 4; this.step = (this.step + 1) % 16; if (this.step === 0) this.bar++; }
  };
  Syn.env1 = function (g, t, peak, dec) { g.gain.setValueAtTime(peak, t); g.gain.exponentialRampToValueAtTime(.0001, t + dec); };
  Syn.play = function (st, t) {
    var c = this.ctx, m = this.master, self = this, o, g, f;
    if (st % 4 === 0 || (st === 14 && this.bar % 4 === 3)) { o = c.createOscillator(); g = c.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .12); this.env1(g, t, .9, .24); o.connect(g); g.connect(m); o.start(t); o.stop(t + .26); }
    function nz(freq, type, peak, dec, dly) { var s = c.createBufferSource(); s.buffer = self.noise; f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; g = c.createGain(); self.env1(g, t, peak, dec); s.connect(f); f.connect(g); g.connect(m); if (dly) g.connect(self.delay); s.start(t, Math.random() * .5); s.stop(t + dec + .02); }
    if (st === 4 || st === 12) nz(1600, 'bandpass', .32, .16, true);
    if (st % 2 === 1 || st % 4 === 2) nz(7000, 'highpass', st % 4 === 2 ? .1 : .05, .045, false);
    var pat = BASSP[this.bar % 3]; if (st % 2 === 0) {
      var deg = pat[st / 2]; if (st % 4 === 2 || deg || st === 0) {
        o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = SCALE[deg]; f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; g = c.createGain(); this.env1(g, t, .34, .22);
        o.connect(f); f.connect(g); g.connect(m); o.start(t); o.stop(t + .24);
      }
    }
    if (st % 2 === 0 && Math.random() < .38) {
      o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = SCALE[Math.floor(Math.random() * SCALE.length)] * 8; g = c.createGain(); this.env1(g, t, .09, .3);
      o.connect(g); g.connect(m); g.connect(this.delay); o.start(t); o.stop(t + .32);
    }
  };
  function setSynth(on) { if (on) Syn.start(); else Syn.stop(); $$('.pill[data-fx=synth]').forEach(function (p) { p.classList.toggle('on', !!on); }); if (on) snark('synth'); }
  FX.synth = setSynth; FX.synthOn = function () { return Syn.on; };

  /* ═════════ THUNDER ═════════ */
  var tcv = document.createElement('canvas'); tcv.id = 'thunder'; document.body.appendChild(tcv);
  var flashEl = document.createElement('div'); flashEl.className = 'flash'; document.body.appendChild(flashEl);
  var tcx = tcv.getContext('2d'), drops = [], tOn = false, tRaf = 0, bolt = null, boltT = 0, nextBolt = 0;
  function tsz() { tcv.width = innerWidth; tcv.height = innerHeight; }
  function rumble() {
    var S = FX.sound; if (!S || !S.on) return; S.init(); var c = S.ctx; if (!c) return;
    var buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), ch = buf.getChannelData(0); for (var i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    var s = c.createBufferSource(); s.buffer = buf; var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 140; var g = c.createGain();
    g.gain.setValueAtTime(.0001, c.currentTime); g.gain.exponentialRampToValueAtTime(.35, c.currentTime + .12); g.gain.exponentialRampToValueAtTime(.0001, c.currentTime + 1.9);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  }
  function strike() {
    var w = tcv.width, h = tcv.height, x = rnd(.15, .85) * w, y = 0, pts = [[x, y]], br = [], i;
    var endY = h * rnd(.55, .92); while (y < endY) { x += rnd(-42, 42); y += rnd(18, 46); pts.push([x, y]); }
    for (i = 0; i < 2; i++) { var s = pts[2 + Math.floor(Math.random() * (pts.length - 3))] || pts[1], bx = s[0], by = s[1], seg = [[bx, by]], dir = Math.random() < .5 ? -1 : 1;
      for (var k = 0; k < 5; k++) { bx += dir * rnd(8, 30); by += rnd(10, 32); seg.push([bx, by]); } br.push(seg); }
    bolt = { pts: pts, br: br }; boltT = 14;
    if (flashEl.animate) flashEl.animate([{ opacity: 0 }, { opacity: .7 }, { opacity: .05 }, { opacity: .5 }, { opacity: 0 }], { duration: 440 });
    root.classList.add('lit'); setTimeout(function () { root.classList.remove('lit'); }, 220); setTimeout(rumble, rnd(300, 1100));
  }
  function tframe(t) {
    if (!tOn) return; tRaf = requestAnimationFrame(tframe); var w = tcv.width, h = tcv.height; tcx.clearRect(0, 0, w, h);
    tcx.strokeStyle = 'rgba(165,205,255,.4)'; tcx.lineWidth = 1; tcx.beginPath();
    drops.forEach(function (d) { tcx.moveTo(d.x, d.y); tcx.lineTo(d.x - d.l * .12, d.y + d.l); d.x -= 2; d.y += d.v; if (d.y > h) { d.y = -30; d.x = rnd(0, w + 100); } }); tcx.stroke();
    if (bolt) {
      var a = boltT / 14; tcx.save(); tcx.strokeStyle = 'rgba(235,245,255,' + a.toFixed(2) + ')'; tcx.shadowColor = '#9fd0ff'; tcx.shadowBlur = 18; tcx.lineWidth = 2.4;
      [bolt.pts].concat(bolt.br).forEach(function (seg, si) { tcx.lineWidth = si ? 1.2 : 2.4; tcx.beginPath(); seg.forEach(function (q, i) { i ? tcx.lineTo(q[0], q[1]) : tcx.moveTo(q[0], q[1]); }); tcx.stroke(); });
      tcx.restore(); if (--boltT <= 0) bolt = null;
    }
    if (t > nextBolt) { strike(); nextBolt = t + rnd(3500, 9000); }
  }
  function setThunder(on) {
    if (reduce && on) { FX.toast && FX.toast('// storm blocked: reduced-motion'); return; }
    tOn = !!on; $$('.pill[data-fx=storm]').forEach(function (p) { p.classList.toggle('on', tOn); });
    if (tOn) { tsz(); drops = []; for (var i = 0; i < 220; i++) drops.push({ x: rnd(0, innerWidth + 100), y: rnd(-30, innerHeight), v: rnd(14, 24), l: rnd(12, 26) }); tcv.classList.add('on'); nextBolt = performance.now() + 1200; cancelAnimationFrame(tRaf); tRaf = requestAnimationFrame(tframe); snark('storm'); }
    else { tcv.classList.remove('on'); cancelAnimationFrame(tRaf); setTimeout(function () { if (!tOn) tcx.clearRect(0, 0, tcv.width, tcv.height); }, 650); }
  }
  addEventListener('resize', function () { if (tOn) tsz(); });
  FX.thunder = setThunder; FX.thunderOn = function () { return tOn; };

  /* ═════════ wiring: pills, commands, secrets ═════════ */
  $$('.pill[data-fx=synth]').forEach(function (p) { function f() { setSynth(!Syn.on); } p.addEventListener('click', f); p.addEventListener('keydown', function (e) { if (e.key === 'Enter') f(); }); });
  $$('.pill[data-fx=storm]').forEach(function (p) { function f() { setThunder(!tOn); } p.addEventListener('click', f); p.addEventListener('keydown', function (e) { if (e.key === 'Enter') f(); }); });
  var cmds = FX.cmds || {}, P = function (t, c) { FX.print && FX.print(t, c); };
  cmds.hack = function (a) { P('initiating breach' + (a.length ? ' on ' + a.join(' ') : '') + ' ...'); hack(a.join(' ')); };
  cmds.synth = function (a) { var v = a[0] ? a[0] === 'on' : !Syn.on; setSynth(v); P('synth ' + (v ? 'on (the grid is listening)' : 'off')); };
  cmds.thunder = function (a) { var v = a[0] ? a[0] === 'on' : !tOn; setThunder(v); P('thunder ' + (tOn ? 'on' : 'off')); };
  cmds.storm = cmds.thunder;
  cmds.bug = function () { if (bugEl) P('there is already a bug. look closer.'); else { spawnBug(false); P('bug released.'); } };
  cmds.bugs = function () { P('bugs squashed: ' + bugCount); };
  cmds.error = function () { spawnPop(); P('error dispatched.'); };
  cmds.neon = function () { FX.neon(); P('flickering sign...'); };
  cmds.id = function (a) { var o = FX.id(a[0] === 'new'); P('handle ........ ' + o.handle); P('clearance .... LEVEL-' + o.level); P('affiliation .. ' + o.faction); P('issued ........ ' + o.issued); };
  cmds.snark = function (a) { var v = a[0] ? a[0] === 'on' : muted; setMuted(!v); P('neural link ' + (muted ? 'muted' : 'online')); if (!muted) say('i am back. miss me?', true); };
  FX.helpExtra = (FX.helpExtra || []).concat(['  hack [name]         breach the mainframe (opens a notebook)', '  synth               audio-reactive grid synth', '  thunder             storm + lightning',
    '  bug | bugs          release / count bugs', '  error               summon a popup', '  id [new]            your runner ID', '  snark [on|off]      neural link', '  neon                flicker the sign']);
  var sec = FX.secrets || {};
  sec.hack = function () { hack(); }; sec.thunder = function () { setThunder(!tOn); }; sec.synth = function () { setSynth(!Syn.on); };
  sec.bug = function () { FX.bug(); }; sec.popup = function () { spawnPop(); }; sec.neon = function () { FX.neon(); };
})();
