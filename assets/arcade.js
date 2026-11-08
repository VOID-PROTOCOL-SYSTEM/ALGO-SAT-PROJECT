/* MEMO ARCHIVE — ARCADE (up up down down b a), UPSIDE DOWN (up up down down right left right left b a), MEMO BOY (left right left right a b) */
(function () {
  var FX = window.ArchiveFX = window.ArchiveFX || {}, U = FX.u; if (!U) return;
  var $ = U.$, $$ = U.$$, pick = U.pick, lget = U.lget, lset = U.lset, reduce = U.reduce, root = document.documentElement;
  var R = function (a, b) { return a + Math.random() * (b - a); };
  function beep(f, f2, d, type, v, delay) { var s = FX.sound; if (s && s.on && s.tone) s.tone(f, f2 || 0, d || .06, type || 'square', v || .03, delay || 0); }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function col(n, f) { var v = getComputedStyle(root).getPropertyValue(n).trim(); return v || f; }
  function best(id) { return parseInt(lget('arc-' + id) || '0', 10) || 0; }
  var later = [];                                   /* eye lines to deliver once the arcade closes */
  function eyeSay(t) { if (FX.arcadeActive) later.push(t); else FX.say && FX.say(t, true); }

  /* ═════════ code matcher ═════════ */
  var UP = 'ArrowUp', DN = 'ArrowDown', LT = 'ArrowLeft', RT = 'ArrowRight';
  var SEQ = { arcade: [UP, UP, DN, DN, 'b', 'a'], upside: [UP, UP, DN, DN, RT, LT, RT, LT, 'b', 'a'], gameboy: [LT, RT, LT, RT, 'a', 'b'] };
  var TRIG = { arcade: function () { openArcade(); }, upside: function () { setUpside(!ud); }, gameboy: function () { setGB(!gb); } };
  var kbuf = [], arcOpen = false;
  function typing(e) { var t = e.target; return !!(t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName || '') || t.isContentEditable)); }
  window.addEventListener('keydown', function (e) {
    if (arcOpen) { arcKey(e); return; }
    if (FX.bossActive || FX.advActive || $('.bossfight') || $('.adv') || typing(e) || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; kbuf.push(k); if (kbuf.length > 12) kbuf.shift();
    Object.keys(SEQ).forEach(function (n) { var s = SEQ[n]; if (kbuf.length >= s.length && kbuf.slice(-s.length).join('|') === s.join('|')) { kbuf = []; TRIG[n](); } });
  }, true);
  window.addEventListener('keyup', function (e) { if (!arcOpen) return; keys[norm(e.key)] = false; }, true);
  var logoTaps = []; document.addEventListener('click', function (e) {          /* phone-friendly secret: tap the logo 7 times */
    if (!(e.target.closest && e.target.closest('.logo'))) return; var n = Date.now(); logoTaps.push(n); logoTaps = logoTaps.filter(function (t) { return n - t < 3500; });
    if (logoTaps.length >= 7) { logoTaps = []; openArcade(); } });

  /* ═════════ arcade shell ═════════ */
  var dly = 0, arc, box, view = 'menu', sel = 0, cur = null, raf = 0, last = 0, keys = {}, cv, cx, msgEl, hudEl, typeEl, eyeEl, dead = false, runBest = 0, curG = null;
  function norm(k) { if (k.length === 1) { k = k.toLowerCase(); return { w: UP, s: DN, a: LT, d: RT }[k] || k; } return k; }
  var EYE_MENU = ['insert coin. or do not. i am an eye, not a cashier.', 'high scores are saved in your browser. so are your sins.', 'five games. zero ads. one judgemental cartoon.', 'pick wisely. i am keeping score. literally.', 'you found the arcade. the konami police have been notified. (they are asleep.)'];
  function noopCtx() { return new Proxy({}, { get: function (t, k) { return k === 'measureText' ? function () { return { width: 10 }; } : function () {}; }, set: function () { return true; } }); }
  var GAMES = [
    { id: 'snake', name: 'SNAKE', d: 'eat the data. do not eat yourself.', c: '\u2190\u2191\u2193\u2192 / WASD', mk: mkSnake },
    { id: 'pong', name: 'PONG', d: 'first to 5 beats the cpu. mouse or arrows.', c: '\u2191\u2193 / mouse', mk: mkPong },
    { id: 'breakout', name: 'BREAKOUT', d: 'smash the memo wall. three lives.', c: '\u2190\u2192 / mouse, SPACE launches', mk: mkBreakout },
    { id: 'stare', name: 'STARE CONTEST', d: 'outstare the eye. twelve seconds. do not move.', c: 'do NOTHING', mk: mkStare },
    { id: 'typist', name: 'ALGO TYPIST', d: '30 seconds of algorithm vocabulary.', c: 'type the word, SPACE/ENTER', mk: mkTypist },
    { id: 'flap', name: 'FLAP-EYE', d: 'one eye. many pipes. gravity is rude.', c: 'SPACE / \u2191 / click to flap', mk: mkFlap },
    { id: 'drift', name: 'DRIFT', d: 'asteroids, but the rocks have attitude.', c: '\u2190\u2192 turn, \u2191 thrust, SPACE fire', mk: mkDrift },
    { id: 'bugs', name: 'BUG HUNT', d: 'minesweeper. the mines are bugs. relatable.', c: 'click squash, right-click / F flag', mk: mkBugs },
    { id: 'merge', name: 'MERGE', d: 'slide and combine tiles. reach 2048.', c: 'arrows / swipe', mk: mkMerge },
    { id: 'lock', name: 'PATTERN LOCK', d: 'watch the sequence. repeat it. 12 rounds.', c: 'arrows / click the pads', mk: mkLock },
    { id: 'stack', name: 'STACKTRIS', d: 'falling blocks. you know the drill.', c: '\u2190\u2192 move, \u2191 rotate, \u2193 soft, SPACE drop', mk: mkTetris }
  ];
  var NLAB = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q'];
  function dailyIdx() { return parseInt(new Date().toISOString().slice(0, 10).split('-').join(''), 10) % GAMES.length; }
  function openArcade() {
    if (arcOpen) return; arcOpen = true; FX.arcadeActive = true; keys = {}; view = 'menu'; sel = 0;
    arc = el('div', 'arc'); box = el('div', 'arc-box'); arc.appendChild(box); document.body.appendChild(arc); beep(520, 1040, .12, 'square', .04); beep(1040, 0, .12, 'square', .04, .12);
    menu();
  }
  function closeArcade() {
    stopGame(); arcOpen = false; FX.arcadeActive = false; if (arc) arc.remove(); arc = null; kbuf = [];
    var l = later.slice(); later = []; l.forEach(function (t, i) { setTimeout(function () { FX.say && FX.say(t, true); }, 600 + i * 4200); });
    if (!l.length) setTimeout(function () { FX.say && FX.say(pick(['back so soon? the cabinet misses you.', 'high scores saved. dignity not included.']), true); }, 700);
  }
  FX.arcade = openArcade; FX.arcadeOpen = function () { return arcOpen; };
  function head(sub) {
    box.textContent = ''; var x = el('span', 'arc-x', '\u00D7'); x.addEventListener('click', closeArcade); box.appendChild(x);
    box.appendChild(el('div', 'arc-title', 'ARCADE')); box.appendChild(el('div', 'arc-sub', sub));
  }
  function menu() {
    stopGame(); view = 'menu'; head('\u2014 INSERT COIN \u2014  ' + (parseInt(lget('arc-plays') || '0', 10)) + ' PLAYS'); box.className = 'arc-box wide';
    var list = el('div', 'arc-list two'); box.appendChild(list), dly = dailyIdx();
    GAMES.forEach(function (g, i) {
      var it = el('div', 'arc-item' + (i === sel ? ' sel' : '')), n = el('span', 'arc-n', NLAB[i]), gg = el('span', 'arc-g'), b = el('span', 'arc-b', (i === dly ? '\u2605 2x XP  ' : '') + (best(g.id) ? 'HI ' + best(g.id) : ''));
      gg.appendChild(document.createTextNode(g.name)); gg.appendChild(el('span', 'arc-d', g.d)); it.appendChild(n); it.appendChild(gg); it.appendChild(b);
      it.addEventListener('mouseenter', function () { sel = i; $$('.arc-item', list).forEach(function (x, k) { x.classList.toggle('sel', k === i); }); beep(900, 0, .03, 'square', .015); });
      it.addEventListener('click', function () { sel = i; startGame(GAMES[i]); }); list.appendChild(it);
    });
    eyeEl = el('div', 'arc-eye', pick(EYE_MENU)); box.appendChild(eyeEl);
    var f = el('div', 'arc-foot'); f.appendChild(el('span', '', '\u2190\u2191\u2193\u2192 SELECT  \u00B7  ENTER PLAY  \u00B7  1-9 0 Q QUICK START')); f.appendChild(el('span', '', 'ESC EXIT')); box.appendChild(f);
  }
  function refreshSel() { $$('.arc-item').forEach(function (x, k) { x.classList.toggle('sel', k === sel); if (k === sel && x.scrollIntoView) x.scrollIntoView({ block: 'nearest' }); }); }
  function startGame(g) {
    stopGame(); curG = g; view = 'game'; dead = false; keys = {}; head(g.name); box.className = 'arc-box'; runBest = best(g.id);
    hudEl = el('div', 'arc-hud'); var hl = el('span', '', 'SCORE 0'); hl.id = 'arc-score'; var hr = el('span', '', 'HI ' + runBest); hr.id = 'arc-hi'; hudEl.appendChild(hl); hudEl.appendChild(hr); box.appendChild(hudEl);
    var st = el('div', 'arc-stage'); cv = el('canvas', 'arc-cv'); cv.width = 480; cv.height = 320; st.appendChild(cv); msgEl = el('div', 'arc-msg'); st.appendChild(msgEl); box.appendChild(st);
    typeEl = null; if (g.id === 'typist') { typeEl = el('input', 'arc-type'); typeEl.type = 'text'; typeEl.autocomplete = 'off'; typeEl.spellcheck = false; typeEl.autocapitalize = 'off'; typeEl.placeholder = 'type here...'; box.appendChild(typeEl); }
    var pad = el('div', 'arc-pad'); [['\u2691', 'f'], ['\u25B2', UP], ['\u2423', ' '], ['\u25C0', LT], ['\u25BC', DN], ['\u25B6', RT]].forEach(function (p) {
      var b = el('i', '', p[0]); if (p[1]) { b.addEventListener('pointerdown', function (e) { e.preventDefault(); keys[p[1]] = true; cur && cur.key && cur.key(p[1]); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { keys[p[1]] = false; }); }); } pad.appendChild(b); }); box.appendChild(pad);
    var f = el('div', 'arc-foot'); f.appendChild(el('span', '', g.c)); f.appendChild(el('span', '', 'ENTER RETRY  \u00B7  ESC MENU')); box.appendChild(f);
    eyeEl = el('div', 'arc-eye', ''); box.appendChild(eyeEl);
    var ctx = cv.getContext('2d') || noopCtx();
    var api = { W: 480, H: 320, ctx: ctx, keys: keys, cv: cv, beep: beep, type: typeEl,
      hud: function (t) { var s = $('#arc-score'); if (s) s.textContent = t; }, msg: function (h, p) { msgEl.textContent = ''; if (h) { msgEl.appendChild(el('h3', '', h)); if (p) msgEl.appendChild(el('p', '', p)); } },
      eye: function (t) { eyeEl.textContent = t; }, over: gameOver, C: col, R: R };
    cur = g.mk(api); api.eye(pick(HELLO[g.id] || ['go.']));
    function cpos(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * 480 / r.width, y: (e.clientY - r.top) * 320 / r.height }; }
    cv.addEventListener('pointermove', function (e) { if (cur && cur.pointer) { var p = cpos(e); cur.pointer(p.x, p.y); } });
    cv.addEventListener('pointerdown', function (e) { if (dead) { startGame(g); return; } var p = cpos(e); if (cur && cur.pointer) cur.pointer(p.x, p.y); if (cur && cur.click) cur.click(e.button, e); });
    cv.addEventListener('pointerup', function (e) { if (cur && cur.release && !dead) { var p = cpos(e); cur.release(p.x, p.y); } });
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    if (typeEl) { typeEl.addEventListener('input', function () { cur && cur.onInput && cur.onInput(typeEl.value); }); setTimeout(function () { typeEl.focus(); }, 30); }
    last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function loop(t) { raf = requestAnimationFrame(loop); var dt = Math.min(.05, (t - last) / 1000); last = t; if (cur && !dead) { cur.update(dt); cur.draw(); } else if (cur && dead) cur.draw && cur.draw(); }
  function stopGame() { cancelAnimationFrame(raf); raf = 0; if (cur && cur.destroy) cur.destroy(); cur = null; curG = null; }
  var HELLO = { snake: ['eat. grow. try not to become a metaphor.'], pong: ['i am the cpu. i do not get tired. you do.'], breakout: ['the wall is just a memo with commitment issues.'], stare: ['i have no eyelids. well. one. do not move.'], typist: ['algorithm words. your fingers. go.'], flap: ['i have wings. technically. they are svg.'], drift: ['the rocks are not friendly. the rocks are rocks.'], bugs: ['first click is always safe. i am generous like that.'], merge: ['merge sort jokes are not allowed here. (merge conflicts are.)'], lock: ['watch closely. blinking is cheating.'], stack: ['you know the drill. i know you will not clear four lines.'] };
  var BAD = ['that was painful to watch. i watched all of it.', 'a bold attempt. a bad one. bold.', 'the cabinet saw that. the cabinet is disappointed.'];
  var GOOD = ['okay okay. that was actually good.', 'new high score. i am legally obligated to be impressed.', 'not bad, runner. not bad at all.'];
  function gameOver(score, win, line) {
    if (dead) return; dead = true; var g = curG, nb = score > best(g.id), p = '', mult = GAMES[dailyIdx()] === g ? 2 : 1, had = GAMES.every(function (x) { return best(x.id) > 0; });
    lset('arc-plays', String((parseInt(lget('arc-plays') || '0', 10) || 0) + 1));
    if (nb && score > 0) { lset('arc-' + g.id, String(score)); p += FX.gainXP ? FX.gainXP(5 * mult) : ''; $('#arc-hi') && ($('#arc-hi').textContent = 'HI ' + score); }
    if (win) p += FX.gainXP ? FX.gainXP(10 * mult) : '';
    if (!had && GAMES.every(function (x) { return best(x.id) > 0; })) { p += FX.gainXP ? FX.gainXP(40) : ''; later.push('ARCADE CHAMPION. you have a score on every machine. +40 xp. go outside. (after one more round.)'); }
    var m = (box && msgEl) ? msgEl : null; if (m) { m.textContent = ''; m.appendChild(el('h3', '', win ? 'YOU WIN' : 'GAME OVER')); m.appendChild(el('p', '', 'SCORE ' + score + (nb && score > 0 ? '  \u2605 NEW BEST' : '') + '   \u00B7   ENTER TO RETRY')); }
    eyeEl && (eyeEl.textContent = line || pick(nb || win ? GOOD : BAD)); if (p) later.push(p.replace(/^ \|\| /, '').replace(' || ', ' '));
    if (win) { beep(523, 0, .1, 'square', .04); beep(659, 0, .1, 'square', .04, .1); beep(784, 0, .2, 'square', .04, .2); } else beep(220, 70, .4, 'sawtooth', .04);
    if (curG && curG.id === 'typist' && typeEl) typeEl.blur();
  }
  function arcKey(e) {
    var k = e.key, c = norm(k), inType = typeEl && e.target === typeEl;
    e.stopImmediatePropagation();
    if (k === 'Escape') { e.preventDefault(); view === 'game' ? menu() : closeArcade(); return; }
    if (inType) { if (k === 'Enter' && cur && cur.submit) { e.preventDefault(); if (dead) startGame(curG); else cur.submit(); } return; }
    if ([UP, DN, LT, RT, ' '].indexOf(k) !== -1) e.preventDefault();
    if (view === 'menu') {
      var n = GAMES.length, ls = $('.arc-list'), nc = ls ? (getComputedStyle(ls).gridTemplateColumns || '').split(' ').filter(Boolean).length || 1 : 1, mv = null;
      if (c === UP) mv = (sel - nc + n) % n; else if (c === DN) mv = (sel + nc) % n; else if (c === LT) mv = (sel + n - 1) % n; else if (c === RT) mv = (sel + 1) % n;
      if (mv !== null) { sel = mv; refreshSel(); beep(900, 0, .03, 'square', .015); }
      else if (k === 'Enter' || k === ' ') startGame(GAMES[sel]);
      else { var qi = NLAB.indexOf(k === 'q' || k === 'Q' ? 'Q' : k); if (qi !== -1 && GAMES[qi]) { sel = qi; startGame(GAMES[sel]); } }
      return;
    }
    if (dead) { if (k === 'Enter' || k === ' ') startGame(curG); return; }
    keys[c] = true; if (cur && cur.key) cur.key(c);
  }

  /* ═════════ SNAKE ═════════ */
  function mkSnake(a) {
    var cols = 24, rows = 16, S = 20, snake = [{ x: 12, y: 8 }, { x: 11, y: 8 }, { x: 10, y: 8 }], dir = { x: 1, y: 0 }, nd = dir, acc = 0, step = .12, score = 0, food = spawn(), ctx = a.ctx;
    function spawn() { var f; do { f = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }; } while (snake.some(function (s) { return s.x === f.x && s.y === f.y; })); return f; }
    return {
      update: function (dt) {
        acc += dt; while (acc >= step && !dead) { acc -= step; dir = nd; var h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
          var wall = h.x < 0 || h.y < 0 || h.x >= cols || h.y >= rows; if (wall || snake.some(function (s) { return s.x === h.x && s.y === h.y; })) { a.over(score, false, score >= 100 ? 'a hundred points of pure appetite. respect.' : wall ? 'you met the wall. the wall won. the wall always wins.' : 'you ate yourself. it happens to the best of us.'); return; }
          snake.unshift(h); if (h.x === food.x && h.y === food.y) { score += 10; a.hud('SCORE ' + score); food = spawn(); step = Math.max(.05, step - .004); a.beep(880, 1320, .06, 'square', .03); } else snake.pop(); }
      },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320); ctx.strokeStyle = 'rgba(128,128,128,.12)'; for (var i = 0; i <= cols; i++) { ctx.beginPath(); ctx.moveTo(i * S, 0); ctx.lineTo(i * S, 320); ctx.stroke(); } for (var j = 0; j <= rows; j++) { ctx.beginPath(); ctx.moveTo(0, j * S); ctx.lineTo(480, j * S); ctx.stroke(); }
        ctx.fillStyle = a.C('--cp-neon-magenta', '#ff2d78'); ctx.fillRect(food.x * S + 4, food.y * S + 4, S - 8, S - 8);
        snake.forEach(function (s, i) { ctx.fillStyle = i ? a.C('--cp-neon-cyan', '#00f5ff') : a.C('--cp-neon-green', '#00ff9f'); ctx.fillRect(s.x * S + 1, s.y * S + 1, S - 2, S - 2); });
      },
      key: function (k) { var d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[k]; if (d && !(d[0] === -dir.x && d[1] === -dir.y)) nd = { x: d[0], y: d[1] }; }
    };
  }

  /* ═════════ PONG ═════════ */
  function mkPong(a) {
    var W = 480, H = 320, ph = 56, py = H / 2 - ph / 2, ay = py, ps = 0, as = 0, ball, ctx = a.ctx, k = a.keys, wait = .8;
    function serve(d) { ball = { x: W / 2, y: H / 2, vx: 230 * d, vy: R(-110, 110), r: 5 }; wait = .7; }
    serve(1); a.hud('YOU 0  :  0 CPU');
    function paddleHit(px, py2, left) {
      if (ball.y < py2 - 4 || ball.y > py2 + ph + 4) return false; var rel = (ball.y - (py2 + ph / 2)) / (ph / 2), sp = Math.min(520, Math.hypot(ball.vx, ball.vy) * 1.07), an = rel * .9;
      ball.vx = (left ? 1 : -1) * sp * Math.cos(an); ball.vy = sp * Math.sin(an); ball.x = left ? px + 8 + ball.r : px - ball.r; a.beep(left ? 440 : 330, 0, .05, 'square', .03); return true;
    }
    return {
      pointer: function (x, y) { py = Math.max(0, Math.min(H - ph, y - ph / 2)); },
      update: function (dt) {
        if (k[UP]) py -= 280 * dt; if (k[DN]) py += 280 * dt; py = Math.max(0, Math.min(H - ph, py));
        var tgt = ball.y - ph / 2 + Math.sin(performance.now() / 400) * 14, sp = 120 + as * 8 + ps * 14; ay += Math.max(-sp * dt, Math.min(sp * dt, tgt - ay)); ay = Math.max(0, Math.min(H - ph, ay));
        if (wait > 0) { wait -= dt; return; }
        ball.x += ball.vx * dt; ball.y += ball.vy * dt; if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -1; } if (ball.y > H - ball.r) { ball.y = H - ball.r; ball.vy *= -1; }
        if (ball.vx < 0 && ball.x - ball.r <= 24 && ball.x > 8) paddleHit(16, py, true); else if (ball.vx > 0 && ball.x + ball.r >= W - 24 && ball.x < W - 8) paddleHit(W - 24, ay, false);
        if (ball.x < -10) { as++; a.beep(160, 80, .25, 'sawtooth', .04); a.hud('YOU ' + ps + '  :  ' + as + ' CPU'); if (as >= 5) { a.over(ps * 10, false, 'the cpu wins. it does not even know it won. that is the saddest part.'); return; } serve(1); }
        if (ball.x > W + 10) { ps++; a.beep(660, 990, .15, 'square', .04); a.hud('YOU ' + ps + '  :  ' + as + ' CPU'); if (ps >= 5) { a.over(ps * 10 + 30 - as * 3, true, 'you beat a thing that cannot lose. that is either talent or a bug.'); return; } serve(-1); }
      },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(128,128,128,.3)'; for (var y = 0; y < H; y += 20) ctx.fillRect(W / 2 - 1, y, 2, 10);
        ctx.fillStyle = a.C('--cp-neon-cyan', '#00f5ff'); ctx.fillRect(16, py, 8, ph); ctx.fillStyle = a.C('--cp-neon-magenta', '#ff2d78'); ctx.fillRect(W - 24, ay, 8, ph);
        ctx.fillStyle = a.C('--cp-text-primary', '#e2eaf5'); ctx.fillRect(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2);
      }
    };
  }

  /* ═════════ BREAKOUT ═════════ */
  function mkBreakout(a) {
    var W = 480, H = 320, ctx = a.ctx, k = a.keys, pw = 74, px = W / 2 - pw / 2, bricks = [], lives = 3, score = 0, ball, launched = false;
    for (var r = 0; r < 5; r++) for (var c = 0; c < 10; c++) bricks.push({ x: 10 + c * 46, y: 36 + r * 17, w: 44, h: 14, r: r, on: true });
    function reset() { launched = false; ball = { x: px + pw / 2, y: H - 30, vx: 0, vy: 0, r: 5 }; }
    function launch() { if (launched) return; launched = true; ball.vx = R(-120, 120); ball.vy = -250; }
    reset(); a.hud('SCORE 0   LIVES 3');
    var rowC = ['--cp-neon-magenta', '--cp-neon-purple', '--cp-neon-cyan', '--cp-neon-green', '--cp-neon-yellow'];
    return {
      click: launch, pointer: function (x) { px = Math.max(0, Math.min(W - pw, x - pw / 2)); },
      key: function (c) { if (c === ' ') launch(); },
      update: function (dt) {
        if (k[LT]) px -= 340 * dt; if (k[RT]) px += 340 * dt; px = Math.max(0, Math.min(W - pw, px)); if (!launched) { ball.x = px + pw / 2; ball.y = H - 30; return; }
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -1; } if (ball.x > W - ball.r) { ball.x = W - ball.r; ball.vx *= -1; } if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -1; }
        if (ball.vy > 0 && ball.y + ball.r >= H - 22 && ball.y + ball.r <= H - 8 && ball.x >= px - 3 && ball.x <= px + pw + 3) { var rel = (ball.x - (px + pw / 2)) / (pw / 2), sp = Math.min(480, Math.hypot(ball.vx, ball.vy) * 1.02); ball.vx = sp * Math.sin(rel * 1.0); ball.vy = -Math.abs(sp * Math.cos(rel * 1.0)); a.beep(440, 0, .04, 'square', .03); }
        for (var i = 0; i < bricks.length; i++) { var b = bricks[i]; if (!b.on) continue; if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
          b.on = false; score += 10 + (4 - b.r) * 2; ball.vy *= -1; a.beep(600 + (4 - b.r) * 80, 0, .05, 'square', .03); a.hud('SCORE ' + score + '   LIVES ' + lives);
          if (!bricks.some(function (x) { return x.on; })) { a.over(score + lives * 20, true, 'the wall is dust. you are a demolition artist.'); return; } break; } }
        if (ball.y > H + 10) { lives--; a.hud('SCORE ' + score + '   LIVES ' + lives); a.beep(180, 60, .3, 'sawtooth', .04); if (lives <= 0) { a.over(score, false, 'the wall stands. the wall is smug.'); return; } reset(); }
      },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, W, H);
        bricks.forEach(function (b) { if (!b.on) return; ctx.fillStyle = a.C(rowC[b.r], '#00f5ff'); ctx.fillRect(b.x, b.y, b.w, b.h); });
        ctx.fillStyle = a.C('--cp-text-primary', '#e2eaf5'); ctx.fillRect(px, H - 20, pw, 8); ctx.fillRect(ball.x - ball.r, ball.y - ball.r, ball.r * 2, ball.r * 2);
        if (!launched) { ctx.fillStyle = a.C('--cp-text-muted', '#8a9ab8'); ctx.font = '12px monospace'; ctx.textAlign = 'center'; ctx.fillText('SPACE / CLICK TO LAUNCH', W / 2, H - 50); }
      }
    };
  }

  /* ═════════ STARE CONTEST ═════════ */
  function mkStare(a) {
    var ctx = a.ctx, phase = 'ready', t = 3, el0 = 0, TARGET = 12, taunt = '', lastMx = null, lastMy = null, closing = 0, onMove, done = false, TA = { 2: 'comfortable?', 4: 'i have no eyelids. well. one.', 6: 'your eyes are watering. i can tell.', 8: 'blink. go on. i dare you.', 10: 'ok ok ok. you are good. you are scary good.', 11.4: 'i... am... not... blinking...' }, fired = {};
    function lose(why) { if (done || phase !== 'stare') return; done = true; var s = Math.floor(el0 * 10) / 10; a.msg(); a.over(Math.floor(el0 * 10), false, why + ' you lasted ' + s + 's.'); }
    onMove = function (e) { if (phase !== 'stare') return; if (lastMx == null) { lastMx = e.clientX; lastMy = e.clientY; return; } if (Math.hypot(e.clientX - lastMx, e.clientY - lastMy) > 4) lose('you moved. i saw it. i see everything.'); };
    document.addEventListener('mousemove', onMove); a.msg('GET READY', 'do not touch anything once it starts'); a.hud('GET READY');
    return {
      destroy: function () { document.removeEventListener('mousemove', onMove); },
      key: function (c) { if (phase === 'stare') lose('you pressed a key. cheating or twitching, same thing.'); },
      click: function () { if (phase === 'stare') lose('you clicked. the eye felt that.'); },
      pointer: function () { },
      update: function (dt) {
        if (phase === 'ready') { t -= dt; a.hud('STARTING IN ' + Math.ceil(t)); if (t <= 0) { phase = 'stare'; el0 = 0; lastMx = null; a.msg(); a.eye('...'); } return; }
        if (phase === 'stare') { el0 += dt; a.hud('TIME ' + el0.toFixed(1) + ' / ' + TARGET); Object.keys(TA).forEach(function (k) { if (el0 >= +k && !fired[k]) { fired[k] = 1; taunt = TA[k]; a.eye(taunt); } });
          if (el0 >= TARGET && !done) { phase = 'win'; done = true; closing = 0; a.over(TARGET * 10 + 20, true, 'the eye blinked first. i am not mad. i am a little mad.'); } }
        if (phase === 'win') closing = Math.min(1, closing + dt * 2.5);
      },
      draw: function () {
        var W = 480, H = 320, lid = (phase === 'win' || (done && phase === 'stare')) ? (phase === 'win' ? closing : 0) : 0;
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, W, H);
        var cxm = W / 2, cym = H / 2, ew = 190, eh = 80 * (1 - lid * .92), dil = phase === 'stare' ? Math.min(1, el0 / TARGET) : 0, ir = 46 + Math.sin(el0 * 3) * 2, pr = 12 + dil * 20;
        ctx.save(); ctx.beginPath(); ctx.moveTo(cxm - ew, cym); ctx.quadraticCurveTo(cxm, cym - eh * 2, cxm + ew, cym); ctx.quadraticCurveTo(cxm, cym + eh * 2, cxm - ew, cym); ctx.closePath(); ctx.clip();
        ctx.fillStyle = a.C('--cp-text-primary', '#e2eaf5'); ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = a.C('--cp-neon-magenta', '#ff2d78'); ctx.beginPath(); ctx.arc(cxm, cym, ir, 0, 7); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cxm, cym, pr, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(cxm + 14, cym - 14, 6, 0, 7); ctx.fill(); ctx.restore();
        ctx.strokeStyle = a.C('--cp-neon-magenta', '#ff2d78'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cxm - ew, cym); ctx.quadraticCurveTo(cxm, cym - eh * 2, cxm + ew, cym); ctx.quadraticCurveTo(cxm, cym + eh * 2, cxm - ew, cym); ctx.stroke();
        if (phase === 'stare') { ctx.fillStyle = a.C('--cp-neon-green', '#00ff9f'); ctx.fillRect(20, H - 22, (W - 40) * Math.min(1, el0 / TARGET), 8); }
      }
    };
  }

  /* ═════════ ALGO TYPIST ═════════ */
  var WORDS = 'array queue stack graph tree node edge heap hash sort merge quick bubble binary search dijkstra recursion memoise greedy complexity pointer vertex traverse linear logarithm polynomial backtrack iterate invariant heuristic adjacency permutation divide conquer dynamic knapsack topological amortised asymptotic bellman kruskal prim bfs dfs cycle path weight tuple matrix bitwise modulo parent child leaf root depth'.split(' ');
  function mkTypist(a) {
    var ctx = a.ctx, T = 30, left = T, started = false, words = [], idx = 0, val = '', ok = 0, chars = 0, flash = 0, score = 0;
    function more() { var w = WORDS.slice().sort(function () { return Math.random() - .5; }); words = words.concat(w); } more();
    a.hud('TIME 30   WORDS 0'); a.msg('TYPE THE WORD', 'timer starts on your first letter');
    function check() { if (val.trim() === words[idx]) { ok++; chars += words[idx].length + 1; score = ok * 10; idx++; val = ''; typeEl.value = ''; a.beep(700, 1000, .05, 'square', .03); if (idx > words.length - 5) more(); } else { flash = .25; a.beep(200, 120, .08, 'sawtooth', .03); val = ''; typeEl.value = ''; } }
    return {
      onInput: function (v) { if (!started && v.length) { started = true; a.msg(); } val = v.replace(/\s/g, ''); if (/\s$/.test(v)) check(); else if (val === words[idx]) check(); },
      submit: function () { if (started) check(); },
      update: function (dt) { if (!started) return; left -= dt; flash = Math.max(0, flash - dt); a.hud('TIME ' + Math.ceil(Math.max(0, left)) + '   WORDS ' + ok);
        if (left <= 0) { var wpm = Math.round((chars / 5) / (T / 60)); a.over(score, ok >= 20, wpm + ' wpm. ' + (wpm > 60 ? 'fast hands. suspicious hands.' : wpm > 35 ? 'respectable. my regexes type faster.' : 'it is not a race. it is a race. you lost it.')); } },
      draw: function () {
        var W = 480, H = 320; ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, W, H); ctx.fillStyle = a.C('--cp-neon-cyan', '#00f5ff'); ctx.fillRect(0, 0, W * Math.max(0, left) / T, 6);
        var w = words[idx] || ''; ctx.font = '48px monospace'; ctx.textAlign = 'left'; var tw = ctx.measureText(w).width, x0 = (W - tw) / 2, cw = tw / Math.max(1, w.length);
        for (var i = 0; i < w.length; i++) { var typed = val[i]; ctx.fillStyle = typed == null ? a.C('--cp-text-primary', '#e2eaf5') : typed === w[i] ? a.C('--cp-neon-green', '#00ff9f') : a.C('--cp-neon-magenta', '#ff2d78'); ctx.fillText(w[i], x0 + i * cw, 160); }
        if (flash > 0) { ctx.fillStyle = 'rgba(255,45,120,.15)'; ctx.fillRect(0, 0, W, H); }
        ctx.font = '16px monospace'; ctx.fillStyle = a.C('--cp-text-muted', '#8a9ab8'); ctx.textAlign = 'center'; ctx.fillText(words.slice(idx + 1, idx + 5).join('   '), W / 2, 230);
      }
    };
  }

  /* ═════════ FLAP-EYE ═════════ */
  function mkFlap(a) {
    var W = 480, H = 320, ctx = a.ctx, y = H / 2, vy = 0, pipes = [], tNext = .6, score = 0, started = false, GAP = 104;
    function flap() { started = true; vy = -285; a.beep(520, 780, .07, 'square', .03); }
    a.msg('FLAP-EYE', 'SPACE / CLICK / \u2191 to flap');
    return {
      key: function (c) { if (c === ' ' || c === UP) { flap(); a.msg(); } }, click: function () { flap(); a.msg(); },
      update: function (dt) {
        if (!started) return; vy += 880 * dt; y += vy * dt; tNext -= dt;
        if (tNext <= 0) { tNext = 1.55; pipes.push({ x: W + 20, c: R(70, H - 70), pass: false }); }
        for (var i = pipes.length - 1; i >= 0; i--) { var p = pipes[i]; p.x -= 150 * dt; if (p.x < -50) { pipes.splice(i, 1); continue; }
          if (!p.pass && p.x + 20 < 110) { p.pass = true; score++; a.hud('SCORE ' + score); a.beep(880, 0, .05, 'triangle', .03); }
          if (110 + 14 > p.x - 20 && 110 - 14 < p.x + 20 && (y - 11 < p.c - GAP / 2 || y + 11 > p.c + GAP / 2)) { a.over(score * 10, false, score >= 10 ? 'ten pipes. the eye has wings now. metaphorically.' : 'you flew into a pipe. pipes are famously stationary.'); return; } }
        if (y > H - 11 || y < 11) { a.over(score * 10, false, 'the floor. the ceiling. both undefeated.'); }
      },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, W, H); ctx.fillStyle = a.C('--cp-neon-green', '#00ff9f');
        pipes.forEach(function (p) { ctx.fillRect(p.x - 20, 0, 40, p.c - GAP / 2); ctx.fillRect(p.x - 20, p.c + GAP / 2, 40, H); });
        ctx.fillStyle = a.C('--cp-text-primary', '#e2eaf5'); ctx.beginPath(); ctx.ellipse(110, y, 15, 11, vy / 900, 0, 7); ctx.fill();
        ctx.fillStyle = a.C('--cp-neon-magenta', '#ff2d78'); ctx.beginPath(); ctx.arc(113, y, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(114, y, 2, 0, 7); ctx.fill();
      }
    };
  }

  /* ═════════ DRIFT (asteroids) ═════════ */
  function mkDrift(a) {
    var W = 480, H = 320, ctx = a.ctx, k = a.keys, ship = { x: 240, y: 160, vx: 0, vy: 0, an: -Math.PI / 2, inv: 2 }, bullets = [], rocks = [], lives = 3, score = 0, wave = 0, cool = 0;
    function rock(x, y, s) { var an = Math.random() * 6.28, sp = R(22, 55) * (4 - s) * .7 + 15, pts = []; for (var i = 0; i < 9; i++) pts.push(R(.72, 1.15)); return { x: x, y: y, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, s: s, r: s * 9 + 4, a: 0, va: R(-1.2, 1.2), pts: pts }; }
    function spawnWave() { wave++; for (var i = 0; i < 2 + wave; i++) { var edge = Math.random() < .5; rocks.push(rock(edge ? 0 : R(0, W), edge ? R(0, H) : 0, 3)); } }
    function fire() { if (cool > 0) return; cool = .22; bullets.push({ x: ship.x + Math.cos(ship.an) * 12, y: ship.y + Math.sin(ship.an) * 12, vx: ship.vx + Math.cos(ship.an) * 390, vy: ship.vy + Math.sin(ship.an) * 390, life: .95 }); a.beep(900, 300, .08, 'square', .025); }
    function wrap(o) { if (o.x < 0) o.x += W; if (o.x > W) o.x -= W; if (o.y < 0) o.y += H; if (o.y > H) o.y -= H; }
    spawnWave(); a.hud('SCORE 0   LIVES 3');
    return {
      key: function (c) { if (c === ' ') fire(); },
      click: function () { fire(); },
      update: function (dt) {
        cool -= dt; ship.inv -= dt; if (k[LT]) ship.an -= 4.2 * dt; if (k[RT]) ship.an += 4.2 * dt;
        if (k[UP]) { ship.vx += Math.cos(ship.an) * 230 * dt; ship.vy += Math.sin(ship.an) * 230 * dt; }
        var f = Math.pow(.55, dt); ship.vx *= f; ship.vy *= f; ship.x += ship.vx * dt; ship.y += ship.vy * dt; wrap(ship);
        for (var i = bullets.length - 1; i >= 0; i--) { var b = bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt; wrap(b); b.life -= dt; if (b.life <= 0) bullets.splice(i, 1); }
        rocks.forEach(function (r) { r.x += r.vx * dt; r.y += r.vy * dt; r.a += r.va * dt; wrap(r); });
        for (var bi = bullets.length - 1; bi >= 0; bi--) for (var ri = rocks.length - 1; ri >= 0; ri--) { var bb = bullets[bi], rr = rocks[ri]; if (!bb || !rr) continue;
          if (Math.hypot(bb.x - rr.x, bb.y - rr.y) < rr.r) { bullets.splice(bi, 1); rocks.splice(ri, 1); score += [0, 100, 50, 20][rr.s]; a.hud('SCORE ' + score + '   LIVES ' + lives); a.beep(150, 60, .15, 'sawtooth', .04);
            if (rr.s > 1) { rocks.push(rock(rr.x, rr.y, rr.s - 1)); rocks.push(rock(rr.x, rr.y, rr.s - 1)); } break; } }
        if (ship.inv <= 0) rocks.forEach(function (r) { if (lives > 0 && Math.hypot(ship.x - r.x, ship.y - r.y) < r.r + 6) { lives--; a.hud('SCORE ' + score + '   LIVES ' + lives); a.beep(200, 50, .5, 'sawtooth', .05); ship.x = 240; ship.y = 160; ship.vx = ship.vy = 0; ship.inv = 2.5; if (lives <= 0) a.over(score, false, 'the rocks inherit the screen. rocks have always been patient.'); } });
        if (!rocks.length) { spawnWave(); a.eye('wave ' + wave + '. they brought friends.'); }
      },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, W, H); ctx.lineWidth = 1.5;
        ctx.strokeStyle = a.C('--cp-text-primary', '#e2eaf5'); rocks.forEach(function (r) { ctx.beginPath(); for (var i = 0; i < 9; i++) { var an = r.a + i / 9 * 6.283, rad = r.r * r.pts[i]; i ? ctx.lineTo(r.x + Math.cos(an) * rad, r.y + Math.sin(an) * rad) : ctx.moveTo(r.x + Math.cos(an) * rad, r.y + Math.sin(an) * rad); } ctx.closePath(); ctx.stroke(); });
        ctx.fillStyle = a.C('--cp-neon-yellow', '#f7ff00'); bullets.forEach(function (b) { ctx.fillRect(b.x - 1.5, b.y - 1.5, 3, 3); });
        if (ship.inv <= 0 || Math.floor(ship.inv * 8) % 2) { ctx.strokeStyle = a.C('--cp-neon-cyan', '#00f5ff'); ctx.beginPath(); ctx.moveTo(ship.x + Math.cos(ship.an) * 12, ship.y + Math.sin(ship.an) * 12); ctx.lineTo(ship.x + Math.cos(ship.an + 2.5) * 10, ship.y + Math.sin(ship.an + 2.5) * 10); ctx.lineTo(ship.x + Math.cos(ship.an - 2.5) * 10, ship.y + Math.sin(ship.an - 2.5) * 10); ctx.closePath(); ctx.stroke(); }
      }
    };
  }

  /* ═════════ BUG HUNT (minesweeper) ═════════ */
  function mkBugs(a) {
    var C = 15, Rw = 10, S = 32, N = 22, ctx = a.ctx, cells = [], started = false, t = 0, flagMode = false, hx = -1, hy = -1, revealed = 0, flags = 0, fin = false;
    for (var i = 0; i < C * Rw; i++) cells.push({ b: false, r: false, f: false, n: 0 });
    function at(x, y) { return x >= 0 && y >= 0 && x < C && y < Rw ? cells[y * C + x] : null; }
    function place(sx, sy) { var n = 0; while (n < N) { var x = Math.floor(Math.random() * C), y = Math.floor(Math.random() * Rw); if (Math.abs(x - sx) < 2 && Math.abs(y - sy) < 2) continue; var c = at(x, y); if (c.b) continue; c.b = true; n++; }
      for (y = 0; y < Rw; y++) for (x = 0; x < C; x++) { var m = 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) { var q = at(x + dx, y + dy); if (q && q.b) m++; } at(x, y).n = m; } }
    function flood(x, y) { var st = [[x, y]]; while (st.length) { var p = st.pop(), c = at(p[0], p[1]); if (!c || c.r || c.f || c.b) continue; c.r = true; revealed++; if (c.n === 0) for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) st.push([p[0] + dx, p[1] + dy]); } }
    function hud() { a.hud('BUGS ' + (N - flags) + '   TIME ' + Math.floor(t) + '   ' + (flagMode ? '[FLAG]' : '[SQUASH]')); }
    function end(win) { fin = true; cells.forEach(function (c) { if (c.b) c.r = true; }); var sc = win ? 300 + Math.max(0, 300 - Math.floor(t) * 2) : revealed * 2; a.over(sc, win, win ? 'all bugs found in ' + Math.floor(t) + 's. a flawless pest controller.' : 'that was a bug. it was always a bug. it is a bug hunt.'); }
    function act(flag) { var x = Math.floor(hx / S), y = Math.floor(hy / S), c = at(x, y); if (!c || fin) return;
      if (flag) { if (!c.r) { c.f = !c.f; flags += c.f ? 1 : -1; a.beep(300, 0, .04, 'square', .03); } hud(); return; }
      if (c.f || c.r) return; if (!started) { started = true; place(x, y); a.msg(); }
      if (c.b) { c.r = true; a.beep(120, 50, .4, 'sawtooth', .05); end(false); return; }
      flood(x, y); a.beep(600, 0, .03, 'square', .02); if (revealed >= C * Rw - N) end(true); hud(); }
    hud(); a.msg('BUG HUNT', 'click to squash \u00B7 right-click or F to flag'); var numC = ['', '--cp-neon-cyan', '--cp-neon-green', '--cp-neon-yellow', '--cp-neon-magenta', '--cp-neon-purple', '--cp-neon-cyan', '--cp-neon-green', '--cp-text-primary'];
    return {
      pointer: function (x, y) { hx = x; hy = y; }, click: function (btn, e) { act(btn === 2 || flagMode || (e && e.shiftKey)); },
      key: function (c) { if (c === 'f') { flagMode = !flagMode; hud(); } else if (c === ' ') act(flagMode); },
      update: function (dt) { if (started && !fin) { var o = Math.floor(t); t += dt; if (Math.floor(t) !== o) hud(); } },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320); ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (var y = 0; y < Rw; y++) for (var x = 0; x < C; x++) { var c = at(x, y), px = x * S, py = y * S, hov = Math.floor(hx / S) === x && Math.floor(hy / S) === y;
          ctx.fillStyle = c.r ? 'rgba(128,128,128,.10)' : hov ? 'rgba(128,128,128,.35)' : 'rgba(128,128,128,.22)'; ctx.fillRect(px + 1, py + 1, S - 2, S - 2);
          if (c.r && c.b) { ctx.fillStyle = a.C('--cp-neon-magenta', '#ff2d78'); ctx.beginPath(); ctx.arc(px + 16, py + 16, 7, 0, 7); ctx.fill(); ctx.strokeStyle = ctx.fillStyle; for (var l = 0; l < 4; l++) { ctx.beginPath(); ctx.moveTo(px + 16 - 10, py + 16 - 8 + l * 5); ctx.lineTo(px + 16 + 10, py + 16 - 8 + l * 5); ctx.stroke(); } }
          else if (c.r && c.n) { ctx.fillStyle = a.C(numC[c.n], '#00f5ff'); ctx.fillText(String(c.n), px + 16, py + 17); }
          else if (c.f) { ctx.fillStyle = a.C('--cp-neon-yellow', '#f7ff00'); ctx.fillText('F', px + 16, py + 17); } }
      }
    };
  }

  /* ═════════ MERGE (2048) ═════════ */
  function mkMerge(a) {
    var ctx = a.ctx, g = [], score = 0, sx = 0, sy = 0, lx = 0, ly = 0, T = 64, G = 8, ox = 92, oy = 12, wonFlag = false, i;
    for (i = 0; i < 16; i++) g.push(0);
    function add() { var e = []; g.forEach(function (v, k) { if (!v) e.push(k); }); if (e.length) g[pick(e)] = Math.random() < .9 ? 2 : 4; } add(); add(); a.hud('SCORE 0');
    function lines(d) { var L = []; for (var n = 0; n < 4; n++) { var l = []; for (var m = 0; m < 4; m++) l.push(d === 'L' ? n * 4 + m : d === 'R' ? n * 4 + 3 - m : d === 'U' ? m * 4 + n : (3 - m) * 4 + n); L.push(l); } return L; }
    function move(d) { var moved = false; lines(d).forEach(function (l) { var v = l.map(function (ix) { return g[ix]; }).filter(Boolean), o = []; for (var k = 0; k < v.length; k++) { if (v[k] === v[k + 1]) { o.push(v[k] * 2); score += v[k] * 2; if (v[k] * 2 === 2048) wonFlag = true; k++; } else o.push(v[k]); } while (o.length < 4) o.push(0); l.forEach(function (ix, k) { if (g[ix] !== o[k]) moved = true; g[ix] = o[k]; }); });
      if (!moved) return; add(); a.hud('SCORE ' + score); a.beep(500, 0, .04, 'square', .03);
      if (wonFlag) { a.over(score, true, '2048. the memo has been merged. no conflicts.'); return; }
      var can = g.indexOf(0) !== -1; for (var y = 0; y < 4 && !can; y++) for (var x = 0; x < 4; x++) { var v = g[y * 4 + x]; if ((x < 3 && g[y * 4 + x + 1] === v) || (y < 3 && g[(y + 1) * 4 + x] === v)) { can = true; break; } }
      if (!can) a.over(score, false, 'no moves left. the grid is full of itself.'); }
    return {
      key: function (c) { var d = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D' }[c]; if (d) move(d); },
      pointer: function (x, y) { lx = x; ly = y; }, click: function () { sx = lx; sy = ly; },
      release: function (x, y) { var dx = x - sx, dy = y - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'R' : 'L') : (dy > 0 ? 'D' : 'U')); },
      update: function () { },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320); ctx.fillStyle = 'rgba(128,128,128,.15)'; ctx.fillRect(ox, oy, 4 * T + 5 * G, 4 * T + 5 * G); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        var pal = ['--cp-neon-cyan', '--cp-neon-green', '--cp-neon-yellow', '--cp-neon-magenta', '--cp-neon-purple'];
        g.forEach(function (v, k) { var x = ox + G + (k % 4) * (T + G), y = oy + G + Math.floor(k / 4) * (T + G); ctx.fillStyle = 'rgba(128,128,128,.12)'; ctx.fillRect(x, y, T, T); if (!v) return; var lv = Math.log(v) / Math.LN2;
          ctx.globalAlpha = Math.min(1, .3 + lv * .07); ctx.fillStyle = a.C(pal[(lv - 1) % 5 | 0], '#00f5ff'); ctx.fillRect(x, y, T, T); ctx.globalAlpha = 1; ctx.fillStyle = lv > 5 ? a.C('--cp-bg-deep', '#04060a') : a.C('--cp-text-primary', '#e2eaf5'); ctx.font = 'bold ' + (v > 999 ? 18 : 24) + 'px monospace'; ctx.fillText(String(v), x + T / 2, y + T / 2 + 1); });
      }
    };
  }

  /* ═════════ PATTERN LOCK (simon) ═════════ */
  function mkLock(a) {
    var ctx = a.ctx, seq = [], phase = 'wait', timer = .8, showI = 0, lit = -1, litT = 0, inI = 0, lx = 0, ly = 0, FR = [330, 392, 523, 659], WINN = 12;
    var PADS = [[170, 10, 140, 96], [320, 112, 140, 96], [170, 214, 140, 96], [20, 112, 140, 96]], COLS = ['--cp-neon-cyan', '--cp-neon-green', '--cp-neon-magenta', '--cp-neon-yellow'], ARR = ['\u25B2', '\u25B6', '\u25BC', '\u25C0'];
    function light(i, d) { lit = i; litT = d || .35; a.beep(FR[i], 0, .3, 'triangle', .05); }
    function press(i) { if (phase !== 'input') return; light(i, .22);
      if (seq[inI] === i) { inI++; if (inI === seq.length) { a.hud('ROUND ' + seq.length + '   SCORE ' + seq.length * 10); if (seq.length >= WINN) { a.over(seq.length * 10, true, 'twelve rounds. your memory has more RAM than mine.'); return; } phase = 'wait'; timer = .9; } }
      else { phase = 'dead'; a.beep(150, 60, .5, 'sawtooth', .05); a.over(Math.max(0, seq.length - 1) * 10, false, 'wrong pad on round ' + seq.length + '. the lock remains locked.'); } }
    a.hud('ROUND 0'); a.msg('PATTERN LOCK', 'watch, then repeat with arrows or clicks');
    return {
      pointer: function (x, y) { lx = x; ly = y; }, click: function () { PADS.forEach(function (p, i) { if (lx >= p[0] && lx <= p[0] + p[2] && ly >= p[1] && ly <= p[1] + p[3]) press(i); }); },
      key: function (c) { var i = [UP, RT, DN, LT].indexOf(c); if (i !== -1) press(i); },
      update: function (dt) {
        if (litT > 0) { litT -= dt; if (litT <= 0) lit = -1; }
        if (phase === 'wait') { timer -= dt; if (timer <= 0) { a.msg(); seq.push(Math.floor(Math.random() * 4)); phase = 'show'; showI = 0; timer = .5; inI = 0; a.hud('ROUND ' + seq.length + '   WATCH'); } }
        else if (phase === 'show') { timer -= dt; if (timer <= 0) { if (showI < seq.length) { light(seq[showI++], .38); timer = .62; } else { phase = 'input'; a.hud('ROUND ' + seq.length + '   YOUR TURN'); } } }
      },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '30px monospace';
        PADS.forEach(function (p, i) { ctx.globalAlpha = lit === i ? 1 : .22; ctx.fillStyle = a.C(COLS[i], '#00f5ff'); ctx.fillRect(p[0], p[1], p[2], p[3]); ctx.globalAlpha = 1; ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillText(ARR[i], p[0] + p[2] / 2, p[1] + p[3] / 2); });
      }
    };
  }

  /* ═════════ STACKTRIS ═════════ */
  function mkTetris(a) {
    var ctx = a.ctx, k = a.keys, cols = 10, rows = 16, S = 20, ox = 140, board = [], score = 0, lines = 0, level = 1, acc = 0, dropped = false, p, nx;
    var SH = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]]], CL = ['--cp-neon-cyan', '--cp-neon-yellow', '--cp-neon-purple', '--cp-neon-magenta', '--cp-neon-green', '--cp-neon-cyan', '--cp-neon-magenta'];
    for (var r = 0; r < rows; r++) board.push(new Array(cols).fill(0));
    function newP() { var i = Math.floor(Math.random() * 7); return { m: SH[i].map(function (q) { return q.slice(); }), c: i, x: Math.floor((cols - SH[i][0].length) / 2), y: 0 }; }
    function hit(q, dx, dy, m) { m = m || q.m; for (var y = 0; y < m.length; y++) for (var x = 0; x < m[0].length; x++) if (m[y][x]) { var X = q.x + x + dx, Y = q.y + y + dy; if (X < 0 || X >= cols || Y >= rows) return true; if (Y >= 0 && board[Y][X]) return true; } return false; }
    function rot(m) { var o = []; for (var c = 0; c < m[0].length; c++) { o[c] = []; for (var rr = m.length - 1; rr >= 0; rr--) o[c].push(m[rr][c]); } return o; }
    p = newP(); nx = newP(); a.hud('SCORE 0   LINES 0   LV 1');
    function lock() {
      p.m.forEach(function (row, y) { row.forEach(function (v, x) { if (v && p.y + y >= 0) board[p.y + y][p.x + x] = p.c + 1; }); }); var n = 0;
      for (var y = rows - 1; y >= 0; y--) if (board[y].every(Boolean)) { board.splice(y, 1); board.unshift(new Array(cols).fill(0)); n++; y++; }
      if (n) { score += [0, 100, 300, 500, 800][n] * level; lines += n; level = 1 + Math.floor(lines / 8); a.beep(700, 1200, .15, 'square', .04); } else a.beep(200, 0, .04, 'square', .03);
      score += 4; a.hud('SCORE ' + score + '   LINES ' + lines + '   LV ' + level); p = nx; nx = newP(); if (hit(p, 0, 0)) a.over(score, lines >= 20, lines >= 20 ? 'twenty lines. a tidy mind.' : 'the stack reached the ceiling. it happens to the tallest of us.');
    }
    return {
      key: function (c) { if (c === LT && !hit(p, -1, 0)) p.x--; else if (c === RT && !hit(p, 1, 0)) p.x++; else if (c === UP) { var m = rot(p.m); [0, -1, 1, -2, 2].some(function (dx) { if (!hit(p, dx, 0, m)) { p.m = m; p.x += dx; return true; } return false; }); } else if (c === ' ') { while (!hit(p, 0, 1)) p.y++; lock(); } },
      update: function (dt) { acc += dt; var sp = k[DN] ? .035 : Math.max(.08, .62 - (level - 1) * .06); if (acc >= sp) { acc = 0; if (!hit(p, 0, 1)) p.y++; else lock(); } },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320); ctx.fillStyle = 'rgba(128,128,128,.10)'; ctx.fillRect(ox, 0, cols * S, rows * S);
        function cell(x, y, c) { ctx.fillStyle = a.C(CL[c], '#00f5ff'); ctx.fillRect(ox + x * S + 1, y * S + 1, S - 2, S - 2); }
        board.forEach(function (row, y) { row.forEach(function (v, x) { if (v) cell(x, y, v - 1); }); }); p.m.forEach(function (row, y) { row.forEach(function (v, x) { if (v) cell(p.x + x, p.y + y, p.c); }); });
        ctx.fillStyle = a.C('--cp-text-muted', '#8a9ab8'); ctx.font = '12px monospace'; ctx.textAlign = 'left'; ctx.fillText('NEXT', ox + cols * S + 20, 20); nx.m.forEach(function (row, y) { row.forEach(function (v, x) { if (v) { ctx.fillStyle = a.C(CL[nx.c], '#00f5ff'); ctx.fillRect(ox + cols * S + 20 + x * 14, 30 + y * 14, 12, 12); } }); });
      }
    };
  }

  /* ═════════ UPSIDE DOWN ═════════ */
  var ud = false, udCv, udCx, udRaf, spores = [], prevPersona = null, flash = 0, origTitle = document.title, udTitle;
  function udLoop() {
    udRaf = requestAnimationFrame(udLoop); var W = udCv.width, H = udCv.height; udCx.clearRect(0, 0, W, H);
    spores.forEach(function (s) { s.y -= s.v; s.x += Math.sin(s.p += .01) * .35; if (s.y < -10) { s.y = H + 10; s.x = Math.random() * W; } udCx.fillStyle = 'rgba(255,' + (150 + s.g) + ',' + (120 + s.g) + ',' + s.a + ')'; udCx.beginPath(); udCx.arc(s.x, s.y, s.r, 0, 7); udCx.fill(); });
    if (flash > 0) { udCx.fillStyle = 'rgba(255,40,20,' + flash + ')'; udCx.fillRect(0, 0, W, H); flash = Math.max(0, flash - .03); } else if (Math.random() < .0015) { flash = .35; beep(70, 40, .5, 'sawtooth', .05); }
  }
  function setUpside(on) {
    if (on === ud) return; ud = on; if (on && gb) setGB(false);
    root.classList.toggle('upside', on); beep(on ? 110 : 330, on ? 40 : 660, .9, 'sawtooth', .04);
    if (!udCv) { udCv = el('canvas'); udCv.id = 'ud-fx'; document.body.appendChild(udCv); udTitle = el('div', 'ud-title', ''); document.body.appendChild(udTitle); }
    udTitle.textContent = on ? 'THE UPSIDE DOWN' : 'RIGHT SIDE UP'; udTitle.classList.add('show'); setTimeout(function () { udTitle.classList.remove('show'); }, 2600);
    if (on) {
      udCv.width = innerWidth; udCv.height = innerHeight; udCx = udCv.getContext('2d') || noopCtx(); spores = []; for (var i = 0; i < 90; i++) spores.push({ x: Math.random() * udCv.width, y: Math.random() * udCv.height, r: R(.8, 2.6), v: R(.15, .7), a: R(.15, .6), p: Math.random() * 6, g: Math.floor(R(0, 60)) });
      if (!reduce) udLoop(); origTitle = document.title; document.title = '\u01DD\u028C\u0131\u0265\u0254\u0279\u0250 o\u026F\u01DDW';
      prevPersona = FX.nlState ? FX.nlState().persona : null; FX.setPersona && FX.setPersona('villain'); eyeSay('...it is cold here. something is listening. (it is me. i am the something.)');
    } else {
      cancelAnimationFrame(udRaf); document.title = origTitle; FX.setPersona && FX.setPersona(prevPersona || 'default'); eyeSay('back in the right-side-up. the demogorgon says bye.');
    }
  }
  FX.upsideDown = function (v) { setUpside(v == null ? !ud : !!v); }; FX.isUpside = function () { return ud; };
  addEventListener('resize', function () { if (ud && udCv) { udCv.width = innerWidth; udCv.height = innerHeight; } });

  /* ═════════ MEMO BOY (game boy palette) ═════════ */
  var gb = false, savedHue = 'cyan';
  function setGB(on) {
    if (on === gb) return; gb = on; if (on && ud) setUpside(false);
    if (on) {
      var cur0 = $('.swatch.on'); savedHue = (cur0 && cur0.dataset.hue) || 'cyan';
      var b = el('div', 'gb-boot'); b.appendChild(el('div', 'gb-logo', 'MEMO\u2022BOY')); b.appendChild(el('small', '', '\u00A9 MEMO ARCHIVE')); document.body.appendChild(b);
      beep(987, 0, .12, 'square', .05); beep(1318, 0, .6, 'square', .05, .13);
      setTimeout(function () { root.classList.add('gameboy'); FX.hue && FX.hue('cyan'); }, 900); setTimeout(function () { b.remove(); }, 2400);
      eyeSay('four shades of green. one hundred percent attitude. press START to continue.');
    } else { root.classList.remove('gameboy'); FX.hue && FX.hue(savedHue); beep(660, 330, .2, 'square', .04); eyeSay('full colour restored. my retinas thank you.'); }
  }
  FX.gameboy = function (v) { setGB(v == null ? !gb : !!v); }; FX.isGameboy = function () { return gb; };

  /* ═════════ terminal + secret words ═════════ */
  var cmds = FX.cmds || {}, P = function (t, c) { FX.print && FX.print(t, c); };
  cmds.arcade = function () { P('inserting coin...'); setTimeout(function () { var t = document.querySelector('.term'); t && t.classList.remove('open'); openArcade(); }, 300); };
  cmds.upsidedown = function () { P(ud ? 'flipping back...' : 'the gate opens...'); setUpside(!ud); };
  cmds.gameboy = function () { P(gb ? 'power off.' : 'power on.'); setGB(!gb); };
  var oldTheme = cmds.theme; cmds.theme = function (a) { var h = (a[0] || '').toLowerCase(); if (h === 'gameboy' || h === 'memoboy') return setGB(true); if (h === 'upside' || h === 'upsidedown') return setUpside(true); if (h === 'normal' || h === 'default') { if (gb) setGB(false); if (ud) setUpside(false); return P('theme -> normal'); } return oldTheme ? oldTheme(a) : null; };
  FX.helpExtra = (FX.helpExtra || []).concat(['  theme gameboy|upside|normal', '  arcade | upsidedown | gameboy   ...if you know the codes, you do not need these']);
  var SEC = FX.secrets || {}; SEC.arcade = function () { openArcade(); }; SEC.upsidedown = function () { setUpside(!ud); }; SEC.gameboy = function () { setGB(!gb); }; SEC.memoboy = SEC.gameboy; FX.secrets = SEC;
})();
