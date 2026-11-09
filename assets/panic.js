/* MEMO ARCHIVE — v10.1 PANIC BUTTON: "I DON'T KNOW HOW TO CODE" (fake system breach, ~30 s, entirely fake) */
(function () {
  var FX = window.ArchiveFX = window.ArchiveFX || {}, X = FX.chx, U = FX.u; if (!U || !X) return;
  var $ = U.$, pick = U.pick, lget = U.lget, lset = U.lset;
  var R = X.R, wait = X.wait, tone = X.tone, xp = X.xp, el = X.el, toast = X.toast, openOv = X.openOv, cmds = FX.cmds || {}, P = function (t) { FX.print && FX.print(t); };
  function hex(n) { var s = ''; while (s.length < n) s += Math.floor(Math.random() * 16).toString(16); return s; }
  var FN = ['do_syscall_64', 'vfs_read', '__schedule', 'tcp_v4_rcv', 'page_fault', 'kmem_cache_alloc', 'ext4_file_read_iter', 'security_file_open', 'native_write_msr', 'panic_unwind', 'vce_optimize', 'pigeon_dispatch'];
  function fill(s) {
    return s.replace(/\{h16\}/g, function () { return '0x' + hex(16); }).replace(/\{h8\}/g, function () { return '0x' + hex(8); }).replace(/\{h2\}/g, function () { return hex(2); })
      .replace(/\{h3\}/g, function () { return hex(3); }).replace(/\{n\}/g, function () { return String(Math.floor(R(2, 254))); }).replace(/\{fn\}/g, function () { return pick(FN); });
  }
  var LOGS = [
    'BUG: unable to handle kernel NULL pointer dereference at 0000000000000000', 'Oops: 0002 [#1] SMP NOPTI', 'RIP: 0010:{fn}+0x{h2}/0x{h3}', 'Call Trace:', ' <TASK>', ' {fn}+0x{h2}/0x{h3}', ' ? __x64_sys_open+0x{h2}/0x{h3}',
    'segfault at {h8} ip {h16} sp {h16} error 4', 'iptables: DROP IN=eth0 SRC=6.6.6.{n} DST=127.0.0.1 PROTO=TCP', 'sshd[666]: Accepted password for root from 66.66.66.66', 'firewall: ALL RULES FLUSHED',
    'selinux: permissive mode forced by UNKNOWN', 'audit: type=1400 apparmor="DENIED" operation="panic"', 'systemd[1]: Started Definitely-Not-Malware.service', 'rootkit: loaded module "vce_destroyer" taint=P',
    'mem: heap spray {h8} .. {h8}', 'EXFIL: ~/homework_final_FINAL_v7.docx -> 203.0.113.{n}', 'netfilter: connection 10.0.0.{n}:4444 [reverse shell established]', 'kernel: Out of memory: Killed process 1337 (vscode) total-vm:99999999kB',
    'WARN: stack smashing detected ***', 'crypto: AES-256 key = ############ (redacted, nice try)', 'ALERT: privilege escalation: operator -> root -> god', 'kernel: [{fn}] general protection fault, probably for non-canonical address {h16}'
  ];
  var JOKES = [
    'AI: operator confidence in own coding ability: 0.3% ... CONFIRMED', 'EXFIL: chrome/history.sqlite -> /dev/null (we are not monsters)', 'dmesg: pigeon_swarm: deployed {n} units', 'ALERT: someone typed "git push --force" and meant it',
    'FATAL: coffee level critical', 'ERROR: segmentation fault (core dumped) (the core is also on fire)', 'WARN: indentation error detected in the fabric of reality', 'ALERT: 4,096 tabs open. memory is crying.',
    'kernel: unexpected semicolon at line 0', 'AUDIT: user attempted to "just add a print statement"', 'SCAN: no semicolons found. suspicious.', 'ALERT: stack overflow answer copied without reading it'
  ];
  var CRIT = [
    'Kernel panic - not syncing: Attempted to kill init! exitcode=0x0000000b', 'FATAL: double fault at {h16}', 'PANIC: CPU{n}: Machine Check Exception: 4 Bank 7: {h16}', '---[ end trace {h16} ]---', 'Kernel panic - not syncing: operator does not know how to code',
    'FATAL: stack corruption {h8}', 'PANIC: VFS: Unable to mount root fs on unknown-block(0,0)', 'FATAL: thermal event: CPU core temperature above threshold, throttled', 'BUG: soft lockup - CPU#{n} stuck for 22s! [vce_destroyer:666]'
  ];
  var POPS = [
    ['CRITICAL ERROR', 'Your code has stopped working. (it never started)'], ['FIREWALL', 'Firewall status: vibes only'], ['KERNEL PANIC', 'Please remain calm. (do not)'], ['ANTIVIRUS', 'Threat detected: YOU'],
    ['SYSTEM32', 'deleting system32... 12%'], ['WARNING', 'Unauthorized human detected at keyboard'], ['STACK OVERFLOW', 'Your question has been closed as a duplicate'], ['SEGFAULT', 'core dumped on the carpet'],
    ['PYTHON.EXE', 'IndentationError: expected an indented block (and a hug)'], ['BREACH', 'They are inside the call stack'], ['ERROR', 'Error: error handler errored']
  ];
  var TITLES = ['SYSTEM BREACH', 'ACCESS DENIED', 'ROOT COMPROMISED', 'FIREWALL DOWN', 'YOU ARE NOT AUTHORISED', "I DON'T KNOW HOW TO CODE", 'UNKNOWN INTRUDER', 'KERNEL PANIC'];
  var CH = '01ABCDEF<>/\\|#$%&@!?'.split('');

  function panic() {
    if (X.stack.some(function (s) { return s.d.classList.contains('chx-pn'); })) return;
    var alive = true, quiet = false, ivs = [], tos = [], sirenMs = 520, rate = 1, flip = false;
    function stop() { alive = false; ivs.forEach(clearInterval); tos.forEach(clearTimeout); try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {} }
    var o = openOv('chx-pn', '<canvas class="pn-rain"></canvas><div class="pn-vig"></div><div class="pn-scan"></div><div class="pn-hd"></div><div class="pn-term"><div class="pn-tb">root@archive:/kernel# dmesg --follow</div><div class="pn-log"></div></div><div class="pn-side"><div class="pn-bars"></div><pre class="pn-trace"></pre></div><div class="pn-cdw"></div><div class="pn-pops"></div><div class="pn-esc">Esc to abort (it is fake. mostly.)</div><div class="pn-end"></div>', stop);
    var d = o.d, hd = $('.pn-hd', d), log = $('.pn-log', d), pops = $('.pn-pops', d), cdw = $('.pn-cdw', d), cv = $('.pn-rain', d), cx = cv.getContext('2d');
    function say(t) { try { if (FX.sound && FX.sound.on && window.speechSynthesis) { var u = new SpeechSynthesisUtterance(t); u.rate = 0.9; u.pitch = 0.4; speechSynthesis.speak(u); } } catch (e) {} }

    /* red code rain */
    cv.width = innerWidth; cv.height = innerHeight; cx.fillStyle = '#120000'; cx.fillRect(0, 0, cv.width, cv.height);
    var cols = Math.floor(cv.width / 16), drops = []; for (var i = 0; i < cols; i++) drops.push(R(-50, 0));
    ivs.push(setInterval(function () {
      cx.fillStyle = 'rgba(15,0,0,.14)'; cx.fillRect(0, 0, cv.width, cv.height); cx.font = '15px monospace';
      for (var i = 0; i < cols; i++) { cx.fillStyle = Math.random() < 0.04 ? '#fff' : '#ff2a2a'; cx.fillText(CH[Math.floor(Math.random() * CH.length)], i * 16, drops[i] * 16); if (drops[i] * 16 > cv.height && Math.random() > 0.97) drops[i] = 0; drops[i] += rate; }
    }, 45));

    /* siren + geiger */
    function siren() { if (!alive || quiet) return; flip = !flip; tone(flip ? 600 : 1000, flip ? 1000 : 600, sirenMs / 1000 * 0.95, 'sawtooth', 0.045); tos.push(setTimeout(siren, sirenMs)); }

    /* kernel log */
    var ts = 11.2;
    function line(s, c) { ts += R(0.0004, 0.38); var e = document.createElement('div'); e.className = c ? 'c' : ''; e.textContent = '[' + ('      ' + ts.toFixed(6)).slice(-12) + '] ' + s; log.appendChild(e); while (log.children.length > 60) log.removeChild(log.firstChild); }
    function burst(k) { var s = fill(k ? pick(CRIT) : (Math.random() < 0.22 ? pick(JOKES) : pick(LOGS))); line(s, k || /FATAL|PANIC|BUG|EXFIL|rootkit|Oops/.test(s)); }

    /* windows-95 popup spam; closing one spawns two more */
    var popN = 0;
    function spawnPop() {
      if (!alive || popN > 48) return; popN++;
      var m = pick(POPS), p = el('div', 'pn-pop', '<div class="pn-pb"><span>' + m[0] + '</span><i class="pn-px">x</i></div><div class="pn-pm"><b>!</b><span>' + m[1] + '</span></div>');
      p.style.left = R(0, Math.max(10, innerWidth - 270)) + 'px'; p.style.top = R(0, Math.max(10, innerHeight - 110)) + 'px';
      $('.pn-px', p).onclick = function (ev) { ev.stopPropagation(); p.remove(); spawnPop(); spawnPop(); tone(300, 120, 0.08, 'square', 0.04); };
      pops.appendChild(p); tone(420 + R(0, 300), 200, 0.05, 'square', 0.025);
    }

    function startBars() {
      var box = $('.pn-bars', d), L = ['ENCRYPTING HOMEWORK', 'UPLOADING SEARCH HISTORY -> /dev/null', 'DEPLOYING PIGEONS', 'DOWNLOADING MORE RAM', 'DELETING SYSTEM32 (just the cool bits)'], ps = L.map(function () { return 0; });
      box.innerHTML = L.map(function (t) { return '<div class="pn-bar"><span>' + t + '</span><em>0%</em><div class="pn-bt"><i></i></div></div>'; }).join('');
      var bars = [].slice.call(box.children);
      ivs.push(setInterval(function () { bars.forEach(function (b, i) { ps[i] = Math.min(99, ps[i] + R(0.2, 2.6)); $('i', b).style.width = ps[i] + '%'; $('em', b).textContent = Math.round(ps[i]) + '%'; }); }, 120));
    }
    function startTrace() {
      var tr = $('.pn-trace', d), hops = ['tracing route to operator ...', ' 1  192.168.0.1     0.4 ms', ' 2  10.66.6.1       3.1 ms', ' 3  darknet.gw      13 ms', ' 4  ???              ??? ms', ' 5  the.void         inf ms', ' 6  your.own.router  0.2 ms', ' 7  (relax. it is fake.)'], h = 0;
      ivs.push(setInterval(function () { if (h < hops.length) tr.textContent += hops[h++] + '\n'; }, 650));
    }

    (async function () {
      xp('panic', 15); lset('chx-panics', String((parseInt(lget('chx-panics') || '0', 10) || 0) + 1));
      d.classList.add('strobe'); say('Warning. System breach detected.'); siren();
      hd.textContent = '\u26A0 WARNING \u26A0'; await wait(1500); if (!alive) return;

      /* phase 1: log flood + popups */
      hd.textContent = 'SYSTEM BREACH'; var popIv = setInterval(spawnPop, 700); ivs.push(popIv);
      var t0 = performance.now(), e;
      while (alive && (e = performance.now() - t0) < 8500) { burst(); if (Math.random() < 0.3) burst(); sirenMs = Math.max(260, 520 - e / 30); await wait(Math.max(10, 120 - e / 80)); }
      if (!alive) return;

      /* phase 2: bars, trace, titles, quake */
      d.classList.add('side', 'quake'); say('Intrusion detected. Firewall down.'); rate = 2; startBars(); startTrace();
      var ti = 0; ivs.push(setInterval(function () { hd.textContent = TITLES[ti++ % TITLES.length]; }, 700));
      t0 = performance.now(); while (alive && performance.now() - t0 < 8000) { burst(); await wait(55); }
      if (!alive) return;

      /* phase 3: lockdown countdown */
      clearInterval(popIv); popIv = setInterval(spawnPop, 180); ivs.push(popIv); sirenMs = 200; rate = 3.5; d.classList.add('cd'); say('Lockdown initiated.');
      ivs.push(setInterval(function () { burst('FATAL'); burst('FATAL'); }, 50));
      for (var k = 10; k > 0 && alive; k--) {
        cdw.textContent = 'LOCKDOWN IN ' + k; if (k <= 3) d.classList.add('white'); if (k === 3) say('Three. Two. One.');
        tone(400 + (10 - k) * 90, 300 + (10 - k) * 90, 0.15, 'square', 0.07); await wait(1000);
      }
      if (!alive) return;

      /* phase 4: blackout and the reveal */
      ivs.forEach(clearInterval); ivs = []; quiet = true; try { window.speechSynthesis && speechSynthesis.cancel(); } catch (er) {}
      d.classList.remove('strobe', 'quake', 'white'); d.classList.add('dead'); tone(60, 20, 1.6, 'sawtooth', 0.1);
      var end = $('.pn-end', d); await wait(1500);
      async function tt(t, ms, pause) { var n = document.createElement('div'); end.appendChild(n); for (var c = 0; c < t.length && alive; c++) { n.textContent += t[c]; await wait(ms); } await wait(pause || 500); }
      await tt('KERNEL PANIC - not syncing: operator does not know how to code.', 35, 1400); if (!alive) return;
      await tt('recalculating...', 60, 1300); await tt('correction: operator DOES know how to code.', 35, 900);
      await tt('evidence: six memos, one algorithms project, a boss fight, a text adventure and a 20-game arcade.', 22, 800);
      await tt('SYSTEM RESTORED. none of this was real: no files touched, no webcam, no pigeons (probably).', 22, 600); if (!alive) return;
      tone(660, 990, 0.2, 'triangle', 0.06); tone(990, 1320, 0.3, 'triangle', 0.06, 0.2);
      var row = el('div', 'pn-row', '<button class="pn-ok">I KNOW HOW TO CODE</button><button class="pn-again">PANIC AGAIN</button>'); end.appendChild(row);
      $('.pn-ok', row).onclick = function () { o.close(); toast('welcome back, coder.'); };
      $('.pn-again', row).onclick = function () { o.close(); setTimeout(panic, 250); };
    })();
  }

  cmds.panic = function () { P('do NOT press the red button...'); FX.closeTerm && FX.closeTerm(); setTimeout(panic, 250); };
  var pb = el('button', 'pn-btn', "I DON'T KNOW HOW TO CODE"); pb.onclick = function () { panic(); }; document.body.appendChild(pb);
  var buf = '';
  document.addEventListener('keydown', function (e) {
    var t = e.target; if (e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1 || /INPUT|TEXTAREA|SELECT/.test(t.tagName || '') || t.isContentEditable || X.stack.length) return;
    buf = (buf + e.key.toLowerCase()).slice(-8); if (buf.slice(-5) === 'panic') { buf = ''; panic(); }
  });
})();
