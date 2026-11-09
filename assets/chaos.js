/* MEMO ARCHIVE — v10 chaos pack: railgun, overheat, gravity, hammer, dvd skull, self-destruct, rickroll terminal, captcha, loading bar, hacker typer, audio driver, insult compiler */
(function () {
  var FX = window.ArchiveFX = window.ArchiveFX || {}, U = FX.u; if (!U) return;
  var $ = U.$, pick = U.pick, lget = U.lget, lset = U.lset, root = document.documentElement;
  var cmds = FX.cmds || {}, P = function (t, c) { FX.print && FX.print(t, c); };
  function R(a, b) { return a + Math.random() * (b - a); }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function tone(f, f2, d, ty, v, dl) { var s = FX.sound; if (s && s.on && s.tone) s.tone(f, f2, d, ty || 'square', v || 0.05, dl || 0); }
  function xp(id, n) { if (lget('chx-' + id)) return; lset('chx-' + id, '1'); FX.gainXP && FX.gainXP(n || 5); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function toast(t, ms) { var d = el('div', 'chx chx-toast', t); document.body.appendChild(d); setTimeout(function () { d.classList.add('out'); setTimeout(function () { d.remove(); }, 400); }, ms || 2600); }
  function skip(t) { return !t || !t.closest || !!t.closest('.chx,.term,[class*="nl-"]'); }
  function leave() { FX.closeTerm && FX.closeTerm(); }

  /* overlay stack + Esc handling */
  var stack = [], modes = {};
  function openOv(cls, html, onClose) {
    var d = el('div', 'chx chx-ov ' + cls, html); document.body.appendChild(d);
    var o = { d: d, close: function () { var i = stack.indexOf(o); if (i < 0) return; stack.splice(i, 1); d.remove(); onClose && onClose(); } };
    stack.push(o); return o;
  }
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (stack.length) stack[stack.length - 1].close();
    else Object.keys(modes).forEach(function (k) { if (k !== 'heat') modes[k](); });
  });

  /* 1. PLASMA RAILGUN */
  function railgun() {
    var cv = el('canvas', 'chx chx-cv'); cv.width = innerWidth; cv.height = innerHeight; document.body.appendChild(cv);
    var cx = cv.getContext('2d'), ps = [], hid = [], beams = [], raf, shots = 0, tag = el('div', 'chx chx-tag', 'RAILGUN ARMED &middot; click anything &middot; Esc to disarm');
    document.body.appendChild(tag); root.classList.add('chx-rail');
    function frame() {
      cx.clearRect(0, 0, cv.width, cv.height);
      beams = beams.filter(function (b) { return b.l > 0; });
      beams.forEach(function (b) { b.l--; cx.globalAlpha = b.l / 8; cx.strokeStyle = '#8ff'; cx.lineWidth = 2 + b.l; cx.beginPath(); cx.moveTo(innerWidth / 2, innerHeight); cx.lineTo(b.x, b.y); cx.stroke(); });
      ps = ps.filter(function (p) { return p.l > 0 && p.y < cv.height + 20; });
      ps.forEach(function (p) { p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.l--; cx.globalAlpha = Math.min(1, p.l / 25); cx.fillStyle = p.c; cx.fillRect(p.x, p.y, p.s, p.s); });
      cx.globalAlpha = 1; raf = requestAnimationFrame(frame);
    }
    frame();
    function shot(e) {
      var t = e.target; if (skip(t) || t === root || t === document.body) return;
      e.preventDefault(); e.stopPropagation();
      var r = t.getBoundingClientRect(), pal = ['#39ff14', '#00e5ff', '#ff2bd6', getComputedStyle(t).color];
      var n = Math.min(220, Math.round(r.width * r.height / 260) + 12);
      beams.push({ x: e.clientX, y: e.clientY, l: 8 });
      for (var i = 0; i < n; i++) ps.push({ x: r.left + Math.random() * r.width, y: r.top + Math.random() * r.height, vx: R(-3, 3) + (r.left + r.width / 2 - e.clientX) * 0.01, vy: R(-6, 1), s: R(2, 5), c: pick(pal), l: R(50, 110) });
      t.style.visibility = 'hidden'; hid.push(t);
      tone(900, 60, 0.25, 'sawtooth', 0.06); tone(120, 40, 0.3, 'square', 0.05, 0.05);
      if (++shots === 8) xp('rail', 8);
    }
    document.addEventListener('click', shot, true);
    return function () { document.removeEventListener('click', shot, true); cancelAnimationFrame(raf); cv.remove(); tag.remove(); hid.forEach(function (h) { h.style.visibility = ''; }); root.classList.remove('chx-rail'); };
  }

  /* 2. CPU OVERHEAT + MELT */
  function overheat() {
    var g = el('div', 'chx chx-heat', '<b>CPU</b><div class="chx-gb"><i></i></div><span>30&deg;C</span>'); document.body.appendChild(g);
    var bar = $('i', g), lab = $('span', g), t = 30, molten = false, sy = scrollY, melted = [], ovl = null, alive = true, tm = 0;
    function bump(n) { if (!molten) t = Math.min(100, t + n); }
    function onc(e) { if (!skip(e.target)) bump(6); }
    function ons() { bump(Math.min(5, Math.abs(scrollY - sy) / 60)); sy = scrollY; }
    function unmelt() { melted.forEach(function (n) { n.classList.remove('chx-melt'); n.style.removeProperty('--md'); n.style.removeProperty('--mdl'); }); melted = []; root.classList.remove('chx-molten'); if (ovl) { ovl.remove(); ovl = null; } }
    function melt() {
      molten = true; t = 100; root.classList.add('chx-molten'); xp('heat', 8);
      ovl = el('div', 'chx chx-moltenov'); document.body.appendChild(ovl); toast('CPU CRITICAL &mdash; THERMAL MELTDOWN'); tone(80, 30, 1.2, 'sawtooth', 0.07);
      [].slice.call(document.querySelectorAll('h1,h2,h3,p,a,button,li,img,.card,.sign,small')).forEach(function (n) {
        var r = n.getBoundingClientRect(); if (skip(n) || r.bottom < 0 || r.top > innerHeight || !r.width) return;
        n.style.setProperty('--md', R(14, 70) + 'px'); n.style.setProperty('--mdl', R(0, 2.2) + 's'); n.classList.add('chx-melt'); melted.push(n);
      });
      tm = setTimeout(function () { if (!alive) return; unmelt(); t = 55; molten = false; toast('cooled down. barely.'); }, 8000);
    }
    var iv = setInterval(function () {
      if (!molten) { t = Math.max(30, t - 0.5); if (t >= 100) melt(); }
      bar.style.width = ((t - 30) / 70 * 100) + '%'; bar.style.background = 'hsl(' + (180 - (t - 30) / 70 * 175) + ',100%,55%)';
      lab.textContent = Math.round(t) + '\u00b0C'; g.classList.toggle('hot', t > 80);
    }, 100);
    document.addEventListener('click', onc, true); window.addEventListener('scroll', ons);
    return function () { alive = false; clearInterval(iv); clearTimeout(tm); document.removeEventListener('click', onc, true); window.removeEventListener('scroll', ons); unmelt(); g.remove(); };
  }

  /* 3. GRAVITY COLLAPSE */
  function gravity(a) {
    var dir = a && a[0] === 'up' ? -1 : 1, SEL = 'h1,h2,h3,h4,p,a,button,li,img,small,.card,.sign,.pill', items = [], t0 = performance.now(), raf;
    [].slice.call(document.querySelectorAll(SEL)).forEach(function (n) {
      if (skip(n) || n.querySelector(SEL)) return;
      var r = n.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || !r.width || !r.height) return;
      var st = n.getAttribute('style'); if (getComputedStyle(n).display === 'inline') n.style.display = 'inline-block';
      var fl = dir > 0 ? innerHeight - r.bottom - R(0, 50) : r.top - R(0, 50);
      items.push({ n: n, st: st, y: 0, v: 0, fl: Math.max(0, fl), d: R(0, 900), rot: R(-40, 40) });
    });
    root.style.overflow = 'hidden';
    var bar = el('div', 'chx chx-tag', 'GRAVITY OFFLINE &middot; <button>RESTORE</button>'); document.body.appendChild(bar);
    $('button', bar).onclick = function () { modes.grav && modes.grav(); };
    tone(200, 50, 0.8, 'sine', 0.06); if (items.length) xp('grav', 8);
    function frame(now) {
      var e = now - t0;
      items.forEach(function (o) {
        if (e < o.d) return; o.v += 0.55; o.y += o.v;
        if (o.y >= o.fl) { o.y = o.fl; o.v = -o.v * 0.38; if (Math.abs(o.v) < 1.2) o.v = 0; }
        o.n.style.transform = 'translateY(' + (dir * o.y) + 'px) rotate(' + (o.rot * (o.fl ? o.y / o.fl : 0)) + 'deg)';
      });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return function () {
      cancelAnimationFrame(raf); bar.remove();
      items.forEach(function (o) { o.n.style.transition = 'transform .9s cubic-bezier(.2,.8,.2,1)'; o.n.style.transform = ''; });
      setTimeout(function () { items.forEach(function (o) { if (o.st == null) o.n.removeAttribute('style'); else o.n.setAttribute('style', o.st); }); root.style.overflow = ''; }, 1000);
    };
  }

  /* 4. GLASS HAMMER */
  function hammer() {
    var NS = 'http://www.w3.org/2000/svg', sv = document.createElementNS(NS, 'svg'), n = 0, tag = el('div', 'chx chx-tag', 'HAMMER EQUIPPED &middot; click to smash &middot; Esc to repair');
    sv.setAttribute('class', 'chx chx-glass'); sv.setAttribute('width', innerWidth); sv.setAttribute('height', innerHeight);
    document.body.appendChild(sv); document.body.appendChild(tag); root.classList.add('chx-hm');
    function line(pts, w, c, o) {
      var p = document.createElementNS(NS, 'polyline');
      p.setAttribute('points', pts.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '));
      p.setAttribute('fill', 'none'); p.setAttribute('stroke', c); p.setAttribute('stroke-width', w); p.setAttribute('stroke-opacity', o); p.setAttribute('stroke-linejoin', 'round'); sv.appendChild(p);
    }
    function branch(x, y, a, len, depth) {
      var pts = [[x, y]], segs = Math.round(R(4, 8));
      for (var i = 0; i < segs; i++) { a += R(-0.35, 0.35); x += Math.cos(a) * R(10, len); y += Math.sin(a) * R(10, len); pts.push([x, y]); if (depth < 2 && Math.random() < 0.28) branch(x, y, a + R(-1, 1), len * 0.7, depth + 1); }
      line(pts, 5, '#8ff', 0.12); line(pts, 1.3, '#fff', 0.85);
    }
    function hit(e) {
      if (e.target.closest && e.target.closest('.chx-tag')) return;
      e.preventDefault(); e.stopPropagation();
      var k = Math.round(R(7, 11)), a0 = R(0, 6.28);
      for (var i = 0; i < k; i++) branch(e.clientX, e.clientY, a0 + i * 6.28 / k + R(-0.2, 0.2), R(24, 48), 0);
      var c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', e.clientX); c.setAttribute('cy', e.clientY); c.setAttribute('r', 6); c.setAttribute('fill', 'rgba(255,255,255,.35)'); sv.appendChild(c);
      tone(260, 40, 0.18, 'sawtooth', 0.06); tone(3200, 700, 0.12, 'square', 0.03, 0.02); tone(1800, 300, 0.2, 'triangle', 0.03, 0.07);
      root.classList.add('chx-shake'); setTimeout(function () { root.classList.remove('chx-shake'); }, 140);
      n++; if (n === 12) toast('SCREEN INTEGRITY: 12%');
      if (n === 25) { sv.classList.add('wreck'); toast('GLASS CRITICAL &mdash; it is not coming back'); xp('hammer', 10); }
    }
    document.addEventListener('click', hit, true);
    return function () { document.removeEventListener('click', hit, true); sv.remove(); tag.remove(); root.classList.remove('chx-hm'); if (n) toast('screen repaired. nobody saw anything.'); };
  }

  /* 5. BOUNCING DVD SKULL (rigged to find a corner every 20-40s) */
  function dvd() {
    var s = el('div', 'chx chx-dvd', '\u2620'), hud = el('div', 'chx chx-tag chx-dvdh', ''), w = 84, h = 84;
    document.body.appendChild(s); document.body.appendChild(hud);
    var W, H, ux0, uy0, vx, vy, t0, T = 30, hits = 0, bounces = 0, hue = 150, last = [0, 0], raf, curX = 0, curY = 0;
    function fold(u, L) { var m = ((u % (2 * L)) + 2 * L) % (2 * L); return m <= L ? m : 2 * L - m; }
    function vel(u, L) {
      for (var i = 0; i < 30; i++) { var sg = Math.random() < 0.5 ? -1 : 1, k = Math.round((u + sg * R(130, 220) * T) / L), v = (k * L - u) / T; if (Math.abs(v) > 70 && Math.abs(v) < 320) return v; }
      return 150;
    }
    function sched(x, y) { W = Math.max(200, innerWidth - w); H = Math.max(200, innerHeight - h); ux0 = x; uy0 = y; t0 = performance.now(); T = R(22, 40); vx = vel(x, W); vy = vel(y, H); }
    function corner(ux, uy) { hits++; toast('CORNER HIT! &#9733;'); tone(660, 1320, 0.2, 'square', 0.05); tone(990, 1980, 0.3, 'square', 0.05, 0.15); xp('dvd', 15); sched(ux, uy); }
    sched(R(0, innerWidth - w), R(0, innerHeight - h));
    function frame(now) {
      var t = (now - t0) / 1000, ux = ux0 + vx * t, uy = uy0 + vy * t, bx = Math.floor(ux / W), by = Math.floor(uy / H);
      if (bx !== last[0] || by !== last[1]) {
        var cb = bx !== last[0], cc = by !== last[1]; bounces += (cb ? 1 : 0) + (cc ? 1 : 0);
        hue = (hue + 67) % 360; s.style.color = 'hsl(' + hue + ',100%,60%)'; tone(cb && cc ? 880 : 300, 200, 0.06, 'square', 0.03);
        if (cb && cc) corner(ux, uy); last = [bx, by];
      }
      curX = fold(ux, W); curY = fold(uy, H); s.style.transform = 'translate(' + curX.toFixed(1) + 'px,' + curY.toFixed(1) + 'px)';
      hud.innerHTML = 'SKULL &middot; corner hits ' + hits + ' &middot; bounces ' + bounces + ' &middot; next corner ~' + Math.max(0, Math.round(T - (now - t0) / 1000)) + 's &middot; Esc to quit';
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    function onr() { sched(Math.min(curX, innerWidth - w), Math.min(curY, innerHeight - h)); last = [0, 0]; }
    window.addEventListener('resize', onr);
    return function () { cancelAnimationFrame(raf); window.removeEventListener('resize', onr); s.remove(); hud.remove(); };
  }

  /* 6. SELF-DESTRUCT */
  function boom(o) {
    o.close(); tone(60, 20, 1.5, 'sawtooth', 0.1); document.title = '\u{1F4A5} BOOM'; xp('destruct', 10);
    var f = el('div', 'chx chx-flash'); document.body.appendChild(f);
    setTimeout(function () {
      try { window.close(); } catch (e) {}
      var b = el('div', 'chx chx-boom', '<div><h1>BOOM.</h1><p>the archive has self-destructed.<br>all the memos are gone. (they are not. it is a website.)</p><button>REBOOT</button></div>');
      document.body.appendChild(b); $('button', b).onclick = function () { location.reload(); };
    }, 450);
  }
  function destruct() {
    var iv = 0, n = 10, armed = false;
    var o = openOv('chx-sd', '<div class="sd-box"><h2>SELF-DESTRUCT PROTOCOL</h2><p>authorised personnel only. (that is you. unfortunately.)</p><div class="sd-sw"><div class="sd-btn">DESTROY</div><div class="sd-glass">LIFT COVER</div></div><div class="sd-num"></div><button class="sd-abort">ABORT</button></div>', function () { clearInterval(iv); });
    var g = $('.sd-glass', o.d), b = $('.sd-btn', o.d), num = $('.sd-num', o.d), ab = $('.sd-abort', o.d);
    ab.style.display = 'none';
    g.onclick = function () { g.classList.add('open'); tone(500, 520, 0.05); };
    b.onclick = function () {
      if (!g.classList.contains('open') || armed) return; armed = true; ab.style.display = ''; o.d.classList.add('arm'); num.textContent = n; tone(150, 150, 0.3, 'sawtooth', 0.07);
      iv = setInterval(function () { n--; num.textContent = n; var f = 300 + (10 - n) * 80; tone(f, f, 0.12, 'square', 0.06); if (n <= 0) { clearInterval(iv); boom(o); } }, 1000);
    };
    ab.onclick = function () { o.close(); toast('self-destruct aborted. phew.'); };
  }

  /* 7. RUN_OPTIMIZATION_VCE.sh — the rickroll, extended edition (no lyrics: title + "never gonna ___ you" format only) */
  var ROLL_COMMENTS = [
    ['xX_algo_Xx', 'came here for the VCE optimizer. leaving with a 1987 baritone.'],
    ['prof_dijkstra', 'this is not a valid shortest path to the answer key.'],
    ['bug_mascot', 'i have been rolled and i have no regrets (i am a bug)'],
    ['ant_colony_7', 'followed the pheromone trail. it was a rickroll.'],
    ['null_pointer', '404: answer key not found. quiff found instead.'],
    ['ctrl_alt_defeat', 'my teacher rickrolled me with a .sh file. respect.'],
    ['O_of_n_squared', 'first! (second pass)'],
    ['kernel_panic_fan', 'the quiff has more uptime than my server'],
    ['big_O_energy', 'rick never gonna time out'],
    ['git_blame_me', 'force-pushed this to main. no regrets'],
    ['halting_problem', 'been watching for 3 hours. cannot tell if i will stop.'],
    ['stackoverflow_user', 'marked as duplicate of a 1987 song']
  ];
  var FACE = [
    '       .-~~~~~~~-.',
    '     .~  ~~~~~~~  ~.   <- the quiff',
    '    /   _       _   \\',
    '   |   (o)     (o)   |',
    '   |        ^        |',
    '    \\     \\___/     /',
    '     ~.    ---    .~',
    '       ~-._____.-~',
    '      .-|  ||  |-.',
    '     / | TRENCH | \\'
  ].join('\n');
  var DANCE = [['  \\o/', '   |', '  / \\'], ['   o/', '  /|', '  / \\'], ['  \\o', '   |\\', '  / \\'], ['  _o_', '   |', '  < >']];
  function pad(s, n) { return (s + '                    ').slice(0, n); }
  function dancers(i) {
    var A = DANCE[i % 4], B = DANCE[(i + 2) % 4], C = DANCE[(i + 1) % 4];
    return ['       .-*-.        ', '      *  |  *       '].concat(A.map(function (l, k) { return pad(l, 10) + pad(B[k], 10) + pad(C[k], 10); })).concat(['  ~~~~~~~~~~~~~~~~~~~~~~~~~~']).join('\n');
  }
  function rick() {
    var dead = false, ivs = [], vid = null;
    var o = openOv('chx-rr', '<div class="rr-win"><div class="rr-bar"><span>operator@archive:~ &mdash; RUN_OPTIMIZATION_VCE.sh</span><i class="rr-x">x</i></div><div class="rr-body"><pre class="rr-pre"></pre></div></div>', function () { dead = true; ivs.forEach(clearInterval); if (vid) { try { vid.pause(); vid.removeAttribute('src'); while (vid.firstChild) vid.removeChild(vid.firstChild); vid.load(); } catch (e) {} } });
    var win = $('.rr-win', o.d), body = $('.rr-body', o.d), pre = $('.rr-pre', o.d);
    $('.rr-x', o.d).onclick = o.close;
    var rolls = (parseInt(lget('chx-rolls') || '0', 10) || 0) + 1; lset('chx-rolls', String(rolls)); xp('rick', 8);
    async function typeTo(node, text, d) { for (var c = 0; c < text.length && !dead; c++) { node.textContent += text[c]; if (c % 2 === 0) await wait(d); } node.textContent += '\n'; body.scrollTop = 1e6; }
    async function prog(label, to, ms) {
      var base = pre.textContent, t0 = performance.now(), W = 30;
      while (!dead) { var k = Math.min(1, (performance.now() - t0) / ms), p = Math.round(to * k), f = Math.round(W * p / 100); pre.textContent = base + label + ' [' + '#'.repeat(f) + '.'.repeat(W - f) + '] ' + p + '%'; if (k >= 1) break; await wait(40); }
      pre.textContent += '\n';
    }
    function os() {
      win.classList.add('rr-big');
      body.innerHTML = '<div class="rr-os"><div class="rr-left"><pre class="rr-ascii"></pre><h4>RICK ASTLEY OS v1987</h4><pre class="rr-man"></pre><pre class="rr-dance"></pre></div><div class="rr-right"><div class="rr-player"><div class="rr-screen"><video class="rr-vid" controls loop playsinline preload="auto"></video><div class="rr-na"><b>VIDEO UNAVAILABLE</b> &mdash; lyric track blocked (we respect copyright). the vibes are not blocked.<br><small>dev note: put rickroll.mp4 (or .webm) in the assets folder.</small></div><div class="rr-unmute">click the video to unmute</div></div><div class="rr-meta"><b>Never Gonna Give You Up</b><span>1,500,000,000 views + 1 (you)</span></div></div><div class="rr-comments"></div></div></div><div class="rr-foot"><span class="rr-cnt"></span><button class="rr-again">ROLL AGAIN</button><button class="rr-esc">ESCAPE</button></div>';
      $('.rr-ascii', o.d).textContent = FACE;
      var man = $('.rr-man', o.d), dn = $('.rr-dance', o.d), screen = $('.rr-screen', o.d), com = $('.rr-comments', o.d), na = $('.rr-na', o.d), um = $('.rr-unmute', o.d), vOK = false, fb = false;
      vid = $('.rr-vid', o.d);
      /* the video lives in assets/: rickroll.mp4 first, rickroll.webm as a fallback format */
      ['assets/rickroll.mp4', 'video/mp4', 'assets/rickroll.webm', 'video/webm'].forEach(function (v, i, a) { if (i % 2) return; var s = document.createElement('source'); s.src = v; s.type = a[i + 1]; vid.appendChild(s); });
      function fallback() { if (vOK || fb || dead) return; fb = true; vid.style.display = 'none'; na.style.display = 'block'; }
      vid.lastChild.addEventListener('error', fallback); vid.addEventListener('error', fallback);
      vid.addEventListener('playing', function () { vOK = true; });
      vid.addEventListener('volumechange', function () { if (!vid.muted) um.style.display = 'none'; });
      um.onclick = function () { vid.muted = false; vid.play(); um.style.display = 'none'; };
      var pr = vid.play();
      if (pr && pr.catch) pr.catch(function () { if (fb || dead) return; vid.muted = true; var q = vid.play(); if (q && q.catch) q.catch(function () {}); um.style.display = 'block'; });
      var joke = rolls === 1 ? 'times rolled: 1. welcome to the club.' : rolls < 5 ? 'times rolled: ' + rolls + '. you keep coming back. we respect it.' : 'times rolled: ' + rolls + '. at this point you are the rickroll.';
      $('.rr-cnt', o.d).textContent = joke;
      $('.rr-again', o.d).onclick = function () { o.close(); setTimeout(rick, 200); };
      $('.rr-esc', o.d).onclick = function () { o.close(); toast('escaped. (the rick follows you.)'); };
      var PM = ['PROMISE MANIFEST  (the title is the only lyric on this machine)', '', '[ VOWED ] never gonna segfault you', '[ VOWED ] never gonna null-pointer you', '[ VOWED ] never gonna off-by-one you', '[ VOWED ] never gonna O(n!) you', '[ VOWED ] never gonna force-push over you', '[ VOWED ] never gonna deprecate you', '[ VOWED ] never gonna merge-conflict you', '[ VOWED ] never gonna ask you to explain the invariant', '[ VOWED ] never gonna ship you without a base case', '[ ERROR ] never gonna stop rolling you (cannot be disabled)'];
      (async function () { for (var i = 0; i < PM.length && !dead; i++) { await typeTo(man, PM[i], 14); await wait(120); } })();
      var beat = 0, cm = ROLL_COMMENTS.slice().sort(function () { return Math.random() - 0.5; }), BASS = [55, 55, 65.4, 49];
      dn.textContent = dancers(0);
      /* dancers always dance; the synth groove + floating notes only play when there is no real video */
      ivs.push(setInterval(function () {
        if (dead) return; beat++;
        dn.textContent = dancers(beat); win.style.setProperty('--rh', String((beat * 14) % 360));
        if (!fb) return;
        tone(140, 45, 0.18, 'sine', 0.08); tone(BASS[beat % 4], BASS[beat % 4] * 0.98, 0.45, 'sawtooth', 0.035);
        if (beat % 2 === 0) tone(1800, 900, 0.08, 'square', 0.03);
        tone(7000, 6000, 0.03, 'square', 0.015, 0.265);
        var n = el('span', 'rr-note', '\u266A'); n.style.left = R(5, 90) + '%'; screen.appendChild(n); setTimeout(function () { n.remove(); }, 2400);
      }, 531));
      ivs.push(setInterval(function () {
        if (dead || !cm.length) return; var c = cm.shift(); cm.push(c);
        var d = el('div', 'rr-cm', '<b>' + c[0] + '</b> ' + c[1]); com.appendChild(d); while (com.children.length > 6) com.removeChild(com.firstChild);
      }, 1400));
    }
    (async function () {
      await typeTo(pre, '$ sudo ./RUN_OPTIMIZATION_VCE.sh', 14); await typeTo(pre, '[sudo] password for operator: ********', 10);
      await typeTo(pre, 'VCE-OPTIMIZER v3.1 (c) totally-legit labs', 8); await typeTo(pre, 'checking study-design invariants ........ PASS', 8); await typeTo(pre, 'locating memo3 solution key ............ FOUND', 8);
      await prog('decrypting answer key', 99, 2800); if (dead) return;
      await wait(900); await typeTo(pre, 'stuck at 99%. classic.', 25); await wait(700);
      await typeTo(pre, 'ERROR 0x1987: optimizer cannot continue.', 25); await typeTo(pre, 'cause: a promise made in 1987 cannot be broken.', 25); await wait(900); if (dead) return;
      win.classList.add('rr-glitch'); tone(80, 2000, 0.6, 'sawtooth', 0.05); tone(2000, 80, 0.6, 'square', 0.04, 0.3);
      await wait(1300); if (dead) return; win.classList.remove('rr-glitch'); os();
    })();
  }

  /* 8. ABSURD CAPTCHA */
  function captcha() {
    var fails = 0, o = openOv('chx-cp', '<div class="cp-box"><div class="cp-head"></div><div class="cp-body"></div></div>');
    var body = $('.cp-body', o.d), head = $('.cp-head', o.d);
    var PR = ['an emotional crisis', 'O(n!) complexity', 'a sentient toaster', 'the concept of Monday', 'a regression in production', 'the colour of Tuesday', 'a solved halting problem', 'regret'];
    var IC = ['\u{1F62D}', '\u{1F4C9}', '\u2615', '\u{1F41B}', '\u{1F525}', '\u{1F4CE}', '\u{1F9E0}', '\u23F3', '\u{1F4A5}', '\u{1F9E6}', '\u{1F986}', '\u{1F41F}'];
    var FL = ['incorrect. you selected feelings instead of crises.', 'wrong. that square was in a superposition.', 'the algorithm disagrees, and the algorithm has tenure.', 'close. but no.', 'a human would have known. suspicious.', 'error: the correct answer is always one square off.'];
    function start() {
      head.innerHTML = ''; body.innerHTML = '<label class="cp-chk"><span class="cp-cb"></span> I am not a robot</label>';
      $('.cp-chk', body).onclick = function () { $('.cp-cb', body).classList.add('spin'); setTimeout(round, 1300); };
    }
    function round() {
      var sel = {}; head.innerHTML = 'Select all squares containing<br><b>' + pick(PR) + '</b>';
      var grid = el('div', 'cp-grid');
      for (var i = 0; i < 9; i++) (function (i) { var t = el('div', 'cp-t', pick(IC)); t.onclick = function () { sel[i] = !sel[i]; t.classList.toggle('on', sel[i]); tone(700, 700, 0.03); }; grid.appendChild(t); })(i);
      var msg = el('div', 'cp-msg', fails ? 'attempt ' + (fails + 1) + ' of &infin;' : ''), btn = el('button', 'cp-go', 'VERIFY');
      btn.onclick = function () {
        fails++; msg.className = 'cp-msg bad'; msg.textContent = pick(FL); tone(160, 120, 0.25, 'sawtooth', 0.06);
        if (fails >= 5) { xp('captcha', 10); msg.textContent = 'verdict: you are a robot. you may proceed anyway.'; btn.textContent = 'ACCEPT FATE'; btn.onclick = o.close; return; }
        setTimeout(round, 1400);
      };
      body.innerHTML = ''; body.appendChild(grid); body.appendChild(msg); body.appendChild(btn);
    }
    start();
  }

  /* 9. INFINITE LOADING BAR */
  function loading() {
    var alive = true;
    var o = openOv('chx-ld', '<div class="ld-box"><h3>Calculating Final VCE Scaled Score...</h3><div class="ld-track"><i></i></div><div class="ld-row"><span class="ld-pct">0%</span><span class="ld-eta"></span></div><p class="ld-q"></p><small>esc to give up</small></div>', function () { alive = false; });
    var fill = $('i', o.d), pct = $('.ld-pct', o.d), eta = $('.ld-eta', o.d), q = $('.ld-q', o.d), cur = 0;
    var C = ['#39ff14', '#ff2bd6', '#00e5ff', '#ffb800', '#b44dff'], ETA = ['ETA: 4 min', 'ETA: soon', 'ETA: 12 yrs', 'ETA: yes', 'ETA: \u221e', 'ETA: 99 min ago'];
    function set(v, col) { cur = v; fill.style.width = v + '%'; if (col) fill.style.background = col; pct.textContent = v.toFixed(v > 98 ? 1 : 0) + '%'; }
    function anim(to, ms, col) {
      return new Promise(function (res) {
        var from = cur, t0 = performance.now(); if (col) fill.style.background = col;
        (function f(now) { if (!alive) return res(); var k = Math.min(1, (now - t0) / ms); set(from + (to - from) * k); if (k < 1) requestAnimationFrame(f); else res(); })(t0);
      });
    }
    xp('load', 5);
    (async function () {
      while (alive) {
        eta.textContent = pick(ETA); q.textContent = 'summoning the examiners...'; await anim(99, 3500, pick(C)); if (!alive) break;
        q.textContent = 'almost there. (no.)'; await wait(1800); if (!alive) break;
        q.textContent = 'recounting...'; set(12, pick(C)); await wait(700); eta.textContent = pick(ETA);
        await anim(61, 2200); q.textContent = 'nope. backwards now.'; await anim(4, 1800, pick(C)); if (!alive) break;
        q.textContent = 'rescaling the rescaling'; await anim(99.9, 3200, pick(C)); q.textContent = 'ERROR: scaled score is not a real number'; await wait(1600); set(0, pick(C));
      }
    })();
  }

  /* 10. HACKER TYPER (Ctrl+Alt+H) */
  var SRC = [
    'def dijkstra(graph, src):', '    dist = {v: float("inf") for v in graph}', '    dist[src] = 0', '    pq = [(0, src)]', '    while pq:', '        d, u = heapq.heappop(pq)', '        if d > dist[u]:', '            continue', '        for v, w in graph[u]:', '            nd = d + w', '            if nd < dist[v]:', '                dist[v] = nd', '                heapq.heappush(pq, (nd, v))', '    return dist', '',
    'static int ring_push(struct ring *r, const void *buf, size_t n)', '{', '    spin_lock_irqsave(&r->lock, flags);', '    if (r->head - r->tail + n > r->size) {', '        spin_unlock_irqrestore(&r->lock, flags);', '        return -ENOSPC;', '    }', '    memcpy(r->data + (r->head & r->mask), buf, n);', '    smp_wmb();', '    r->head += n;', '    spin_unlock_irqrestore(&r->lock, flags);', '    return 0;', '}', '',
    'def aco_update(tau, ants, rho=0.5, Q=1.0):', '    for e in tau:', '        tau[e] *= (1 - rho)', '    for path, cost in ants:', '        for e in zip(path, path[1:]):', '            tau[e] += Q / cost', '    return tau', '',
    'def bfs(G, s):', '    seen, q = {s}, deque([s])', '    while q:', '        u = q.popleft()', '        for v in G[u]:', '            if v not in seen:', '                seen.add(v); q.append(v)', '    return seen', ''
  ].join('\n') + '\n';
  function typer() {
    if (stack.some(function (o) { return o.d.classList.contains('chx-ht'); })) return;
    var o = openOv('chx-ht', '<pre class="ht-pre"></pre><div class="ht-ok"></div>', function () { window.removeEventListener('keydown', key, true); });
    var pre = $('.ht-pre', o.d), ok = $('.ht-ok', o.d), i = 0, mark = 600, grant = true;
    function key(e) {
      if (e.key === 'Escape') return;
      if (e.ctrlKey && e.altKey && e.code === 'KeyH') { e.preventDefault(); e.stopImmediatePropagation(); o.close(); return; }
      if (/^(Shift|Control|Alt|Meta|CapsLock|F\d+)$/.test(e.key)) return;
      e.preventDefault(); e.stopImmediatePropagation();
      var n = Math.round(R(3, 7)); pre.textContent += SRC.substr(i % SRC.length, n); i += n;
      if (pre.textContent.length > 7000) pre.textContent = pre.textContent.slice(-4500);
      o.d.scrollTop = 1e7;
      if (i > mark) { mark += R(500, 900); ok.textContent = grant ? 'ACCESS GRANTED' : 'ACCESS DENIED'; ok.className = 'ht-ok show ' + (grant ? 'g' : 'd'); tone(grant ? 880 : 140, grant ? 1320 : 100, 0.2, 'square', 0.05); grant = !grant; setTimeout(function () { ok.className = 'ht-ok'; }, 1100); xp('typer', 5); }
    }
    window.addEventListener('keydown', key, true);
  }
  document.addEventListener('keydown', function (e) { if (e.ctrlKey && e.altKey && e.code === 'KeyH') { e.preventDefault(); typer(); } });

  /* 11. FAKE AUDIO DRIVER ERROR (triple-click the big title, or `driver`) */
  function driver() {
    var alive = true;
    var o = openOv('chx-dr', '<div class="dr-win"><div class="dr-bar">Audio Service &mdash; Error</div><div class="dr-bd"><div class="dr-ic">!</div><div><b>Audio Driver Corrupted.</b><p>realtek-hd-vce.sys (0xC000009A) has stopped responding.</p><p class="dr-ask">Please blow into your microphone to clear dust.</p><div class="dr-meter"><i></i></div></div></div><div class="dr-btns"><button class="dr-blow">BLOW</button><button class="dr-no">CANCEL</button></div></div>', function () { alive = false; });
    for (var i = 0; i < 26; i++) tone(R(600, 2400), R(600, 2400), 0.08, 'square', 0.05, i * 0.09);
    tone(90, 40, 0.5, 'sawtooth', 0.08, 2.4);
    var ask = $('.dr-ask', o.d), mt = $('.dr-meter i', o.d), blow = $('.dr-blow', o.d);
    $('.dr-no', o.d).onclick = function () { ask.textContent = 'Cancel is also corrupted.'; tone(200, 150, 0.15); };
    blow.onclick = async function () {
      if (blow.textContent !== 'BLOW') return o.close();
      blow.disabled = true; ask.textContent = 'blow harder...';
      for (var k = 0; k < 30 && alive; k++) { mt.style.width = (k / 30 * 100 * R(0.7, 1.1)) + '%'; await wait(100); }
      if (!alive) return; mt.style.width = '100%'; ask.textContent = 'Dust cleared. (we never touched your microphone. promise.)'; blow.disabled = false; blow.textContent = 'OK'; xp('driver', 6);
    };
  }
  var hc = 0, ht = 0;
  document.addEventListener('click', function (e) {
    var h = e.target.closest && e.target.closest('h1'); if (!h || stack.length) { hc = 0; return; }
    var n = Date.now(); hc = n - ht < 650 ? hc + 1 : 1; ht = n; if (hc >= 3) { hc = 0; driver(); }
  });

  /* 12. INSULT COMPILER */
  function hx() { return ('0000' + Math.floor(Math.random() * 65536).toString(16)).slice(-4).toUpperCase(); }
  function judge(src) {
    var L = src.split('\n'), n = src.trim() ? L.length : 0, out = ['> compiling ' + n + ' line' + (n === 1 ? '' : 's') + ' of questionable intent...'], bad = [];
    if (!n) return out.concat(['ERROR 0x0000' + hx() + ': input is empty.', 'bold strategy: a program with no bugs because it has no code.', 'verdict: 0/10. technically flawless. spiritually vacant.']);
    var who = pick(['an oxidized toaster', 'a sleep-deprived vending machine', 'a raccoon with root access', 'a haunted CRT', 'a pigeon on a keyboard', 'a printer that has seen too much', 'a neon sign with a grudge']);
    var ind = L.map(function (l) { return (l.match(/^\s*/)[0] || '').length; }), loops = [];
    L.forEach(function (l, i) { if (/\b(for|while)\b/.test(l)) loops.push(ind[i]); });
    var nest = loops.some(function (a, i) { return loops.some(function (b, j) { return j < i && b < a; }); });
    var shortv = (src.match(/\b[a-z]\s*=[^=]/g) || []).length, prints = (src.match(/print\(|console\.log|printf|cout/g) || []).length;
    var longest = Math.max.apply(null, L.map(function (l) { return l.length; })), deep = Math.max.apply(null, ind) >= 16;
    out.push('This syntax looks like it was written by ' + who + '.');
    if (nest) bad.push(pick(['nested loops detected. O(n^2) called; it wants its time budget back.', 'that nested loop is quadratic. so is my disappointment.']));
    if (shortv > 3) bad.push('single-letter variables everywhere. i, j, k, x... is this code or a sad alphabet?');
    if (/\b(temp|tmp|foo|bar|stuff|thing|data2|test1)\b/i.test(src)) bad.push('variables named temp/foo/stuff. naming things is hard; you did not try.');
    if (prints > 2) bad.push('debug prints scattered like confetti. the logs are now a diary.');
    if (longest > 100) bad.push('line ' + (L.findIndex(function (l) { return l.length === longest; }) + 1) + ' is ' + longest + ' characters long. horizontal scrolling is not a personality.');
    if (/todo|fixme|hack|xxx/i.test(src)) bad.push('a TODO that will outlive us all.');
    if (n > 6 && !/(#|\/\/|\/\*)/.test(src)) bad.push('zero comments. future-you is going to hunt present-you.');
    if (/\bgoto\b/.test(src)) bad.push('goto. in this economy.');
    if (deep) bad.push('indentation so deep the code needs oxygen.');
    if ((src.match(/\b\d{3,}\b/g) || []).length > 2) bad.push('magic numbers. which wizard handed you those?');
    if (/def (\w+)\([^)]*\):[\s\S]*\b\1\(/.test(src)) bad.push('recursion without visible base-case confidence. bold.');
    var gen = ['the compiler read this and filed a complaint with HR.', 'i have seen cleaner logic in a corrupted save file.', 'this is not spaghetti code. spaghetti has structure.', 'your formatting suggests a lack of hope.'];
    while (bad.length < 3) bad.push(gen.splice(Math.floor(Math.random() * gen.length), 1)[0]);
    var score = Math.max(1, 9 - Math.floor(bad.length * 1.4));
    return out.concat(bad.slice(0, 5).map(function (t) { return 'ERROR 0x' + hx() + ': ' + t; }), ['verdict: ' + score + '/10. ' + pick(['it compiles. emotionally, it does not.', 'ship it. the bugs will build character.', 'the bug mascot has already adopted this file.'])]);
  }
  function compiler() {
    var o = openOv('chx-ic', '<div class="ic-box"><div class="ic-bar">INSULT_BOT compiler v0.9 &mdash; paste code, accept judgment <i class="ic-x">x</i></div><textarea class="ic-in" spellcheck="false" placeholder="// paste your code here. no, really. brace yourself."></textarea><div class="ic-bt"><button class="ic-go">COMPILE</button></div><pre class="ic-out"></pre></div>');
    var ta = $('.ic-in', o.d), out = $('.ic-out', o.d), busy = false;
    $('.ic-x', o.d).onclick = o.close;
    $('.ic-go', o.d).onclick = async function () {
      if (busy) return; busy = true; var lines = judge(ta.value); out.textContent = ''; tone(400, 800, 0.1);
      for (var i = 0; i < lines.length; i++) { for (var c = 0; c < lines[i].length; c++) { out.textContent += lines[i][c]; if (c % 2) await wait(14); } out.textContent += '\n'; await wait(220); }
      busy = false; xp('insult', 6);
    };
    setTimeout(function () { ta.focus(); }, 50);
  }

  /* wiring: terminal commands, typed words, hidden button */
  function run(fn, msg) { return function (a) { P(msg); leave(); setTimeout(function () { fn(a || []); }, 280); }; }
  function mtog(name, start, msg) {
    return function (a) {
      a = a || [];
      if (modes[name] || a[0] === 'off') { if (modes[name]) { modes[name](); P(name + ' off'); } return; }
      P(msg); leave();
      setTimeout(function () { if (modes[name]) return; var off = start(a); modes[name] = function () { delete modes[name]; off(); }; }, 280);
    };
  }
  cmds.railgun = mtog('rail', railgun, 'charging plasma railgun...');
  cmds.overheat = mtog('heat', overheat, 'cpu monitor online. try not to click too fast.');
  cmds.gravity = mtog('grav', gravity, 'inverting local gravity... (add "up" to fall upward)');
  cmds.hammer = mtog('hammer', hammer, 'equipping glass hammer...');
  cmds.repair = function () { if (modes.hammer) modes.hammer(); else P('nothing is broken. yet.'); };
  cmds.dvd = mtog('dvd', dvd, 'screensaver engaged...');
  cmds.destruct = cmds.selfdestruct = run(destruct, 'arming self-destruct...');
  cmds.rickroll = cmds['./run_optimization_vce.sh'] = cmds['run_optimization_vce.sh'] = run(rick, 'sudo ./RUN_OPTIMIZATION_VCE.sh ...');
  cmds.captcha = run(captcha, 'verifying humanity...');
  cmds.loading = run(loading, 'calculating...');
  cmds.typer = cmds.hackertyper = run(typer, 'jacking in...');
  cmds.driver = run(driver, 'probing audio hardware...');
  cmds.compile = cmds.insult = run(compiler, 'booting insult_bot...');
  cmds.chaos = function () {
    ['railgun [off]    click anything to vaporise it', 'overheat [off]   cpu gauge: click/scroll too fast and it melts', 'gravity [up]      everything falls (Esc restores)', 'hammer / repair   smash the glass', 'dvd [off]         bouncing skull, corner counter', 'destruct          glass-covered big red switch', 'panic             full system-breach meltdown (or the big red button)', 'rickroll          or find the ghost button at the bottom', 'captcha           prove you are human (you will not)', 'loading           final VCE scaled score, calculating', 'typer             or Ctrl+Alt+H: mash keys, look like a hacker', 'driver            or triple-click the big title', 'compile           paste code, receive judgment'].forEach(function (l) { P('  ' + l); });
  };
  var buf = '', WORDS = ['railgun', 'overheat', 'gravity', 'hammer', 'dvd', 'destruct', 'rickroll', 'captcha', 'loading', 'typer', 'driver', 'compile'];
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1 || /INPUT|TEXTAREA|SELECT/.test(t.tagName || '') || t.isContentEditable || stack.length) return;
    buf = (buf + e.key.toLowerCase()).slice(-12);
    WORDS.forEach(function (w) { if (buf.slice(-w.length) === w) { buf = ''; cmds[w]([]); } });
  });
  FX.chx = { R: R, wait: wait, tone: tone, xp: xp, el: el, toast: toast, openOv: openOv, skip: skip, stack: stack };
  var gb = el('button', 'chx chx-ghost', 'RUN_OPTIMIZATION_VCE.sh'); gb.onclick = function () { cmds.rickroll([]); }; document.body.appendChild(gb);
})();
