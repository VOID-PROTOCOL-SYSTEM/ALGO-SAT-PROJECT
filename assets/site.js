/* MEMO ARCHIVE — landing page extras (boot, scramble, tilt, HUD, palette, hue, easter egg) */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k) || localStorage.getItem(k); } catch (e) { return null; } },
    setL: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    setS: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Boot sequence (once per session, any key / click skips) ── */
  function boot() {
    var root = document.documentElement, el = $('#boot'), log = $('#boot-log');
    if (!el || !root.classList.contains('booting')) return;
    var n = $$('.card-link').length;
    var lines = [
      '> MEMO_ARCHIVE BIOS v2.0.77', '> checking memory ........ OK', '> mounting /notebooks ..... ' + n + ' FILES',
      '> loading theme ........... cyberpunk-marimo.css', '> neural link ............. STANDBY', '> ACCESS GRANTED_'
    ];
    var i = 0, done = false;
    function finish() {
      if (done) return; done = true;
      store.setS('booted', '1'); el.classList.add('out');
      setTimeout(function () { root.classList.remove('booting'); }, 480);
      scramble($('h1'));
    }
    function next() {
      if (done) return;
      if (i >= lines.length) return setTimeout(finish, 450);
      log.textContent += (i ? '\n' : '') + lines[i++];
      setTimeout(next, 230);
    }
    ['keydown', 'click', 'touchstart'].forEach(function (ev) { el.addEventListener(ev, finish); });
    document.addEventListener('keydown', finish, { once: true });
    next();
  }

  /* ── Title decrypt effect ── */
  var GLYPHS = '!<>-_\\/[]{}=+*^?#01';
  function scramble(el) {
    if (!el || reduce) return;
    var text = el.dataset.text || el.textContent; el.dataset.text = text;
    var frame = 0, total = 28;
    clearInterval(el._t);
    el._t = setInterval(function () {
      var out = '';
      for (var k = 0; k < text.length; k++) {
        if (text[k] === ' ') { out += ' '; continue; }
        out += (k / text.length) * total < frame ? text[k] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (++frame > total) { clearInterval(el._t); el.textContent = text; }
    }, 32);
  }

  /* ── Spotlight + 3D tilt on cards ── */
  function cards() {
    $$('.card-link').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
        if (reduce) return;
        var rx = ((y / r.height) - .5) * -9, ry = ((x / r.width) - .5) * 9;
        c.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-3px)';
      });
      c.addEventListener('mouseleave', function () { c.style.transform = ''; });
    });
  }

  /* ── HUD: live UTC clock + session uptime ── */
  function hud() {
    var clock = $('#hud-clock'), up = $('#hud-up'), t0 = Date.now();
    if (!clock) return;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function tick() {
      var d = new Date();
      clock.textContent = pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + ' UTC';
      var s = Math.floor((Date.now() - t0) / 1000);
      if (up) up.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
    }
    tick(); setInterval(tick, 1000);
  }

  /* ── Hue switcher ── */
  function hue() {
    var map = { cyan: 0, violet: 75, amber: -150, green: -55 };
    function apply(name) {
      var deg = map[name] || 0;
      document.documentElement.style.filter = deg ? 'hue-rotate(' + deg + 'deg)' : '';
      $$('.swatch').forEach(function (s) { s.classList.toggle('on', s.dataset.hue === name); });
      store.setL('hue', name);
    }
    $$('.swatch').forEach(function (s) {
      s.addEventListener('click', function () { apply(s.dataset.hue); });
      s.addEventListener('keydown', function (e) { if (e.key === 'Enter') apply(s.dataset.hue); });
    });
    apply(store.get('hue') || 'cyan');
    (window.ArchiveFX = window.ArchiveFX || {}).hue = apply;
  }

  /* ── Command palette (Ctrl/Cmd+K) ── */
  function palette() {
    var items = $$('.card-link').map(function (c) {
      return { href: c.getAttribute('href'), tag: $('.card-tag', c).textContent, name: $('.card-name', c).textContent };
    });
    var wrap = document.createElement('div'); wrap.className = 'pal-wrap';
    wrap.innerHTML = '<div class="pal"><input type="search" placeholder="jump to notebook…" autocomplete="off">' +
      '<div class="pal-list"></div><div class="pal-foot"><kbd>↑</kbd> <kbd>↓</kbd> NAVIGATE &nbsp; <kbd>ENTER</kbd> OPEN &nbsp; <kbd>ESC</kbd> CLOSE</div></div>';
    document.body.appendChild(wrap);
    var input = $('input', wrap), list = $('.pal-list', wrap), sel = 0, shown = [];
    function render() {
      var q = input.value.trim().toLowerCase();
      shown = items.filter(function (it) { return !q || (it.tag + ' ' + it.name).toLowerCase().indexOf(q) !== -1; });
      sel = Math.min(sel, Math.max(shown.length - 1, 0));
      list.innerHTML = '';
      shown.forEach(function (it, i) {
        var a = document.createElement('a'); a.className = 'pal-item' + (i === sel ? ' sel' : ''); a.href = it.href;
        a.style.borderBottom = 'none';
        var n = document.createElement('span'); n.textContent = it.name;
        var s = document.createElement('small'); s.textContent = it.tag;
        a.appendChild(n); a.appendChild(s); list.appendChild(a);
      });
      if (!shown.length) { list.innerHTML = '<div class="pal-item">&gt; NO MATCHES</div>'; }
    }
    function open() { wrap.classList.add('open'); input.value = ''; sel = 0; render(); input.focus(); }
    function close() { wrap.classList.remove('open'); }
    input.addEventListener('input', function () { sel = 0; render(); });
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); wrap.classList.contains('open') ? close() : open(); return; }
      if (!wrap.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % shown.length; render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + shown.length) % shown.length; render(); }
      else if (e.key === 'Enter' && shown[sel]) { var h = shown[sel].href; (window.ArchiveFX && ArchiveFX.go) ? ArchiveFX.go(h) : (location.href = h); }
    });
    var hint = $('#open-pal'); if (hint) hint.addEventListener('click', open);
  }

  /* ── Konami easter egg ── */
  function konami() {
    var seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'], pos = 0;
    var toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = '// OVERRIDE ACCEPTED — GLITCH STORM ENGAGED';
    document.body.appendChild(toast);
    function storm() { var r = document.documentElement; r.classList.add('storm'); toast.classList.add('show');
      setTimeout(function () { r.classList.remove('storm'); toast.classList.remove('show'); }, 6000); }
    (window.ArchiveFX = window.ArchiveFX || {}).storm = storm;
    document.addEventListener('keydown', function (e) {
      var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      pos = k === seq[pos] ? pos + 1 : (k === seq[0] ? 1 : 0);
      if (pos === seq.length) { pos = 0; storm(); }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    cards(); hud(); hue(); palette(); konami(); boot();
    var h1 = $('h1'); if (h1) { if (!document.documentElement.classList.contains('booting')) scramble(h1); h1.addEventListener('mouseenter', function () { scramble(h1); }); }
  });
})();
