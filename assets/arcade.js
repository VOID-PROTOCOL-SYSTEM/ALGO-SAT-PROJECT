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
    { id: 'stack', name: 'STACKTRIS', d: 'falling blocks. you know the drill.', c: '\u2190\u2192 move, \u2191 rotate, \u2193 soft, SPACE drop', mk: mkTetris },
    { id: 'maze', name: 'MAZE RUNNER', d: 'dfs built it. bfs can rescue you (H).', c: 'arrows, H = hint (-5s)', mk: mkMaze },
    { id: 'dash', name: 'DIJKSTRA DASH', d: 'find the cheapest route. 5 rounds.', c: 'arrows, Z undo', mk: mkDash },
    { id: 'whack', name: 'WHACK-A-BUG', d: 'squash bugs. spare the eye. 30 seconds.', c: 'click / keys 1-9 (numpad)', mk: mkWhack },
    { id: 'lights', name: 'LIGHTS OUT', d: 'flip them all off. neighbours flip too.', c: 'click / arrows + SPACE', mk: mkLights },
    { id: 'react', name: 'REACTION TEST', d: 'click on green. 5 rounds. no flinching.', c: 'click / SPACE', mk: mkReact },
    { id: 'lanes', name: 'LANE CROSSER', d: 'why did the cursor cross the road?', c: 'arrows, step by step', mk: mkLanes },
    { id: 'sort', name: 'SORT-O-MATIC', d: 'sort the bars in the fewest swaps.', c: 'click two bars / arrows + SPACE', mk: mkSort },
    { id: 'ttt', name: 'TIC-TAC-MINIMAX', d: 'a perfect-play AI. it blunders sometimes.', c: 'click / keys 1-9 / arrows + SPACE', mk: mkTTT },
    { id: 'trace', name: 'TRACE THE ALGORITHM', d: 'predict the next node: bfs, dfs, dijkstra.', c: 'click or press 1-8 \u00B7 H hint \u00B7 V watch', mk: mkTrace }
  ];
  var NLAB = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Q', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'F'];
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
    stopGame(); view = 'menu'; dead = false; checkAch(); head('\u2014 INSERT COIN \u2014  ' + (parseInt(lget('arc-plays') || '0', 10)) + ' PLAYS'); box.className = 'arc-box wide';
    var list = el('div', 'arc-list two'); box.appendChild(list), dly = dailyIdx();
    GAMES.forEach(function (g, i) {
      var it = el('div', 'arc-item' + (i === sel ? ' sel' : '')), n = el('span', 'arc-n', NLAB[i]), gg = el('span', 'arc-g'), b = el('span', 'arc-b', (i === dly ? '\u2605 2x XP  ' : '') + (best(g.id) ? 'HI ' + best(g.id) : ''));
      gg.appendChild(document.createTextNode(g.name)); gg.appendChild(el('span', 'arc-d', g.d)); it.appendChild(n); it.appendChild(gg); it.appendChild(b);
      it.addEventListener('mouseenter', function () { sel = i; $$('.arc-item', list).forEach(function (x, k) { x.classList.toggle('sel', k === i); }); beep(900, 0, .03, 'square', .015); });
      it.addEventListener('click', function () { sel = i; startGame(GAMES[i]); }); list.appendChild(it);
    });
    eyeEl = el('div', 'arc-eye', pick(EYE_MENU)); box.appendChild(eyeEl);
    var f = el('div', 'arc-foot'); f.appendChild(el('span', '', '\u2190\u2191\u2193\u2192 SELECT  \u00B7  ENTER PLAY  \u00B7  1-9 0 Q-P F QUICK START')); var tb = el('span', 'arc-trophy', '\u2605 TROPHIES (K)'); tb.addEventListener('click', trophies); f.appendChild(tb); f.appendChild(el('span', '', 'ESC EXIT')); box.appendChild(f);
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
  var HELLO = { snake: ['eat. grow. try not to become a metaphor.'], pong: ['i am the cpu. i do not get tired. you do.'], breakout: ['the wall is just a memo with commitment issues.'], stare: ['i have no eyelids. well. one. do not move.'], typist: ['algorithm words. your fingers. go.'], flap: ['i have wings. technically. they are svg.'], drift: ['the rocks are not friendly. the rocks are rocks.'], bugs: ['first click is always safe. i am generous like that.'], merge: ['merge sort jokes are not allowed here. (merge conflicts are.)'], lock: ['watch closely. blinking is cheating.'], stack: ['you know the drill. i know you will not clear four lines.'], maze: ['i built this maze with dfs. recursive backtracker. no regrets.'], dash: ['greedy is a trap. dijkstra is a lifestyle.'], whack: ['bugs: pop up, annoy, vanish. just like production.'], lights: ['every puzzle has a solution. this one has a lot of clicking.'], react: ['do not click until green. i know you want to.'], lanes: ['the cars are not sentient. the cars are not sentient.'], sort: ['selection sort makes n swaps. you can do better. or worse.'], ttt: ['i am minimax. i have already seen how this ends.'], trace: ['three algorithms. one brain. predict the next node.'] };
  var BAD = ['that was painful to watch. i watched all of it.', 'a bold attempt. a bad one. bold.', 'the cabinet saw that. the cabinet is disappointed.'];
  var GOOD = ['okay okay. that was actually good.', 'new high score. i am legally obligated to be impressed.', 'not bad, runner. not bad at all.'];
  function gameOver(score, win, line) {
    if (dead) return; dead = true; var g = curG, nb = score > best(g.id), p = '', mult = GAMES[dailyIdx()] === g ? 2 : 1, had = GAMES.every(function (x) { return best(x.id) > 0; });
    lset('arc-plays', String((parseInt(lget('arc-plays') || '0', 10) || 0) + 1)); if (win) { lset('arc-wins', String((parseInt(lget('arc-wins') || '0', 10) || 0) + 1)); lset('arc-won-' + g.id, '1'); } if (mult === 2) lset('arc-daily', '1');
    if (nb && score > 0) { lset('arc-' + g.id, String(score)); p += FX.gainXP ? FX.gainXP(5 * mult) : ''; $('#arc-hi') && ($('#arc-hi').textContent = 'HI ' + score); }
    if (win) p += FX.gainXP ? FX.gainXP(10 * mult) : '';
    if (!had && GAMES.every(function (x) { return best(x.id) > 0; })) { p += FX.gainXP ? FX.gainXP(40) : ''; later.push('ARCADE CHAMPION. you have a score on every machine. +40 xp. go outside. (after one more round.)'); }
    var m = (box && msgEl) ? msgEl : null; if (m) { m.textContent = ''; m.appendChild(el('h3', '', win ? 'YOU WIN' : 'GAME OVER')); m.appendChild(el('p', '', 'SCORE ' + score + (nb && score > 0 ? '  \u2605 NEW BEST' : '') + '   \u00B7   ENTER TO RETRY')); }
    eyeEl && (eyeEl.textContent = line || pick(nb || win ? GOOD : BAD)); if (p) later.push(p.replace(/^ \|\| /, '').replace(' || ', ' '));
    if (win) { beep(523, 0, .1, 'square', .04); beep(659, 0, .1, 'square', .04, .1); beep(784, 0, .2, 'square', .04, .2); } else beep(220, 70, .4, 'sawtooth', .04);
    if (curG && curG.id === 'typist' && typeEl) typeEl.blur();
    checkAch();
  }
  function arcKey(e) {
    var k = e.key, c = norm(k), inType = typeEl && e.target === typeEl;
    e.stopImmediatePropagation();
    if (k === 'Escape') { e.preventDefault(); view === 'menu' ? closeArcade() : menu(); return; }
    if (view === 'trophy') return;
    if (inType) { if (k === 'Enter' && cur && cur.submit) { e.preventDefault(); if (dead) startGame(curG); else cur.submit(); } return; }
    if ([UP, DN, LT, RT, ' '].indexOf(k) !== -1) e.preventDefault();
    if (view === 'menu') {
      if (k === 'k' || k === 'K') { trophies(); return; }
      var n = GAMES.length, ls = $('.arc-list'), nc = ls ? (getComputedStyle(ls).gridTemplateColumns || '').split(' ').filter(Boolean).length || 1 : 1, mv = null;
      if (c === UP) mv = (sel - nc + n) % n; else if (c === DN) mv = (sel + nc) % n; else if (c === LT) mv = (sel + n - 1) % n; else if (c === RT) mv = (sel + 1) % n;
      if (mv !== null) { sel = mv; refreshSel(); beep(900, 0, .03, 'square', .015); }
      else if (k === 'Enter' || k === ' ') startGame(GAMES[sel]);
      else { var qi = NLAB.indexOf(k.length === 1 ? k.toUpperCase() : k); if (qi !== -1 && GAMES[qi]) { sel = qi; startGame(GAMES[sel]); } }
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

  /* ═════════ MAZE RUNNER (maze built with DFS; press H for a BFS hint) ═════════ */
  function mkMaze(a) {
    var ctx = a.ctx, SZ = [[8, 5], [12, 8], [16, 10], [24, 16]], lvl = 0, c, r, cell, ox, oy, w, px, py, trail, hint = 0, hintPath = [], time = 45, score = 0, tc;
    function gen() {
      c = SZ[lvl][0]; r = SZ[lvl][1]; cell = Math.floor(Math.min(480 / c, 320 / r)); ox = Math.floor((480 - c * cell) / 2); oy = Math.floor((320 - r * cell) / 2); w = []; var vis = [], st = [0], i; for (i = 0; i < c * r; i++) { w.push(15); vis.push(0); } vis[0] = 1;
      while (st.length) { var cu = st[st.length - 1], x = cu % c, y = (cu / c) | 0, nb = []; if (y > 0 && !vis[cu - c]) nb.push([cu - c, 1, 4]); if (x < c - 1 && !vis[cu + 1]) nb.push([cu + 1, 2, 8]); if (y < r - 1 && !vis[cu + c]) nb.push([cu + c, 4, 1]); if (x > 0 && !vis[cu - 1]) nb.push([cu - 1, 8, 2]);
        if (!nb.length) { st.pop(); continue; } var n = pick(nb); w[cu] &= ~n[1]; w[n[0]] &= ~n[2]; vis[n[0]] = 1; st.push(n[0]); }
      px = 0; py = 0; trail = [0]; hint = 0; hintPath = [];
    }
    function bfs() { var prev = {}, q = [py * c + px], seen = {}; seen[q[0]] = 1; var goal = c * r - 1; while (q.length) { var u = q.shift(); if (u === goal) break; var x = u % c, y = (u / c) | 0;
        [[1, 0, 2], [0, 1, 4], [-1, 0, 8], [0, -1, 1]].forEach(function (d) { if (w[u] & d[2]) return; var v = (y + d[1]) * c + x + d[0]; if (!seen[v]) { seen[v] = 1; prev[v] = u; q.push(v); } }); }
      var p = [], u2 = goal; while (u2 !== undefined && u2 !== py * c + px) { p.push(u2); u2 = prev[u2]; } return p; }
    function hudu() { a.hud('LEVEL ' + (lvl + 1) + '   TIME ' + Math.ceil(time) + '   SCORE ' + score); }
    gen(); hudu(); a.msg('MAZE RUNNER', 'arrows to move \u00B7 H = BFS hint (costs 5s)');
    return {
      key: function (k) { a.msg(); var d = { ArrowUp: [0, -1, 1], ArrowRight: [1, 0, 2], ArrowDown: [0, 1, 4], ArrowLeft: [-1, 0, 8] }[k];
        if (k === 'h') { time -= 5; hintPath = bfs(); hint = 2.2; a.beep(400, 700, .1, 'triangle', .03); return; } if (!d || (w[py * c + px] & d[2])) return;
        px += d[0]; py += d[1]; trail.push(py * c + px); a.beep(300 + (trail.length % 8) * 30, 0, .02, 'square', .015);
        if (px === c - 1 && py === r - 1) { score += 100 + Math.round(time); a.beep(660, 990, .2, 'square', .04); lvl++; time += 12; if (lvl >= SZ.length) { a.over(score, true, 'all four mazes. dfs built them. you beat dfs. think about that.'); return; } a.eye('level ' + (lvl + 1) + '. the walls are getting ideas.'); gen(); } hudu(); },
      update: function (dt) { time -= dt; hint = Math.max(0, hint - dt); hudu(); if (time <= 0) a.over(score, false, 'time. the maze is still there. the maze is patient.'); },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320); ctx.fillStyle = 'rgba(128,128,128,.18)'; trail.forEach(function (t) { ctx.fillRect(ox + (t % c) * cell + 2, oy + ((t / c) | 0) * cell + 2, cell - 4, cell - 4); });
        if (hint > 0) { ctx.fillStyle = a.C('--cp-neon-yellow', '#f7ff00'); hintPath.forEach(function (t) { ctx.fillRect(ox + (t % c) * cell + cell / 2 - 2, oy + ((t / c) | 0) * cell + cell / 2 - 2, 4, 4); }); }
        ctx.fillStyle = a.C('--cp-neon-green', '#00ff9f'); ctx.fillRect(ox + (c - 1) * cell + 3, oy + (r - 1) * cell + 3, cell - 6, cell - 6);
        ctx.strokeStyle = a.C('--cp-neon-cyan', '#00f5ff'); ctx.lineWidth = 2; ctx.beginPath(); for (var i = 0; i < c * r; i++) { var x = ox + (i % c) * cell, y = oy + ((i / c) | 0) * cell; if (w[i] & 1) { ctx.moveTo(x, y); ctx.lineTo(x + cell, y); } if (w[i] & 2) { ctx.moveTo(x + cell, y); ctx.lineTo(x + cell, y + cell); } if (w[i] & 4) { ctx.moveTo(x, y + cell); ctx.lineTo(x + cell, y + cell); } if (w[i] & 8) { ctx.moveTo(x, y); ctx.lineTo(x, y + cell); } } ctx.stroke();
        ctx.fillStyle = a.C('--cp-neon-magenta', '#ff2d78'); ctx.fillRect(ox + px * cell + cell * .25, oy + py * cell + cell * .25, cell * .5, cell * .5);
      }
    };
  }

  /* ═════════ DIJKSTRA DASH ═════════ */
  function mkDash(a) {
    var ctx = a.ctx, C = 10, Rw = 6, S = 48, oy = 16, cost, px, py, path, total, round = 0, sum = 0, phase = 'play', pt = 0, optv = 0, RO = 5, i;
    function dij() { var N = C * Rw, d = [], done = [], k; for (k = 0; k < N; k++) d.push(1e9); d[0] = 0; for (;;) { var u = -1, b = 1e9; for (k = 0; k < N; k++) if (!done[k] && d[k] < b) { b = d[k]; u = k; } if (u < 0 || u === N - 1) break; done[u] = 1; var x = u % C, y = (u / C) | 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (q) { var nx = x + q[0], ny = y + q[1]; if (nx < 0 || ny < 0 || nx >= C || ny >= Rw) return; var v = ny * C + nx; if (d[u] + cost[v] < d[v]) d[v] = d[u] + cost[v]; }); } return d[N - 1]; }
    function newRound() { cost = []; for (i = 0; i < C * Rw; i++) cost.push(1 + Math.floor(Math.random() * 9)); cost[0] = 0; px = 0; py = 0; path = [0]; total = 0; optv = dij(); phase = 'play'; a.hud('ROUND ' + (round + 1) + '/' + RO + '   COST ' + total + '   SCORE ' + sum); }
    newRound(); a.msg('DIJKSTRA DASH', 'reach the green cell. every step costs its number. Z undoes.');
    return {
      key: function (k) { a.msg(); if (phase !== 'play') return;
        if (k === 'z' || k === 'Backspace') { if (path.length > 1) { var l = path.pop(); total -= cost[l]; var p = path[path.length - 1]; px = p % C; py = (p / C) | 0; } a.hud('ROUND ' + (round + 1) + '/' + RO + '   COST ' + total + '   SCORE ' + sum); return; }
        var d = { ArrowUp: [0, -1], ArrowRight: [1, 0], ArrowDown: [0, 1], ArrowLeft: [-1, 0] }[k]; if (!d) return; var nx = px + d[0], ny = py + d[1]; if (nx < 0 || ny < 0 || nx >= C || ny >= Rw) return;
        px = nx; py = ny; path.push(py * C + px); total += cost[py * C + px]; a.beep(300 + cost[py * C + px] * 40, 0, .03, 'square', .02);
        if (px === C - 1 && py === Rw - 1) { var pts = Math.round(100 * optv / total); sum += pts; phase = 'result'; pt = 2.2; a.eye(total === optv ? 'optimal! dijkstra would frame this. +' + pts : 'you paid ' + total + '. the optimal was ' + optv + '. +' + pts + ' points.'); }
        a.hud('ROUND ' + (round + 1) + '/' + RO + '   COST ' + total + '   SCORE ' + sum); },
      update: function (dt) { if (phase === 'result') { pt -= dt; if (pt <= 0) { round++; if (round >= RO) { a.over(sum, sum >= 400, sum >= 400 ? 'average efficiency above 80%. you are a human priority queue.' : 'greedy choices cost you. as they always do.'); return; } newRound(); } } },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 18px monospace';
        for (var y = 0; y < Rw; y++) for (var x = 0; x < C; x++) { var v = cost[y * C + x], onp = path.indexOf(y * C + x) !== -1; ctx.fillStyle = 'rgba(128,128,128,' + (.08 + v * .03) + ')'; ctx.fillRect(x * S + 2, oy + y * S + 2, S - 4, S - 4); if (onp) { ctx.fillStyle = a.C('--cp-neon-cyan', '#00f5ff'); ctx.globalAlpha = .35; ctx.fillRect(x * S + 2, oy + y * S + 2, S - 4, S - 4); ctx.globalAlpha = 1; }
          if (x === C - 1 && y === Rw - 1) { ctx.fillStyle = a.C('--cp-neon-green', '#00ff9f'); ctx.globalAlpha = .5; ctx.fillRect(x * S + 2, oy + y * S + 2, S - 4, S - 4); ctx.globalAlpha = 1; }
          if (v) { ctx.fillStyle = a.C('--cp-text-muted', '#8a9ab8'); ctx.fillText(String(v), x * S + S / 2, oy + y * S + S / 2); } }
        ctx.fillStyle = a.C('--cp-neon-magenta', '#ff2d78'); ctx.fillRect(px * S + 10, oy + py * S + 10, S - 20, S - 20);
        if (phase === 'result') { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 130, 480, 60); ctx.fillStyle = a.C('--cp-neon-yellow', '#f7ff00'); ctx.font = 'bold 20px monospace'; ctx.fillText('YOU ' + total + '   OPTIMAL ' + optv, 240, 160); }
      }
    };
  }

  /* ═════════ WHACK-A-BUG ═════════ */
  function mkWhack(a) {
    var ctx = a.ctx, holes = [], T = 30, left = T, score = 0, spawn = .5, elapsed = 0, hits = 0, i, lx = 0, ly = 0, flash = [];
    for (i = 0; i < 9; i++) holes.push({ x: 90 + (i % 3) * 150, y: 70 + Math.floor(i / 3) * 90, t: 0, kind: '', hit: 0 });
    a.hud('TIME 30   SCORE 0'); a.msg('WHACK-A-BUG', 'click the bugs \u00B7 keys 1-9 (numpad layout) \u00B7 NOT the eye');
    function whack(i) { var h = holes[i]; if (!h || h.t <= 0 || h.hit) return; h.hit = .25; if (h.kind === 'bug') { score += 10; hits++; a.beep(700 + hits * 6, 0, .05, 'square', .03); } else { score = Math.max(0, score - 15); a.beep(160, 80, .25, 'sawtooth', .05); a.eye('you hit my cousin. he has a family.'); } a.hud('TIME ' + Math.ceil(left) + '   SCORE ' + score); }
    return {
      pointer: function (x, y) { lx = x; ly = y; }, click: function () { a.msg(); holes.forEach(function (h, i) { if (Math.abs(lx - h.x) < 55 && Math.abs(ly - h.y) < 38) whack(i); }); },
      key: function (c) { var n = parseInt(c, 10); if (n >= 1 && n <= 9) { a.msg(); whack((2 - Math.floor((n - 1) / 3)) * 3 + (n - 1) % 3); } },
      update: function (dt) {
        left -= dt; elapsed += dt; spawn -= dt; holes.forEach(function (h) { if (h.t > 0) { h.t -= dt; } h.hit = Math.max(0, h.hit - dt); });
        if (spawn <= 0) { var free = holes.filter(function (h) { return h.t <= 0 && !h.hit; }); if (free.length) { var h = pick(free); h.t = Math.max(.5, 1.15 - elapsed * .02); h.kind = Math.random() < .2 ? 'eye' : 'bug'; h.hit = 0; } spawn = Math.max(.32, .85 - elapsed * .015); }
        a.hud('TIME ' + Math.max(0, Math.ceil(left)) + '   SCORE ' + score); if (left <= 0) a.over(score, score >= 200, score >= 200 ? 'a plague of bugs and you are the cure.' : 'the bugs win this round. they will be back. they are always back.');
      },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320);
        holes.forEach(function (h) { ctx.fillStyle = 'rgba(128,128,128,.25)'; ctx.beginPath(); ctx.ellipse(h.x, h.y + 18, 46, 16, 0, 0, 7); ctx.fill();
          if (h.t > 0 || h.hit) { var up = h.hit ? 0 : 1; ctx.save(); ctx.globalAlpha = h.hit ? .4 : 1;
            if (h.kind === 'bug') { ctx.fillStyle = a.C('--cp-neon-magenta', '#ff2d78'); ctx.beginPath(); ctx.arc(h.x, h.y, 17, 0, 7); ctx.fill(); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 2; for (var l = 0; l < 3; l++) { ctx.beginPath(); ctx.moveTo(h.x - 26, h.y - 10 + l * 10); ctx.lineTo(h.x + 26, h.y - 10 + l * 10); ctx.stroke(); } ctx.fillStyle = '#000'; ctx.fillRect(h.x - 7, h.y - 5, 4, 4); ctx.fillRect(h.x + 3, h.y - 5, 4, 4); }
            else { ctx.fillStyle = a.C('--cp-text-primary', '#e2eaf5'); ctx.beginPath(); ctx.ellipse(h.x, h.y, 24, 15, 0, 0, 7); ctx.fill(); ctx.fillStyle = a.C('--cp-neon-cyan', '#00f5ff'); ctx.beginPath(); ctx.arc(h.x, h.y, 8, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(h.x, h.y, 3, 0, 7); ctx.fill(); }
            ctx.restore(); } });
      }
    };
  }

  /* ═════════ LIGHTS OUT ═════════ */
  function mkLights(a) {
    var ctx = a.ctx, N = 5, S = 56, ox = 100, oy = 20, g = [], moves = 0, cx = 2, cy = 2, lx = 0, ly = 0, presses = 0, i;
    function tog(x, y) { [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var X = x + d[0], Y = y + d[1]; if (X >= 0 && Y >= 0 && X < N && Y < N) g[Y * N + X] ^= 1; }); }
    for (i = 0; i < N * N; i++) g.push(0); var used = {}; while (presses < 9) { var q = Math.floor(Math.random() * 25); if (used[q]) continue; used[q] = 1; presses++; tog(q % N, (q / N) | 0); } if (!g.some(Boolean)) tog(2, 2);
    a.hud('MOVES 0   PAR ' + presses); a.msg('LIGHTS OUT', 'press a cell: it flips itself and its neighbours \u00B7 turn them ALL off');
    function press(x, y) { a.msg(); tog(x, y); moves++; a.beep(500 + (x + y) * 40, 0, .04, 'square', .03); a.hud('MOVES ' + moves + '   PAR ' + presses);
      if (!g.some(Boolean)) a.over(Math.max(20, 260 - Math.max(0, moves - presses) * 12), true, moves <= presses ? 'at or under par. suspiciously efficient.' : 'solved in ' + moves + '. par was ' + presses + '. close enough.'); }
    return {
      pointer: function (x, y) { lx = x; ly = y; }, click: function () { var x = Math.floor((lx - ox) / S), y = Math.floor((ly - oy) / S); if (x >= 0 && y >= 0 && x < N && y < N) { cx = x; cy = y; press(x, y); } },
      key: function (k) { if (k === UP) cy = Math.max(0, cy - 1); else if (k === DN) cy = Math.min(N - 1, cy + 1); else if (k === LT) cx = Math.max(0, cx - 1); else if (k === RT) cx = Math.min(N - 1, cx + 1); else if (k === ' ') press(cx, cy); },
      update: function () { },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320);
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) { var on = g[y * N + x]; ctx.fillStyle = on ? a.C('--cp-neon-yellow', '#f7ff00') : 'rgba(128,128,128,.18)'; ctx.fillRect(ox + x * S + 3, oy + y * S + 3, S - 6, S - 6); }
        ctx.strokeStyle = a.C('--cp-neon-magenta', '#ff2d78'); ctx.lineWidth = 3; ctx.strokeRect(ox + cx * S + 1, oy + cy * S + 1, S - 2, S - 2);
      }
    };
  }

  /* ═════════ REACTION TEST ═════════ */
  function mkReact(a) {
    var ctx = a.ctx, RO = 5, round = 0, phase = 'wait', t = R(1.4, 3.8), el0 = 0, goAt = 0, times = [], total = 0, show = 0, last = '';
    var TAUNT = function (ms) { return ms < 180 ? 'that is robot-fast. are you a robot? am i?' : ms < 250 ? 'sharp. very sharp.' : ms < 330 ? 'average human. i say that with love.' : ms < 450 ? 'were you blinking? you were blinking.' : 'my grandma has faster reflexes. my grandma is a div.'; };
    a.hud('ROUND 1/' + RO + '   SCORE 0'); a.msg('REACTION TEST', 'wait for GREEN, then click / SPACE as fast as you can');
    function hit() { a.msg(); if (phase === 'wait') { times.push(600); last = 'TOO SOON (+600ms penalty)'; a.beep(150, 80, .3, 'sawtooth', .05); a.eye('too soon. patience is a virtue. a slow one.'); next(); }
      else if (phase === 'go') { var ms = Math.round(performance.now() - goAt); times.push(ms); var pts = Math.max(0, Math.round((600 - ms) / 6)); total += pts; last = ms + ' ms'; a.beep(880, 0, .08, 'square', .04); a.eye(TAUNT(ms)); next(); } }
    function next() { round++; phase = 'show'; show = 1.3; a.hud('ROUND ' + Math.min(RO, round + 1) + '/' + RO + '   SCORE ' + total); }
    return {
      click: hit, key: function (k) { if (k === ' ') hit(); },
      update: function (dt) {
        if (phase === 'wait') { t -= dt; if (t <= 0) { phase = 'go'; el0 = 0; goAt = performance.now(); } } else if (phase === 'go') { el0 += dt; if (performance.now() - goAt > 3000) { times.push(900); last = 'TOO SLOW'; next(); } }
        else if (phase === 'show') { show -= dt; if (show <= 0) { if (round >= RO) { var avg = Math.round(times.reduce(function (s, x) { return s + x; }, 0) / times.length); a.over(total, avg < 300, 'average ' + avg + ' ms. ' + (avg < 300 ? 'fast hands. the cursor fears you.' : 'the average human is ~250. you are... a human.')); phase = 'done'; } else { phase = 'wait'; t = R(1.4, 3.8); } } }
      },
      draw: function () {
        var bg = phase === 'go' ? a.C('--cp-neon-green', '#00ff9f') : phase === 'show' ? a.C('--cp-bg-raised', '#1a2234') : a.C('--cp-neon-magenta', '#ff2d78'); ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320);
        ctx.globalAlpha = phase === 'wait' ? .55 : .9; ctx.fillStyle = bg; ctx.fillRect(40, 40, 400, 190); ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 32px monospace'; ctx.fillStyle = phase === 'go' ? a.C('--cp-bg-deep', '#04060a') : a.C('--cp-text-primary', '#e2eaf5');
        ctx.fillText(phase === 'wait' ? 'WAIT...' : phase === 'go' ? 'CLICK!' : last, 240, 135);
        ctx.font = '14px monospace'; ctx.fillStyle = a.C('--cp-text-muted', '#8a9ab8'); ctx.fillText(times.map(function (x) { return x; }).join('  '), 240, 270);
      }
    };
  }

  /* ═════════ LANE CROSSER ═════════ */
  function mkLanes(a) {
    var ctx = a.ctx, S = 32, cols = 15, rows = 10, px = 7, py = 9, lives = 3, score = 0, level = 1, furthest = 9, cars = [], inv = 0, mk;
    function build() { cars = []; for (var r = 1; r <= 8; r++) { if (r === 5) continue; var dir = r % 2 ? 1 : -1, sp = (R(45, 85)) * (1 + (level - 1) * .12), n = 2 + (r % 3 === 0 ? 1 : 0), gap = (cols * S + 80) / n, len = pick([2, 2, 3]) * S - 6; for (var i = 0; i < n; i++) cars.push({ x: i * gap + R(0, 30), r: r, v: dir * sp, w: len }); } }
    function reset() { px = 7; py = 9; furthest = 9; }
    build(); a.hud('SCORE 0   LIVES 3   LEVEL 1');
    function hurt() { if (inv > 0) return; lives--; a.beep(150, 50, .4, 'sawtooth', .05); a.hud('SCORE ' + score + '   LIVES ' + lives + '   LEVEL ' + level); reset(); inv = 1; if (lives <= 0) a.over(score, false, score >= 100 ? 'you crossed more roads than a chicken. a very tired chicken.' : 'the traffic does not stop. it never stops.'); }
    return {
      key: function (k) { var d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[k]; if (!d) return; px = Math.max(0, Math.min(cols - 1, px + d[0])); py = Math.max(0, Math.min(rows - 1, py + d[1])); a.beep(400, 0, .02, 'square', .015);
        if (py < furthest) { furthest = py; score += 1; } if (py === 0) { score += 10 * level; level++; build(); reset(); a.beep(660, 990, .2, 'square', .04); a.eye('level ' + level + '. the cars got faster. the chicken did not.'); } a.hud('SCORE ' + score + '   LIVES ' + lives + '   LEVEL ' + level); },
      update: function (dt) {
        inv = Math.max(0, inv - dt); cars.forEach(function (c) { c.x += c.v * dt; if (c.v > 0 && c.x > cols * S + 20) c.x = -c.w - 20; if (c.v < 0 && c.x < -c.w - 20) c.x = cols * S + 20; });
        var X = px * S + 5, Y = py * S + 5; cars.forEach(function (c) { if (c.r === py && X + 22 > c.x && X < c.x + c.w) hurt(); });
      },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320); ctx.fillStyle = 'rgba(128,128,128,.14)'; for (var r = 1; r <= 8; r++) if (r !== 5) ctx.fillRect(0, r * S, 480, S);
        ctx.fillStyle = a.C('--cp-neon-green', '#00ff9f'); ctx.globalAlpha = .3; ctx.fillRect(0, 0, 480, S); ctx.fillRect(0, 5 * S, 480, S); ctx.fillRect(0, 9 * S, 480, S); ctx.globalAlpha = 1;
        cars.forEach(function (c) { ctx.fillStyle = a.C(c.v > 0 ? '--cp-neon-magenta' : '--cp-neon-yellow', '#ff2d78'); ctx.fillRect(c.x, c.r * S + 5, c.w, S - 10); });
        if (inv <= 0 || Math.floor(inv * 10) % 2) { ctx.fillStyle = a.C('--cp-neon-cyan', '#00f5ff'); ctx.fillRect(px * S + 5, py * S + 5, S - 10, S - 10); }
      }
    };
  }

  /* ═════════ SORT-O-MATIC (fewest swaps wins) ═════════ */
  function mkSort(a) {
    var ctx = a.ctx, SIZES = [6, 8, 10], round = 0, arr, cur0 = 0, sel = -1, moves = 0, par = 0, sum = 0, phase = 'play', pt = 0, lx = 0, ly = 0;
    function minSwaps(p) { var seen = [], sw = 0; for (var i = 0; i < p.length; i++) { if (seen[i]) continue; var j = i, len = 0; while (!seen[j]) { seen[j] = 1; j = p[j] - 1; len++; } sw += len - 1; } return sw; }
    function newRound() { var n = SIZES[round]; do { arr = []; for (var i = 1; i <= n; i++) arr.push(i); arr.sort(function () { return Math.random() - .5; }); } while (minSwaps(arr) < 3); par = minSwaps(arr); moves = 0; sel = -1; cur0 = 0; phase = 'play'; hud(); }
    function hud() { a.hud('ROUND ' + (round + 1) + '/3   SWAPS ' + moves + '   PAR ' + par + '   SCORE ' + sum); }
    function done() { return arr.every(function (v, i) { return v === i + 1; }); }
    function pick1(i) { a.msg(); if (phase !== 'play') return; if (sel === -1) { sel = i; a.beep(500, 0, .03, 'square', .02); return; } if (sel === i) { sel = -1; return; }
      var t = arr[sel]; arr[sel] = arr[i]; arr[i] = t; sel = -1; moves++; a.beep(420, 640, .06, 'square', .03); hud();
      if (done()) { var pts = Math.max(10, 100 - Math.max(0, moves - par) * 20); sum += pts; phase = 'result'; pt = 1.8; a.eye(moves <= par ? 'perfect. ' + par + ' swaps. selection sort is jealous. +' + pts : moves + ' swaps. par was ' + par + '. +' + pts); hud(); } }
    newRound(); a.msg('SORT-O-MATIC', 'pick two bars to swap them. sort ascending in the FEWEST swaps.');
    return {
      pointer: function (x, y) { lx = x; ly = y; }, click: function () { var n = arr.length, w = 440 / n, i = Math.floor((lx - 20) / w); if (i >= 0 && i < n) { cur0 = i; pick1(i); } },
      key: function (k) { var n = arr.length; if (k === LT) cur0 = Math.max(0, cur0 - 1); else if (k === RT) cur0 = Math.min(n - 1, cur0 + 1); else if (k === ' ') pick1(cur0); },
      update: function (dt) { if (phase === 'result') { pt -= dt; if (pt <= 0) { round++; if (round >= 3) { a.over(sum, sum >= 240, sum >= 240 ? 'near-perfect swaps. you think like a permutation cycle.' : 'bubble-sort energy. it got there. eventually.'); return; } newRound(); } } },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320); var n = arr.length, w = 440 / n; ctx.textAlign = 'center'; ctx.font = 'bold 16px monospace'; ctx.textBaseline = 'middle';
        arr.forEach(function (v, i) { var h = v / n * 230, x = 20 + i * w; ctx.fillStyle = i === sel ? a.C('--cp-neon-yellow', '#f7ff00') : v === i + 1 ? a.C('--cp-neon-green', '#00ff9f') : a.C('--cp-neon-cyan', '#00f5ff'); ctx.globalAlpha = v === i + 1 || i === sel ? 1 : .55; ctx.fillRect(x + 3, 275 - h, w - 6, h); ctx.globalAlpha = 1; ctx.fillStyle = a.C('--cp-text-primary', '#e2eaf5'); ctx.fillText(String(v), x + w / 2, 295); });
        ctx.strokeStyle = a.C('--cp-neon-magenta', '#ff2d78'); ctx.lineWidth = 2; ctx.strokeRect(20 + cur0 * w + 1, 20, w - 2, 280);
      }
    };
  }

  /* ═════════ TIC-TAC-MINIMAX ═════════ */
  function mkTTT(a) {
    var ctx = a.ctx, b = [], round = 0, sum = 0, turn = 'X', phase = 'play', pt = 0, cx = 1, cy = 1, lx = 0, ly = 0, wl = null, BL = .2, res = [], S = 96, ox = 96, oy = 16;
    var LN = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    function win(bd) { for (var i = 0; i < 8; i++) { var l = LN[i]; if (bd[l[0]] && bd[l[0]] === bd[l[1]] && bd[l[1]] === bd[l[2]]) return { w: bd[l[0]], l: l }; } return null; }
    function full(bd) { return bd.every(Boolean); }
    function mm(bd, pl, d) { var w = win(bd); if (w) return w.w === 'O' ? 10 - d : d - 10; if (full(bd)) return 0; var best = pl === 'O' ? -99 : 99; for (var i = 0; i < 9; i++) if (!bd[i]) { bd[i] = pl; var v = mm(bd, pl === 'O' ? 'X' : 'O', d + 1); bd[i] = ''; best = pl === 'O' ? Math.max(best, v) : Math.min(best, v); } return best; }
    function aiMove() { var free = []; for (var i = 0; i < 9; i++) if (!b[i]) free.push(i); var m; if (Math.random() < BL) m = pick(free); else { var bs = -99; free.forEach(function (i) { b[i] = 'O'; var v = mm(b, 'X', 1); b[i] = ''; if (v > bs) { bs = v; m = i; } }); } b[m] = 'O'; a.beep(330, 0, .06, 'square', .03); }
    function reset() { b = ['', '', '', '', '', '', '', '', '']; turn = 'X'; phase = 'play'; wl = null; hud(); }
    function hud() { a.hud('GAME ' + (round + 1) + '/3   SCORE ' + sum); }
    function check() { var w = win(b); if (w) { wl = w.l; var pts = w.w === 'X' ? 100 : 0; sum += pts; res.push(w.w === 'X' ? 'W' : 'L'); phase = 'result'; pt = 1.6; a.beep(w.w === 'X' ? 880 : 180, w.w === 'X' ? 1200 : 80, .3, 'square', .04); a.eye(w.w === 'X' ? 'you beat minimax?! it blundered. (20% of the time it does. i am merciful.)' : 'minimax wins. it looked at every possible future. you looked at one.'); hud(); return true; }
      if (full(b)) { sum += 40; res.push('D'); phase = 'result'; pt = 1.6; a.eye('a draw. against perfect play, a draw is a win. (it is not. but it is respectable.)'); hud(); return true; } return false; }
    function play(i) { a.msg(); if (phase !== 'play' || b[i]) return; b[i] = 'X'; a.beep(520, 0, .05, 'square', .03); if (check()) return; aiMove(); check(); }
    reset(); a.msg('TIC-TAC-MINIMAX', 'you are X. the AI searches every future. it sometimes blunders.');
    return {
      pointer: function (x, y) { lx = x; ly = y; }, click: function () { var x = Math.floor((lx - ox) / S), y = Math.floor((ly - oy) / S); if (x >= 0 && y >= 0 && x < 3 && y < 3) play(y * 3 + x); },
      key: function (k) { var n = parseInt(k, 10); if (n >= 1 && n <= 9) { play((2 - Math.floor((n - 1) / 3)) * 3 + (n - 1) % 3); return; } if (k === UP) cy = Math.max(0, cy - 1); else if (k === DN) cy = Math.min(2, cy + 1); else if (k === LT) cx = Math.max(0, cx - 1); else if (k === RT) cx = Math.min(2, cx + 1); else if (k === ' ') play(cy * 3 + cx); },
      update: function (dt) { if (phase === 'result') { pt -= dt; if (pt <= 0) { round++; if (round >= 3) { a.over(sum, sum >= 140, sum >= 140 ? 'you took a game off a perfect-play algorithm. legendary.' : 'minimax remains unbeaten. it will outlive us all.'); return; } reset(); } } },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320); ctx.strokeStyle = a.C('--cp-neon-cyan', '#00f5ff'); ctx.lineWidth = 3; ctx.beginPath(); for (var i = 1; i < 3; i++) { ctx.moveTo(ox + i * S, oy + 6); ctx.lineTo(ox + i * S, oy + 3 * S - 6); ctx.moveTo(ox + 6, oy + i * S); ctx.lineTo(ox + 3 * S - 6, oy + i * S); } ctx.stroke();
        ctx.lineWidth = 6; b.forEach(function (v, i) { var x = ox + (i % 3) * S + S / 2, y = oy + Math.floor(i / 3) * S + S / 2; if (v === 'X') { ctx.strokeStyle = a.C('--cp-neon-magenta', '#ff2d78'); ctx.beginPath(); ctx.moveTo(x - 24, y - 24); ctx.lineTo(x + 24, y + 24); ctx.moveTo(x + 24, y - 24); ctx.lineTo(x - 24, y + 24); ctx.stroke(); } else if (v === 'O') { ctx.strokeStyle = a.C('--cp-neon-yellow', '#f7ff00'); ctx.beginPath(); ctx.arc(x, y, 26, 0, 7); ctx.stroke(); } });
        if (phase === 'play') { ctx.strokeStyle = 'rgba(128,128,128,.6)'; ctx.lineWidth = 2; ctx.strokeRect(ox + cx * S + 4, oy + cy * S + 4, S - 8, S - 8); }
        if (wl) { ctx.strokeStyle = a.C('--cp-text-primary', '#e2eaf5'); ctx.lineWidth = 4; var p1 = wl[0], p2 = wl[2]; ctx.beginPath(); ctx.moveTo(ox + (p1 % 3) * S + S / 2, oy + Math.floor(p1 / 3) * S + S / 2); ctx.lineTo(ox + (p2 % 3) * S + S / 2, oy + Math.floor(p2 / 3) * S + S / 2); ctx.stroke(); }
        ctx.fillStyle = a.C('--cp-text-muted', '#8a9ab8'); ctx.font = '13px monospace'; ctx.textAlign = 'center'; ctx.fillText(res.join('  '), 240, 312);
      }
    };
  }

  /* ═════════ TROPHY ROOM ═════════ */
  function nl() { return FX.nlState ? FX.nlState() : { xp: 0, mDone: 0, won: 0 }; }
  function plays() { return parseInt(lget('arc-plays') || '0', 10) || 0; }
  function wonG(id) { return !!lget('arc-won-' + id); }
  var ACH = [
    { id: 'first', n: 'FIRST COIN', d: 'play any game', t: function () { return plays() >= 1; } },
    { id: 'p10', n: 'REGULAR', d: 'play 10 games', t: function () { return plays() >= 10; } },
    { id: 'p50', n: 'CABINET RESIDENT', d: 'play 50 games', t: function () { return plays() >= 50; } },
    { id: 'win1', n: 'WINNER', d: 'win any game', t: function () { return parseInt(lget('arc-wins') || '0', 10) >= 1; } },
    { id: 'win5', n: 'ON A ROLL', d: 'win 5 times', t: function () { return parseInt(lget('arc-wins') || '0', 10) >= 5; } },
    { id: 'all', n: 'ARCADE CHAMPION', d: 'set a score on every machine', t: function () { return GAMES.every(function (g) { return best(g.id) > 0; }); } },
    { id: 'daily', n: 'CREATURE OF HABIT', d: 'play the daily starred game', t: function () { return !!lget('arc-daily'); } },
    { id: 'snake', n: 'LONG BOI', d: 'score 100 in snake', t: function () { return best('snake') >= 100; } },
    { id: 'stare', n: 'NO BLINK', d: 'win the stare contest', t: function () { return wonG('stare'); } },
    { id: 'merge', n: '2048 CLUB', d: 'reach 2048 in merge', t: function () { return wonG('merge'); } },
    { id: 'maze', n: 'LOST NO MORE', d: 'finish every maze', t: function () { return wonG('maze'); } },
    { id: 'dash', n: 'HUMAN DIJKSTRA', d: 'win dijkstra dash', t: function () { return wonG('dash'); } },
    { id: 'ttt', n: 'MINIMAX SLAYER', d: 'beat the tic-tac-minimax match', t: function () { return wonG('ttt'); } },
    { id: 'trace', n: 'HUMAN VISUALISER', d: 'finish trace the algorithm', t: function () { return wonG('trace'); } },
    { id: 'react', n: 'QUICK DRAW', d: 'average under 300 ms', t: function () { return wonG('react'); } },
    { id: 'rank', n: 'CERTIFIED RUNNER', d: 'reach 300 xp with the eye', t: function () { return nl().xp >= 300; } },
    { id: 'miss', n: 'YES BOSS', d: 'complete 5 missions', t: function () { return nl().mDone >= 5; } },
    { id: 'roast', n: 'ROAST CHAMPION', d: 'beat the eye in a roast battle', t: function () { return nl().won >= 1; } },
    { id: 'upside', n: '???', d: 'enter the upside down', h: 1, t: function () { return !!lget('arc-flag-upside'); } },
    { id: 'gb', n: '???', d: 'power on the handheld', h: 1, t: function () { return !!lget('arc-flag-gameboy'); } },
    { id: 'boss', n: 'KING SLAYER', d: 'defeat the glitch king', h: 1, t: function () { return parseInt(lget('boss-wins') || '0', 10) > 0; } },
    { id: 'adv', n: 'ARCHIVIST', d: 'find 5 adventure endings', h: 1, t: function () { return !!(FX.advStats && FX.advStats().endings >= 5); } }
  ];
  var REAL = { upside: 'UPSIDE DOWNER', gb: 'MEMO BOY' };
  function checkAch() {
    var have = (lget('arc-ach') || '').split(',').filter(Boolean), fresh = [];
    ACH.forEach(function (x) { if (have.indexOf(x.id) === -1 && x.t()) { have.push(x.id); fresh.push(x); } });
    if (fresh.length) { lset('arc-ach', have.join(',')); fresh.forEach(function (x) { later.push('TROPHY UNLOCKED: ' + (REAL[x.id] || x.n) + '. +10 xp.'); if (FX.gainXP) FX.gainXP(10); }); }
    return fresh;
  }
  function trophies() {
    stopGame(); view = 'trophy'; dead = false; checkAch(); var have = (lget('arc-ach') || '').split(',').filter(Boolean); head('\u2605 TROPHIES  ' + have.length + '/' + ACH.length); box.className = 'arc-box wide';
    var list = el('div', 'arc-list two'); box.appendChild(list);
    ACH.forEach(function (x) { var ok = have.indexOf(x.id) !== -1, it = el('div', 'arc-item' + (ok ? ' sel' : '')), n = el('span', 'arc-n', ok ? '\u2605' : '\u00B7'), gg = el('span', 'arc-g'); gg.appendChild(document.createTextNode(ok ? (REAL[x.id] || x.n) : (x.h ? '? ? ?' : x.n))); gg.appendChild(el('span', 'arc-d', ok || !x.h ? x.d : 'a secret. find it.')); it.appendChild(n); it.appendChild(gg); list.appendChild(it); });
    eyeEl = el('div', 'arc-eye', have.length === ACH.length ? 'every trophy. i have nothing left to give you. (a compliment. you are good.)' : 'trophies pay 10 xp each. hidden ones hide. i am not telling.'); box.appendChild(eyeEl);
    var f = el('div', 'arc-foot'); f.appendChild(el('span', '', 'ESC BACK')); box.appendChild(f);
  }

  /* ═════════ TRACE THE ALGORITHM (algorithm visualiser: predict the next node) ═════════ */
  function mkTrace(a) {
    var ctx = a.ctx, ALG = ['BFS', 'DFS', 'DIJKSTRA'], RULE = { BFS: 'BFS: earliest-discovered node goes next (queue). ties: lowest #', DFS: 'DFS: go deep to the lowest unvisited neighbour; stuck? backtrack', DIJKSTRA: 'DIJKSTRA: smallest tentative distance goes next. ties: lowest #' };
    var WHY = { BFS: 'bfs keeps a queue: nodes are visited in the order they were discovered.', DFS: 'dfs goes as deep as it can first, then backtracks to the most recent node with an unvisited neighbour.', DIJKSTRA: 'dijkstra always finalises the unvisited node with the smallest tentative distance.' };
    var N = 8, round = 0, nodes, adj, w, ord, vis, step, dist, score = 0, mistakes = 0, phase = 'ask', pt = 0, flashOk = -1, flashBad = -1, lx = 0, ly = 0, hintTxt = '', watch = false, wt = 0, perfect = true, struct;
    function key2(i, j) { return i < j ? i + '-' + j : j + '-' + i; }
    function build() {
      nodes = []; adj = []; w = {}; var i, j; for (i = 0; i < N; i++) { adj.push([]); nodes.push({ x: 62 + (i % 4) * 118 + R(-22, 22), y: 105 + Math.floor(i / 4) * 130 + R(-26, 26) }); }
      function link(p, q) { if (adj[p].indexOf(q) === -1) { adj[p].push(q); adj[q].push(p); w[key2(p, q)] = 1 + Math.floor(Math.random() * 9); } }
      function dd(p, q) { return Math.hypot(nodes[p].x - nodes[q].x, nodes[p].y - nodes[q].y); }
      for (i = 1; i < N; i++) { var bj = 0, bd = 1e9; for (j = 0; j < i; j++) { var d = dd(i, j); if (d < bd) { bd = d; bj = j; } } link(i, bj); }
      var tries = 0, extra = 0; while (extra < 4 && tries++ < 60) { var p = Math.floor(Math.random() * N), q = Math.floor(Math.random() * N); if (p !== q && adj[p].indexOf(q) === -1 && dd(p, q) < 210) { link(p, q); extra++; } }
      adj.forEach(function (l) { l.sort(function (x, y) { return x - y; }); }); order(); vis = [0]; step = 1;
    }
    function order() {
      var alg = ALG[round]; ord = []; struct = []; var seen = {}, k;
      if (alg === 'BFS') { var q = [0]; seen[0] = 1; while (q.length) { struct.push(q.slice()); var u = q.shift(); ord.push(u); adj[u].forEach(function (v) { if (!seen[v]) { seen[v] = 1; q.push(v); } }); } }
      else if (alg === 'DFS') { var stack = []; (function dfs(u) { seen[u] = 1; ord.push(u); stack.push(u); struct.push(stack.slice()); adj[u].forEach(function (v) { if (!seen[v]) dfs(v); }); stack.pop(); })(0); }
      else { dist = []; for (k = 0; k < N; k++) dist.push(1e9); dist[0] = 0; var done = {}; for (;;) { var u2 = -1, b = 1e9; for (k = 0; k < N; k++) if (!done[k] && dist[k] < b) { b = dist[k]; u2 = k; } if (u2 < 0) break; done[u2] = 1; ord.push(u2); struct.push(null); adj[u2].forEach(function (v) { if (dist[u2] + w[key2(u2, v)] < dist[v]) dist[v] = dist[u2] + w[key2(u2, v)]; }); } }
      if (alg === 'DIJKSTRA') { var d0 = []; /* final distances kept in dist */ }
    }
    function tent(v) { var best = 1e9; vis.forEach(function (u) { if (adj[u].indexOf(v) !== -1) { var dv = fin[u] + w[key2(u, v)]; if (dv < best) best = dv; } }); return best; }
    var fin = [];
    function finals() { fin = []; vis.forEach(function (u) { fin[u] = dist ? dist[u] : 0; }); }
    function hud() { a.hud('ROUND ' + (round + 1) + '/3 ' + ALG[round] + '   SCORE ' + score + '   MISTAKES ' + mistakes + '/3'); }
    function start() { build(); phase = 'ask'; perfect = true; hintTxt = ''; watch = false; finals(); hud(); a.eye(WHY[ALG[round]]); }
    function nextStep() { if (step >= ord.length) { phase = 'round'; pt = 1.6; if (perfect) { score += 30; a.eye('perfect round. +30 bonus. you ARE the algorithm.'); } hud(); return; } phase = 'ask'; }
    function guess(i) {
      a.msg(); if (phase !== 'ask' || vis.indexOf(i) !== -1) return; var right = ord[step];
      if (i === right) { score += 10; flashOk = i; a.beep(600 + step * 40, 0, .06, 'square', .03); } else { mistakes++; perfect = false; flashBad = i; flashOk = right; a.beep(160, 90, .25, 'sawtooth', .05); a.eye(WHY[ALG[round]] + ' (the answer was ' + (right + 1) + ')'); }
      vis.push(right); step++; finals(); hud(); phase = i === right ? 'ask' : 'reveal'; pt = .9; if (i === right) { setTimeout(function () { flashOk = -1; }, 350); nextStep(); }
      if (mistakes >= 3) { phase = 'dead'; a.over(score, false, 'three mistakes. the algorithm moves on without you. it always does.'); }
    }
    start(); a.msg('TRACE THE ALGORITHM', 'click (or press 1-8) the node the algorithm visits NEXT. H = hint (-5), V = watch it run.');
    return {
      pointer: function (x, y) { lx = x; ly = y; },
      click: function () { for (var i = 0; i < N; i++) if (Math.hypot(lx - nodes[i].x, ly - nodes[i].y) < 20) { guess(i); return; } },
      key: function (c) { a.msg(); var n = parseInt(c, 10); if (n >= 1 && n <= N) { guess(n - 1); return; }
        if (c === 'h' && phase === 'ask') { score = Math.max(0, score - 5); var s = struct[step - 1]; hintTxt = ALG[round] === 'DIJKSTRA' ? 'hint: next = smallest tentative distance (shown on the nodes)' : ALG[round] === 'BFS' ? 'queue (front first): ' + struct[step].map(function (x) { return x + 1; }).join(' ') : 'stack (path from root): ' + struct[step - 1].map(function (x) { return x + 1; }).join(' > '); a.eye(hintTxt); hud(); }
        if (c === 'v' && phase === 'ask') { watch = true; wt = 0; perfect = false; a.eye('watching ' + ALG[round] + ' run. no points for the rest of this round.'); } },
      update: function (dt) {
        if (watch) { wt -= dt; if (wt <= 0 && step < ord.length) { vis.push(ord[step]); step++; finals(); flashOk = ord[step - 1]; wt = .6; a.beep(400 + step * 40, 0, .05, 'triangle', .03); setTimeout(function () { flashOk = -1; }, 300); } if (step >= ord.length && watch) { watch = false; nextStep(); } return; }
        if (phase === 'reveal') { pt -= dt; if (pt <= 0) { flashOk = -1; flashBad = -1; nextStep(); } }
        else if (phase === 'round') { pt -= dt; if (pt <= 0) { round++; if (round >= 3) { a.over(score, true, 'bfs, dfs, dijkstra. you executed them all in your head. i am humbled. (i am not.)'); phase = 'done'; return; } start(); a.msg(); } }
      },
      draw: function () {
        ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); ctx.fillRect(0, 0, 480, 320); var i, alg = ALG[round]; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 2; for (i = 0; i < N; i++) adj[i].forEach(function (j) { if (j < i) return; var both = vis.indexOf(i) !== -1 && vis.indexOf(j) !== -1; ctx.strokeStyle = both ? a.C('--cp-neon-cyan', '#00f5ff') : 'rgba(128,128,128,.4)'; ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke();
          if (alg === 'DIJKSTRA') { ctx.fillStyle = a.C('--cp-bg-deep', '#04060a'); var mx = (nodes[i].x + nodes[j].x) / 2, my = (nodes[i].y + nodes[j].y) / 2; ctx.fillRect(mx - 8, my - 8, 16, 16); ctx.fillStyle = a.C('--cp-neon-yellow', '#f7ff00'); ctx.font = 'bold 12px monospace'; ctx.fillText(String(w[key2(i, j)]), mx, my + 1); } });
        for (i = 0; i < N; i++) { var v = vis.indexOf(i) !== -1, front = !v && vis.some(function (u) { return adj[u].indexOf(i) !== -1; }), n = nodes[i];
          ctx.fillStyle = flashBad === i ? a.C('--cp-neon-magenta', '#ff2d78') : flashOk === i ? a.C('--cp-neon-green', '#00ff9f') : v ? a.C('--cp-neon-cyan', '#00f5ff') : a.C('--cp-bg-deep', '#04060a'); ctx.beginPath(); ctx.arc(n.x, n.y, 17, 0, 7); ctx.fill();
          ctx.strokeStyle = front ? a.C('--cp-neon-yellow', '#f7ff00') : v ? a.C('--cp-neon-cyan', '#00f5ff') : 'rgba(128,128,128,.7)'; ctx.lineWidth = front ? 3 : 2; ctx.stroke();
          ctx.fillStyle = v || flashBad === i || flashOk === i ? a.C('--cp-bg-deep', '#04060a') : a.C('--cp-text-primary', '#e2eaf5'); ctx.font = 'bold 15px monospace'; ctx.fillText(String(i + 1), n.x, n.y + 1);
          if (alg === 'DIJKSTRA') { var tx = v ? fin[i] : front ? tent(i) : null; if (tx != null) { ctx.fillStyle = v ? a.C('--cp-neon-green', '#00ff9f') : a.C('--cp-neon-yellow', '#f7ff00'); ctx.font = 'bold 12px monospace'; ctx.fillText('d=' + tx, n.x, n.y - 28); } } }
        ctx.fillStyle = a.C('--cp-neon-magenta', '#ff2d78'); ctx.font = 'bold 14px monospace'; ctx.textAlign = 'left'; ctx.fillText(alg + ' from node 1', 10, 16);
        ctx.fillStyle = a.C('--cp-text-muted', '#8a9ab8'); ctx.font = '11px monospace'; ctx.fillText('visited: ' + vis.map(function (x) { return x + 1; }).join(' '), 10, 36); ctx.textAlign = 'center'; ctx.fillText(RULE[alg], 240, 308);
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
    root.classList.toggle('upside', on); if (on) lset('arc-flag-upside', '1'); beep(on ? 110 : 330, on ? 40 : 660, .9, 'sawtooth', .04);
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
    if (on) { lset('arc-flag-gameboy', '1');
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
