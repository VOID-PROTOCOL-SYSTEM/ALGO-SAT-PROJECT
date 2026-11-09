/* MEMO ARCHIVE — v10.4 SLEEPER MODE: arm any prank from a link and let it fire later.
   link format:  index.html#sleeper=panic:idle:90;rickroll:click      (also ?sleeper=... works)
   feature[.arg]:trigger[:n]   triggers: random | delay[:N or A-B s] | idle[:N s] | click[:nth] | scroll[:N %] | load
   disarm: type  disarm  anywhere, run  disarm  in the terminal, or open  #sleeper=off  */
(function () {
  var FX = window.ArchiveFX = window.ArchiveFX || {}, X = FX.chx, U = FX.u; if (!U || !X) return;
  var $ = U.$, pick = U.pick, R = X.R, el = X.el, toast = X.toast, openOv = X.openOv, cmds = FX.cmds || {}, P = function (t) { FX.print && FX.print(t); };
  var ALIAS = { any: 'any', panic: 'panic', rickroll: 'rickroll', rick: 'rickroll', winupdate: 'winupdate', update: 'winupdate', crash: 'crash', bsod: 'crash', dodge: 'dodge', captcha: 'captcha', loading: 'loading', driver: 'driver', gravity: 'gravity', dvd: 'dvd', destruct: 'destruct', typer: 'typer' };
  var ANY = ['panic', 'rickroll', 'winupdate', 'crash', 'dodge', 'captcha', 'loading', 'gravity', 'dvd', 'destruct', 'driver'];
  var KEY = 'chx-sleepers', armed = [];

  function store(list) { try { if (list && list.length) sessionStorage.setItem(KEY, JSON.stringify(list)); else sessionStorage.removeItem(KEY); } catch (e) {} }
  function save() { store(armed.map(function (a) { return a.spec; })); }
  function describe(s) {
    var t = s.trig, n = s.r ? s.r[0] + '-' + s.r[1] + 's' : s.n ? s.n + (t === 'scroll' ? '%' : t === 'click' ? 'x' : 's') : '';
    return s.f + (s.a ? '.' + s.a : '') + '  (' + t + (n ? ' ' + n : '') + ')';
  }

  /* triggers: each returns a cancel function and calls go() once */
  var T = {
    random: function (s, go) { var t = setTimeout(go, R(60, 300) * 1000); return function () { clearTimeout(t); }; },
    load: function (s, go) { var t = setTimeout(go, 2000); return function () { clearTimeout(t); }; },
    delay: function (s, go) { var t = setTimeout(go, (s.r ? R(s.r[0], s.r[1]) : (s.n || 60)) * 1000); return function () { clearTimeout(t); }; },
    idle: function (s, go) {
      var ms = (s.n || 90) * 1000, t = 0, ev = ['mousemove', 'keydown', 'mousedown', 'wheel', 'touchstart', 'scroll'];
      function reset() { clearTimeout(t); t = setTimeout(done, ms); }
      function done() { stop(); go(); }
      function stop() { clearTimeout(t); ev.forEach(function (e) { window.removeEventListener(e, reset, true); }); }
      ev.forEach(function (e) { window.addEventListener(e, reset, { capture: true, passive: true }); }); reset(); return stop;
    },
    click: function (s, go) {
      var need = s.n || 1, got = 0;
      function on(e) {
        var a = e.target.closest && e.target.closest('a[href]'); if (!a || X.skip(a)) return;
        var h = a.getAttribute('href'); if (!h || h.charAt(0) === '#' || /^(javascript|mailto|tel):/i.test(h)) return;
        if (++got < need) return; e.preventDefault(); e.stopPropagation(); stop(); go();
      }
      function stop() { document.removeEventListener('click', on, true); }
      document.addEventListener('click', on, true); return stop;
    },
    scroll: function (s, go) {
      var pct = (s.n || 70) / 100;
      function on() { var max = document.documentElement.scrollHeight - innerHeight; if (max > 200 && scrollY / max >= pct) { stop(); go(); } }
      function stop() { window.removeEventListener('scroll', on); }
      window.addEventListener('scroll', on, { passive: true }); return stop;
    }
  };

  function busy() { var a = document.activeElement; return X.stack.length > 0 || !!(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName || '')); }
  function fire(spec) {
    var i = armed.findIndex(function (a) { return a.spec === spec; }); if (i >= 0) armed.splice(i, 1); save();
    (function attempt() {
      if (busy()) { setTimeout(attempt, 4000); return; }
      var name = spec.f === 'any' ? pick(ANY) : spec.f, c = cmds[name]; if (c) c(spec.a ? [spec.a] : []);
    })();
  }
  function arm(spec, persist) {
    var rec = { spec: spec, cancel: (T[spec.trig] || T.random)(spec, function () { fire(spec); }) }; armed.push(rec); if (persist !== false) save(); return rec;
  }
  function disarmAll() { var n = armed.length; armed.forEach(function (a) { a.cancel(); }); armed = []; store([]); return n; }

  /* parse "panic.mac:idle:90;rickroll:click" */
  function parse(str) {
    var out = [];
    String(str || '').split(/[;+,]/).forEach(function (part) {
      var p = part.trim().toLowerCase().split(':'), f0 = (p[0] || '').split('.'), name = ALIAS[f0[0]], trig = p[1] || 'random', arg = p[2];
      if (f0[0] === 'off') { out.off = true; return; } if (!name) return; if (!T[trig]) trig = 'random';
      var s = { f: name, a: f0[1] || '', trig: trig }, m = arg && /^(\d+)-(\d+)$/.exec(arg);
      if (m) s.r = [+m[1], +m[2]]; else if (arg && !isNaN(+arg)) s.n = +arg;
      out.push(s);
    });
    return out;
  }
  function specStr(f, t, n) { return f + ':' + t + (n && t !== 'random' && t !== 'load' ? ':' + n : ''); }

  /* boot: read a link, hide it from the address bar, remember it for this tab's session */
  function readLink() {
    var m = /[#&?]sleeper=([^&]*)/.exec(location.hash) || /[?&]sleeper=([^&]*)/.exec(location.search); if (!m) return false;
    var raw; try { raw = decodeURIComponent(m[1]); } catch (e) { raw = m[1]; }
    var sp = parse(raw);
    if (sp.off) { disarmAll(); } else { sp.forEach(function (s) { arm(s, false); }); save(); }
    try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])sleeper=[^&]*&?/, '$1').replace(/[?&]$/, '')); } catch (e) {}
    return true;
  }
  function restore() { try { var l = JSON.parse(sessionStorage.getItem(KEY) || '[]'); l.forEach(function (s) { arm(s, false); }); } catch (e) {} }
  if (!readLink()) restore();
  window.addEventListener('hashchange', readLink);

  /* terminal commands */
  cmds.disarm = function () { var n = disarmAll(); P(n ? 'disarmed ' + n + ' sleeper' + (n > 1 ? 's' : '') + '. phew.' : 'nothing was armed.'); };
  cmds.sleeper = function (a) {
    a = a || [];
    if (!a.length || a[0] === 'list') {
      if (!armed.length) { P('no sleepers armed. usage: sleeper <prank> [random|delay|idle|click|scroll|load] [n]   or: prank (link builder)'); return; }
      armed.forEach(function (r) { P('  armed: ' + describe(r.spec)); }); return;
    }
    if (a[0] === 'off') return cmds.disarm();
    if (a[0] === 'link' || a[0] === 'build') return cmds.prank();
    var sp = parse(specStr(a[0], a[1] || 'random', a[2]));
    if (!sp.length) { P('unknown prank. try: ' + Object.keys(ALIAS).join(', ')); return; }
    sp.forEach(function (s) { arm(s); P('armed: ' + describe(s) + '  (disarm to cancel)'); });
  };

  /* prank link builder */
  function builder() {
    var chain = [], FEATS = ['any', 'panic', 'rickroll', 'winupdate', 'crash', 'crash.win', 'crash.mac', 'crash.linux', 'crash.snap', 'dodge', 'captcha', 'loading', 'driver', 'gravity', 'gravity.up', 'dvd', 'destruct', 'typer'];
    var o = openOv('chx-sl', '<div class="sl-box"><div class="sl-bar">PRANK LINK BUILDER <i class="sl-x">x</i></div>' +
      '<div class="sl-row"><span class="sl-k">prank</span><select class="sl-f">' + FEATS.map(function (f) { return '<option value="' + f + '">' + (f === 'any' ? 'any (random surprise)' : f) + '</option>'; }).join('') + '</select></div>' +
      '<div class="sl-row"><span class="sl-k">fires</span><select class="sl-t"><option value="random">at a random time (1-5 min)</option><option value="delay">N seconds after they open it</option><option value="idle">after N seconds of no input</option><option value="click">when they click a notebook link</option><option value="scroll">when they scroll N% down</option><option value="load">right after it loads</option></select></div>' +
      '<div class="sl-row sl-nr"><span class="sl-k sl-nn">seconds</span><input class="sl-n" type="text" value="90" spellcheck="false"></div>' +
      '<div class="sl-row"><button class="sl-add">ADD TO LINK</button><span class="sl-chips"></span></div>' +
      '<input class="sl-url" readonly spellcheck="false"><div class="sl-row"><button class="sl-copy">COPY LINK</button><button class="sl-test">TEST IN 3 s</button></div>' +
      '<small>the link hides itself in the address bar after it loads and re-arms if they wander off to a notebook and back. it fires once per tab. disarm: type <b>disarm</b>, or open the link with <b>#sleeper=off</b>.</small></div>');
    var f = $('.sl-f', o.d), t = $('.sl-t', o.d), n = $('.sl-n', o.d), nr = $('.sl-nr', o.d), nn = $('.sl-nn', o.d), url = $('.sl-url', o.d), chips = $('.sl-chips', o.d);
    var DEF = { delay: '60', idle: '90', scroll: '70', click: '1', random: '', load: '' };
    function cur() { return specStr(f.value, t.value, n.value.trim()); }
    function base() { return location.href.split('#')[0].split('?')[0]; }
    function refresh() {
      nr.style.display = (t.value === 'random' || t.value === 'load') ? 'none' : ''; nn.textContent = t.value === 'scroll' ? 'percent' : t.value === 'click' ? 'which click' : 'seconds';
      var list = chain.concat([cur()]); url.value = base() + '#sleeper=' + list.join(';');
      chips.innerHTML = ''; chain.forEach(function (c, i) { var b = el('span', 'sl-chip', c + ' \u00d7'); b.onclick = function () { chain.splice(i, 1); refresh(); }; chips.appendChild(b); });
    }
    f.onchange = refresh; n.oninput = refresh;
    t.onchange = function () { n.value = DEF[t.value]; refresh(); };
    $('.sl-add', o.d).onclick = function () { chain.push(cur()); refresh(); };
    $('.sl-x', o.d).onclick = o.close;
    $('.sl-copy', o.d).onclick = function () {
      var b = this; function ok() { b.textContent = 'COPIED'; setTimeout(function () { b.textContent = 'COPY LINK'; }, 1400); }
      try { navigator.clipboard.writeText(url.value).then(ok, function () { url.select(); document.execCommand('copy'); ok(); }); } catch (e) { url.select(); try { document.execCommand('copy'); } catch (e2) {} ok(); }
    };
    $('.sl-test', o.d).onclick = function () { var sp = parse(chain.concat([cur()])[0]); if (sp.length) { o.close(); sp.slice(0, 1).forEach(function (s) { arm({ f: s.f, a: s.a, trig: 'delay', n: 3 }, false); }); toast('test armed: fires in 3 seconds'); } };
    n.value = DEF[t.value]; refresh();
  }
  cmds.prank = cmds.pranklink = function () { FX.closeTerm && FX.closeTerm(); setTimeout(builder, 280); };

  var buf = '';
  document.addEventListener('keydown', function (e) {
    var tg = e.target; if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1 || /INPUT|TEXTAREA|SELECT/.test(tg.tagName || '') || tg.isContentEditable || X.stack.length) return;
    buf = (buf + e.key.toLowerCase()).slice(-10);
    if (buf.slice(-6) === 'disarm') { buf = ''; var n = disarmAll(); toast(n ? 'disarmed.' : 'nothing armed.'); }
    else if (buf.slice(-5) === 'prank') { buf = ''; cmds.prank(); }
  });
  FX.sleeper = { arm: function (s) { return parse(s).forEach(function (x) { arm(x); }); }, list: function () { return armed.map(function (a) { return a.spec; }); }, disarm: disarmAll };
})();
