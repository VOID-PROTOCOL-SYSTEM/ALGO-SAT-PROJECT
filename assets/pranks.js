/* MEMO ARCHIVE — v10.3 pranks: fake windows update, crash gallery, dodging buttons, reticulating loading messages, bribe the examiner, algorithm court (all fake, Esc always leaves) */
(function () {
  var FX = window.ArchiveFX = window.ArchiveFX || {}, X = FX.chx, U = FX.u; if (!U || !X) return;
  var $ = U.$, pick = U.pick, lget = U.lget, lset = U.lset;
  var R = X.R, wait = X.wait, tone = X.tone, xp = X.xp, el = X.el, toast = X.toast, openOv = X.openOv, cmds = FX.cmds || {}, P = function (t) { FX.print && FX.print(t); };
  function leave() { FX.closeTerm && FX.closeTerm(); }
  function shuffle(a) { return a.slice().sort(function () { return Math.random() - 0.5; }); }

  /* fullscreen for the fake system screens; leaving fullscreen (Esc) also leaves the prank */
  function fs(on) {
    try {
      if (on) { var r = document.documentElement, p = r.requestFullscreen && r.requestFullscreen(); if (p && p.catch) p.catch(function () {}); }
      else if (document.fullscreenElement) { var q = document.exitFullscreen(); if (q && q.catch) q.catch(function () {}); }
    } catch (e) {}
  }
  function fsGuard(o) {
    var was = false;
    function ch() { if (document.fullscreenElement) was = true; else if (was) { document.removeEventListener('fullscreenchange', ch); o.close(); } }
    document.addEventListener('fullscreenchange', ch);
    return function () { document.removeEventListener('fullscreenchange', ch); fs(false); };
  }

  /* 1. FAKE WINDOWS UPDATE */
  function winupdate() {
    var dead = false, cleanup = function () {};
    var o = openOv('pk-wu', '<div class="pk-win"><div class="pk-dots"><i></i><i></i><i></i><i></i><i></i></div><div class="pk-wt"></div><div class="pk-wp"></div><div class="pk-ws"></div></div><div class="pk-hint">Esc to exit (it is fake)</div>', function () { dead = true; cleanup(); });
    cleanup = fsGuard(o); fs(true); xp('winupdate', 8);
    var wt = $('.pk-wt', o.d), wp = $('.pk-wp', o.d), ws = $('.pk-ws', o.d), hint = $('.pk-hint', o.d);
    var TT = ['Working on updates', 'Working on updates', 'Updating the updater', 'Undoing changes made to your computer', 'Installing the update that fixes the update', 'Please be patient. This is fake, but also forever.'];
    var SS = ["Don't turn off your computer", 'This will take a while', 'Downloading more RAM', 'Reticulating drivers', 'Convincing the registry', 'Your PC will restart several times. (it says that every time)'];
    setTimeout(function () { if (!dead) hint.classList.add('on'); }, 15000);
    (async function () {
      for (var loop = 0; !dead; loop++) {
        o.d.classList.remove('blk'); wt.textContent = TT[Math.min(loop, TT.length - 1)];
        var p = Math.round(R(0, 18)), stalls = [Math.round(R(25, 40)), Math.round(R(55, 75)), 99];
        while (!dead && p < 100) { p++; wp.textContent = p + '% complete'; ws.textContent = SS[(loop + Math.floor(p / 20)) % SS.length]; await wait(stalls.indexOf(p) >= 0 ? R(5000, 9000) : R(120, 700)); }
        if (dead) return; wt.textContent = 'Restarting'; wp.textContent = ''; ws.textContent = ''; await wait(1800); o.d.classList.add('blk'); await wait(2600);
      }
    })();
  }

  /* 2. CRASH GALLERY */
  var CODES = ['CRITICAL_PROCESS_DIED', 'SYSTEM_THREAD_EXCEPTION_NOT_HANDLED', 'IRQL_NOT_LESS_OR_EQUAL', 'PAGE_FAULT_IN_NONPAGED_AREA', 'KERNEL_SECURITY_CHECK_FAILURE', 'DPC_WATCHDOG_VIOLATION', 'VCE_SCORE_OVERFLOW'];
  var FAILED = ['ntoskrnl.exe', 'dijkstra.sys', 'memo3.dll', 'vibes.sys', 'rickroll.sys', 'recursion.dll'];
  function qr() {
    var s = '<svg viewBox="0 0 25 25" width="110" height="110" shape-rendering="crispEdges"><rect width="25" height="25" fill="#fff"/>', x, y;
    function fnd(a, b) { s += '<rect x="' + a + '" y="' + b + '" width="7" height="7" fill="#000"/><rect x="' + (a + 1) + '" y="' + (b + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (a + 2) + '" y="' + (b + 2) + '" width="3" height="3" fill="#000"/>'; }
    for (y = 0; y < 25; y++) for (x = 0; x < 25; x++) { if ((x < 8 && y < 8) || (x > 16 && y < 8) || (x < 8 && y > 16)) continue; if (Math.random() < 0.5) s += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#000"/>'; }
    fnd(0, 0); fnd(18, 0); fnd(0, 18); return s + '</svg>';
  }
  var CR = {
    win: async function (o, box, dead, reboot) {
      box.innerHTML = '<div class="bs-face">:(</div><p class="bs-m">Your PC ran into a problem and needs to restart. We\u2019re just collecting some error info, and then we\u2019ll restart for you.</p><p class="bs-p"><span>0</span>% complete</p><div class="bs-row"><div class="bs-qr">' + qr() + '</div><div class="bs-i"><p>For more information about this issue and possible fixes, visit https://www.windows.com/stopcode</p><p>If you call a support person, give them this info:<br>Stop code: ' + pick(CODES) + '<br>What failed: ' + pick(FAILED) + '</p></div></div>';
      var n = $('.bs-p span', box), p = 0;
      while (!dead() && p < 100) { p = Math.min(100, p + Math.round(R(1, 5))); n.textContent = p; await wait(R(150, 900)); }
      await wait(1200); reboot();
    },
    mac: async function (o, box, dead, reboot) {
      box.innerHTML = '<div class="mc-ml"><p>You need to restart your computer. Hold down the Power button until it turns off, then press the Power button again.</p><p>Vous devez red\u00e9marrer votre ordinateur. Maintenez le bouton de d\u00e9marrage enfonc\u00e9 pendant quelques secondes, puis appuyez de nouveau sur le bouton de d\u00e9marrage.</p><p>Sie m\u00fcssen Ihren Computer neu starten. Halten Sie die Ein-/Ausschalttaste einige Sekunden gedr\u00fcckt und dr\u00fccken Sie dann erneut die Ein-/Ausschalttaste.</p><p>Debe reiniciar el ordenador. Mantenga pulsado el bot\u00f3n de encendido hasta que se apague y, a continuaci\u00f3n, vuelva a pulsarlo.</p></div>';
      await wait(4500); if (dead()) return;
      o.d.classList.add('mc2');
      box.innerHTML = '<div class="mc-dlg"><div class="mc-ic">\u26A0\uFE0F</div><div class="mc-b"><b>Your computer was restarted because of a problem.</b><p>Press a key or wait a few seconds to continue.</p><div class="mc-bt"><button class="mc-r">Report...</button><button class="mc-i">Ignore</button></div></div></div>';
      $('.mc-i', box).onclick = function () { reboot(); };
      $('.mc-r', box).onclick = function () { $('.mc-b p', box).textContent = 'Report sent to a very small committee.'; setTimeout(reboot, 1800); };
      await wait(16000); if (!dead()) reboot();
    },
    linux: async function (o, box, dead, reboot) {
      var L = ['[   12.482910] VFS: Cannot open root device "sda1" or unknown-block(0,0): error -6', '[   12.482914] Please append a correct "root=" boot option; here are the available partitions:', '[   12.482921] 0b00        1048575 sr0', '[   12.482930] Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0)', '[   12.482936] CPU: 0 PID: 1 Comm: swapper/0 Not tainted 6.1.0-vce #1', '[   12.482941] Call Trace:', '[   12.482944]  <TASK>', '[   12.482947]  dump_stack_lvl+0x48/0x60', '[   12.482952]  panic+0x11f/0x2c0', '[   12.482957]  mount_block_root+0x1c3/0x230', '[   12.482961]  prepare_namespace+0x13a/0x170', '[   12.482965]  kernel_init_freeable+0x1f1/0x230', '[   12.482970]  kernel_init+0x16/0x130', '[   12.482974]  ret_from_fork+0x22/0x30', '[   12.482978]  </TASK>', '[   12.482985] ---[ end Kernel panic - not syncing: VFS: Unable to mount root fs on unknown-block(0,0) ]---'];
      var pre = el('pre', 'lx-p'); box.appendChild(pre);
      for (var i = 0; i < L.length && !dead(); i++) { pre.textContent += L[i] + '\n'; await wait(R(60, 240)); }
      await wait(4500); if (dead()) return;
      pre.textContent += '\npress any key to reboot (the keyboard is also not working)_';
      function go() { window.removeEventListener('keydown', go, true); reboot(); }
      window.addEventListener('keydown', function k(e) { if (e.key === 'Escape') return; window.removeEventListener('keydown', k, true); reboot(); }, true); o.d.onclick = go;
    },
    snap: function (o, box, dead, reboot) {
      box.innerHTML = '<div class="sn"><div class="sn-f">:(</div><h2>Aw, Snap!</h2><p>Something went wrong while displaying this webpage.</p><p>Error code: <code>' + pick(['SIGSEGV', 'STATUS_ACCESS_VIOLATION', 'RESULT_CODE_HUNG', 'SIGILL', 'OUT_OF_MEMORY', 'STATUS_BREAKPOINT']) + '</code></p><button class="sn-b">Reload</button></div>';
      $('.sn-b', box).onclick = function () { this.textContent = 'Reloading...'; setTimeout(reboot, 900); };
    }
  };
  function crash(a) {
    var kinds = ['win', 'mac', 'linux', 'snap'], k = (a && a[0] && kinds.indexOf(a[0]) >= 0) ? a[0] : pick(kinds), dead = false, cleanup = function () {};
    var o = openOv('pk-cr pk-cr-' + k, '<div class="pk-crb"></div>', function () { dead = true; cleanup(); });
    var box = $('.pk-crb', o.d); cleanup = fsGuard(o); if (k !== 'snap') fs(true); xp('crash', 8);
    function reboot(msg) { if (dead) return; o.d.classList.add('blk'); setTimeout(function () { o.close(); toast(typeof msg === 'string' ? msg : 'restarted. nothing happened.'); }, 1400); }
    CR[k](o, box, function () { return dead; }, reboot);
  }

  /* 3. DODGING BUTTONS */
  function dodge() {
    var dead = false, count = 0, total = 0;
    var VAR = [['Premium Answer Key', 'DOWNLOAD ANSWERS', '100% free. no strings. (strings attached)'], ['Terms & Conditions', 'ACCEPT', 'please accept to continue existing'], ['You won a prize!', 'CLAIM PRIZE', 'you are the 1,000,000th visitor (so were the last 999,999)'], ['Skip ad', 'SKIP', 'your ad will be skipped in 5... 5... 5...']], v = pick(VAR);
    var TA = ['too slow.', 'nice try.', 'that was close!', 'i have trust issues now.', 'you cannot catch me.', 'are you even trying?', 'almost!', 'my therapist told me to keep my distance.', 'hehe.'];
    var o = openOv('pk-dg', '<div class="dg-box"><h3>' + v[0] + '</h3><p class="dg-m">' + v[2] + '</p><div class="dg-sl"></div><div class="dg-ft"><button class="dg-no">No thanks</button></div><small>Esc to leave</small></div>', function () { dead = true; });
    var slot = $('.dg-sl', o.d), msg = $('.dg-m', o.d); xp('dodge', 8);
    function done() { $('.dg-box', o.d).innerHTML = '<h3>Download complete</h3><p class="dg-m">answers.zip (0 bytes). you were dodged ' + total + ' times. the answers were inside you all along.</p><button class="dg-b ok">OK</button>'; $('.ok', o.d).onclick = o.close; tone(660, 990, 0.2, 'triangle', 0.06); }
    function mk() {
      count++; var b = el('button', 'dg-b', v[1]), cnt = 0, lim = Math.round(R(11, 17)), free = false, fixed = false; slot.appendChild(b);
      function away(cx, cy) {
        var r = b.getBoundingClientRect(), w = r.width, h = r.height, x, y, t = 0;
        do { x = R(10, Math.max(20, innerWidth - w - 10)); y = R(10, Math.max(20, innerHeight - h - 10)); t++; } while (Math.hypot(x + w / 2 - cx, y + h / 2 - cy) < 260 && t < 30);
        if (!fixed) { fixed = true; b.style.position = 'fixed'; b.style.left = r.left + 'px'; b.style.top = r.top + 'px'; void b.offsetWidth; }
        b.style.transitionDuration = Math.max(0.06, 0.22 - cnt * 0.01) + 's'; b.style.left = x + 'px'; b.style.top = y + 'px';
      }
      o.d.addEventListener('mousemove', function (e) {
        if (free || dead) return; var r = b.getBoundingClientRect();
        if (Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < Math.max(r.width / 2 + 40, 90) + cnt * 3) {
          cnt++; total++; away(e.clientX, e.clientY); msg.textContent = pick(TA); tone(300 + R(0, 500), 600, 0.05, 'square', 0.03);
          if (cnt >= lim) { free = true; b.textContent = 'fine. you win. (i am tired)'; b.classList.add('tired'); msg.textContent = '...'; }
        }
      });
      b.onclick = function () { if (!free) { msg.textContent = 'no keyboard cheating.'; away(R(0, innerWidth), R(0, innerHeight)); return; } done(); };
    }
    mk();
    $('.dg-no', o.d).onclick = function () { msg.textContent = 'declining is not an option.'; if (count < 5) mk(); tone(200, 120, 0.1, 'sawtooth', 0.05); };
  }

  /* 4. RETICULATING LOADING MESSAGES (opt-in: `reticulate`) */
  var RET = ['Reticulating splines...', 'Convincing quicksort to pick a better pivot...', 'Sorting the unsortable...', 'Teaching ants about pheromones...', 'Untangling the call stack...', 'Asking Dijkstra for directions...', 'Feeding the bug mascot...', 'Balancing the red-black tree (it is tipsy)...', 'Compiling the compilers...', 'Defragmenting the hash table...', 'Pruning the search tree...', 'Negotiating with the examiners...', 'Garbage collecting (do not look)...', 'Memoizing the memoization...', 'Dividing, then conquering...', 'Looking for the base case...', 'Exploring all 3.2 million paths...', 'Waking the neural link...', 'Calibrating the invariants...', 'Downloading more RAM...', 'Asking the oracle (it said maybe)...', 'Hashing out our differences...'];
  function retScreen(ms, then) {
    var iv = 0, sv = 0, mv = 0, done = false;
    var o = openOv('pk-rt', '<div class="rt-b"><div class="rt-s">|</div><div class="rt-m">Reticulating splines...</div><div class="rt-t"><i></i></div><div class="rt-p">0%</div><small>Esc to cancel</small></div>', function () { clearInterval(iv); clearInterval(sv); clearInterval(mv); });
    var m = $('.rt-m', o.d), bar = $('i', o.d), pc = $('.rt-p', o.d), sp = $('.rt-s', o.d), t0 = performance.now(), msgs = shuffle(RET), i = 0, sc = ['|', '/', '-', '\\'], si = 0;
    sv = setInterval(function () { sp.textContent = sc[si++ % 4]; }, 120);
    mv = setInterval(function () { m.textContent = msgs[i++ % msgs.length]; }, 520);
    iv = setInterval(function () { var k = Math.min(1, (performance.now() - t0) / ms), q = k < 0.9 ? k : 0.9 + (k - 0.9) * 0.3; bar.style.width = (q * 100) + '%'; pc.textContent = Math.round(q * 100) + '%'; if (k >= 1 && !done) { done = true; clearInterval(iv); clearInterval(sv); clearInterval(mv); then && then(o); } }, 60);
    return o;
  }
  document.addEventListener('click', function (e) {
    if (lget('chx-ret') !== '1' || e.defaultPrevented || e.button || e.ctrlKey || e.metaKey || e.shiftKey || X.stack.length) return;
    var a = e.target.closest && e.target.closest('a[href]'); if (!a || X.skip(a) || a.target === '_blank' || a.hasAttribute('download')) return;
    var h = a.getAttribute('href'); if (!h || h.charAt(0) === '#' || /^(javascript|mailto|tel):/i.test(h)) return;
    if (a.origin && a.origin !== location.origin) return;
    e.preventDefault(); e.stopPropagation(); xp('reticulate', 5);
    retScreen(R(2200, 3800), function () { location.href = a.href; });
  }, true);
  cmds.reticulate = function (a) {
    var on = a && a[0] ? a[0] === 'on' : lget('chx-ret') !== '1'; lset('chx-ret', on ? '1' : '0');
    P(on ? 'reticulating loader ON: links now take a scenic route (type reticulate again to turn off)' : 'reticulating loader off.');
    if (on) { leave(); setTimeout(function () { retScreen(2600, function (o) { o.close(); }); }, 280); }
  };

  /* 5. BRIBE THE EXAMINER (clicker) */
  var BAKE = [
    { id: 'click', n: 'Bigger oven', d: '+1 cookie per click', cost: 50, g: 1.6, click: 1 },
    { id: 'gran', n: 'Grandma bakers', d: '+1 cookie/s', cost: 25, g: 1.15, cps: 1 },
    { id: 'fact', n: 'Cookie factory', d: '+10 cookies/s', cost: 250, g: 1.15, cps: 10 },
    { id: 'cart', n: 'Cookie cartel', d: '+80 cookies/s', cost: 3000, g: 1.15, cps: 80 }
  ];
  var BRIB = [
    { id: 'door', n: 'Cookie under the door', d: '+0.01 ATAR/s', cost: 15, g: 1.15, sps: 0.01 },
    { id: 'bask', n: 'Fruit basket', d: '+0.04 ATAR/s', cost: 100, g: 1.15, sps: 0.04 },
    { id: 'flat', n: 'Handwritten flattery', d: '+0.15 ATAR/s', cost: 600, g: 1.15, sps: 0.15 },
    { id: 'off', n: 'Offshore examiner account', d: '+0.5 ATAR/s', cost: 3500, g: 1.15, sps: 0.5 },
    { id: 'lobby', n: 'Hire a lobbyist', d: '+1.5 ATAR/s', cost: 20000, g: 1.15, sps: 1.5 },
    { id: 'form', n: 'Rename the exam "a formality"', d: '+5 ATAR/s', cost: 120000, g: 1.15, sps: 5 }
  ];
  var NEWS = ['EXAMINER SEEN BUYING A YACHT', 'MARKING SCHEME FOUND IN A COOKIE JAR', 'LOCAL STUDENT DENIES EVERYTHING', 'VCAA STATEMENT: "WE LOVE COOKIES"', 'EXAM PAPER REVEALED TO BE A MENU', 'SCALED SCORES NOW PAID IN BAKED GOODS', 'EXAMINERS UNION DEMANDS CHOCOLATE CHIP', 'ATAR CALCULATOR JUST SHRUGS', 'SUSPICIOUS CRUMBS FOUND AT MARKING CENTRE', 'WHISTLEBLOWER SPOTTED. WHISTLEBLOWER ATE.'];
  function fmt(n) { return n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e4 ? (n / 1e3).toFixed(1) + 'k' : Math.floor(n).toString(); }
  function bribe() {
    var S = { c: 0, atar: 30, up: {} }, won = false;
    try { var sv = JSON.parse(lget('chx-bribe') || 'null'); if (sv && typeof sv.c === 'number') S = sv; } catch (e) {}
    function owned(id) { return S.up[id] || 0; }
    function cost(it) { return Math.ceil(it.cost * Math.pow(it.g, owned(it.id))); }
    function clickVal() { return 1 + owned('click'); }
    function cps() { return BAKE.reduce(function (s, it) { return s + (it.cps || 0) * owned(it.id); }, 0); }
    function sps() { return BRIB.reduce(function (s, it) { return s + it.sps * owned(it.id); }, 0); }
    var iv = 0, sv2 = 0, nv = 0, gv = 0;
    var o = openOv('pk-br', '<div class="br-box"><div class="br-top"><b>BRIBE THE EXAMINER</b><span class="br-sc"></span><div class="br-bar"><i></i></div></div><div class="br-main"><div class="br-left"><button class="br-oven">\uD83C\uDF6A</button><div class="br-c"></div><div class="br-r"></div></div><div class="br-shop"></div></div><div class="br-tk"></div><small>Esc to close (progress is saved) &middot; <a class="br-rs">reset</a></small></div>', function () { clearInterval(iv); clearInterval(sv2); clearInterval(nv); clearInterval(gv); try { lset('chx-bribe', JSON.stringify(S)); } catch (e) {} });
    var d = o.d, sc = $('.br-sc', d), bar = $('.br-bar i', d), cc = $('.br-c', d), rr = $('.br-r', d), shop = $('.br-shop', d), tk = $('.br-tk', d), items = [];
    function row(it, head) { var b = el('button', 'br-it', '<span class="br-n">' + it.n + '</span><span class="br-d">' + it.d + '</span><span class="br-k"></span>'); b.onclick = function () { var c = cost(it); if (S.c < c) { tone(160, 120, 0.08, 'sawtooth', 0.04); return; } S.c -= c; S.up[it.id] = owned(it.id) + 1; tone(520, 880, 0.08, 'square', 0.04); upd(); }; shop.appendChild(b); items.push([it, b]); }
    shop.appendChild(el('div', 'br-h', 'BAKING')); BAKE.forEach(row); shop.appendChild(el('div', 'br-h', 'BRIBES')); BRIB.forEach(row);
    function upd() {
      sc.textContent = 'ATAR ' + S.atar.toFixed(2); bar.style.width = Math.max(0, (S.atar - 30) / 69.95 * 100) + '%';
      cc.textContent = fmt(S.c) + ' cookies'; rr.textContent = '+' + clickVal() + ' per click \u00b7 ' + cps().toFixed(0) + '/s \u00b7 ' + sps().toFixed(2) + ' ATAR/s';
      items.forEach(function (p) { var c = cost(p[0]); $('.br-k', p[1]).textContent = fmt(c) + ' \uD83C\uDF6A  (owned ' + owned(p[0].id) + ')'; p[1].classList.toggle('dis', S.c < c); });
    }
    $('.br-oven', d).onclick = function (e) { S.c += clickVal(); tone(700 + R(0, 200), 500, 0.04, 'square', 0.02); var f = el('span', 'br-f', '+' + clickVal()); f.style.left = (e.clientX - d.getBoundingClientRect().left) + 'px'; f.style.top = (e.clientY - d.getBoundingClientRect().top - 10) + 'px'; d.appendChild(f); setTimeout(function () { f.remove(); }, 800); upd(); };
    $('.br-rs', d).onclick = function () { S = { c: 0, atar: 30, up: {} }; won = false; upd(); toast('progress reset.'); };
    function win() {
      won = true; xp('bribe', 15); S.atar = 99.95; upd(); tone(660, 1320, 0.3, 'triangle', 0.06); tone(990, 1980, 0.4, 'triangle', 0.06, 0.25);
      var w = el('div', 'br-win', '<h2>ATAR 99.95</h2><p>congratulations. the examiners deny everything.</p><button class="br-ok">KEEP BAKING</button>'); d.appendChild(w); $('.br-ok', w).onclick = function () { w.remove(); S.atar = 99.9; won = false; };
    }
    iv = setInterval(function () { S.c += cps() * 0.1; if (!won) { S.atar = Math.min(99.95, S.atar + sps() * 0.1); if (S.atar >= 99.95) win(); } upd(); }, 100);
    sv2 = setInterval(function () { try { lset('chx-bribe', JSON.stringify(S)); } catch (e) {} }, 3000);
    tk.textContent = pick(NEWS); nv = setInterval(function () { tk.textContent = pick(NEWS); }, 9000);
    gv = setInterval(function () {
      if (won) return; var b = el('button', 'br-g', '\uD83D\uDD75\uFE0F'); b.style.left = R(5, 85) + '%'; b.style.top = R(20, 80) + '%'; d.appendChild(b); tone(880, 1320, 0.1, 'triangle', 0.04);
      var gone = setTimeout(function () { b.remove(); }, 7000);
      b.onclick = function () { clearTimeout(gone); var g = Math.round(50 + cps() * 30); S.c += g; b.remove(); toast('whistleblower bribed: +' + fmt(g) + ' cookies'); upd(); };
    }, R(25000, 40000));
    upd();
  }

  /* 6. ALGORITHM COURT */
  function feat(src) {
    var L = src.split('\n'), n = src.trim() ? L.length : 0, ind = L.map(function (l) { return (l.match(/^\s*/)[0] || '').length; }), loops = [];
    L.forEach(function (l, i) { if (/\b(for|while)\b/.test(l)) loops.push(ind[i]); });
    return {
      n: n, nest: loops.some(function (a, i) { return loops.some(function (b, j) { return j < i && b < a; }); }), shortv: (src.match(/\b[a-z]\s*=[^=]/g) || []).length, tmp: /\b(temp|tmp|foo|bar|stuff|thing|data2|test1)\b/i.test(src),
      prints: (src.match(/print\(|console\.log|printf|cout/g) || []).length, todo: /todo|fixme|hack|xxx/i.test(src), nocom: n > 6 && !/(#|\/\/|\/\*)/.test(src), deep: Math.max.apply(null, ind) >= 16,
      defs: (src.match(/\b(def|function|fn)\b/g) || []).length, longest: Math.max.apply(null, L.map(function (l) { return l.length; }))
    };
  }
  var SEN = ['to refactor 3 functions and apologise to the compiler', 'to write 500 unit tests by hand', 'to explain the invariant to a rubber duck', 'to rename every variable "x" and then rename them back', 'to review someone else\u2019s spaghetti as community service', 'to read the documentation (all of it)'];
  var ACQ = ['released on a technicality: the compiler never actually read it', 'acquitted. the jury was bribed with cookies (see: bribe)', 'not guilty. the code is slightly less terrible than the court expected'];
  function court() {
    var dead = false, busy = false;
    var o = openOv('pk-ac', '<div class="ac-box"><div class="ac-bar">ALGORITHM COURT &mdash; the code is on trial <i class="ac-x">x</i></div><textarea class="ac-in" spellcheck="false" placeholder="// submit your evidence (paste code) and face the jury of sorting algorithms"></textarea><div class="ac-bt"><button class="ac-go">CALL THE COURT TO ORDER</button></div><div class="ac-t"></div></div>', function () { dead = true; });
    var ta = $('.ac-in', o.d), tr = $('.ac-t', o.d); $('.ac-x', o.d).onclick = o.close; setTimeout(function () { ta.focus(); }, 50);
    async function say(who, col, text, pause) {
      var d = el('div', 'ac-l', ''), b = document.createElement('b'), s = document.createElement('span'); b.textContent = who + ': '; b.style.color = col; d.appendChild(b); d.appendChild(s); tr.appendChild(d);
      for (var c = 0; c < text.length && !dead; c++) { s.textContent += text[c]; if (c % 2) await wait(12); } tr.scrollTop = 1e6; await wait(pause || 500);
    }
    $('.ac-go', o.d).onclick = async function () {
      if (busy) return; busy = true; tr.innerHTML = ''; var src = ta.value, f = feat(src); xp('court', 8);
      var JUD = '#ffd319', PRO = '#ff7b7b', DEF = '#7be8ff';
      await say('JUDGE DIJKSTRA', JUD, 'ALL RISE. Court is in session. We will take the shortest path to a verdict.', 600); tone(300, 200, 0.1, 'square', 0.05);
      if (!f.n) { await say('JUDGE DIJKSTRA', JUD, 'The defendant has submitted no code. No code, no crime. Case dismissed.', 300); busy = false; return; }
      var ch = []; if (f.nest) ch.push('aggravated quadratic behaviour'); if (f.shortv > 3) ch.push('assaulting variable names (single letters, repeatedly)'); if (f.todo) ch.push('leaving a TODO at the scene'); if (f.nocom) ch.push('refusing to leave comments'); if (f.deep) ch.push('excessive indentation in a public place'); if (f.prints > 2) ch.push('littering (debug prints)'); if (f.longest > 100) ch.push('indecent line length'); if (!ch.length) ch.push('loitering with intent to compile');
      await say('A* (PROSECUTION)', PRO, 'Your Honour, I heuristically estimate this code is guilty. My heuristic is admissible. Mostly. The defendant is charged with: ' + ch.join('; ') + '.', 700);
      await say('BINARY SEARCH (DEFENCE)', DEF, f.n > 1 ? 'Members of the jury, I will halve the evidence until only the innocent part remains... half gone... half again... and what is left is... a semicolon. Innocent. I rest.' : 'Members of the jury: it is one line. How guilty can one line be? (very. i rest.)', 700);
      await say('JUDGE DIJKSTRA', JUD, 'The jury will now deliberate. Quietly. Bogo Sort, please stop shuffling the chairs.', 600);
      var J = [
        ['BUBBLE SORT', f.nest ? [false, 'NOT GUILTY. nested loops? i am also quadratic. i cannot judge. *sweats*'] : [true, 'GUILTY. you are suspiciously efficient and i do not trust it.']],
        ['QUICK SORT', (f.shortv > 3 || f.tmp) ? [true, 'GUILTY. variable names like x? i would have chosen a better pivot. and better names.'] : [false, 'NOT GUILTY. i partitioned the evidence in O(n log n) and it looks fine. you are welcome.']],
        ['MERGE SORT', (f.n > 25 && f.defs < 2) ? [true, 'GUILTY. i divided this code in half five times and it was still one giant function.'] : [false, 'NOT GUILTY. i merged the evidence into a tidy stack. stable verdict.']],
        ['HEAP SORT', (f.deep || f.nocom) ? [true, 'GUILTY. this heap is not balanced and has zero comments.'] : [false, 'NOT GUILTY. the max-heap of evidence says you are fine. i can prove it in O(n log n).']],
        ['INSERTION SORT', (f.todo || f.prints > 2) ? [true, 'GUILTY. back in my day we did not have debug prints. we used our eyes.'] : [false, 'NOT GUILTY. i inserted each piece of evidence in order. very polite code.']],
        ['BOGO SORT', pick([[true, 'GUILTY. i shuffled my verdict until it looked right.'], [false, 'NOT GUILTY. i shuffled my verdict 4,096 times and this was the one that worked.']])]
      ], g = 0;
      for (var i = 0; i < J.length && !dead; i++) { if (J[i][1][0]) g++; await say(J[i][0], J[i][1][0] ? '#ff7b7b' : '#8cff8c', J[i][1][1], 400); }
      if (dead) return;
      var bad = [f.nest, f.shortv > 3, f.todo, f.nocom, f.deep, f.prints > 2, f.longest > 100].filter(Boolean).length, guilty = g >= 4 || (g === 3 && bad >= 2);
      tone(220, 80, 0.2, 'square', 0.08); await say('JUDGE DIJKSTRA', JUD, 'The jury has voted: ' + g + ' guilty, ' + (6 - g) + ' not guilty. ' + (g === 3 ? 'A tie. I break it using the shortest path: ' + (guilty ? 'guilty.' : 'not guilty.') : ''), 500);
      tone(120, 40, 0.3, 'square', 0.1); await say('JUDGE DIJKSTRA', JUD, guilty ? 'GUILTY. The defendant is sentenced ' + pick(SEN) + '. [BANG]' : 'NOT GUILTY. The defendant is ' + pick(ACQ) + '. [BANG]', 300);
      busy = false;
    };
  }

  /* wiring */
  function run(fn, msg) { return function (a) { P(msg); leave(); setTimeout(function () { fn(a || []); }, 280); }; }
  cmds.winupdate = cmds.update = run(winupdate, 'checking for updates...');
  cmds.crash = cmds.bsod = run(crash, 'what could possibly go wrong...  (crash [win|mac|linux|snap])');
  cmds.dodge = run(dodge, 'preparing a totally clickable button...');
  cmds.bribe = run(bribe, 'opening the examiner\u2019s back door...');
  cmds.court = run(court, 'all rise...');
  cmds.pranks = function () {
    ['winupdate        full-screen fake windows update that never finishes', 'crash [kind]      random fake crash: win (bsod) / mac / linux / snap', 'dodge             a button you cannot click', 'reticulate [on]   links take a scenic route with silly loading messages', 'bribe             clicker: bake cookies, buy the examiner, reach ATAR 99.95', 'court             paste code; a jury of sorting algorithms judges it', 'prank             build a sleeper link: arms any prank to fire later (disarm cancels)'].forEach(function (l) { P('  ' + l); });
  };
  var buf = '', WORDS = { winupdate: 'winupdate', crash: 'crash', dodge: 'dodge', reticulate: 'reticulate', bribe: 'bribe', court: 'court' };
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1 || /INPUT|TEXTAREA|SELECT/.test(t.tagName || '') || t.isContentEditable || X.stack.length) return;
    buf = (buf + e.key.toLowerCase()).slice(-12);
    Object.keys(WORDS).forEach(function (w) { if (buf.slice(-w.length) === w) { buf = ''; cmds[WORDS[w]]([]); } });
  });
})();
