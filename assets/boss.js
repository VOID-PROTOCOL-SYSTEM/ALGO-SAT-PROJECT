/* MEMO ARCHIVE — GLITCH INVADERS: boss fight (3 waves + KERNEL PANIC, three phases) */
(function () {
  var FX = window.ArchiveFX = window.ArchiveFX || {}, U = FX.u; if (!U) return;
  var $ = U.$, rnd = U.rnd, pick = U.pick, lget = U.lget, lset = U.lset, reduce = U.reduce;
  var DATA = { items: [] }; try { DATA = JSON.parse($('#archive-data').textContent); } catch (e) {}
  var running = false, lastGame = null; FX.bossActive = false;
  function snd() { return FX.sound || { on: false, tone: function () {} }; }

  var SPR = {
    bug:  ['..#..#..', '...##...', '..####..', '.##..##.', '########', '#.####.#', '#.#..#.#', '...##...'],
    nul:  ['...##...', '..####..', '.######.', '########', '##.##.##', '########', '..#..#..', '.#....#.'],
    seg:  ['.######.', '########', '##.##.##', '########', '.######.', '..#..#..', '.##..##.', '##....##'],
    boss: ['......##########......', '....##############....', '...################...', '..##################..', '.####..########..####.', '.###....######....###.', '.####..########..####.',
           '######################', '######################', '.####.##.####.##.####.', '..###.##.####.##.###..', '...##..#.####.#..##...', '....#..#......#..#....', '.......##....##.......']
  };
  var cache = {};
  function sprite(key, col, u) {
    var k = key + col + u; if (cache[k]) return cache[k]; var b = SPR[key], c = document.createElement('canvas'); c.width = b[0].length * u; c.height = b.length * u;
    var x = c.getContext('2d'); x.fillStyle = col; for (var r = 0; r < b.length; r++) for (var q = 0; q < b[r].length; q++) if (b[r][q] === '#') x.fillRect(q * u, r * u, u, u);
    return (cache[k] = c);
  }
  var TYPES = { bug: { spr: 'bug', col: '#00ff9f', hp: 1, pts: 100 }, nul: { spr: 'nul', col: '#00f5ff', hp: 1, pts: 150 }, seg: { spr: 'seg', col: '#ffb000', hp: 2, pts: 200 }, t404: { spr: null, col: '#ff2d78', hp: 3, pts: 300 } };
  var WAVES = [['bug', 'bug', 'bug'], ['nul', 'seg', 'bug', 'bug'], ['t404', 'seg', 'nul', 'bug']];

  var SAY = {
    start: ['oh no. the glitch is back. defend the archive, runner.', 'kernel panic incoming. aim true. i believe in you. (statistically.)'],
    w1: ['wave one. warm-up bugs. try not to die.'], w2: ['wave two. they brought friends. fast ones.'], w3: ['wave three. the tanky 404s. focus them down.'],
    clear: ['clean sweep.', 'nice shooting.', 'wave cleared. i am only slightly impressed.'],
    block: ['they hit a notebook! protect the files!', 'ouch. that was a memo.'], low: ['one life left. no pressure.', 'careful. you only have one heart. uno.'],
    combo: ['combo x10! show off.', 'you are on fire. figuratively. please.'], R: ['rapid fire. pew pew pew.'], S: ['spread shot. shotgun mode.'], H: ['shield up. brief invincibility.'], '+': ['file restored. you are a hero.'],
    bomb: ['EMP deployed. satisfying.'], bossIntro: ['that is not a bug. that is KERNEL PANIC. oh no.', 'it is big. it is angry. you can do this.'],
    p2: ['phase two! it is spawning minions!', 'it is getting serious. so am i.'], p3: ['RAGE MODE. watch for the beam! move!', 'it is red. red means bad. dodge the laser.'],
    bossLow: ['almost there! finish it!', 'it is wobbling! one more push!'], hit: ['ouch.', 'that looked like it hurt.'], idle: ['are you going to shoot? or is this a meditation game?'],
    win: ['KERNEL PANIC PURGED. the archive lives. i am not crying. you are.', 'you did it. i never doubted you. (i doubted you a lot.)'],
    lose: ['archive compromised... we will rebuild. i believe in second tries.', 'that went badly. shall we pretend it did not?']
  };

  function start(opts) {
    if (running) return; running = true; FX.bossActive = true; opts = opts || {};
    FX.closeTerm && FX.closeTerm(); var pw = document.querySelector('.pal-wrap.open'); if (pw) pw.classList.remove('open');
    var prevOv = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
    var ov = document.createElement('div'); ov.className = 'bossfight';
    ov.innerHTML = '<canvas></canvas><div class="bf-top"><span>SCORE <b class="bf-score">0</b></span><span class="bf-wavel">WAVE <b>1</b>/3</span><span class="bf-hearts"></span><span class="bf-emp"></span><span class="bf-combo"></span></div>' +
      '<div class="bf-boss"><div class="bf-bn">KERNEL PANIC</div><div class="bf-bar"><b></b></div></div><div class="bf-card"></div>' +
      '<div class="bf-say"><div class="bf-eye"><svg viewBox="0 0 32 32"><path d="M2 16 Q16 3 30 16 Q16 29 2 16Z" fill="none" stroke="#ff2d78" stroke-width="1.6"/><circle cx="16" cy="16" r="5" fill="#ff2d78"/><circle cx="17.5" cy="14.5" r="1.4" fill="#04060a"/></svg></div><div class="bf-bubble"></div></div>' +
      '<div class="bf-keys">MOUSE / ARROWS: MOVE &nbsp;·&nbsp; CLICK / SPACE: FIRE &nbsp;·&nbsp; RIGHT-CLICK / B: EMP &nbsp;·&nbsp; P: PAUSE &nbsp;·&nbsp; ESC: QUIT</div>';
    document.body.appendChild(ov);
    var cv = ov.querySelector('canvas'), ctx = cv.getContext('2d'), dpr = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, u = 4;
    var elScore = ov.querySelector('.bf-score'), elWave = ov.querySelector('.bf-wavel'), elHearts = ov.querySelector('.bf-hearts'), elEmp = ov.querySelector('.bf-emp'), elCombo = ov.querySelector('.bf-combo');
    var elBoss = ov.querySelector('.bf-boss'), elBhp = ov.querySelector('.bf-bar b'), card = ov.querySelector('.bf-card'), bubble = ov.querySelector('.bf-bubble');
    function resize() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); u = Math.max(3, Math.min(5, Math.floor(Math.min(W, 1100) / 240))); }
    resize(); addEventListener('resize', resize);

    var stars = []; for (var si = 0; si < 70; si++) stars.push({ x: Math.random(), y: Math.random(), s: Math.random() * 1.6 + .4, v: Math.random() * 30 + 10 });
    var G, raf, last = performance.now(), bTimer, bQueueT = 0, touch = false, mouseFire = false, keys = {};

    function newGame() {
      var n = DATA.items.length || 6, tw = Math.min(W - 60, n * 110), bw = tw / n - 8, bx = (W - tw) / 2 + 4, blocks = [];
      for (var i = 0; i < n; i++) blocks.push({ x: bx + i * (bw + 8), w: bw, hp: 3, max: 3, lab: (i + 1 < 10 ? '0' : '') + (i + 1) });
      G = { state: 'intro', t: 0, score: 0, lives: 3, bombs: 2, wave: 0, combo: 0, comboT: 0, shake: 0, flash: 0, shots: 0, time: 0, idleT: 0, nextWaveT: 0,
            p: { x: W / 2, tx: W / 2, cd: 0, inv: 0, shield: 0, rapid: 0, spread: 0 }, bullets: [], eb: [], en: [], parts: [], pups: [], blocks: blocks, boss: null,
            form: { x: 0, y: 0, dir: 1, spd: 40, step: 0 }, diveT: 3, shootT: 2, banner: null, deadT: 0, ended: false, maxBlocks: n, hitsN: 0 };
      G.archY = H - 38; G.py = H - 98;
    }
    newGame();

    /* ── neural link voice inside the game ── */
    var sayHide, sayType, lastSay = 0;
    function bsay(cat, force) {
      var n = Date.now(); if (!force && n - lastSay < 3200) return; lastSay = n; var arr = SAY[cat]; if (!arr) return; var t = pick(arr); if (FX.flair && Math.random() < .5) t = FX.flair(t);
      clearInterval(sayType); clearTimeout(sayHide); bubble.textContent = ''; bubble.classList.add('show'); var i = 0;
      sayType = setInterval(function () { bubble.textContent = t.slice(0, ++i); if (i >= t.length) clearInterval(sayType); }, 18);
      sayHide = setTimeout(function () { bubble.classList.remove('show'); }, 3600 + t.length * 40);
    }

    /* ── cards (intro / end) ── */
    function showCard(html) { card.innerHTML = html; card.classList.add('on'); }
    function hideCard() { card.classList.remove('on'); }
    function introCard() {
      var best = parseInt(lget('boss-best') || '0', 10), wins = parseInt(lget('boss-wins') || '0', 10);
      showCard('<h2>GLITCH INVADERS</h2><p>// DEFEND THE ARCHIVE //</p><p>The glitch is eating your notebooks. Your files are the blocks at the bottom.<br>Survive three waves, then face <b style="color:#ff2d78">KERNEL PANIC</b>.</p>' +
        '<p>power-ups: <b style="color:#00f5ff">R</b> rapid · <b style="color:#b44dff">S</b> spread · <b style="color:#00ff9f">H</b> shield · <b style="color:#ffb000">+</b> repair</p>' + (wins ? '<p>wins: ' + wins + ' &nbsp; best: ' + best + '</p>' : '') +
        '<div class="bf-row"><span class="bf-btn hot" data-a="go">START</span><span class="bf-btn" data-a="quit">QUIT</span></div><p style="margin-top:14px">CLICK / SPACE / ENTER to begin</p>');
    }
    function endCard(win) {
      var secs = Math.round(G.time), best = parseInt(lget('boss-best') || '0', 10), newBest = G.score > best; if (newBest) lset('boss-best', String(G.score));
      var acc = G.shots ? Math.min(100, Math.round(G.hitsN / G.shots * 100)) : 0;
      if (win) { lset('boss-wins', String(parseInt(lget('boss-wins') || '0', 10) + 1)); lset('boss-beaten', '1'); }
      showCard('<h2 style="' + (win ? '' : 'color:#ff2d78 !important') + '">' + (win ? 'KERNEL PANIC PURGED' : 'ARCHIVE COMPROMISED') + '</h2>' +
        '<div class="bf-big">' + G.score.toLocaleString() + (newBest ? ' &nbsp;★ NEW BEST' : '') + '</div><p>time ' + secs + 's &nbsp;·&nbsp; accuracy ' + acc + '% &nbsp;·&nbsp; files saved ' + G.blocks.filter(function (b) { return b.hp > 0; }).length + '/' + G.maxBlocks + '</p>' +
        (win ? '<p>the archive is safe. you earned the <b style="color:#ffd400">BOSS SLAYER</b> badge on your runner ID.</p>' : '<p>the glitch won this round. the archive is still... mostly there.</p>') +
        '<div class="bf-row"><span class="bf-btn hot" data-a="again">' + (win ? 'PLAY AGAIN' : 'RETRY') + '</span><span class="bf-btn" data-a="quit">EXIT</span></div>');
      if (win) { FX.renderId && FX.renderId(); }
      lastGame = { win: win, score: G.score };
    }
    card.addEventListener('click', function (e) { var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (a === 'go') begin(); else if (a === 'again') { reset(); begin(); } else if (a === 'quit') quit(); });
    function reset() { hideCard(); newGame(); updateHud(); }
    function begin() {
      if (G.state !== 'intro') return; hideCard(); G.state = 'play';
      if (opts.start === 'boss') { G.wave = 3; spawnBoss(); } else { nextWave(); }
      bsay('start', true);
    }

    /* ── spawning ── */
    function nextWave() {
      G.wave++; if (G.wave > 3) { spawnBossIntro(); return; }
      var rows = WAVES[G.wave - 1], cols = Math.max(4, Math.min(G.wave === 3 ? 7 : 8, Math.floor((W - 180) / (u * 15)))), sx = u * 15, sy = u * 12; G.en = [];
      rows.forEach(function (t, gy) { for (var gx = 0; gx < cols; gx++) { var T = TYPES[t]; G.en.push({ type: t, gx: gx, gy: gy, x: 0, y: 0, hp: T.hp, w: (t === 't404' ? 11 : 8) * u, h: (t === 't404' ? 7 : 8) * u, dive: false, flash: 0, ph: Math.random() * 6 }); } });
      G.form = { x: (W - (cols - 1) * sx) / 2, y: 90 + u * 4, dir: 1, spd: 34 + G.wave * 12, sx: sx, sy: sy, cols: cols, total: G.en.length };
      G.shootT = 1.6; G.diveT = 3.5; elWave.querySelector('b').textContent = G.wave;
      G.banner = { t: 1.8, text: 'WAVE ' + G.wave, sub: ['WARM-UP', 'THEY BROUGHT FRIENDS', 'HEAVY ARMOUR'][G.wave - 1] }; bsay('w' + G.wave, true);
    }
    function spawnBossIntro() { G.state = 'bossintro'; G.t0 = 3; G.banner = { t: 3, text: '⚠ WARNING ⚠', sub: 'KERNEL PANIC APPROACHING', red: true }; G.flash = .6; bsay('bossIntro', true); snd().tone(90, 60, .6, 'sawtooth', .07); }
    function spawnBoss() {
      var bu = Math.round(u * 1.7), mx = opts.bossHp || 110;
      G.boss = { x: W / 2, y: -150, bu: bu, w: 22 * bu, h: 14 * bu, hp: mx, max: mx, phase: 1, t: 0, fireT: 1.6, ringT: 2, spawnT: 5, beamT: 3, beam: null, flash: 0, enter: true, rot: 0 };
      G.state = 'boss'; elBoss.classList.add('on'); elWave.innerHTML = 'BOSS'; G.en = [];
    }

    /* ── helpers ── */
    function boom(x, y, col, n, spd) { for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = rnd(30, spd || 220); G.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(.4, 1), max: 1, col: col, s: rnd(1.5, 4) }); } }
    function shake(n) { if (!reduce) G.shake = Math.max(G.shake, n); }
    function ebullet(x, y, vx, vy, col) { G.eb.push({ x: x, y: y, vx: vx, vy: vy, r: 4, col: col || '#ff2d78' }); }
    function addScore(pts) { var mult = 1 + Math.floor(G.combo / 5); G.score += pts * mult; }
    function killEnemy(e, i) {
      G.en.splice(i, 1); var T = TYPES[e.type]; boom(e.x, e.y, T.col, 14); G.combo = G.comboT > 0 ? G.combo + 1 : 1; G.comboT = 1.5; addScore(T.pts);
      if (G.combo === 10) bsay('combo', true); snd().tone(260, 50, .14, 'sawtooth', .04);
      if (Math.random() < .15) G.pups.push({ x: e.x, y: e.y, k: pick(['R', 'S', 'H', '+']), vy: 95 });
    }
    function hurtBlock(x, dmg) {
      var best = null, bd = 1e9; G.blocks.forEach(function (b) { if (b.hp <= 0) return; var d = Math.abs(b.x + b.w / 2 - x); if (d < bd) { bd = d; best = b; } });
      if (!best) return; best.hp -= dmg || 1; boom(best.x + best.w / 2, G.archY, '#00f5ff', 12, 160); shake(8); snd().tone(150, 50, .2, 'square', .05);
      if (best.hp <= 0) { best.hp = 0; boom(best.x + best.w / 2, G.archY, '#ff2d78', 26, 260); } bsay('block');
    }
    function hurtPlayer() {
      var p = G.p; if (p.inv > 0) return; if (p.shield > 0) { p.shield = 0; p.inv = 1; boom(p.x, G.py, '#00ff9f', 16); snd().tone(500, 200, .12, 'triangle', .05); return; }
      G.lives--; p.inv = 1.6; G.combo = 0; G.comboT = 0; boom(p.x, G.py, '#00f5ff', 30, 280); shake(14); G.flash = .3; snd().tone(200, 40, .3, 'sawtooth', .07);
      if (G.lives === 1) bsay('low', true); else bsay('hit');
    }
    function dropBullets(dmgEnemies, bossDmg) {
      G.eb = []; G.flash = .7; shake(18); snd().tone(120, 40, .5, 'sawtooth', .08);
      for (var i = G.en.length - 1; i >= 0; i--) { var e = G.en[i]; e.hp -= dmgEnemies; if (e.hp <= 0) killEnemy(e, i); else e.flash = .15; }
      if (G.boss && !G.boss.enter) { G.boss.hp -= bossDmg; G.boss.flash = .15; }
    }
    function shoot() {
      var p = G.p; if (p.cd > 0) return; var y = G.py - u * 4; G.shots += p.spread > 0 ? 3 : 1;
      G.bullets.push({ x: p.x, y: y, vx: 0, vy: -780 });
      if (p.spread > 0) { G.bullets.push({ x: p.x - 8, y: y + 4, vx: -170, vy: -740 }); G.bullets.push({ x: p.x + 8, y: y + 4, vx: 170, vy: -740 }); }
      p.cd = p.rapid > 0 ? .085 : .16; G.idleT = 0; if (snd().on && (G.shots % 3 === 0)) snd().tone(900, 420, .05, 'triangle', .02);
    }

    /* ── update ── */
    function update(dt) {
      var p = G.p; G.t += dt; if (G.state === 'play' || G.state === 'boss' || G.state === 'bossintro') G.time += dt;
      stars.forEach(function (s) { s.y += s.v * dt / H; if (s.y > 1) { s.y = 0; s.x = Math.random(); } });
      if (G.banner) { G.banner.t -= dt; if (G.banner.t <= 0) G.banner = null; }
      if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 40); if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.6);
      G.parts.forEach(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .985; q.vy *= .985; q.life -= dt; }); G.parts = G.parts.filter(function (q) { return q.life > 0; });
      if (G.state === 'intro' || G.ended) return;
      // player movement
      var kx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0); if (kx) p.tx = Math.max(24, Math.min(W - 24, p.tx + kx * 640 * dt));
      p.x += (p.tx - p.x) * Math.min(1, dt * 16); p.cd -= dt; p.inv -= dt; p.rapid -= dt; p.spread -= dt; if (G.comboT > 0) { G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; }
      if ((keys.Space || mouseFire || touch) && G.state !== 'bossdead') shoot();
      G.idleT += dt; if (G.idleT > 7) { bsay('idle', true); G.idleT = 0; }
      // bullets
      G.bullets.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; }); G.bullets = G.bullets.filter(function (b) { return b.y > -20 && b.x > -20 && b.x < W + 20; });
      G.eb.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; });
      for (var i = G.eb.length - 1; i >= 0; i--) {
        var b = G.eb[i]; if (b.x < -30 || b.x > W + 30 || b.y > H + 30 || b.y < -60) { G.eb.splice(i, 1); continue; }
        if (Math.abs(b.x - p.x) < u * 3.2 && Math.abs(b.y - G.py) < u * 3.8) { G.eb.splice(i, 1); hurtPlayer(); continue; }
        if (b.y >= G.archY - 4) { var hit = G.blocks.some(function (bl) { return bl.hp > 0 && b.x >= bl.x && b.x <= bl.x + bl.w; }); if (hit) { G.eb.splice(i, 1); hurtBlock(b.x, 1); } else if (b.y > H + 10) G.eb.splice(i, 1); }
      }
      // pickups
      for (i = G.pups.length - 1; i >= 0; i--) {
        var q = G.pups[i]; q.y += q.vy * dt; if (q.y > H + 20) { G.pups.splice(i, 1); continue; }
        if (Math.abs(q.x - p.x) < u * 5 && Math.abs(q.y - G.py) < u * 5) {
          G.pups.splice(i, 1); snd().tone(600, 1200, .15, 'triangle', .05); bsay(q.k, false);
          if (q.k === 'R') p.rapid = 9; else if (q.k === 'S') p.spread = 9; else if (q.k === 'H') p.shield = 1;
          else { var worst = null; G.blocks.forEach(function (bl) { if (bl.hp < bl.max && (!worst || bl.hp < worst.hp)) worst = bl; }); if (worst) { worst.hp = Math.min(worst.max, worst.hp + 2); boom(worst.x + worst.w / 2, G.archY, '#ffb000', 14, 140); } }
        }
      }
      if (G.state === 'play') updateWave(dt); else if (G.state === 'bossintro') { G.t0 -= dt; if (G.t0 <= 0) spawnBoss(); } else if (G.state === 'boss' || G.state === 'bossdead') updateBoss(dt);
      // player bullets vs enemies
      for (i = G.bullets.length - 1; i >= 0; i--) {
        var pb = G.bullets[i], gone = false;
        for (var j = G.en.length - 1; j >= 0; j--) {
          var e = G.en[j]; if (Math.abs(pb.x - e.x) < e.w / 2 + 3 && Math.abs(pb.y - e.y) < e.h / 2 + 8) { e.hp--; e.flash = .1; G.hitsN++; gone = true; if (e.hp <= 0) killEnemy(e, j); else { G.score += 5; snd().tone(500, 400, .04, 'square', .02); } break; }
        }
        if (!gone && G.boss && !G.boss.enter && G.state === 'boss') {
          var bo = G.boss; if (Math.abs(pb.x - bo.x) < bo.w / 2 && Math.abs(pb.y - bo.y) < bo.h / 2) { bo.hp--; bo.flash = .07; G.hitsN++; gone = true; G.score += 10; boom(pb.x, pb.y, '#ffd400', 2, 120); if (snd().on && G.hitsN % 4 === 0) snd().tone(300, 200, .04, 'square', .025); }
        }
        if (gone) G.bullets.splice(i, 1);
      }
      if (G.lives <= 0 || G.blocks.every(function (b) { return b.hp <= 0; })) { if (!G.ended) lose(); }
    }
    function updateWave(dt) {
      var f = G.form, p = G.p;
      if (G.en.length === 0) { if (!G.nextWaveT) { G.nextWaveT = 2.2; G.banner = { t: 2, text: 'WAVE CLEAR', sub: '' }; bsay('clear', true); } G.nextWaveT -= dt; if (G.nextWaveT <= 0) { G.nextWaveT = 0; nextWave(); } return; }
      var alive = G.en.filter(function (e) { return !e.dive; }), frac = 1 - G.en.length / f.total, spd = f.spd * (1 + frac * 1.6);
      f.x += f.dir * spd * dt;
      var minX = 1e9, maxX = -1e9; alive.forEach(function (e) { var ex = f.x + e.gx * f.sx; if (ex < minX) minX = ex; if (ex > maxX) maxX = ex; });
      if (alive.length && ((f.dir > 0 && maxX > W - 40) || (f.dir < 0 && minX < 40))) { f.dir *= -1; f.y += u * 3.2; }
      G.en.forEach(function (e) {
        e.flash -= dt;
        if (!e.dive) { e.x = f.x + e.gx * f.sx; e.y = f.y + e.gy * f.sy + Math.sin(G.t * 2 + e.ph) * 2; }
        else { e.dt += dt; e.y += 270 * dt; e.x = e.x0 + Math.sin(e.dt * 3.4) * 70 + (p.x - e.x0) * Math.min(1, e.dt / 1.4) * .55; if (Math.abs(e.x - p.x) < u * 5 && Math.abs(e.y - G.py) < u * 5) { e.hp = 0; hurtPlayer(); } }
      });
      for (var i = G.en.length - 1; i >= 0; i--) {
        var e = G.en[i]; if (e.hp <= 0) { G.en.splice(i, 1); boom(e.x, e.y, '#fff', 10); continue; }
        if (e.y + e.h / 2 >= G.archY - 8) { G.en.splice(i, 1); hurtBlock(e.x, 2); boom(e.x, e.y, '#ff2d78', 14); if (G.en.length === 0 && !G.nextWaveT) G.nextWaveT = 0; }
      }
      G.shootT -= dt;
      if (G.shootT <= 0 && alive.length) {
        G.shootT = [rnd(1.3, 2.1), rnd(.9, 1.6), rnd(.75, 1.25)][G.wave - 1];
        var cands = alive.filter(function (e) { return !alive.some(function (o) { return o.gx === e.gx && o.gy > e.gy; }); }), e2 = pick(cands.length ? cands : alive), sp = 190 + G.wave * 28;
        if (e2.type === 'seg') { var dx = p.x - e2.x, dy = G.py - e2.y, d = Math.hypot(dx, dy) || 1; ebullet(e2.x, e2.y + e2.h / 2, dx / d * sp, dy / d * sp, '#ffb000'); } else ebullet(e2.x, e2.y + e2.h / 2, 0, sp);
        if (e2.type === 't404') { ebullet(e2.x - 10, e2.y + e2.h / 2, -30, sp * .95); ebullet(e2.x + 10, e2.y + e2.h / 2, 30, sp * .95); }
      }
      G.diveT -= dt;
      if (G.diveT <= 0 && G.wave >= 2) {
        G.diveT = rnd(2.4, 4.2) - G.wave * .2; var pool = alive.filter(function (e) { return e.type === 'nul' || (G.wave === 3 && e.type === 'bug'); });
        if (pool.length) { var dv = pick(pool); dv.dive = true; dv.dt = 0; dv.x0 = dv.x; }
      }
    }
    function updateBoss(dt) {
      var b = G.boss, p = G.p; if (!b) return; b.t += dt; b.flash -= dt; b.rot += dt;
      G.en.forEach(function (e) { e.flash -= dt; if (e.dive) { e.dt += dt; e.y += 230 * dt; e.x = e.x0 + Math.sin(e.dt * 3) * 80; } });
      for (var i = G.en.length - 1; i >= 0; i--) { var e = G.en[i]; if (e.y > H + 20) G.en.splice(i, 1); else if (e.hp > 0 && Math.abs(e.x - p.x) < u * 5 && Math.abs(e.y - G.py) < u * 5) { G.en.splice(i, 1); hurtPlayer(); } else if (e.hp <= 0) G.en.splice(i, 1); }
      if (G.state === 'bossdead') {
        G.deadT -= dt; if (Math.random() < .5) boom(b.x + rnd(-b.w / 2, b.w / 2), b.y + rnd(-b.h / 2, b.h / 2), pick(['#ff2d78', '#ffd400', '#fff', '#00f5ff']), 12, 300);
        if (Math.random() < .2) { shake(10); G.flash = .3; } if (G.deadT <= 0) { G.ended = true; G.boss = null; elBoss.classList.remove('on'); bsay('win', true); snd().tone(520, 0, .15, 'triangle', .07); snd().tone(780, 0, .2, 'triangle', .07, .15); snd().tone(1040, 0, .35, 'triangle', .07, .32); endCard(true); }
        return;
      }
      if (b.enter) { b.y += (95 - b.y) * Math.min(1, dt * 1.6); if (b.y > 88) b.enter = false; elBhp.style.width = '100%'; return; }
      var pct = b.hp / b.max, phase = pct > .66 ? 1 : pct > .33 ? 2 : 3;
      if (phase !== b.phase) { b.phase = phase; G.flash = .5; shake(16); bsay(phase === 2 ? 'p2' : 'p3', true); snd().tone(100, 50, .5, 'sawtooth', .08); G.eb = []; }
      if (pct < .12 && !b.lowSaid) { b.lowSaid = true; bsay('bossLow', true); }
      var sp = [0, .7, 1.1, 1.5][phase]; b.x = W / 2 + Math.sin(b.t * sp) * Math.min(W * .34, 420); b.y = 95 + Math.sin(b.t * 1.3) * 12;
      b.fireT -= dt; b.ringT -= dt; b.spawnT -= dt; b.beamT -= dt; var by = b.y + b.h / 2;
      var fireRate = [0, 1.15, .85, .6][phase];
      if (b.fireT <= 0) { b.fireT = fireRate; var base = Math.atan2(G.py - by, p.x - b.x), n = phase === 3 ? 5 : 3, spread = phase === 3 ? .2 : .32;
        for (var k = 0; k < n; k++) { var a = base + (k - (n - 1) / 2) * spread; ebullet(b.x, by, Math.cos(a) * 230, Math.sin(a) * 230, '#ff2d78'); } }
      if (phase >= 2 && b.ringT <= 0) { b.ringT = phase === 3 ? 2.4 : 3.2; var off = Math.random(), cnt = 12; for (var r = 0; r < cnt; r++) { var ang = r / cnt * 6.283 + off; ebullet(b.x, b.y, Math.cos(ang) * 175, Math.sin(ang) * 175, '#b44dff'); } snd().tone(160, 90, .15, 'square', .04); }
      if (phase >= 2 && b.spawnT <= 0 && G.en.length < 6) { b.spawnT = 6; for (var s = -1; s <= 1; s += 2) G.en.push({ type: 'bug', gx: 0, gy: 0, x: b.x + s * b.w / 2, y: b.y, x0: b.x + s * b.w / 2, hp: 1, w: 8 * u, h: 8 * u, dive: true, dt: 0, flash: 0, ph: 0 }); }
      if (phase === 3) {
        if (!b.beam && b.beamT <= 0) { b.beam = { x: p.x, t: 0 }; b.beamT = 5; snd().tone(900, 1100, .8, 'sine', .04); }
        if (b.beam) { b.beam.t += dt; if (b.beam.t > .85 && b.beam.t < 1.35 && Math.abs(b.beam.x - p.x) < 22) hurtPlayer(); if (b.beam.t > 1.4) b.beam = null; if (b.beam && b.beam.t > .85 && b.beam.t < .9) { shake(14); snd().tone(70, 40, .45, 'sawtooth', .08); } }
      }
      elBhp.style.width = Math.max(0, pct * 100) + '%';
      if (b.hp <= 0) { G.state = 'bossdead'; G.deadT = 2.4; G.eb = []; G.en = []; G.score += 5000; boom(b.x, b.y, '#fff', 50, 360); G.flash = 1; shake(24); G.beamKill = true; }
    }
    function lose() { G.ended = true; G.state = 'lost'; boom(G.p.x, G.py, '#00f5ff', 40, 300); shake(20); elBoss.classList.remove('on'); bsay('lose', true); snd().tone(220, 40, .8, 'sawtooth', .08); setTimeout(function () { endCard(false); }, 900); }

    /* ── draw ── */
    function glowText(txt, x, y, size, col) { ctx.font = '700 ' + size + 'px "Orbitron","Share Tech Mono",monospace'; ctx.textAlign = 'center'; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.fillText(txt, x, y); ctx.shadowBlur = 0; }
    function drawSpr(key, col, x, y, uu, flash, glitch) {
      var s = sprite(key, flash > 0 ? '#ffffff' : col, uu), w = s.width, h = s.height;
      if (glitch && !reduce) { ctx.globalAlpha = .55; ctx.drawImage(sprite(key, '#ff2d78', uu), x - w / 2 - rnd(2, 5), y - h / 2); ctx.drawImage(sprite(key, '#00f5ff', uu), x - w / 2 + rnd(2, 5), y - h / 2); ctx.globalAlpha = 1; }
      ctx.drawImage(s, Math.round(x - w / 2), Math.round(y - h / 2));
    }
    function draw() {
      ctx.clearRect(0, 0, W, H); ctx.save(); if (G.shake > 0) ctx.translate(rnd(-G.shake, G.shake) * .5, rnd(-G.shake, G.shake) * .5);
      ctx.fillStyle = 'rgba(160,200,255,.7)'; stars.forEach(function (s) { ctx.globalAlpha = .25 + s.s * .2; ctx.fillRect(s.x * W, s.y * H, s.s, s.s); }); ctx.globalAlpha = 1;
      // archive blocks
      G.blocks.forEach(function (b) {
        var bh = 22, y = G.archY; ctx.fillStyle = b.hp > 0 ? 'rgba(0,245,255,' + (.08 + b.hp / b.max * .12) + ')' : 'rgba(255,45,120,.05)'; ctx.fillRect(b.x, y, b.w, bh);
        ctx.strokeStyle = b.hp > 0 ? (b.hp === 1 ? '#ff2d78' : b.hp === 2 ? '#ffb000' : '#00f5ff') : 'rgba(255,45,120,.35)'; ctx.lineWidth = 1.4; ctx.setLineDash(b.hp > 0 ? [] : [4, 5]); ctx.strokeRect(b.x + .5, y + .5, b.w - 1, bh - 1); ctx.setLineDash([]);
        ctx.font = '400 11px "Share Tech Mono",monospace'; ctx.textAlign = 'center'; ctx.fillStyle = b.hp > 0 ? '#8ff6ff' : 'rgba(255,45,120,.5)'; ctx.fillText(b.hp > 0 ? 'FILE ' + b.lab : 'LOST', b.x + b.w / 2, y + 15);
      });
      // enemies
      G.en.forEach(function (e) {
        var T = TYPES[e.type];
        if (T.spr) drawSpr(T.spr, T.col, e.x, e.y, u, e.flash, e.dive);
        else { ctx.fillStyle = e.flash > 0 ? '#fff' : 'rgba(255,45,120,.18)'; ctx.strokeStyle = e.flash > 0 ? '#fff' : T.col; ctx.lineWidth = 2; ctx.fillRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h); ctx.strokeRect(e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
          ctx.font = '700 ' + Math.round(u * 3.6) + 'px "Orbitron",monospace'; ctx.textAlign = 'center'; ctx.fillStyle = e.flash > 0 ? '#04060a' : T.col; ctx.fillText('404', e.x, e.y + u * 1.3); }
      });
      // boss
      var b = G.boss; if (b) {
        if (b.beam) { var bm = b.beam; if (bm.t < .85) { ctx.strokeStyle = 'rgba(255,45,120,' + (.3 + Math.sin(bm.t * 40) * .25) + ')'; ctx.lineWidth = 2; ctx.setLineDash([8, 10]); ctx.beginPath(); ctx.moveTo(bm.x, b.y + b.h / 2); ctx.lineTo(bm.x, H); ctx.stroke(); ctx.setLineDash([]); }
          else if (bm.t < 1.4) { var g = ctx.createLinearGradient(bm.x - 22, 0, bm.x + 22, 0); g.addColorStop(0, 'rgba(255,45,120,0)'); g.addColorStop(.5, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,45,120,0)'); ctx.fillStyle = g; ctx.fillRect(bm.x - 22, b.y + b.h / 2, 44, H); } }
        var col = b.phase === 3 ? '#ff2d4d' : b.phase === 2 ? '#b44dff' : '#ff2d78', dead = G.state === 'bossdead';
        ctx.save(); if (dead) ctx.translate(rnd(-5, 5), rnd(-4, 4)); drawSpr('boss', col, b.x, b.y, b.bu, b.flash, !dead && (b.phase >= 2 || Math.random() < .08)); ctx.restore();
        if (!dead) { ctx.fillStyle = '#ffd400'; ctx.shadowColor = '#ffd400'; ctx.shadowBlur = 14; var ey = b.y - b.bu * .6; ctx.fillRect(b.x - b.bu * 5.2, ey, b.bu * 1.6, b.bu * 1.6); ctx.fillRect(b.x + b.bu * 3.6, ey, b.bu * 1.6, b.bu * 1.6); ctx.shadowBlur = 0; }
      }
      // bullets
      ctx.globalCompositeOperation = 'lighter';
      G.bullets.forEach(function (bl) { ctx.fillStyle = '#00f5ff'; ctx.fillRect(bl.x - 1.5, bl.y - 10, 3, 16); ctx.fillStyle = 'rgba(0,245,255,.25)'; ctx.fillRect(bl.x - 4, bl.y - 12, 8, 20); });
      G.eb.forEach(function (eb) { ctx.fillStyle = eb.col; ctx.beginPath(); ctx.arc(eb.x, eb.y, eb.r, 0, 6.283); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(eb.x, eb.y, eb.r * .45, 0, 6.283); ctx.fill(); });
      G.parts.forEach(function (q) { ctx.globalAlpha = Math.max(0, q.life / q.max); ctx.fillStyle = q.col; ctx.fillRect(q.x, q.y, q.s, q.s); }); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      // pickups
      var PC = { R: '#00f5ff', S: '#b44dff', H: '#00ff9f', '+': '#ffb000' };
      G.pups.forEach(function (q) { ctx.strokeStyle = PC[q.k]; ctx.lineWidth = 2; ctx.shadowColor = PC[q.k]; ctx.shadowBlur = 12; ctx.strokeRect(q.x - 11, q.y - 11, 22, 22); ctx.shadowBlur = 0; ctx.font = '700 14px "Orbitron",monospace'; ctx.textAlign = 'center'; ctx.fillStyle = PC[q.k]; ctx.fillText(q.k, q.x, q.y + 5); });
      // player
      if (G.state !== 'intro' && G.state !== 'lost') {
        var p = G.p, vis = p.inv <= 0 || Math.floor(G.t * 18) % 2 === 0;
        if (vis) { ctx.save(); ctx.translate(p.x, G.py); ctx.shadowColor = '#00f5ff'; ctx.shadowBlur = 16; ctx.strokeStyle = '#00f5ff'; ctx.lineWidth = 2.2; ctx.fillStyle = 'rgba(0,245,255,.15)';
          ctx.beginPath(); ctx.moveTo(0, -u * 4.2); ctx.lineTo(u * 3.6, u * 3.2); ctx.lineTo(0, u * 1.8); ctx.lineTo(-u * 3.6, u * 3.2); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ff2d78'; ctx.shadowColor = '#ff2d78'; ctx.fillRect(-2, u * 2.4, 4, 3 + Math.random() * 6); ctx.restore();
          if (p.shield > 0) { ctx.strokeStyle = 'rgba(0,255,159,.8)'; ctx.lineWidth = 2; ctx.shadowColor = '#00ff9f'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(p.x, G.py, u * 6, 0, 6.283); ctx.stroke(); ctx.shadowBlur = 0; } }
      }
      // banner
      if (G.banner) { var bn = G.banner, a = Math.min(1, bn.t * 2, (bn.t > 1 ? 1 : bn.t)); ctx.globalAlpha = a; glowText(bn.text, W / 2, H * .38, Math.min(54, W / 12), bn.red ? '#ff2d78' : '#00f5ff'); if (bn.sub) { ctx.font = '400 14px "Share Tech Mono",monospace'; ctx.fillStyle = '#8a9ab8'; ctx.shadowBlur = 0; ctx.fillText(bn.sub, W / 2, H * .38 + 30); } ctx.globalAlpha = 1; }
      ctx.restore();
      if (G.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + Math.min(.6, G.flash * (reduce ? .3 : .8)) + ')'; ctx.fillRect(0, 0, W, H); }
    }
    function updateHud() {
      elScore.textContent = G.score.toLocaleString(); elHearts.textContent = '♥'.repeat(Math.max(0, G.lives)) + '♡'.repeat(Math.max(0, 3 - G.lives)); elEmp.textContent = 'EMP ' + '◆'.repeat(G.bombs) + '◇'.repeat(Math.max(0, 2 - G.bombs));
      var m = 1 + Math.floor(G.combo / 5); elCombo.textContent = G.combo >= 3 ? 'COMBO ' + G.combo + (m > 1 ? ' ×' + m : '') : '';
    }

    /* ── loop ── */
    var paused = false;
    function frame(t) { raf = requestAnimationFrame(frame); var dt = Math.min(.033, (t - last) / 1000); last = t; if (paused) { return; } update(dt); draw(); updateHud(); }
    raf = requestAnimationFrame(frame); introCard();

    /* ── input ── */
    function onKey(e) {
      e.stopImmediatePropagation(); keys[e.code] = e.type === 'keydown'; if (e.type !== 'keydown') return;
      if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.code) !== -1) e.preventDefault();
      if (e.key === 'Escape') { quit(); return; }
      if ((e.key === 'Enter' || e.code === 'Space') && G.state === 'intro') { begin(); return; }
      if (e.key === 'Enter' && G.ended) { reset(); begin(); return; }
      if (e.code === 'KeyP' && G.state !== 'intro' && !G.ended) { paused = !paused; if (paused) showCard('<h2>PAUSED</h2><p>press P to resume</p>'); else hideCard(); }
      if (e.code === 'KeyB') emp();
    }
    function emp() { if (G.bombs > 0 && !G.ended && G.state !== 'intro' && !paused) { G.bombs--; dropBullets(2, 8); bsay('bomb', true); } }
    function onMove(e) { G.p.tx = e.clientX; }
    function onDown(e) { if (e.target.closest && e.target.closest('.bf-btn')) return; if (e.button === 0) { mouseFire = true; if (G.state === 'intro') begin(); } }
    function onUp(e) { if (e.button === 0) mouseFire = false; }
    function onCtx(e) { e.preventDefault(); emp(); }
    function onTouch(e) { touch = true; G.p.tx = e.touches[0].clientX; if (G.state === 'intro' && !(e.target.closest && e.target.closest('.bf-btn'))) begin(); }
    function onTouchEnd() { touch = false; }
    addEventListener('keydown', onKey, true); addEventListener('keyup', onKey, true); ov.addEventListener('mousemove', onMove); ov.addEventListener('mousedown', onDown);
    addEventListener('mouseup', onUp); ov.addEventListener('contextmenu', onCtx); ov.addEventListener('touchstart', onTouch, { passive: true }); ov.addEventListener('touchmove', onTouch, { passive: true }); ov.addEventListener('touchend', onTouchEnd);
    function onBlur() { mouseFire = false; keys = {}; } addEventListener('blur', onBlur);

    function quit() {
      cancelAnimationFrame(raf); clearInterval(sayType); clearTimeout(sayHide); removeEventListener('keydown', onKey, true); removeEventListener('keyup', onKey, true); removeEventListener('mouseup', onUp);
      removeEventListener('resize', resize); removeEventListener('blur', onBlur); ov.remove(); document.documentElement.style.overflow = prevOv; running = false; FX.bossActive = false;
      if (lastGame) { var lg = lastGame; lastGame = null; setTimeout(function () { FX.snark && FX.snark(lg.win ? 'bossWin' : 'bossLose', null, true); }, 500); }
    }
    FX._boss = { G: function () { return G; }, quit: quit, begin: begin };
  }

  FX.boss = start;
  FX.bossStats = function () { return { wins: parseInt(lget('boss-wins') || '0', 10), best: parseInt(lget('boss-best') || '0', 10) }; };
  var cmds = FX.cmds || {}, P = function (t, c) { FX.print && FX.print(t, c); };
  cmds.boss = function () { P('summoning the glitch king...'); setTimeout(function () { start(); }, 350); }; cmds.fight = cmds.boss;
  FX.helpExtra = (FX.helpExtra || []).concat(['  boss | fight        defend the archive from the glitch king']);
  var sec = FX.secrets || {}; sec.boss = function () { start(); };
})();
