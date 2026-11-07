/* MEMO ARCHIVE — fun pack (part 1): helpers, slice transition, cursor, holo, neon sign, skyline, scroll glitch */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var FX = window.ArchiveFX = window.ArchiveFX || {};
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  function lget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function seeded(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  FX.u = { $: $, $$: $$, rnd: rnd, pick: pick, hash: hash, seeded: seeded, lget: lget, lset: lset, reduce: reduce };

  var LOAD_MSGS = ['reticulating splines', 'bribing the garbage collector', 'convincing marimo to cooperate', 'untangling the neon cables',
    'defragmenting the vibes', 'asking the server nicely', 'compiling excuses', 'warming up the flux capacitor', 'downloading more RAM',
    'teaching the pixels to behave', 'feeding the hamsters that power the cloud', 'polishing the scanlines', 'spinning up the hype engine',
    'counting to infinity (twice)', 'untangling spaghetti code', 'negotiating with the firewall'];
  FX.loadMsgs = LOAD_MSGS;

  /* ── Slice transition (replaces the simple wipe) ── */
  FX.transition = function (href) {
    if (reduce) { location.href = href; return; }
    var N = 12, o = document.createElement('div'), kids = [], i;
    o.className = 'slices';
    for (i = 0; i < N; i++) { var s = document.createElement('i'); s.style.transform = 'translateX(' + (i % 2 ? 101 : -101) + '%)'; o.appendChild(s); kids.push(s); }
    var m = document.createElement('div'); m.className = 'slices-msg';
    m.innerHTML = '<div class="sm-t"></div><div class="sm-bar"><b></b></div>';
    $('.sm-t', m).textContent = pick(LOAD_MSGS) + '…';
    o.appendChild(m); document.body.appendChild(o);
    kids.forEach(function (s, i) {
      s.animate([{ transform: s.style.transform }, { transform: 'translateX(0)' }], { duration: 230, delay: i * 16, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    });
    var t0 = N * 16 + 120;
    m.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: t0 - 60, fill: 'forwards' });
    $('.sm-bar b', m).animate([{ width: '0%' }, { width: '100%' }], { duration: 380, delay: t0 - 60, fill: 'forwards' });
    setTimeout(function () { location.href = href; }, t0 + 340);
    addEventListener('pageshow', function () { o.remove(); }, { once: true });
  };

  /* ── Cursor trail + reticle ── */
  if (!reduce && !coarse) {
    var tc = document.createElement('canvas'); tc.id = 'trail'; document.body.appendChild(tc);
    var tx = tc.getContext('2d'), parts = [], looping = false, mx = -100, my = -100, rx = -100, ry = -100;
    var ret = document.createElement('div'); ret.className = 'reticle'; ret.innerHTML = '<i></i><i></i><i></i><i></i>'; document.body.appendChild(ret);
    var TC = ['0,245,255', '255,45,120', '180,77,255'];
    function tsize() { tc.width = innerWidth; tc.height = innerHeight; }
    tsize(); addEventListener('resize', tsize);
    function loop() {
      tx.clearRect(0, 0, tc.width, tc.height); tx.globalCompositeOperation = 'lighter';
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life -= .035; if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy;
        tx.fillStyle = 'rgba(' + p.c + ',' + (p.life * .8).toFixed(2) + ')';
        tx.beginPath(); tx.arc(p.x, p.y, p.s * p.life, 0, 6.283); tx.fill();
      }
      rx += (mx - rx) * .28; ry += (my - ry) * .28;
      ret.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      if (parts.length || Math.abs(mx - rx) > .4 || Math.abs(my - ry) > .4) requestAnimationFrame(loop); else looping = false;
    }
    addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY; ret.style.opacity = 1;
      for (var k = 0; k < 2; k++) parts.push({ x: mx + rnd(-3, 3), y: my + rnd(-3, 3), vx: rnd(-.6, .6), vy: rnd(-.6, .6), life: 1, s: rnd(2, 4.5), c: pick(TC) });
      if (parts.length > 150) parts.splice(0, parts.length - 150);
      if (!looping) { looping = true; requestAnimationFrame(loop); }
    });
    document.addEventListener('mouseover', function (e) {
      var hot = e.target.closest && e.target.closest('a,.card-link,.pill,.swatch,[role=button],.pal-item,.bug,.pop-btn,.pop-x,.nl-eye');
      ret.classList.toggle('hot', !!hot);
    });
    addEventListener('mousedown', function () { ret.classList.add('down'); });
    addEventListener('mouseup', function () { ret.classList.remove('down'); });
    document.documentElement.addEventListener('mouseleave', function () { ret.style.opacity = 0; });
  }

  /* ── Holographic foil: add layer + feed pointer position ── */
  $$('.card-link').forEach(function (c) {
    var h = document.createElement('i'); h.className = 'holo'; c.appendChild(h);
    c.addEventListener('mousemove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--hx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      c.style.setProperty('--hy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  });

  /* ── Neon sign flicker + sparks ── */
  var h1 = $('h1.sign') || $('.hero h1');
  function sparks() {
    if (!h1 || !h1.animate) return;
    var r = h1.getBoundingClientRect(), n = 14;
    for (var i = 0; i < n; i++) {
      var s = document.createElement('i'); s.className = 'spark';
      s.style.left = (r.left + r.width * rnd(.1, .8)) + 'px'; s.style.top = (r.bottom - r.height * .3) + 'px';
      document.body.appendChild(s);
      var dx = rnd(-70, 70), dy = rnd(30, 130);
      s.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: 'translate(' + dx + 'px,' + dy + 'px)', opacity: 0 }],
        { duration: rnd(450, 900), easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' });
      (function (el) { setTimeout(function () { el.remove(); }, 1000); })(s);
    }
  }
  function flicker(die) {
    if (!h1 || reduce || root.classList.contains('booting')) return;
    var seq = die ? [70, 60, 50, 90, 40, 140] : [60, 50, 40, 100], t = 0, on = false;
    seq.forEach(function (d) { t += d; on = !on; (function (state, at) { setTimeout(function () { h1.classList.toggle('sign-off', state); }, at); })(on, t); });
    if (die) { setTimeout(function () { h1.classList.add('sign-off'); sparks(); }, t + 20); t += 1100; }
    setTimeout(function () { h1.classList.remove('sign-off'); }, t + 120);
  }
  FX.neon = function () { flicker(true); };
  (function signLoop() { if (reduce) return; setTimeout(function () { flicker(Math.random() < .3); signLoop(); }, rnd(5000, 11000)); })();

  /* ── Skyline ── */
  function buildSky() {
    var sky = $('#skyline'); if (!sky) return;
    var W = 1600, H = 190, rng = seeded(77), WC = ['#ffe27a', '#8ff6ff', '#ff7ab8', '#b9a0ff'];
    function layer(minW, maxW, minH, maxH, fill, edge, wins) {
      var x = -20, out = '<svg class="sky-layer" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice">';
      while (x < W) {
        var w = minW + rng() * (maxW - minW), h = minH + rng() * (maxH - minH), y = H - h;
        out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + fill + '"/>';
        if (edge) out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="1.4" fill="' + edge[Math.floor(rng() * edge.length)] + '" opacity=".85"/>';
        if (edge && rng() > .78) {
          var ax = x + w / 2;
          out += '<line x1="' + ax.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + ax.toFixed(1) + '" y2="' + (y - 16).toFixed(1) + '" stroke="#26384f" stroke-width="1.5"/>' +
                 '<circle class="sky-beacon" cx="' + ax.toFixed(1) + '" cy="' + (y - 17).toFixed(1) + '" r="1.8" fill="#ff2d4d"/>';
        }
        if (wins) for (var wy = y + 8; wy < H - 6; wy += 10) for (var wx = x + 5; wx < x + w - 7; wx += 8) {
          if (rng() > .5) out += '<rect' + (rng() > .92 ? ' class="sky-win-blink" style="animation-delay:' + (rng() * 3).toFixed(1) + 's"' : '') +
            ' x="' + wx.toFixed(1) + '" y="' + wy.toFixed(1) + '" width="3" height="4" fill="' + WC[Math.floor(rng() * WC.length)] + '" opacity=".85"/>';
        }
        x += w + rng() * 5;
      }
      return out + '</svg>';
    }
    var html = '<div class="sky-sun"></div>' +
      '<div class="sky-par" data-d="5">' + layer(26, 64, 40, 100, '#0a1322', null, false) + '</div>' +
      '<div class="sky-par" data-d="12">' + layer(30, 70, 55, 130, '#0d1b2e', ['#00f5ff', '#b44dff'], false) + '</div>' +
      '<div class="sky-par" data-d="22">' + layer(34, 80, 70, 165, '#0f2236', ['#00f5ff', '#ff2d78', '#b44dff'], true) + '</div>';
    var carDefs = [['#00f5ff', 12, '-2s', 38, false], ['#ff2d78', 17, '-9s', 62, true], ['#ffe27a', 9, '-5s', 24, false], ['#b44dff', 21, '-14s', 80, true]];
    carDefs.forEach(function (c) { html += '<i class="car' + (c[4] ? ' rev' : '') + '" style="--c:' + c[0] + ';--dur:' + c[1] + 's;--del:' + c[2] + ';top:' + c[3] + 'px"></i>'; });
    sky.innerHTML = html;
    function dist() { sky.style.setProperty('--dist', (sky.clientWidth + 90) + 'px'); }
    dist(); addEventListener('resize', dist);
    var pars = $$('.sky-par', sky), raf = 0;
    if (!reduce && !coarse) addEventListener('mousemove', function (e) {
      if (raf) return; raf = requestAnimationFrame(function () {
        raf = 0; var nx = e.clientX / innerWidth - .5;
        pars.forEach(function (p) { p.style.transform = 'translateX(' + (-nx * p.dataset.d * 2) + 'px)'; });
      });
    });
  }
  buildSky();

  /* ── Scroll aberration ── */
  var main = $('.main'), lastY = scrollY, lastT = performance.now(), abT;
  if (!reduce && main) addEventListener('scroll', function () {
    var now = performance.now(), v = Math.abs(scrollY - lastY) / Math.max(1, now - lastT) * 16; lastY = scrollY; lastT = now;
    if (v > 28) {
      main.style.setProperty('--ab', Math.min(6, v / 14).toFixed(1) + 'px'); main.classList.add('aber');
      clearTimeout(abT); abT = setTimeout(function () { main.classList.remove('aber'); }, 140);
      if (v > 95 && FX.snark) FX.snark('speed');
    }
  }, { passive: true });
})();
