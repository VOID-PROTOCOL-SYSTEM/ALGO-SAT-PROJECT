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
  var arc, box, view = 'menu', sel = 0, cur = null, raf = 0, last = 0, keys = {}, cv, cx, msgEl, hudEl, typeEl, eyeEl, dead = false, runBest = 0, curG = null;
  function norm(k) { if (k.length === 1) { k = k.toLowerCase(); return { w: UP, s: DN, a: LT, d: RT }[k] || k; } return k; }
  var EYE_MENU = ['insert coin. or do not. i am an eye, not a cashier.', 'high scores are saved in your browser. so are your sins.', 'five games. zero ads. one judgemental cartoon.', 'pick wisely. i am keeping score. literally.', 'you found the arcade. the konami police have been notified. (they are asleep.)'];
  function noopCtx() { return new Proxy({}, { get: function (t, k) { return k === 'measureText' ? function () { return { width: 10 }; } : function () {}; }, set: function () { return true; } }); }
  var GAMES = [
    { id: 'snake', name: 'SNAKE', d: 'eat the data. do not eat yourself.', c: '\u2190\u2191\u2193\u2192 / WASD', mk: mkSnake },
    { id: 'pong', name: 'PONG', d: 'first to 5 beats the cpu. mouse or arrows.', c: '\u2191\u2193 / mouse', mk: mkPong },
    { id: 'breakout', name: 'BREAKOUT', d: 'smash the memo wall. three lives.', c: '\u2190\u2192 / mouse, SPACE launches', mk: mkBreakout },
    { id: 'stare', name: 'STARE CONTEST', d: 'outstare the eye. twelve seconds. do not move.', c: 'do NOTHING', mk: mkStare },
    { id: 'typist', name: 'ALGO TYPIST', d: '30 seconds of algorithm vocabulary.', c: 'type the word, SPACE/ENTER', mk: mkTypist }
  ];
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
    stopGame(); view = 'menu'; head('\u2014 INSERT COIN \u2014');
    var list = el('div', 'arc-list'); box.appendChild(list);
    GAMES.forEach(function (g, i) {
      var it = el('div', 'arc-item' + (i === sel ? ' sel' : '')), n = el('span', 'arc-n', String(i + 1)), gg = el('span', 'arc-g'), b = el('span', 'arc-b', best(g.id) ? 'HI ' + best(g.id) : '');
      gg.appendChild(document.createTextNode(g.name)); gg.appendChild(el('span', 'arc-d', g.d)); it.appendChild(n); it.appendChild(gg); it.appendChild(b);
      it.addEventListener('mouseenter', function () { sel = i; $$('.arc-item', list).forEach(function (x, k) { x.classList.toggle('sel', k === i); }); beep(900, 0, .03, 'square', .015); });
      it.addEventListener('click', function () { sel = i; startGame(GAMES[i]); }); list.appendChild(it);
    });
    eyeEl = el('div', 'arc-eye', pick(EYE_MENU)); box.appendChild(eyeEl);
    var f = el('div', 'arc-foot'); f.appendChild(el('span', '', '\u2191\u2193 SELECT  \u00B7  ENTER PLAY  \u00B7  1-5 QUICK START')); f.appendChild(el('span', '', 'ESC EXIT')); box.appendChild(f);
  }
  function refreshSel() { $$('.arc-item').forEach(function (x, k) { x.classList.toggle('sel', k === sel); }); }
  function startGame(g) {
    stopGame(); curG = g; view = 'game'; dead = false; keys = {}; head(g.name); runBest = best(g.id);
    hudEl = el('div', 'arc-hud'); var hl = el('span', '', 'SCORE 0'); hl.id = 'arc-score'; var hr = el('span', '', 'HI ' + runBest); hr.id = 'arc-hi'; hudEl.appendChild(hl); hudEl.appendChild(hr); box.appendChild(hudEl);
    var st = el('div', 'arc-stage'); cv = el('canvas', 'arc-cv'); cv.width = 480; cv.height = 320; st.appendChild(cv); msgEl = el('div', 'arc-msg'); st.appendChild(msgEl); box.appendChild(st);
    typeEl = null; if (g.id === 'typist') { typeEl = el('input', 'arc-type'); typeEl.type = 'text'; typeEl.autocomplete = 'off'; typeEl.spellcheck = false; typeEl.autocapitalize = 'off'; typeEl.placeholder = 'type here...'; box.appendChild(typeEl); }
    var pad = el('div', 'arc-pad'); [['', ''], ['\u25B2', UP], ['', ''], ['\u25C0', LT], ['\u25BC', DN], ['\u25B6', RT]].forEach(function (p) {
      var b = el('i', '', p[0]); if (p[1]) { b.addEventListener('pointerdown', function (e) { e.preventDefault(); keys[p[1]] = true; cur && cur.key && cur.key(p[1]); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { b.addEventListener(ev, function () { keys[p[1]] = false; }); }); } pad.appendChild(b); }); box.appendChild(pad);
    var f = el('div', 'arc-foot'); f.appendChild(el('span', '', g.c)); f.appendChild(el('span', '', 'ENTER RETRY  \u00B7  ESC MENU')); box.appendChild(f);
    eyeEl = el('div', 'arc-eye', ''); box.appendChild(eyeEl);
    var ctx = cv.getContext('2d') || noopCtx();
    var api = { W: 480, H: 320, ctx: ctx, keys: keys, cv: cv, beep: beep, type: typeEl,
      hud: function (t) { var s = $('#arc-score'); if (s) s.textContent = t; }, msg: function (h, p) { msgEl.textContent = ''; if (h) { msgEl.appendChild(el('h3', '', h)); if (p) msgEl.appendChild(el('p', '', p)); } },
      eye: function (t) { eyeEl.textContent = t; }, over: gameOver, C: col, R: R };
    cur = g.mk(api); api.eye(pick(HELLO[g.id] || ['go.']));
    cv.addEventListener('pointermove', function (e) { if (cur && cur.pointer) { var r = cv.getBoundingClientRect(); cur.pointer((e.clientX - r.left) * 480 / r.width, (e.clientY - r.top) * 320 / r.height); } });
    cv.addEventListener('pointerdown', function (e) { if (dead) { startGame(g); return; } if (cur && cur.click) cur.click(); });
    if (typeEl) { typeEl.addEventListener('input', function () { cur && cur.onInput && cur.onInput(typeEl.value); }); setTimeout(function () { typeEl.focus(); }, 30); }
    last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function loop(t) { raf = requestAnimationFrame(loop); var dt = Math.min(.05, (t - last) / 1000); last = t; if (cur && !dead) { cur.update(dt); cur.draw(); } else if (cur && dead) cur.draw && cur.draw(); }
  function stopGame() { cancelAnimationFrame(raf); raf = 0; if (cur && cur.destroy) cur.destroy(); cur = null; curG = null; }
  var HELLO = { snake: ['eat. grow. try not to become a metaphor.'], pong: ['i am the cpu. i do not get tired. you do.'], breakout: ['the wall is just a memo with commitment issues.'], stare: ['i have no eyelids. well. one. do not move.'], typist: ['algorithm words. your fingers. go.'] };
  var BAD = ['that was painful to watch. i watched all of it.', 'a bold attempt. a bad one. bold.', 'the cabinet saw that. the cabinet is disappointed.'];
  var GOOD = ['okay okay. that was actually good.', 'new high score. i am legally obligated to be impressed.', 'not bad, runner. not bad at all.'];
  function gameOver(score, win, line) {
    if (dead) return; dead = true; var g = curG, nb = score > best(g.id), p = '';
    if (nb && score > 0) { lset('arc-' + g.id, String(score)); p += FX.gainXP ? FX.gainXP(5) : ''; $('#arc-hi') && ($('#arc-hi').textContent = 'HI ' + score); }
    if (win) p += FX.gainXP ? FX.gainXP(10) : '';
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
      if (c === UP) { sel = (sel + GAMES.length - 1) % GAMES.length; refreshSel(); beep(900, 0, .03, 'square', .015); }
      else if (c === DN) { sel = (sel + 1) % GAMES.length; refreshSel(); beep(900, 0, .03, 'square', .015); }
      else if (k === 'Enter' || k === ' ') startGame(GAMES[sel]);
      else if (/^[1-9]$/.test(k) && GAMES[+k - 1]) { sel = +k - 1; startGame(GAMES[sel]); }
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
