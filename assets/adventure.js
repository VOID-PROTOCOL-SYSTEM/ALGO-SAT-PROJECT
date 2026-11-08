/* MEMO ARCHIVE — THE MEMO ARCHIVE: a text adventure in six revisions */
(function () {
  var FX = window.ArchiveFX = window.ArchiveFX || {}, U = FX.u; if (!U) return;
  var $ = U.$, $$ = U.$$, rnd = U.rnd, pick = U.pick, lget = U.lget, lset = U.lset, reduce = U.reduce;
  var SAVE_KEY = 'adv-save-v1', MANUAL_KEY = 'adv-manual-v1', MAXSCORE = 200, running = false, ov = null, outEl = null, inpEl = null, sideEl = null, chipsEl = null;
  var OUTLOG = [], delayIdx = 0, UNDO = [], AMB = null, HIST = [], hIdx = 0, started = false;
  var ROOMS = {}, OBJS = {}, OBJ_ORDER = [], st = null;
  function snd() { return FX.sound || { on: false, tone: function () {} }; }

  /* ═════════ text formatting + output ═════════ */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmt(t) {
    t = esc(t);
    t = t.replace(/\[\[(.+?)\]\]/g, function (m, x) { return '<span class="adv-o" data-c="' + x.toLowerCase() + '">' + x + '</span>'; });
    t = t.replace(/\(\((.+?)\|(.+?)\)\)/g, function (m, c, l) { return '<span class="adv-c" data-c="' + c + '">' + l + '</span>'; });
    t = t.replace(/\*\*(.+?)\*\*/g, '<b class="adv-h">$1</b>').replace(/\^\^(.+?)\^\^/g, '<span class="adv-cy">$1</span>').replace(/%%(.+?)%%/g, '<span class="adv-gr">$1</span>')
         .replace(/##(.+?)##/g, '<span class="adv-ye">$1</span>').replace(/__(.+?)__/g, '<span class="adv-dim">$1</span>').replace(/!!(.+?)!!/g, '<span class="adv-rd">$1</span>');
    return t;
  }
  function plain(t) { return String(t).replace(/\[\[(.+?)\]\]/g, '$1').replace(/\(\((.+?)\|(.+?)\)\)/g, '$2').replace(/(\*\*|\^\^|%%|##|__|!!)/g, ''); }
  function out(t, cls) {
    OUTLOG.push(plain(t)); if (!outEl) return;
    var d = document.createElement('div'); d.className = 'adv-l' + (cls ? ' ' + cls : ''); d.innerHTML = fmt(t);
    d.style.animationDelay = Math.min(delayIdx++ * 45, 450) + 'ms'; outEl.appendChild(d);
    while (outEl.childNodes.length > 520) outEl.removeChild(outEl.firstChild); outEl.scrollTop = outEl.scrollHeight;
  }
  function say(t) { out(t); } function sys(t) { out(t, 'adv-sysl'); } function bad(t) { out(t, 'adv-bad'); } function good(t) { out(t, 'adv-good'); }
  function lk(t) {
    var m = FX.mood ? FX.mood() : 'chill';
    if (m === 'sassy') t = '(sigh) ' + t; else if (m === 'salty') t = 'fine. ' + t; else if (m === 'unhinged') t = t.toUpperCase() + ' !!!';
    out('◉ ' + t, 'adv-link');
  }
  function award(key, pts) {
    if (st.aw[key]) return; st.aw[key] = 1; st.score += pts; out('+' + pts + ' points', 'adv-score');
    var s = snd(); if (s.on) { s.tone(880, 1320, .14, 'triangle', .05); }
  }
  function glitchText(t) {
    var p = Math.max(0, st.corr - 35) / 380; if (p <= 0) return t; var G = '▓▒░#@%&?';
    return t.replace(/[a-zA-Z0-9]/g, function (c, i) { return Math.random() < p ? G.charAt(Math.floor(Math.random() * G.length)) : c; }).replace(/\[▓|\[\[(?=[^\]]*[▓▒░#@%&?])/g, '[[');
  }

  /* ═════════ world builders & state helpers ═════════ */
  function R(id, o) { o.id = id; ROOMS[id] = o; }
  function O(id, o) { o.id = id; o.names = o.names || [id]; OBJS[id] = o; OBJ_ORDER.push(id); }
  function nm(id) { return OBJS[id].names[0]; }
  function the(id) { return 'the [[' + nm(id) + ']]'; }
  function has(id) { return st.loc[id] === 'inv'; }
  function here(id) { return st.loc[id] === st.room; }
  function invIds() { return OBJ_ORDER.filter(has); }
  function isOpen(id) { return !!(st.op[id] || OBJS[id].transparent); }
  function visible(id) {
    var l = st.loc[id]; if (!l || l === 'nowhere') return false; if (l === 'inv' || l === st.room) return true;
    if (l.indexOf('in:') === 0) { var c = l.slice(3); return visible(c) && isOpen(c); } return false;
  }
  function contents(cid) { return OBJ_ORDER.filter(function (i) { return st.loc[i] === 'in:' + cid; }); }
  function moveTo(id, where) { st.loc[id] = where; }
  function newState() {
    var loc = {}, op = {}, lock = {};
    OBJ_ORDER.forEach(function (k) { var o = OBJS[k]; loc[k] = o.loc || 'nowhere'; if (o.openable || o.container) op[k] = (typeof o.open === 'boolean') && o.open; if (o.locked) lock[k] = true; });
    return { room: 'lobby', loc: loc, op: op, lock: lock, moves: 0, score: 0, corr: 0, f: {}, aw: {}, visited: { lobby: 1 }, hl: {}, mseq: [], laser: [], insight: 0, swarm: 0, zap: -99, carShown: null,
             dead: false, done: false, last: null, confirm: null, termTries: 0, insd: {}, seen: {}, ver: 1 };
  }
  function fragIds() { return ['frag1', 'frag2', 'frag3', 'frag4', 'frag5', 'frag6']; }
  function fragsHeld() { return fragIds().filter(has).length; }
  function fragsAll() { return fragIds().filter(function (i) { return has(i) || st.insd[i]; }).length; }
  var RANKS = [[0, 'Lost Intern'], [30, 'Index Wanderer'], [70, 'Junior Runner'], [110, 'Archive Hacker'], [150, 'Senior Runner'], [180, 'Glitch Slayer'], [200, 'ARCHIVE LEGEND']];
  function rank(s) { var r = RANKS[0][1]; RANKS.forEach(function (x) { if (s >= x[0]) r = x[1]; }); return r; }
  function deterred() { return st.zap >= st.moves || (FX.bugCount && FX.bugCount() >= 10); }
  var CARS = ['cyan', 'magenta', 'yellow', 'purple'];
  function carNow() { return CARS[st.moves % 4]; }

  /* ═════════ UI: overlay, side panel, map ═════════ */
  var MAPPOS = { floor3: [3, 0], roof: [4, 0], atrium: [3, 1], server: [2, 1], term: [4, 1], core: [1, 1], lobby: [3, 2], hall2: [2, 2], bay2: [1, 2], hall1: [4, 2], annex1b: [5, 2], annex1c: [6, 2], vault1: [4, 3], bench2: [2, 3], cellar: [3, 3] };
  var MAPLAB = { floor3: 'Workbk', roof: 'Roof', atrium: 'Atrium', server: 'Server', term: 'Term', core: 'CORE', lobby: 'Lobby', hall2: '02 Hall', bay2: 'Supply', hall1: '01 Hall', annex1b: 'Annex 1', annex1c: 'Annex 2', vault1: 'Vault', bench2: 'Bench', cellar: 'Cellar' };
  var DOPP = { north: 'south', south: 'north', east: 'west', west: 'east', up: 'down', down: 'up' };
  function exitVisible(r, d) { var ex = ROOMS[r].exits[d]; if (!ex) return false; if (typeof ex === 'string') return true; return !(ex.hidden && ex.hidden()); }
  function exitTo(r, d) { var ex = ROOMS[r].exits[d]; return typeof ex === 'string' ? ex : ex.to; }
  function mapSvg() {
    var cw = 66, ch = 56, pad = 8, w = 7 * cw + pad * 2, h = 4 * ch + pad * 2, edges = '', nodes = '', seen = {};
    Object.keys(ROOMS).forEach(function (r) {
      if (!st.visited[r]) return;
      Object.keys(ROOMS[r].exits).forEach(function (d) {
        if (!exitVisible(r, d)) return; var to = exitTo(r, d), a = MAPPOS[r], b = MAPPOS[to]; if (!a || !b) return; seen[to] = 1;
        var key = [r, to].sort().join('>'); if (seen[key]) return; seen[key] = 1;
        var dash = (d === 'up' || d === 'down') ? ' stroke-dasharray="3 3"' : '';
        edges += '<line x1="' + (pad + a[0] * cw + 29) + '" y1="' + (pad + a[1] * ch + 15) + '" x2="' + (pad + b[0] * cw + 29) + '" y2="' + (pad + b[1] * ch + 15) + '" stroke="rgba(0,245,255,.4)" stroke-width="1.4"' + dash + '/>';
      });
    });
    Object.keys(MAPPOS).forEach(function (r) {
      var known = st.visited[r], adj = false;
      if (!known) Object.keys(ROOMS).forEach(function (q) { if (st.visited[q]) Object.keys(ROOMS[q].exits).forEach(function (d) { if (exitVisible(q, d) && exitTo(q, d) === r) adj = true; }); });
      if (!known && !adj) return; var p = MAPPOS[r], x = pad + p[0] * cw, y = pad + p[1] * ch, cur = st.room === r;
      nodes += '<g><rect x="' + x + '" y="' + y + '" width="58" height="32" rx="3" fill="' + (known ? 'rgba(0,245,255,.10)' : 'rgba(255,255,255,.03)') + '" stroke="' + (cur ? '#ff2d78' : known ? '#00f5ff' : 'rgba(138,154,184,.4)') + '" stroke-width="' + (cur ? 2.2 : 1.2) + '"' + (known ? '' : ' stroke-dasharray="2 3"') + (cur ? ' class="adv-here"' : '') + '/>' +
        '<text x="' + (x + 29) + '" y="' + (y + 20) + '" text-anchor="middle" font-size="12" fill="' + (cur ? '#ff2d78' : known ? '#8ff6ff' : '#8a9ab8') + '" font-family="Share Tech Mono,monospace">' + (known ? MAPLAB[r] : '?') + '</text></g>';
    });
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="adv-mapsvg">' + edges + nodes + '</svg>';
  }
  function renderSide() {
    if (!sideEl || !st) return; var r = ROOMS[st.room], dirs = ['north', 'south', 'east', 'west', 'up', 'down'], ab = { north: 'N', south: 'S', east: 'E', west: 'W', up: 'UP', down: 'DN' };
    var comp = dirs.map(function (d) { var on = r.exits[d] && exitVisible(st.room, d); return '<span class="adv-dir' + (on ? ' on' : '') + '"' + (on ? ' data-c="go ' + d + '"' : '') + '>' + ab[d] + '</span>'; }).join('');
    var invs = invIds().map(function (i) { return '<span class="adv-o" data-c="' + nm(i) + '">' + nm(i) + '</span>'; }).join('') || '<span class="adv-dim">(nothing)</span>';
    var corrCol = st.corr >= 75 ? '#ff2d4d' : st.corr >= 45 ? '#ffb000' : '#00f5ff', ends = JSON.parse(lget('adv-endings') || '[]').length;
    sideEl.innerHTML = '<div class="adv-sh">LOCATION</div><div class="adv-rn">' + esc(r.name) + '</div><div class="adv-comp">' + comp + '</div>' +
      '<div class="adv-sh">INVENTORY</div><div class="adv-inv">' + invs + '</div>' +
      '<div class="adv-sh">STATUS</div><div class="adv-st"><span>SCORE <b>' + st.score + '</b>/' + MAXSCORE + '</span><span>MOVES <b>' + st.moves + '</b></span></div><div class="adv-rk">' + rank(st.score) + '</div>' +
      '<div class="adv-st"><span>FRAGMENTS <b>' + fragsAll() + '</b>/6</span><span>ENDINGS <b>' + ends + '</b>/5</span></div>' +
      '<div class="adv-sh">CORRUPTION <b style="color:' + corrCol + '">' + st.corr + '%</b></div><div class="adv-meter"><b style="width:' + st.corr + '%;background:' + corrCol + '"></b></div>' +
      '<div class="adv-sh">MAP</div>' + mapSvg();
    if (ov) { ov.classList.toggle('adv-hot', st.corr >= 75); }
  }
  function buildUI() {
    ov = document.createElement('div'); ov.className = 'adv';
    ov.innerHTML = '<div class="adv-bar"><span class="adv-t">THE MEMO ARCHIVE <i>// a text adventure in six revisions</i></span><span class="adv-btns"><i data-c="status">STATUS</i><i data-c="hint">HINT</i><i data-c="help">HELP</i><i data-c="save">SAVE</i><i data-c="quit">QUIT</i></span></div>' +
      '<div class="adv-body"><div class="adv-main"><div class="adv-out"></div><div class="adv-chips"></div><div class="adv-in"><span>&gt;</span><input type="text" spellcheck="false" autocomplete="off" autocapitalize="off" maxlength="120" placeholder="what do you do?"></div></div><div class="adv-side"></div></div>';
    document.body.appendChild(ov);
    outEl = $('.adv-out', ov); inpEl = $('input', ov); sideEl = $('.adv-side', ov); chipsEl = $('.adv-chips', ov);
    ['north|n', 'south|s', 'east|e', 'west|w', 'up|u', 'down|d', 'look|look', 'inventory|inv', 'hint|hint', 'wait|wait'].forEach(function (c) {
      var p = c.split('|'), s = document.createElement('span'); s.className = 'adv-chip'; s.textContent = p[1].toUpperCase(); s.setAttribute('data-c', p[0].length === 1 ? p[0] : (['north', 'south', 'east', 'west', 'up', 'down'].indexOf(p[0]) > -1 ? 'go ' + p[0] : p[0])); chipsEl.appendChild(s);
    });
    ov.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-c]'); if (t) { var c = t.getAttribute('data-c'); if (c === 'status') { ov.classList.toggle('adv-showside'); return; }
        if (c === 'quit') { run('quit'); return; } if (t.classList.contains('adv-o')) run('examine ' + c); else run(c); inpEl.focus(); return; }
      if (e.target.closest && e.target.closest('.adv-side') && ov.classList.contains('adv-showside')) ov.classList.remove('adv-showside');
    });
    ov.addEventListener('dblclick', function (e) { var t = e.target.closest && e.target.closest('.adv-o'); if (t) { run('take ' + t.getAttribute('data-c')); } });
    inpEl.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') { var v = inpEl.value; inpEl.value = ''; if (v.trim()) { HIST.push(v); hIdx = HIST.length; } run(v); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (hIdx > 0) inpEl.value = HIST[--hIdx]; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); inpEl.value = hIdx < HIST.length - 1 ? HIST[++hIdx] : (hIdx = HIST.length, ''); }
      else if (e.key === 'Tab') { e.preventDefault(); complete(); }
      else if (e.key === 'Escape') { ov.classList.remove('adv-showside'); }
    });
    ov.addEventListener('keyup', function (e) { e.stopPropagation(); }); ov.addEventListener('keypress', function (e) { e.stopPropagation(); });
  }
  function complete() {
    var v = inpEl.value, m = /(\S*)$/.exec(v), w = m ? m[1].toLowerCase() : ''; if (!w) return; var cand = [];
    OBJ_ORDER.filter(visible).forEach(function (i) { OBJS[i].names.forEach(function (n) { n.split(' ').forEach(function (x) { if (x.indexOf(w) === 0 && x !== w && cand.indexOf(x) === -1) cand.push(x); }); }); });
    if (v.indexOf(' ') === -1) Object.keys(SYN).forEach(function (x) { if (x.indexOf(w) === 0 && x !== w && x.length > 2 && cand.indexOf(x) === -1) cand.push(x); });
    if (cand.length) inpEl.value = v.slice(0, v.length - w.length) + cand[0];
  }

  /* ═════════════════════════ WORLD: ROOMS ═════════════════════════ */
  R('lobby', { name: 'Index Lobby',
    d: function () { return `You stand in the **Index Lobby**, a cathedral of brushed steel and dying neon. Rain streaks the enormous [[front doors]], sealed behind a flickering banner: ##LOCKDOWN — THE ARCHIVE IS CLOSED##.\n\nA curved [[reception desk]] sweeps beneath a wall-mounted [[neural eye]] that watches you with open curiosity. A sagging [[couch]] faces a [[notice board]] and a humming [[kiosk]]. A threadbare [[rug]] covers part of the floor` + (st.f.rug ? `, dragged aside to expose a [[trapdoor]]` : ``) + `.`; },
    exits: { north: 'atrium', east: 'hall1', west: 'hall2', down: { to: 'cellar', hidden: function () { return !st.f.rug; }, guard: function () { return st.op.trapdoor ? null : `The trapdoor is shut.`; } } },
    smell: `Ozone, rain and old carpet.`, listen: `The kiosk hums a tune it clearly believes is jazz.` });
  R('atrium', { name: 'North Atrium',
    d: function () { return `The **North Atrium** is a vault of glass and cold light. A towering [[window]] looks out over a skyline stitched with neon, where hovercars slide past in lazy lanes. A [[directory]] glows beside a dead [[fountain]] whose "water" is just scrolling green text.\n\nA steel [[stairs door]] on the landing leads up; beside it a [[keypad]] with a full alphabet of keys waits patiently. Doors lead north to the Workbook Floor, east to the Terminal Room and west to the Server Room.`; },
    exits: { south: 'lobby', north: 'floor3', east: 'term',
      west: { to: 'server', guard: function () { return st.f.serverOpen ? null : `The Server Room door shows a steady red light: ##LOCKED##. A tiny label reads: AUTHORISED ACCESS GRANTED VIA TERMINAL ROOM.`; } },
      up: { to: 'roof', guard: function () { return st.f.roofOpen ? null : `The stairs door is locked tight. The [[keypad]] glows, wanting a code.`; } } },
    listen: `Far below, the hum of hovercar traffic.` });
  R('hall1', { name: 'Memo 01 Hall',
    d: function () { return `The **Memo 01 Hall** is a long, hushed corridor. Three brass [[plaques]] are bolted to the wall in a row, each engraved with a revision number. A door south is marked ##ORIGINAL VAULT##; the passage continues east to the ##AMENDMENT ANNEXES##. The Lobby lies back west.`; },
    exits: { west: 'lobby', south: 'vault1', east: 'annex1b' } });
  R('vault1', { name: 'Original Vault',
    d: function () { return `The **Original Vault** is cold enough to see your breath. Steel shelves line the walls, mostly empty. A heavy [[cabinet]] squats in the centre, its face dominated by a glowing four-digit [[keypad]]. A single [[shelf]] by the door holds something small.`; },
    exits: { north: 'hall1' }, listen: `Your own breathing. The cabinet seems to be listening back.` });
  R('annex1b', { name: 'Amendment 1 Annex',
    d: function () { return `The **Amendment 1 Annex** is wallpapered in marked-up documents, every page bleeding red corrections. A huge [[wall display]] dominates the east side, showing a single clause in glowing letters. A cluttered [[desk]] sits below it. The hall is west; the passage continues east.`; },
    exits: { west: 'hall1', east: 'annex1c' } });
  R('annex1c', { name: 'Amendment 2 Annex',
    d: function () { return `The **Amendment 2 Annex** is a cramped, humming cupboard of a room. A chunky [[machine]] with three numbered slots — ##REV 1##, ##REV 2##, ##REV 3## — takes up one wall. A [[desk]] is jammed against the other, its surface buried in stationery. The only way out is back west.`; },
    exits: { west: 'annex1b' } });
  R('hall2', { name: 'Memo 02 Hall',
    d: function () { return `The **Memo 02 Hall** is lined with clipboards, each dangling from a nail like a tiny hanged accountant. A faded [[poster]] reads: ##THE SUPPLEMENT: BECAUSE THE ORIGINAL FORGOT SOMETHING##. A door south leads to the Workbench; a doorway west leads to the Supplement Bay. East is the Lobby.`; },
    exits: { east: 'lobby', south: 'bench2', west: 'bay2' } });
  R('bench2', { name: 'Original Workbench',
    d: function () { return `The **Original Workbench** room smells of solder and good intentions. A huge [[workbench]] supports a half-built brass-and-neon [[contraption]] with an empty [[gear socket]] at its heart. A yellowed [[manual]] lies open beside it, and a [[tray]] hangs beneath the machine's output chute.` + (st.f.frag4 ? `` : ``); },
    exits: { north: 'hall2' } });
  R('bay2', { name: 'Supplement Bay',
    d: function () { return `The **Supplement Bay** is stacked floor to ceiling with crates stamped SUPPLEMENT. Near the door, a tall [[dispenser]] hums beside a hand-painted sign: ##INSERT COIN FOR MISSING PARTS##. A pile of [[crates]] fills the rest of the room.`; },
    exits: { east: 'hall2' } });
  R('floor3', { name: 'Workbook Floor',
    d: function () { return `The **Workbook Floor** is an enormous hall, its centre eaten by a yawning [[shaft]] that drops into darkness. A knee-high robot stamped ##CRUDY-1## sits slumped beside a [[cart]] on short rails that run to the shaft's edge; the cart has a big red [[button]]. A [[parts crate]] stands nearby, and a [[chalkboard]] on the wall is covered in chalk. The Atrium is back south.`; },
    exits: { south: 'atrium' }, listen: `Wind in the shaft, and below it, a faint, hopeful clanking.` });
  R('term', { name: 'Terminal Room',
    d: function () { return `The **Terminal Room** is a graveyard of beige monitors, all dark but one: a single [[console]] glows, asking for a ##PASSWORD##. A cluttered [[desk]] stands beneath a drift of [[sticky notes]]. The Atrium is back west.`; },
    exits: { west: 'atrium' } });
  R('server', { name: 'Server Room',
    d: function () { return `The **Server Room** roars with fans. Black [[rack]]s tower in rows, their LEDs blinking like a city seen from a plane. One rack has a hot-swap bay holding a [[battery]]. A red [[lever]] on the wall is labelled ##MASTER RESET — DO NOT PULL##. At the far end, a freight [[lift]] waits behind a scanner: ##REQUIRES SIX FRAGMENTS##. The door east leads back to the Atrium.`; },
    exits: { east: 'atrium', down: { to: 'core', guard: function () { return liftCheck(); } } }, smell: `Hot dust and burnt optimism.` });
  R('roof', { name: 'Skyline Roof',
    d: function () { return `The **Skyline Roof** is all wind and neon. The city sprawls below like a circuit board with the power on, and above you hovercars stream through the rain in four glowing lanes. A big [[relay dish]] bristles from the centre, its receiver blinking in four colours. A low [[railing]] is all that stands between you and a very long fall. The stairs lead ((down|down)).`; },
    exits: { down: 'atrium' }, listen: `Wind. Rain. The whoosh of passing traffic.` });
  R('cellar', { name: 'Cache Cellar',
    d: function () { return `The **Cache Cellar** is damp, warm and loud with chittering. Cables hang like vines. In the corner a pulsing [[nest]] of tangled wire and glowing bugs seethes around a heap of cables — and perched on the heap, serene and utterly unbothered, sits a [[rubber duck]]. Something jagged and red glints in the nest. A ladder leads ((up|up)).`; },
    exits: { up: 'lobby' }, listen: `Thousands of tiny keyboards. Typing. Typing. Typing.` });
  R('core', { name: 'The Core',
    d: function () { return `The **Core** is a vast sphere of humming light. A [[pillar]] of black glass rises from the floor, ringed by six empty [[sockets]]. Above you, a colossal [[screen]] flickers with static; something enormous is waking behind it.` + (st.f.kpAwake ? `\n\n!!KERNEL PANIC IS AWAKE.!! The screen shows a vast, cracked, grinning face made of error messages. The pillar blazes with six lights. The glitch is waiting for you to make a move.` : ``); },
    exits: { up: 'server' } });

  /* ═════════════════════════ WORLD: OBJECTS ═════════════════════════ */
  function frag(n, name, al, insight, loc) {
    O('frag' + n, { names: [name + ' fragment', 'fragment', al], takeable: true, loc: loc || 'nowhere',
      d: `A shard of pulsing ${['blue', 'red', 'gold', 'green', 'violet', 'white'][n - 1]} light, humming softly. Tiny text scrolls inside it: ##"${insight}"##`,
      examined: function () { if (!st.insd['seen' + n]) { st.insd['seen' + n] = 1; st.insight++; sys(`(insight gained: ${st.insight}/6)`); } },
      taken: function () { award('frag' + n, 15); if (!st.aw['corr' + n]) { st.aw['corr' + n] = 1; st.corr = Math.max(0, st.corr - 10); good(`A pulse of clean light runs through the room. The Archive feels a little less broken. (Corruption −10)`); } } });
  }
  /* — Lobby — */
  O('doors', { names: ['front doors', 'doors', 'front door'], scenery: true, loc: 'lobby', d: `Sealed. The LOCKDOWN banner flickers above them. The glass is thick enough to ignore your opinions.`,
    open: function () { say(`The doors don't budge. The Archive is not letting anyone out until the Glitch is dealt with.`); return true; }, hit: function () { say(`You pound on the doors. The banner flickers disapprovingly.`); return true; } });
  O('desk', { names: ['reception desk', 'desk', 'reception'], scenery: true, loc: 'lobby', d: `A curved steel slab polished by decades of bureaucratic elbows. A [[drawer]] is set into its front.` });
  O('drawer', { names: ['drawer', 'desk drawer'], scenery: true, container: true, openable: true, loc: 'lobby', d: `A shallow metal drawer in the reception desk.` });
  O('zapper', { names: ['bug zapper', 'zapper', 'racket'], takeable: true, loc: 'in:drawer', d: `A tennis-racket-shaped bug zapper, its mesh crackling faintly. A label reads: ##FOR USE ON PESTS (AND, IN EMERGENCIES, OTHER PESTS)##.`,
    taken: function () { award('zapper', 3); },
    use: function () { st.zap = st.moves + 8; say(st.room === 'cellar' ? `ZZZT! The racket erupts in blue sparks. The swarm shrieks and scatters to the corners, muttering. You have a few turns of peace.` : `ZZZT! The racket crackles with blue sparks. Somewhere, a bug feels a disturbance in the force.`); return true; } });
  O('pass', { names: ['visitor pass', 'pass', 'badge'], takeable: true, loc: 'in:drawer', d: `A laminated VISITOR pass. It expired three revisions ago. The photo is of a different, happier person.` });
  O('couch', { names: ['couch', 'sofa', 'cushions', 'cushion'], scenery: true, loc: 'lobby', d: `A sagging leather couch that has absorbed a great deal of waiting. The cushions look... searchable.`,
    search: function () { if (!st.f.coin) { st.f.coin = 1; moveTo('coin', 'lobby'); say(`You dig between the cushions and, after the usual crumbs and regret, find a [[coin]].`); st.last = 'coin'; } else say(`Only crumbs and regret remain.`); return true; } });
  O('coin', { names: ['coin', 'brass coin'], takeable: true, loc: 'nowhere', d: `A chunky brass coin stamped ##ONE UNIT OF SUPPLEMENT##. It smells faintly of couch.`, taken: function () { award('coin', 3); } });
  O('board', { names: ['notice board', 'board', 'notices', 'rules'], scenery: true, loc: 'lobby',
    d: `A cork board with one laminated sheet, headed **RULES OF THE ARCHIVE**. Try ((read board|reading it)).`,
    read: `**RULES OF THE ARCHIVE**\n 1. THE LATEST REVISION SUPERSEDES ALL PREVIOUS ONES.\n 2. DO NOT FEED THE CACHE.\n 3. IF IN DOUBT, EXPLAIN IT TO THE DUCK.\n 4. (RULE 4 HAS BEEN AMENDED. SEE RULE 4.)\n\n__tip: click highlighted words to examine them; double-click to take. type__ ((help|help)) __for commands.__` });
  O('kiosk', { names: ['kiosk', 'index-os', 'indexos'], scenery: true, loc: 'lobby', d: `A chunky information kiosk with a cracked screen that reads **WELCOME TO INDEX-OS. PLEASE TAKE A NUMBER.** There is no number dispenser. There never was. Try ((talk kiosk|talking to it)).`,
    talk: function (t) {
      if (!t) { say(`**INDEX-OS:** "WELCOME. PLEASE TAKE A NUMBER. (THERE ARE NO NUMBERS.) ASK ME ABOUT: ARCHIVE, FRAGMENTS, GLITCH."`); return true; }
      if (/archive|memo/.test(t)) say(`**INDEX-OS:** "THE ARCHIVE HOLDS SIX MEMOS ACROSS THREE WINGS. EVERY MEMO IS REVISED. THE LATEST REVISION ALWAYS WINS. THIS IS THE ONLY LAW."`);
      else if (/fragment|shard/.test(t)) say(`**INDEX-OS:** "EACH MEMO LEFT A FRAGMENT IN ITS WING. BRING ALL SIX TO THE CORE, VIA THE SERVER ROOM LIFT. I WOULD HELP MORE BUT I AM A KIOSK."`);
      else if (/glitch|kernel|panic/.test(t)) say(`**INDEX-OS:** "KERNEL PANIC IS NOT IN MY DATABASE. THAT IS CONCERNING. MY DATABASE IS VERY BIG."`);
      else say(`**INDEX-OS:** "I DO NOT HAVE THAT. PLEASE TAKE A NUMBER."`); return true; },
    hit: function () { say(`**INDEX-OS:** "VIOLENCE IS NOT A VALID FORM OF FEEDBACK. PLEASE TAKE A NUMBER."`); return true; } });
  O('rug', { names: ['rug', 'carpet'], scenery: true, loc: 'lobby', d: `A threadbare rug with a faded pattern of overlapping circles — a Venn diagram of unclear intent. One corner has clearly been flipped before.`,
    move: function () { if (st.f.rug) { say(`The rug is already shoved aside.`); return true; } st.f.rug = 1; moveTo('trapdoor', 'lobby'); award('rug', 2); say(`You drag the rug aside. Beneath it, set into the floor, is an iron [[trapdoor]] with a ring handle. A damp, chittering sound rises from beneath.`); return true; } });
  O('trapdoor', { names: ['trapdoor', 'trap door', 'hatch'], scenery: true, openable: true, loc: 'nowhere', d: `A square iron trapdoor with a ring handle. From beneath it comes a damp chittering.`,
    open: function () { if (st.op.trapdoor) { say(`It's already open.`); return true; } st.op.trapdoor = true; say(`You heave the trapdoor open. Warm, damp air rises, carrying a sound like a thousand tiny keyboards. A ladder leads ((down|down)).`); return true; },
    enter: function () { if (!st.op.trapdoor) { say(`The trapdoor is shut.`); return true; } go('down'); return true; } });
  O('eye', { names: ['neural eye', 'eye', 'link', 'neural link', 'wall eye'], scenery: true, loc: 'lobby', d: `A glossy magenta eye in a hexagonal frame on the wall. It blinks. Somehow you know it is your guide. Try ((talk eye|talking to it)) or ((hint|hint)).`,
    talk: function (t) { eyeTalk(t); return true; }, hit: function () { lk(`ow. we hit people we like now? noted.`); return true; } });
  /* — Atrium — */
  O('window', { names: ['window', 'glass', 'skyline'], scenery: true, loc: 'atrium', d: function () { award('window', 2); return `Far below, hovercars stream through four glowing lanes. You watch for a while and the pattern emerges: a ##CYAN## car, then a ##MAGENTA## one, then a ##YELLOW## one, then a ##PURPLE## one. Then it repeats. Always in that order. Hypnotic.`; } });
  O('directory', { names: ['directory', 'sign', 'map board'], scenery: true, loc: 'atrium', d: `A glowing directory. Try ((read directory|reading it)).`,
    read: `**ARCHIVE DIRECTORY**\n MEMO 01 WING (east of Lobby): ORIGINAL VAULT · AMENDMENT 1 ANNEX · AMENDMENT 2 ANNEX\n MEMO 02 WING (west of Lobby): ORIGINAL WORKBENCH · SUPPLEMENT BAY\n MEMO 03 (north of here): WORKBOOK FLOOR\n TERMINAL ROOM (east) · SERVER ROOM (west, authorised only) · ROOF (up, please don't)\n BELOW THE LOBBY: nothing. (There is no below.)` });
  O('fountain', { names: ['fountain', 'water'], scenery: true, loc: 'atrium', d: `A decorative fountain whose water is just scrolling green characters, endlessly cascading into a basin.`,
    drink: function () { say(`You scoop a handful of green text and sip. It tastes like base64. You feel briefly omniscient, then briefly nauseous.`); return true; } });
  O('stairsdoor', { names: ['stairs door', 'stairs', 'stairwell', 'steel door'], scenery: true, loc: 'atrium', d: function () { return st.f.roofOpen ? `The stairs door stands open. Stairs lead ((up|up)) to the roof.` : `A heavy steel door with a keypad beside it. A faded sign: ##ROOF ACCESS — CODE REQUIRED — DO NOT JUMP##.`; },
    enter: function () { go('up'); return true; } });
  O('kp_atrium', { names: ['keypad', 'alphabet keypad', 'stairs keypad'], scenery: true, loc: 'atrium', d: `A brushed-steel keypad with the full alphabet on it. A four-letter code is expected. Try ((enter abcd|enter <code>)).`,
    enter: function (code) {
      if (st.f.roofOpen) { say(`The door is already unlocked.`); return true; }
      if (code === 'cmyp') { st.f.roofOpen = 1; award('roofdoor', 5); good(`The keypad chirps. With a heavy clunk, the stairs door unlocks.`); return true; }
      if (code.length !== 4 || !/^[a-z]+$/.test(code)) { say(`The keypad wants exactly four letters.`); return true; }
      say(`BZZT. The keypad flashes red: ##ACCESS DENIED##.`); return true; } });
  /* — Memo 01 wing — */
  O('plaques', { names: ['plaques', 'plaque', 'brass plaques'], scenery: true, loc: 'hall1', d: `Three brass plaques. Try ((read plaques|reading them)).`,
    read: function () { award('plaque', 2); return `**REVISION 1 — ORIGINAL**\n**REVISION 2 — AMENDMENT 1**\n**REVISION 3 — AMENDMENT 2**\n\nBelow, in smaller letters: __THREE REVISIONS. THE LAST ONE WINS.__`; } });
  O('cabinet', { names: ['cabinet', 'steel cabinet', 'safe'], scenery: true, container: true, openable: true, locked: true, loc: 'vault1', d: function () { return `A heavy steel cabinet. Its door is sealed by the glowing four-digit [[keypad]].` + (st.lock.cabinet ? `` : ` It stands open.`); },
    open: function () { if (st.lock.cabinet) { say(`The cabinet is locked. The [[keypad]] wants a four-digit code. Try ((enter 0000|enter <code>)).`); return true; } return false; } });
  O('kp_vault', { names: ['keypad', 'digit keypad', 'numeric keypad'], scenery: true, loc: 'vault1', d: `A numeric keypad glowing above the cabinet latch. Four digits, then a satisfied beep, ideally.`,
    enter: function (code) {
      if (!st.lock.cabinet) { say(`The cabinet is already open.`); return true; }
      if (!/^\d{4}$/.test(code)) { say(`The keypad wants exactly four digits.`); return true; }
      if (code === '3127') { st.lock.cabinet = false; st.op.cabinet = true; moveTo('frag1', 'in:cabinet'); good(`CLUNK. The keypad plays a tiny fanfare. The cabinet swings open, and inside rests a glowing [[origin fragment]].`); return true; }
      if (code === '4172') { say(`The keypad blinks amber: ##CODE SUPERSEDED BY AMENDMENT 1##.`); return true; }
      if (code === '4127') { say(`The keypad blinks amber: ##CODE SUPERSEDED BY AMENDMENT 2##.`); return true; }
      say(`BZZT. ##ACCESS DENIED.##`); return true; } });
  O('shelf', { names: ['shelf', 'shelves'], scenery: true, loc: 'vault1', d: `A steel shelf by the door. A small brass token sits on it.` });
  O('note0', { names: ['original notice', 'notice', 'note'], takeable: true, loc: 'vault1', d: `A yellowed card on the shelf. Try ((read notice|reading it)).`,
    read: function () { award('note0', 2); return `**ORIGINAL NOTICE**\nThe cabinet code is 4172. Do not write this down.\n__(You are, regrettably, reading it written down.)__`; } });
  O('tokenO', { names: ['original token', 'rev 1 token', 'token', 'brass token'], takeable: true, loc: 'vault1', d: `A brass token stamped ##REV 1## and ##ORIGINAL##. In tiny letters around the rim: ##03:01##.` });
  O('display', { names: ['wall display', 'display', 'clause', 'redline', 'clause 7'], scenery: true, loc: 'annex1b', d: function () { return st.f.struck ? `The display reads: **CLAUSE 7: ALL MEMOS SHALL BE DELIVERED ON TIME.** It looks smug.` : `A glowing wall display shows: **CLAUSE 7: ALL MEMOS SHALL BE DELIVERED ##LATE##.** The word LATE pulses red. This is clearly wrong; someone amended it badly. You'll need to ((strike late|strike)) it out with something red.`; },
    strike: function () {
      if (st.f.struck) { say(`You've already struck it.`); return true; }
      if (!has('pen')) { say(`You've got nothing red enough to strike it with. Somewhere in the annexes someone surely left a marker.`); return true; }
      st.f.struck = 1; moveTo('frag2', 'annex1b'); say(`You draw a bold red line through ##LATE##. The display considers this, flickers, and rewrites itself: **CLAUSE 7: ALL MEMOS SHALL BE DELIVERED ON TIME.** A hidden panel pops open beneath it, revealing a glowing [[redline fragment]].`); return true; },
    recv: function (a) { if (a === 'pen') return OBJS.display.strike(); return false; } });
  O('desk_b', { names: ['desk', 'cluttered desk'], scenery: true, loc: 'annex1b', d: `A cluttered desk. A paper [[amendment 1 note]] and a brass [[amendment 1 token]] sit among the clutter.` });
  O('noteA1', { names: ['amendment 1 note', 'amendment note', 'note', 'paper'], takeable: true, loc: 'annex1b', d: `A paper note. Try ((read note|reading it)).`,
    read: function () { award('noteA1', 2); return `**AMENDMENT 1**\nThe last two digits of the cabinet code have been swapped. Please update your records.\n__(Nobody did.)__`; } });
  O('tokenA1', { names: ['amendment 1 token', 'rev 2 token', 'token'], takeable: true, loc: 'annex1b', d: `A brass token stamped ##REV 2## and ##AMENDMENT 1##. Around the rim: ##03:04##.` });
  O('machine', { names: ['machine', 'revision machine', 'versioning machine'], scenery: true, loc: 'annex1c', d: function () { return `A chunky brass machine with three numbered slots: REV 1, REV 2, REV 3.` + (st.mseq.length ? ` ${st.mseq.length} slot${st.mseq.length > 1 ? 's' : ''} glow${st.mseq.length > 1 ? '' : 's'} green.` : ` All are dark.`) + ` A plaque: ##INSERT TOKENS IN CHRONOLOGICAL ORDER. THE MACHINE KNOWS.##`; },
    put: function (a) {
      var seq = ['tokenO', 'tokenA1', 'tokenA2']; if (seq.indexOf(a) === -1) { say(`The machine only takes revision tokens.`); return true; }
      if (st.f.frag3got) { say(`The machine is done. It looks proud.`); return true; }
      if (a === seq[st.mseq.length]) { moveTo(a, 'nowhere'); st.mseq.push(a); say(`The machine swallows the token with a satisfied clunk. Slot ${st.mseq.length} lights up green.`);
        if (st.mseq.length === 3) { st.f.frag3got = 1; moveTo('frag3', 'annex1c'); good(`All three slots blaze green. The machine shudders, whirs, and spits out a glowing [[latest fragment]]. A tiny plaque lights up: ##THE LATEST REVISION WINS.##`); } }
      else { st.mseq.forEach(function (t) { moveTo(t, 'inv'); }); st.mseq = []; moveTo(a, 'inv'); bad(`The machine buzzes: ##TIMESTAMP REJECTED. CHRONOLOGY VIOLATED.## It spits every token back and resets. (Check the timestamps on the rims.)`); }
      return true; } });
  O('desk_c', { names: ['desk', 'stationery'], scenery: true, loc: 'annex1c', d: `A desk buried under paper clips, sticky tabs and a [[red pen]]. A [[amendment 2 note]] is pinned to the blotter. There might be more under the stationery.`,
    search: function () { if (st.f.tA2) { say(`Only stationery. So much stationery.`); return true; } st.f.tA2 = 1; moveTo('tokenA2', 'annex1c'); say(`Under a drift of paper clips and sticky tabs you find a brass [[amendment 2 token]].`); st.last = 'tokenA2'; return true; } });
  O('pen', { names: ['red pen', 'pen', 'marker'], takeable: true, loc: 'annex1c', d: `A fat red marker, the kind used for correcting other people's work. Its cap is chewed.`, taken: function () { award('pen', 2); } });
  O('noteA2', { names: ['amendment 2 note', 'amendment note', 'note', 'pinned note'], takeable: true, loc: 'annex1c', d: `A note pinned to the blotter. Try ((read note|reading it)).`,
    read: function () { award('noteA2', 2); return `**AMENDMENT 2**\nThe first digit of the cabinet code is hereby replaced by the number of revisions on the Memo 01 plaque.\nThis supersedes all prior instructions.\n__(See: every other instruction.)__`; } });
  O('tokenA2', { names: ['amendment 2 token', 'rev 3 token', 'token'], takeable: true, loc: 'nowhere', d: `A brass token stamped ##REV 3## and ##AMENDMENT 2##. Around the rim: ##03:07##. That is... the time the Glitch got in.` });
  /* — Memo 02 wing — */
  O('poster', { names: ['poster'], scenery: true, loc: 'hall2', d: `A faded poster: **THE SUPPLEMENT: BECAUSE THE ORIGINAL FORGOT SOMETHING.** Underneath, someone has pencilled: "(it always does)".` });
  O('workbench', { names: ['workbench', 'bench'], scenery: true, loc: 'bench2', d: `A massive oak workbench scarred by decades of good intentions.` });
  O('contraption', { names: ['contraption', 'device', 'brass contraption'], scenery: true, loc: 'bench2', d: function () { return st.f.gearIn ? `The contraption whirs happily, all its brass and neon gears turning in harmony.` : `A beautiful half-built device of brass and neon. Everything is in place except the [[gear socket]] at its heart, which is empty. Whatever it makes comes out of a chute into the [[tray]].`; },
    put: function (a) { return OBJS.socket.put(a); } });
  O('socket', { names: ['gear socket', 'socket'], scenery: true, loc: 'bench2', d: `A gear-shaped socket at the heart of the contraption, empty. You'd need a gear to fit it.`,
    put: function (a) {
      if (a !== 'gear') { say(`That doesn't fit the socket. The socket is gear-shaped. The clue is in the name.`); return true; }
      if (st.f.gearIn) { say(`Already filled.`); return true; }
      st.f.gearIn = 1; moveTo('gear', 'nowhere'); moveTo('frag4', 'bench2'); say(`The gear slots home with a deeply satisfying click. The contraption lurches awake, gears whirring, and a [[workbench fragment]] rolls down the chute into the tray.`); return true; },
    recv: function (a) { return OBJS.socket.put(a); } });
  O('manual', { names: ['manual', 'yellowed manual', 'book'], scenery: true, loc: 'bench2', d: `A yellowed manual. Try ((read manual|reading it)).`,
    read: `**ASSEMBLY MANUAL (ORIGINAL)**\n Step 1: Attach the housing.\n Step 2: Fit the gear into the socket.\n Step 3: ...\n__[the rest of the page is missing. a sticky note says: "see SUPPLEMENT"]__` });
  O('tray', { names: ['tray', 'output tray'], scenery: true, loc: 'bench2', d: function () { return st.f.gearIn ? `A tray beneath the output chute.` : `An empty tray beneath the chute.`; } });
  O('dispenser', { names: ['dispenser', 'vending machine', 'parts dispenser'], scenery: true, loc: 'bay2', d: `A tall dispenser humming a sad little tune. A coin slot glints on its front, beside a hand-painted sign: ##INSERT COIN FOR MISSING PARTS##.`,
    put: function (a) {
      if (a !== 'coin') { say(`The dispenser rejects that with a disapproving buzz. It only wants a coin.`); return true; }
      if (st.f.gearGot) { say(`The dispenser is empty now. It sulks.`); return true; }
      st.f.gearGot = 1; moveTo('coin', 'nowhere'); moveTo('gear', 'bay2'); say(`The coin vanishes with a bright *plink*. The dispenser whirs, thinks about it, and drops a heavy brass [[gear]] into the tray at its base.`); return true; },
    recv: function (a) { return OBJS.dispenser.put(a); } });
  O('crates', { names: ['crates', 'crate', 'supplement crates'], scenery: true, loc: 'bay2', d: `Hundreds of crates stamped SUPPLEMENT. Most are bubble wrap and apology notes.`, search: function () { say(`You rummage through the crates. Bubble wrap, apology notes, and one unused sticky tab. Nothing useful.`); return true; } });
  O('gear', { names: ['gear', 'brass gear', 'cog'], takeable: true, loc: 'nowhere', d: `A heavy brass gear with neon-etched teeth. It looks like it fits something.`, taken: function () { award('gear', 3); } });
  /* — Memo 03 — */
  O('shaft', { names: ['shaft', 'pit', 'hole'], scenery: true, loc: 'floor3', d: `A vast square shaft descending into darkness. Rails run to its edge. From far below comes the faint echo of nothing at all.`,
    enter: function () { say(`You peer over the edge and decide, wisely, against it.`); return true; }, jump: function () { die(`You step off the edge and fall for a long, educational time. The Archive logs this as: ##UNAUTHORISED DESCENT##.`); return true; } });
  O('robot', { names: ['robot', 'crudy-1', 'crudy', 'crudy 1'], scenery: true, loc: 'floor3', d: function () { return st.f.crudy ? `[[CRUDY-1]] stands beside the cart, optics glowing a hopeful amber, its tiny treads shuffling with enormous dignity.` : `A knee-high maintenance robot slumped against the cart, ##CRUDY-1## stencilled across its chest. Its battery indicator blinks, once, politely: ##EMPTY##.`; },
    talk: function (t) {
      if (!st.f.crudy) { say(`The robot doesn't respond. Its battery light blinks, once, politely.`); return true; }
      say(`**CRUDY-1:** "ENERGY LIMITED. PLEASE LOAD CART. CAPACITY: 5. REQUIRED VALUE: 7. I CANNOT CARRY EVERYTHING."\nIt looks at you as if this is a philosophy as much as a parameter.`); return true; },
    give: function (a) { if (a !== 'battery') { say(`CRUDY-1 stares at it, then at you. It does not want it.`); return true; } return OBJS.robot.recv(a); },
    put: function (a) { return OBJS.robot.give(a); },
    recv: function (a) {
      if (a !== 'battery') return false; if (st.f.crudy) { say(`CRUDY-1 is already charged.`); return true; }
      st.f.crudy = 1; moveTo('battery', 'nowhere'); award('crudy', 5);
      say(`You slot the battery into CRUDY-1's chest. A whine, a flicker, a long beep — and the robot's optics blaze to life. **CRUDY-1:** "POWER RESTORED. THANK YOU. I HAVE BEEN WAITING A VERY LONG TIME. THE CART IS READY. I CAN CARRY ##5## UNITS. THE FRAGMENT BELOW REQUIRES A DELIVERY VALUE OF ##7##."`); return true; } });
  O('cart', { names: ['cart', 'rail cart'], scenery: true, container: true, transparent: true, loc: 'floor3', d: function () { return `A sturdy cart on short rails that run to the edge of the shaft. A big red [[button]] is bolted to its side. ` + cartStatus(); } });
  O('button', { names: ['red button', 'button'], scenery: true, loc: 'floor3', d: `A big red button on the cart. It practically begs to be pushed. ((send cart|Send the cart.))`,
    push: function () { return sendCart(); } });
  O('partsCrate', { names: ['parts crate', 'crate', 'box', 'parts'], scenery: true, container: true, transparent: true, loc: 'floor3', d: function () { return `A wooden crate of labelled parts: ` + partList() + `.`; } });
  O('chalkboard', { names: ['chalkboard', 'blackboard', 'board'], scenery: true, loc: 'floor3', d: `A chalkboard covered in tidy handwriting. Try ((read chalkboard|reading it)).`,
    read: `**CART RULES**\n CART CAPACITY: 5 UNITS     REQUIRED DELIVERY VALUE: 7\n\n COIL  weight 2  value 3\n RELAY weight 3  value 4\n LENS  weight 4  value 5\n CHIP  weight 1  value 2\n CELL  weight 5  value 6\n\n__(CRUDY-1 REFUSES OVERWEIGHT LOADS. CRUDY-1 REFUSES MOST THINGS.)__` });
  function part(id, n, w, v, d) { O(id, { names: [n, n + ' part'], takeable: true, loc: 'in:partsCrate', w: w, v: v, d: d + ` __(weight ${w}, value ${v})__` }); }
  part('coil', 'coil', 2, 3, `A neat copper coil, warm to the touch.`); part('relay', 'relay', 3, 4, `A clunky electromechanical relay that clicks when you look at it.`);
  part('lens', 'lens', 4, 5, `A heavy crystal lens that bends the light into small rainbows.`); part('chip', 'chip', 1, 2, `A tiny microchip. Suspiciously valuable for its size.`);
  part('cell', 'cell', 5, 6, `A big, dense power cell. It practically fills your arms.`);
  /* — Terminal Room — */
  O('console', { names: ['console', 'terminal', 'computer', 'monitor', 'screen'], scenery: true, loc: 'term', d: function () { return st.f.serverOpen ? `The console reads: ##ACCESS GRANTED.## Beneath it, a log: SERVER ROOM DOOR UNLOCKED. DESK DRAWER UNLOCKED.` : `The console glows green: **ENTER PASSWORD (5 LETTERS):** A cursor blinks. Try ((enter ember|enter <word>)). Wrong guesses show which letters are right.`; },
    enter: function (code) {
      if (st.f.serverOpen) { say(`The console has nothing more to say. It hums contentedly.`); return true; }
      if (!/^[a-z]{5}$/.test(code)) { say(`The console wants exactly five letters.`); return true; }
      st.termTries++; var ans = 'ember', res = [], i;
      if (code === ans) { st.f.serverOpen = 1; st.lock.drawer_t = false; award('term', 10); good(`**ACCESS GRANTED.** The console chimes. Somewhere to the west a heavy door unlocks, and the desk drawer clicks open.`); return true; }
      for (i = 0; i < 5; i++) { var c = code[i]; res.push(c === ans[i] ? '%%' + c.toUpperCase() + '%%' : ans.indexOf(c) !== -1 ? '##' + c.toUpperCase() + '##' : '__' + c.toUpperCase() + '__'); }
      say(`**ACCESS DENIED:** ` + res.join(' ') + `   __(green = right place, yellow = wrong place, dim = not in the word)__`); return true; } });
  O('sticky', { names: ['sticky notes', 'notes', 'sticky note', 'sticky'], scenery: true, loc: 'term', d: `A drift of sticky notes. Try ((read sticky notes|reading them)).`,
    read: `A dozen notes, mostly "buy milk". Two matter:\n • "PASSWORD IS FIVE LETTERS. FORGOT IT AGAIN. — ADMIN"\n • "hint to self: what's left glowing after the fire in OPERATION ___LIGHT?"` });
  O('desk_t', { names: ['desk', 'cluttered desk'], scenery: true, loc: 'term', d: `A cluttered desk. A [[drawer]] is set into the front, a tiny red light blinking on its lock.` });
  O('drawer_t', { names: ['drawer', 'desk drawer'], scenery: true, container: true, openable: true, locked: true, loc: 'term', d: function () { return st.lock.drawer_t ? `A drawer with a blinking red lock.` : `A drawer, unlocked.`; },
    open: function () { if (st.lock.drawer_t) { say(`The drawer's electronic lock blinks red. It's tied to the console.`); return true; } return false; } });
  O('laser', { names: ['laser pointer', 'laser', 'pointer'], takeable: true, loc: 'in:drawer_t', d: `A heavy-duty red laser pointer, the kind used by presenters who take things very seriously. Try ((point laser at ...|point laser at something)).`,
    taken: function () { award('laser', 3); },
    point: function (b) {
      if (st.room !== 'roof') { say(`You wave the laser around. A passing moth is deeply offended.`); return true; }
      var c = OBJS[b] && OBJS[b].color; if (!c) { say(`You point the laser at ${the(b)}. Nothing happens.`); return true; }
      if (st.f.dishDone) { say(`The dish has what it needs.`); return true; }
      if (st.carShown !== c) { say(`No ${c} car is overhead right now. (The cars pass in a loop; a ${st.carShown} one is passing.)`); return true; }
      var order = ['cyan', 'magenta', 'yellow', 'purple'];
      if (c === order[st.laser.length]) { st.laser.push(c); say(`You ping the ${c} hovercar. The dish's ${c} receiver blazes brightly and holds.`);
        if (st.laser.length === 4) { st.f.dishDone = 1; moveTo('frag6', 'roof'); good(`All four receivers blaze together. The dish hums like a choir, then spits a glowing [[skyline fragment]] into the rain at your feet.`); } }
      else { st.laser = []; bad(`You ping the ${c} car, and the dish's receivers all flicker and go dark: ##WRONG SEQUENCE.## It resets.`); }
      return true; },
    use: function () { say(`Point it at something. ((point laser at the cyan car|point laser at ...))`); return true; } });
  /* — Server Room — */
  O('rack', { names: ['rack', 'racks', 'server rack', 'server'], scenery: true, loc: 'server', d: `Towering black server racks, their LEDs blinking in endless rhythm. One has a hot-swap bay with a [[battery]] in it. The bare bus-bars at the back look unwise to touch.`,
    touch: function () { die(`You reach for the bare bus-bars at the back of the rack. Blue light crawls up your arm. You are now part of the infrastructure.`); return true; } });
  O('battery', { names: ['battery', 'battery pack', 'hot-swap battery'], takeable: true, loc: 'server', d: `A heavy hot-swap battery pack, fat with charge. It would power a small robot for a very long time.`, taken: function () { award('battery', 3); },
    eat: function () { die(`You take a bite of the battery. It is, in retrospect, not food. The last thing you taste is lithium and regret.`); return true; } });
  O('lever', { names: ['lever', 'red lever', 'master reset', 'reset lever'], scenery: true, loc: 'server', d: `A big red lever labelled ##MASTER RESET — DO NOT PULL##. Below, in smaller letters: ##(this will erase all memos and restore factory settings)##. A very tempting shortcut.`,
    pull: function () { st.confirm = 'reset'; say(`!!Pull the master reset? It will wipe the Archive and end the game.!! (yes / no)`); return true; } });
  O('lift', { names: ['lift', 'freight lift', 'elevator'], scenery: true, loc: 'server', d: `A heavy freight lift behind a six-socket scanner. The sign reads ##REQUIRES SIX FRAGMENTS##. It leads ((down|down)) to the Core.`, enter: function () { go('down'); return true; } });
  /* — Roof — */
  O('dish', { names: ['relay dish', 'dish', 'receiver', 'antenna'], scenery: true, loc: 'roof', d: function () { return `A big relay dish with four receivers blinking in turn: cyan, magenta, yellow, purple. It hums, waiting to be pinged by the matching hovercars, one by one. ` + (st.f.dishDone ? `All four glow steadily.` : (st.laser.length ? `${st.laser.length} receiver${st.laser.length > 1 ? 's glow' : ' glows'} steadily.` : `None are locked on yet.`)); } });
  O('railing', { names: ['railing', 'rail', 'edge'], scenery: true, loc: 'roof', d: `A knee-high railing. It's less a barrier and more a suggestion. A very long drop lies beyond.`, jump: function () { die(`You vault the railing and fall for a very long time, past a thousand lit windows. The Neural Link, from somewhere, sighs: "...really?"`); return true; } });
  O('cars', { names: ['cars', 'hovercars', 'hovercar', 'traffic', 'city', 'skyline', 'car'], scenery: true, loc: 'roof', d: function () { return `Hovercars stream through four lanes above the rain, in a loop: cyan, magenta, yellow, purple. ` + carLine(); } });
  CARS.forEach(function (c) { O('car_' + c, { names: [c + ' car', c + ' hovercar', c], scenery: true, color: c, loc: 'roof', d: `A sleek ${c} hovercar gliding through the rain. ` + `It'll be back around in a moment.` }); });
  /* — Cellar — */
  O('duck', { names: ['rubber duck', 'duck'], takeable: true, loc: 'cellar', d: `A small, yellow, utterly serene rubber duck. It has a wise, slightly judgemental look. Rule 3 of the Archive: ##IF IN DOUBT, EXPLAIN IT TO THE DUCK.## Try ((talk duck|talk to it)).`,
    taken: function () { award('duck', 5); },
    talk: function () {
      if (!st.f.duckTalk) { st.f.duckTalk = 1; st.corr = Math.max(0, st.corr - 3); say(`You explain the entire Archive to the duck. It listens without interrupting. Halfway through, you realise something obvious about the lockdown that you hadn't noticed. The duck says nothing, in a way that feels like it said everything. (Corruption −3)`); }
      else say(pick([`The duck stares. You feel understood.`, `You explain your feelings to the duck. It is absorbed. Somewhere, a bug quietly fixes itself.`, `The duck says nothing. It does so with enormous authority.`])); return true; },
    hit: function () { say(`The duck squeaks. It's a small, sad, accusatory squeak. You feel terrible.`); return true; } });
  O('nest', { names: ['nest', 'bugs', 'swarm', 'cache', 'bug nest'], scenery: true, loc: 'cellar', d: function () { return deterred() ? `The bugs have scattered to the corners, chittering resentfully. The tangled heart of the nest lies exposed, a jagged [[red shard]] glinting in it.` : `A seething knot of wire and glowing bugs, pulsing like a heart. Something jagged and red glints at its centre. The bugs are watching you. They are organising.`; },
    search: function () { if (deterred()) { say(`With the swarm scattered, you can see a jagged [[red shard]] wedged in the nest. It's corrupted, humming with something wrong and magnetic.`); st.last = 'shard'; return true; } die(`You reach into the nest. The swarm reaches back. A thousand tiny voices say "FEED THE CACHE" in perfect unison.`); return true; } });
  O('cables', { names: ['cables', 'cable', 'wires'], scenery: true, loc: 'cellar', d: `Thick, warm cables hang like jungle vines, humming faintly. Some of them look chewed.` });
  O('shard', { names: ['corrupted shard', 'red shard', 'shard', 'corrupted fragment'], takeable: true, loc: 'cellar', d: `A jagged shard of red light, humming wrongly. Text flickers inside it: ##"WHAT IF THE GLITCH WAS RIGHT?"## Holding it feels like leaning over a very high balcony.`,
    take: function () { if (!deterred()) { die(`You lunge for the red shard. The swarm erupts around you. The shard is the last thing you see — and then it, too, is gone.`); return false; } return true; }, taken: function () { award('shard', 10); say(`The shard burns cold in your hand. You can hear the Glitch, faintly, calling you by name.`); } });
  /* — Core — */
  O('pillar', { names: ['pillar', 'black pillar', 'glass pillar'], scenery: true, loc: 'core', d: function () { return `A pillar of black glass, ringed by six sockets. ` + (st.f.kpAwake ? `All six sockets blaze. The pillar sings.` : `The sockets wait for fragments. Try ((insert fragments|insert fragments)).`); } });
  O('sockets', { names: ['sockets', 'socket'], scenery: true, loc: 'core', d: `Six empty sockets set into the base of the pillar, each a different colour. They're begging for fragments.` });
  O('screen', { names: ['screen', 'kernel panic', 'kp', 'glitch', 'giant screen', 'face'], scenery: true, loc: 'core', d: function () { return st.f.kpAwake ? `A vast, cracked, grinning face made of error messages: **KERNEL PANIC**. It watches you with a thousand blinking cursors. You could ((fight|fight)) it, or try something cleverer.` : `A colossal screen flickering with static. Something enormous is waking behind it.`; },
    talk: function () { if (!st.f.kpAwake) { say(`The static hisses back at you.`); return true; }
      say(`**KERNEL PANIC:** "I WAS ONLY TRYING TO FINISH. THE LOOP SAID TO KEEP GOING. NOBODY TOLD ME WHEN TO STOP." The cursors blink, almost sadly. "YOU CANNOT FIX ME. YOU CAN ONLY DELETE ME."\n__(Is that so? Maybe there are other options.)__`); return true; } });
  frag(1, 'origin', 'origin', 'THE FIRST VERSION IS ONLY EVER A DRAFT.', 'nowhere'); frag(2, 'redline', 'redline', 'CORRECTIONS ARE NOT ADMISSIONS OF FAILURE.', 'nowhere');
  frag(3, 'latest', 'latest', 'THE LATEST REVISION WINS, BUT ONLY IF SOMEONE TELLS THE REST.', 'nowhere'); frag(4, 'workbench', 'workbench', 'THE SUPPLEMENT EXISTS BECAUSE THE ORIGINAL FORGOT SOMETHING. THAT IS FINE.', 'nowhere');
  frag(5, 'cargo', 'cargo', 'YOU CANNOT CARRY EVERYTHING. CHOOSE WHAT MATTERS.', 'nowhere'); frag(6, 'skyline', 'skyline', 'WAIT FOR THE RIGHT MOMENT, IN THE RIGHT ORDER.', 'nowhere');
  OBJS.frag1.loc = 'nowhere';

  /* ═════════════════════════ ENGINE: helpers used by the world ═════════════════════════ */
  function carLine() { if (!st.carShown) st.carShown = carNow(); return 'A **' + st.carShown + '** hovercar is gliding overhead right now.'; }
  function announceCar() { st.carShown = carNow(); say('__A ' + st.carShown + ' hovercar glides overhead.__'); }
  function partList() { var c = contents('partsCrate'); return c.length ? c.map(function (i) { return '[[' + nm(i) + ']] (w' + OBJS[i].w + ' v' + OBJS[i].v + ')'; }).join(', ') : 'nothing — it is empty'; }
  function cartItems() { return contents('cart'); }
  function cartTotals() { var w = 0, v = 0; cartItems().forEach(function (i) { w += OBJS[i].w; v += OBJS[i].v; }); return { w: w, v: v }; }
  function cartStatus() { var c = cartItems(); if (!c.length) return 'The cart is empty.'; var t = cartTotals(); return 'It holds: ' + c.map(function (i) { return '[[' + nm(i) + ']]'; }).join(', ') + '. (weight ' + t.w + '/5, value ' + t.v + '/7)'; }
  function sendCart() {
    if (!st.f.crudy) { say('The button clicks. Nothing happens. CRUDY-1 is out of power, and someone has to haul that cart down the shaft.'); return true; }
    var c = cartItems(); if (!c.length) { say('CRUDY-1 looks at the empty cart, then at you. **CRUDY-1:** "THE CART IS EMPTY. I WILL NOT DESCEND FOR NOTHING."'); return true; }
    var t = cartTotals();
    if (t.w > 5) { bad('**CRUDY-1:** "OVERWEIGHT. ' + t.w + '/5. I REFUSE." The cart does not move. (Take something out.)'); return true; }
    if (t.v < 7) { say('CRUDY-1 hauls the cart into the shaft and, after a long clanking silence, returns with a bag of scrap. **CRUDY-1:** "VALUE ' + t.v + '. REQUIRED 7. DISAPPOINTING." The parts tumble back into the crate.'); c.forEach(function (i) { moveTo(i, 'in:partsCrate'); }); return true; }
    c.forEach(function (i) { moveTo(i, 'nowhere'); }); st.f.cargo = 1; moveTo('frag5', 'floor3');
    good('CRUDY-1 grips the cart and rolls it over the edge of the shaft. A long silence. Then — clanking, whirring, a triumphant beep — and the robot hauls the cart back up. In it, wrapped in a tidy bow of cable, rests a glowing [[cargo fragment]].\n**CRUDY-1:** "DELIVERY: VALUE ' + t.v + ', WEIGHT ' + t.w + '. ON TIME." It says this with enormous dignity.'); return true;
  }
  function liftCheck() { var n = fragsHeld(); return n < 6 ? 'The lift scanner flashes: ##' + n + '/6 FRAGMENTS DETECTED.## It refuses to move. (Bring all six.)' : null; }
  OBJS.cart.put = function (a) {
    if (OBJS[a].w === undefined) { say('The cart is for parts, not ' + the(a) + '.'); return true; }
    moveTo(a, 'in:cart'); say('You load ' + the(a) + ' onto the cart. ' + cartStatus()); return true; };
  OBJS.cart.examined = function () {}; OBJS.lever.push = OBJS.lever.pull;
  OBJS.display.names.push('late'); OBJS.screen.names.push('static');
  OBJS.laser.point = (function (orig) { return function (b) { if (b === 'cars') { say('Which car? Name a colour: ((point laser at cyan car|cyan)), magenta, yellow or purple.'); return true; } return orig(b); }; })(OBJS.laser.point);

  function eyeTalk(t) {
    if (!t) {
      if (!st.aw.eye) { award('eye', 2);
        lk('oh good, a runner. i am the NEURAL LINK. i see everything, understand roughly 40% of it, and judge the rest.');
        lk('short version: KERNEL PANIC is eating the memos. six fragments are scattered through the wings. bring them to the Core, down the lift in the Server Room. then... we improvise.');
        lk('type HINT whenever you are stuck. corruption rises with every move. tick tock.'); }
      else lk(pick(['still here. still blinking.', 'you are doing fine. (that is a lie. you are doing okay.)', 'corruption is at ' + st.corr + '%. no pressure. (some pressure.)', 'ask me about: glitch, fragments, archive, cars, duck, cellar, robot, you.']));
      return;
    }
    if (/glitch|kernel|panic|boss/.test(t)) lk('KERNEL PANIC. an infinite loop that got ideas. it can be fought, outwitted, or... talked to, i suppose. in the right circumstances. the rules of the archive might help.');
    else if (/fragment|shard/.test(t)) lk('six fragments: one per memo. each wing hides one. fragments also contain little pearls of wisdom. read them. i find it relaxing.');
    else if (/archive|memo|memos/.test(t)) lk('six memos, three wings. every memo has been revised. the latest revision always wins. i find that deeply comforting and mildly threatening.');
    else if (/car|cars|hovercar|roof/.test(t)) lk('the cars pass in a loop. the order is the same every time. i have been watching them for years. it is all i do.');
    else if (/duck/.test(t)) lk('the duck is the wisest being in the archive. do not tell the kiosk i said that.');
    else if (/cellar|bug|nest/.test(t)) lk('the cellar is full of bugs. i would bring something zappy. and not linger. bugs get ideas.');
    else if (/robot|crudy|cart/.test(t)) lk('CRUDY-1 is a very good robot. it just needs a battery. also: you cannot carry everything. no one can.');
    else if (/you|link|yourself|eye/.test(t)) lk('i am a cartoon eye on a wall. i have a surprisingly rich inner life and no hands. it is a lot.');
    else if (/hint|help|stuck/.test(t)) lk('just type HINT. i will pretend i did not hear you ask twice.');
    else if (/secret|ending|win/.test(t)) lk('there are five ways this can end. i will not say more. i am contractually vague.');
    else lk(pick(['i do not know about that. ask me about the glitch, the fragments, the cars...', 'hm. no idea. i am an eye, not a library.']));
  }

  /* ═════════════════════════ ENGINE: movement, look, tick ═════════════════════════ */
  var LINKCOM = { atrium: 'that window is fancier than it needs to be. maybe it is trying to tell you something.', hall1: 'three plaques. three revisions. i feel like that is relevant.', vault1: 'a code. lovely. someone wrote it down. someone always writes it down.',
    annex1b: 'red ink everywhere. an editor lives here.', annex1c: 'a machine with slots. i bet it cares about ORDER.', hall2: 'the supplement wing. it exists because the original forgot something. relatable.',
    bench2: 'a machine missing a gear. the supplement bay is next door. i am just saying.', bay2: 'a coin-operated dispenser. somewhere in the lobby, a couch has been collecting change for years.',
    floor3: 'that robot is dead. batteries exist. there is probably one in the server room.', term: 'five letters. the sticky notes practically give it away.', server: 'hot. loud. also: a red lever. do NOT pull it. (i would like to continue existing.)',
    roof: 'the cars again. maybe they like being watched.', cellar: 'it is full of bugs. i respect them. from a distance. do not stay long.', core: 'oh no. oh no no no. okay. you are very brave. i am a coward. let us do this.' };
  function lookBody() {
    var r = ROOMS[st.room], d = r.d(); say(st.corr >= 40 ? glitchText(d) : d);
    var loose = OBJ_ORDER.filter(function (i) { return st.loc[i] === st.room && !OBJS[i].scenery; });
    if (loose.length) say('You can see: ' + loose.map(function (i) { return '[[' + nm(i) + ']]'; }).join(', ') + '.');
    var ex = ['north', 'south', 'east', 'west', 'up', 'down'].filter(function (d) { return r.exits[d] && exitVisible(st.room, d); });
    sys('Exits: ' + ex.map(function (d) { return '((go ' + d + '|' + d + '))'; }).join('  ') + '    ' + (st.room === 'roof' ? '' : ''));
    if (st.room === 'roof') say(carLine());
  }
  function lookRoom() { out(ROOMS[st.room].name.toUpperCase(), 'adv-room'); lookBody(); }
  function arrive() {
    var first = !st.seen['r_' + st.room]; st.seen['r_' + st.room] = 1; lookRoom();
    if (st.room === 'roof') { st.carShown = carNow(); }
    if (st.room === 'cellar') { say('__The chittering stops. Several thousand tiny faces turn toward you.__'); if (deterred()) say('__(the swarm eyes you, and the racket in your hand, and thinks better of it.)__'); else bad('The bugs have noticed you. You should not stay long.'); }
    if (first && LINKCOM[st.room]) lk(LINKCOM[st.room]);
  }
  function go(dir) {
    var r = ROOMS[st.room], ex = r.exits[dir];
    if (!ex || !exitVisible(st.room, dir)) { say(r.noexit && r.noexit[dir] || "You can't go that way."); NOTICK = true; return false; }
    if (typeof ex !== 'string' && ex.guard) { var g = ex.guard(); if (g) { say(g); NOTICK = false; return false; } }
    if (st.room === 'cellar') st.swarm = 0;
    st.room = exitTo(st.room, dir); st.visited[st.room] = 1; arrive(); return true;
  }
  var NOTICK = false;
  function tick() {
    st.moves++; if (st.moves % 3 === 0) st.corr = Math.min(100, st.corr + 1);
    if (st.room === 'roof') announceCar();
    if (st.room === 'cellar' && !deterred()) { st.swarm++;
      if (st.swarm === 2) say('__The chittering rises. The bugs have noticed you.__'); else if (st.swarm === 3) say('__The swarm begins to organise itself into a shape. The shape is a mouth.__');
      else if (st.swarm === 4) bad('The mouth is almost fully formed. You should leave. Right now.'); else if (st.swarm >= 5) { die('The mouth closes. You are now part of the cache.'); return; } }
    else if (st.room !== 'cellar') st.swarm = 0;
    [[40, 'c40', 'The lights flicker. Somewhere, a word in a nearby sign rearranges itself.'], [60, 'c60', 'The air tastes of static. Text on the walls begins to drift.'], [80, 'c80', '!!The Archive is screaming. Entire sentences are collapsing into noise.!!'], [95, 'c95', '!!The corruption is nearly total. You have only moments left.!!']].forEach(function (x) { if (st.corr >= x[0] && !st.f[x[1]]) { st.f[x[1]] = 1; say(x[2]); } });
    if (st.corr >= 100) { ending('E'); return; }
    if (st.moves > 0 && st.moves % 18 === 0 && !FX.isMuted_adv) lk(pick(['corruption is at ' + st.corr + '%. no pressure. (some pressure.)', 'fragments held: ' + fragsAll() + '/6. just keeping score.', 'try HINT if you are stuck. i am right here. blinking.', 'i have decided to believe in you.']));
  }
  function die(msg) {
    bad(msg); st.dead = true; var n = parseInt(lget('adv-deaths') || '0', 10) + 1; lset('adv-deaths', String(n));
    out('**YOU HAVE DIED.** Type ((undo|undo)) to take back your last move, ((restart|restart)) to start over, or ((load|load)) to reload your save.', 'adv-bad');
    var s = snd(); if (s.on) s.tone(200, 40, .5, 'sawtooth', .07);
  }

  /* ═════════════════════════ ENGINE: parser ═════════════════════════ */
  var DIRS = { n: 'north', north: 'north', s: 'south', south: 'south', e: 'east', east: 'east', w: 'west', west: 'west', u: 'up', up: 'up', d: 'down', down: 'down' };
  var SYN = {};
  function syn(v, list) { list.split(' ').forEach(function (w) { SYN[w] = v; }); }
  syn('look', 'look l'); syn('examine', 'examine x inspect study view watch observe check describe'); syn('take', 'take get grab steal carry hold'); syn('drop', 'drop discard toss throw');
  syn('inventory', 'inventory i inv items'); syn('go', 'go walk run head'); syn('open', 'open unlock'); syn('close', 'close shut'); syn('read', 'read'); syn('use', 'use apply activate operate');
  syn('push', 'push shove move shift press slide'); syn('pull', 'pull drag yank lift tug'); syn('turn', 'turn rotate twist flip'); syn('search', 'search rummage dig'); syn('talk', 'talk speak chat converse');
  syn('ask', 'ask tell question'); syn('give', 'give hand offer feed'); syn('put', 'put place insert plug stick'); syn('load', 'load'); syn('unload', 'unload'); syn('type', 'type enter input dial punch key');
  syn('wait', 'wait z rest'); syn('hit', 'hit kick punch attack kill smash break destroy'); syn('eat', 'eat consume swallow bite'); syn('drink', 'drink sip'); syn('smell', 'smell sniff'); syn('listen', 'listen hear');
  syn('jump', 'jump leap vault'); syn('climb', 'climb'); syn('touch', 'touch feel lick taste poke tap'); syn('strike', 'strike cross scratch redline mark cut delete'); syn('point', 'point aim shine zap');
  syn('fight', 'fight shoot battle duel'); syn('debug', 'debug explain rubberduck'); syn('show', 'show display present'); syn('become', 'become embrace join'); syn('send', 'send launch dispatch'); syn('say', 'say shout yell whisper');
  syn('hint', 'hint hints clue help-me stuck'); syn('map', 'map'); syn('score', 'score points rank'); syn('save', 'save'); syn('undo', 'undo'); syn('restart', 'restart reset-game'); syn('quit', 'quit exit q');
  syn('help', 'help ? commands'); syn('about', 'about credits'); syn('endings', 'endings'); syn('status', 'status'); syn('sing', 'sing'); syn('dance', 'dance'); syn('swear', 'swear curse'); syn('pray', 'pray'); syn('think', 'think ponder');
  syn('sleep', 'sleep nap'); syn('xyzzy', 'xyzzy plugh'); syn('sudo', 'sudo'); syn('hello', 'hello hi hey hiya'); syn('yes', 'yes y yeah'); syn('no', 'no nope'); syn('continue', 'continue'); syn('reset', 'reset');
  var PRE = [[/^pick up (.+)$/, 'take $1'], [/^pick (.+) up$/, 'take $1'], [/^put down (.+)$/, 'drop $1'], [/^look (?:at|on) (.+)$/, 'examine $1'], [/^look (?:in|inside|into|under|behind|through) (.+)$/, 'search $1'], [/^look (?:around|about)$/, 'look'],
    [/^(?:talk|speak) (?:to|with) (.+)$/, 'talk $1'], [/^(?:go|walk|run|head) (?:to |into |through |toward |towards )?(.+)$/, 'go $1'], [/^turn (?:on|off) (.+)$/, 'use $1'], [/^switch (?:on|off) (.+)$/, 'use $1'],
    [/^get (.+) from (.+)$/, 'take $1 from $2'], [/^cross out (.+)$/, 'strike $1'], [/^climb (?:up|down) (.+)$/, 'climb $1'], [/^(?:new game|new)$/, 'newgame'], [/^load game$/, 'load'], [/^(?:what|where|who) (?:is|are) (.+)$/, 'examine $1'],
    [/^wait for (.+)$/, 'wait'], [/^explain (.+) to (.+)$/, 'debug $2'], [/^show (?:the )?badge.*$/, 'show badge'], [/^talk (.+) about (.+)$/, 'ask $1 about $2'], [/^say hello$/, 'hello']];
  var PREPS = ['in', 'into', 'inside', 'on', 'onto', 'with', 'at', 'to', 'from', 'under', 'behind', 'about', 'for', 'off', 'against'];
  function norm(s) { s = s.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9 \-?]/g, ' ').replace(/\s+/g, ' ').trim(); s = s.replace(/\b(the|an?)\b/g, ' ').replace(/\s+/g, ' ').trim(); return s; }
  function parse(raw) {
    var t = norm(raw); if (!t) return null; PRE.forEach(function (p) { t = t.replace(p[0], p[1]); });
    if (t === 'newgame') return { verb: 'newgame', p1: '', p2: '', raw: t };
    var toks = t.split(' '), v = toks[0], rest = toks.slice(1);
    if (DIRS[v] && !rest.length) return { verb: 'go', p1: DIRS[v], p2: '', raw: t };
    var verb = SYN[v]; if (!verb) return { verb: null, word: v, raw: t };
    var c = { verb: verb, p1: '', p2: '', prep: '', raw: t, v: v, rest: rest.join(' '), topic: '' };
    if ((verb === 'ask' || verb === 'talk') && rest.indexOf('about') > 0) { var ai = rest.indexOf('about'); c.p1 = rest.slice(0, ai).join(' '); c.topic = rest.slice(ai + 1).join(' '); return c; }
    var idx = -1, i; for (i = 1; i < rest.length; i++) if (PREPS.indexOf(rest[i]) > -1) { idx = i; break; }
    if (idx > -1) { c.p1 = rest.slice(0, idx).join(' '); c.prep = rest[idx]; c.p2 = rest.slice(idx + 1).join(' '); } else c.p1 = rest.join(' ');
    return c;
  }
  function score1(o, p) { var s = 0, pw = p.split(' '); o.names.forEach(function (n) { if (n === p) { s = Math.max(s, 3); return; } var nw = n.split(' '); if (pw.every(function (w) { return nw.indexOf(w) > -1; })) s = Math.max(s, pw.length === nw.length ? 3 : 2); }); return s; }
  function bestIn(list, p) { var best = 0, res = []; list.forEach(function (id) { var s = score1(OBJS[id], p); if (s > best) { best = s; res = [id]; } else if (s === best && s > 0) res.push(id); }); return res; }
  function resolve(p, prefInv, notHeld) {
    if (!p) return { empty: true }; if (p.charAt(0) === '#') return { id: p.slice(1) };
    if (/^(it|them|that|this|him|her)$/.test(p)) return st.last && visible(st.last) ? { id: st.last } : { none: true };
    var vis = OBJ_ORDER.filter(visible), tries = [p]; if (/s$/.test(p)) tries.push(p.slice(0, -1));
    for (var k = 0; notHeld && k < tries.length; k++) { var nh = bestIn(vis.filter(function (i) { return !has(i); }), tries[k]); if (nh.length === 1) return { id: nh[0] }; if (nh.length > 1) return { amb: nh }; }
    for (k = 0; k < tries.length; k++) {
      if (prefInv) { var r1 = bestIn(vis.filter(has), tries[k]); if (r1.length === 1) return { id: r1[0] }; }
      var r = bestIn(vis, tries[k]); if (r.length === 1) return { id: r[0] }; if (r.length > 1) { var pref = r.filter(function (i) { return OBJS[i].takeable; }); if (pref.length === 1 && !prefInv && false) return { id: pref[0] }; return { amb: r }; }
    }
    return { none: true };
  }
  function need(c, slot, prompt, prefInv) {
    var p = c[slot], r = resolve(p, prefInv, c.verb === 'take' && slot === 'p1');
    if (r.empty) { say(prompt); NOTICK = true; return null; }
    if (r.none) { say("You don't see any \"" + p + '" here.'); NOTICK = true; return null; }
    if (r.amb) { AMB = { c: JSON.parse(JSON.stringify(c)), slot: slot, opts: r.amb }; say('Which do you mean: ' + r.amb.map(function (i) { return the(i); }).join(' or ') + '?'); NOTICK = true; return null; }
    st.last = r.id; return r.id;
  }
  function ensureHeld(id) {
    if (has(id)) return true; var o = OBJS[id]; if (!o.takeable) { say("You can't pick up " + the(id) + '.'); return false; }
    if (o.take && o.take() === false) return false; moveTo(id, 'inv'); sys('(first taking ' + the(id) + ')'); if (o.taken) o.taken(); return true;
  }
  function descText(o) { return typeof o.d === 'function' ? o.d() : o.d; }
  function examine(id) {
    var o = OBJS[id]; st.last = id; say(descText(o));
    if (o.container && isOpen(id)) { var cs = contents(id); if (cs.length && !o.transparent) say('Inside: ' + cs.map(function (i) { return '[[' + nm(i) + ']]'; }).join(', ') + '.'); else if (!cs.length && o.openable) say('It is empty.'); }
    if (o.examined) o.examined();
  }
  function takeIt(id) {
    var o = OBJS[id]; if (has(id)) { say('You already have ' + the(id) + '.'); NOTICK = true; return; }
    if (!o.takeable) { say(o.takeMsg || "You can't take " + the(id) + '.'); NOTICK = true; return; }
    if (o.take && o.take() === false) return; moveTo(id, 'inv'); say('Taken: [[' + nm(id) + ']].'); if (o.taken) o.taken();
  }

  /* ═════════════════════════ ENGINE: verbs ═════════════════════════ */
  var VF = {};
  VF.look = function (c) { if (c.p1) return VF.examine(c); lookRoom(); };
  VF.examine = function (c) { if (!c.p1) { say('Examine what?'); NOTICK = true; return; } if (/^(me|self|myself|yourself|runner)$/.test(c.p1)) { say('You are a runner: slightly damp, moderately brave, carrying ' + (invIds().length ? invIds().length + ' item' + (invIds().length > 1 ? 's' : '') : 'nothing but ambition') + '. Likeness: acceptable.'); NOTICK = true; return; } var id = need(c, 'p1', 'Examine what?'); if (id) examine(id); };
  VF.read = function (c) {
    var id = need(c, 'p1', 'Read what?'); if (!id) return; var o = OBJS[id]; st.last = id;
    if (o.read) { var t = typeof o.read === 'function' ? o.read() : o.read; say(t); if (o.examined) o.examined(); } else if (o.d) examine(id); else say('There is nothing to read.'); };
  VF.take = function (c) {
    if (/^(all|everything)$/.test(c.p1)) { var l = OBJ_ORDER.filter(function (i) { return st.loc[i] === st.room && OBJS[i].takeable; }); if (!l.length) { say('There is nothing here to take.'); NOTICK = true; return; } l.forEach(takeIt); return; }
    var id = need(c, 'p1', 'Take what?'); if (id) takeIt(id); };
  VF.drop = function (c) {
    if (/^(all|everything)$/.test(c.p1)) { invIds().forEach(function (i) { moveTo(i, st.room); }); say('You drop everything.'); return; }
    var id = need(c, 'p1', 'Drop what?', true); if (!id) return; if (!has(id)) { say("You aren't carrying that."); NOTICK = true; return; } moveTo(id, st.room); say('Dropped.'); };
  VF.inventory = function () { var l = invIds(); say(l.length ? 'You are carrying: ' + l.map(function (i) { return '[[' + nm(i) + ']]'; }).join(', ') + '.' : 'You are carrying nothing but ambition.'); };
  function exitByName(p) { var r = ROOMS[st.room], best = null; ['north', 'south', 'east', 'west', 'up', 'down'].forEach(function (d) { if (!r.exits[d] || !exitVisible(st.room, d)) return; var n = ROOMS[exitTo(st.room, d)].name.toLowerCase(); if (p && n.indexOf(p) > -1) best = d; }); return best; }
  VF.go = function (c) {
    var p = c.p1; if (!p) { say('Go where?'); NOTICK = true; return; } if (DIRS[p]) { go(DIRS[p]); return; }
    var byName = exitByName(p); if (byName) { go(byName); return; }
    var r = resolve(p); if (r.id && OBJS[r.id].enter) { OBJS[r.id].enter(); return; } say("You can't go there."); NOTICK = true; };
  VF.open = function (c) {
    var id = need(c, 'p1', 'Open what?'); if (!id) return; var o = OBJS[id]; if (o.open && o.open() === true) return;
    if (!o.openable) { say("You can't open that."); NOTICK = true; return; } if (st.lock[id]) { say(o.lockedMsg || "It's locked."); return; } if (st.op[id]) { say("It's already open."); return; }
    st.op[id] = true; var cs = contents(id); say('You open ' + the(id) + '.' + (cs.length ? ' Inside: ' + cs.map(function (i) { return '[[' + nm(i) + ']]'; }).join(', ') + '.' : ' It is empty.')); };
  VF.close = function (c) { var id = need(c, 'p1', 'Close what?'); if (!id) return; var o = OBJS[id]; if (!o.openable) { say("You can't close that."); return; } if (!st.op[id]) { say("It's already closed."); return; } st.op[id] = false; say('You close ' + the(id) + '.'); };
  function useOn(a, b) {
    var A = OBJS[a], B = OBJS[b]; if (A.use && A.use(b) === true) return; if (B.recv && B.recv(a) === true) return; if (B.put && B.put(a) === true) return;
    say('Using ' + the(a) + ' on ' + the(b) + " doesn't seem to do anything."); }
  VF.use = function (c) {
    if (inCoreFrag(c)) return; var a = need(c, 'p1', 'Use what?', true); if (!a) return; if (c.p2) { var b = need(c, 'p2', 'On what?'); if (!b) return; if (!has(a) && !OBJS[a].scenery && !ensureHeld(a)) return; return useOn(a, b); }
    var A = OBJS[a]; if (A.use && A.use() === true) return; if (A.enter && A.scenery) { A.enter(); return; } say("You're not sure how to use that on its own. Try ((use X on Y|use X on Y)).", NOTICK = true); };
  function motion(name, c) { var id = need(c, 'p1', c.v.charAt(0).toUpperCase() + c.v.slice(1) + ' what?'); if (!id) return; var o = OBJS[id]; var fn = o[name] || o.move || (name === 'turn' && o.push); if (fn && fn.call(o) === true) return; if (fn) return; say('Nothing obvious happens.'); }
  VF.push = function (c) { motion('push', c); }; VF.pull = function (c) { motion('pull', c); }; VF.turn = function (c) { motion('turn', c); };
  VF.search = function (c) {
    if (!c.p1) { say('You look around carefully. Nothing new reveals itself.'); return; } var id = need(c, 'p1', 'Search what?'); if (!id) return; var o = OBJS[id];
    if (o.search) { o.search(); return; } if (o.container) { if (o.openable && !st.op[id]) { if (st.lock[id]) { say("It's locked."); return; } st.op[id] = true; } var cs = contents(id); say(cs.length ? 'You find: ' + cs.map(function (i) { return '[[' + nm(i) + ']]'; }).join(', ') + '.' : 'It is empty.'); return; }
    say('You search ' + the(id) + ' and find nothing of interest.'); };
  VF.talk = function (c) { var id = need(c, 'p1', 'Talk to whom?'); if (!id) return; var o = OBJS[id]; if (o.talk) { o.talk(c.topic || ''); return; } say('You talk to ' + the(id) + '. It makes no reply, which is the correct response.'); };
  VF.ask = function (c) { if (!c.p1) { say('Ask whom?'); NOTICK = true; return; } VF.talk(c); };
  VF.give = function (c) {
    var a = need(c, 'p1', 'Give what?', true); if (!a) return; if (!c.p2) { say('Give it to whom?'); NOTICK = true; return; } var b = need(c, 'p2', 'To whom?'); if (!b) return; if (!ensureHeld(a)) return;
    var B = OBJS[b]; if (B.give && B.give(a) === true) return; if (B.recv && B.recv(a) === true) return; say(the(b) + " doesn't seem interested."); };
  VF.put = function (c) {
    if (inCoreFrag(c)) return; var a = need(c, 'p1', 'Put what?', true); if (!a) return; if (!c.p2) { say('Put it where?'); NOTICK = true; return; } var b = need(c, 'p2', 'Where?'); if (!b) return; if (a === b) { say('That would be quite a trick.'); return; }
    if (!ensureHeld(a)) return; var B = OBJS[b]; if (B.put && B.put(a) === true) return; if (B.recv && B.recv(a) === true) return;
    if (B.container && isOpen(b)) { moveTo(a, 'in:' + b); say('You put ' + the(a) + ' in ' + the(b) + '.'); return; } say("You can't put that there."); };
  VF.load = function (c) { if (!c.p1 || /^(game|save)$/.test(c.p1)) return VF.loadgame(); if (!visible('cart')) { say('There is nothing to load that onto here.'); NOTICK = true; return; } c.p2 = 'cart'; return VF.put(c); };
  VF.unload = function (c) { var id = need(c, 'p1', 'Unload what?'); if (!id) return; if (st.loc[id] !== 'in:cart') { say('That is not on the cart.'); return; } moveTo(id, 'inv'); say('You take ' + the(id) + ' off the cart. ' + cartStatus()); };
  VF.send = function (c) { if (!visible('cart')) { say('There is nothing to send here.'); NOTICK = true; return; } sendCart(); };
  VF.type = function (c) {
    var code = c.p1.replace(/\s+/g, '').toLowerCase(); if (!code && !c.p2) { say('Enter what? A code, a word, a door?'); NOTICK = true; return; }
    if (c.p2) { var t = need(c, 'p2', 'Enter it where?'); if (!t) return; if (OBJS[t].enter) { OBJS[t].enter(code); return; } say("That doesn't take input."); return; }
    var r = resolve(c.p1); if (r.id && OBJS[r.id].enter && !/^\d+$/.test(code) && code.length > 5) { OBJS[r.id].enter(); return; }
    var tgt = OBJ_ORDER.filter(visible).filter(function (i) { return OBJS[i].enter && OBJS[i].scenery && /keypad|console/.test(OBJS[i].names.join(' ')); })[0];
    if (r.id && OBJS[r.id].enter && !tgt) { OBJS[r.id].enter(); return; }
    if (tgt) { OBJS[tgt].enter(code); return; } if (r.id && OBJS[r.id].enter) { OBJS[r.id].enter(); return; } say("There's nothing here that takes a code."); NOTICK = true; };
  VF.wait = function () { say(st.room === 'roof' ? 'You wait, watching the traffic.' : 'Time passes.'); };
  VF.hit = function (c) { var id = need(c, 'p1', 'Hit what?'); if (!id) return; var o = OBJS[id]; if (o.hit && o.hit() === true) return; say(pick(['Violence is rarely the answer. (It is sometimes the answer. Not here.)', 'You give it a stern look instead.'])); };
  VF.eat = function (c) { var id = need(c, 'p1', 'Eat what?'); if (!id) return; var o = OBJS[id]; if (o.eat && o.eat() === true) return; say(OBJS[id].takeable ? 'You are not hungry enough for that.' : "That's not food."); };
  VF.drink = function (c) { var id = need(c, 'p1', 'Drink what?'); if (!id) return; var o = OBJS[id]; if (o.drink && o.drink() === true) return; say("You can't drink that."); };
  VF.smell = function () { say(ROOMS[st.room].smell || 'It smells of ozone, dust and mild bureaucracy.'); }; VF.listen = function () { say(ROOMS[st.room].listen || 'The Archive hums quietly to itself.'); };
  VF.jump = function (c) { var j = OBJ_ORDER.filter(visible).filter(function (i) { return OBJS[i].jump; })[0]; if (j) { OBJS[j].jump(); return; } say('You jump on the spot. Nothing changes. You feel briefly silly.'); };
  VF.climb = function (c) { var p = c.p1; if (/ladder|hatch/.test(p) && st.room === 'cellar') { go('up'); return; } if (/stair|door/.test(p) && st.room === 'atrium') { go('up'); return; } if (/ladder|trapdoor/.test(p) && st.room === 'lobby' && st.op.trapdoor) { go('down'); return; } say('There is nothing to climb here.'); NOTICK = true; };
  VF.touch = function (c) { var id = need(c, 'p1', 'Touch what?'); if (!id) return; var o = OBJS[id]; if (o.touch && o.touch() === true) return; say('You touch ' + the(id) + '. Nothing dramatic happens.'); };
  VF.strike = function (c) { var id = need(c, 'p1', 'Strike what?'); if (!id) return; var o = OBJS[id]; if (o.strike) { o.strike(); return; } if (id === 'pen' || id === 'display') { OBJS.display.strike(); return; } say("You can't strike that out."); };
  VF.point = function (c) {
    var a = need(c, 'p1', 'Point what?', true); if (!a) return; if (!c.p2) { say('Point it at what?'); NOTICK = true; return; } var b = need(c, 'p2', 'At what?'); if (!b) return; if (!ensureHeld(a)) return;
    var A = OBJS[a]; if (A.point) { A.point(b); return; } say('You point ' + the(a) + ' at ' + the(b) + '. Nothing happens.'); };
  VF.say = function (c) { var t = c.rest; if (/^(xyzzy|plugh)$/.test(t)) return VF.xyzzy(); say(t ? 'You say "' + t + '" to the room. The room does not reply. The [[neural eye]] might, though.' : 'You clear your throat. Nobody is impressed.'); };
  VF.hello = function () { say(pick(['Hello.', 'You greet the room warmly. The room remains an object.'])); }; VF.sing = function () { say('You sing a few bars. The kiosk adds a laugh track that you did not ask for.'); };
  VF.dance = function () { say('You dance. The neon flickers in time. Somewhere, the Neural Link does a little wiggle and pretends it did not.'); }; VF.swear = function () { say('Language! The Neural Link covers its (single) ear.'); };
  VF.pray = function () { say('You pray to the gods of backups. A faint chime answers: ##BACKUP COMPLETE.## You feel inexplicably better.'); }; VF.think = function () { say('You think hard. The thought: "if in doubt, explain it to the duck." Hm.'); };
  VF.sleep = function () { say('You curl up for a nap. The corruption does not care. Wake up, runner.'); }; VF.xyzzy = function () { say('A hollow voice says "FOOL." Wrong game. (Also: wrong century.)'); };
  VF.sudo = function () { say('Permission denied. Nice try. You are not in the sudoers file. Nobody is. The file is empty.'); };
  VF.status = function () { if (ov) ov.classList.toggle('adv-showside'); NOTICK = true; }; VF.map = VF.status;
  VF.about = function () { say('**THE MEMO ARCHIVE** — a text adventure in six revisions.\nA love letter to Zork, bureaucracy, and the phrase "the latest revision wins".\nFive endings. Many deaths. One duck.'); };
  VF.help = function () { say('**COMMANDS**\n Move: ((n|n)) ((s|s)) ((e|e)) ((w|w)) ((u|u)) ((d|d)) — or "go to atrium"\n Look: ((look|look)) · examine X · read X · search X · ((inventory|i))\n Act: take/drop X · open X · use X on Y · put X in Y · give X to Y · push/pull X · talk to X · ask X about Y · enter CODE\n Meta: ((hint|hint)) · ((score|score)) · ((undo|undo)) · ((save|save)) · ((load|load)) · ((restart|restart)) · ((endings|endings)) · ((quit|quit))\n\n__Tips: click any highlighted word to examine it; double-click to take it. Tab completes. Up/Down recalls history. The corruption meter rises with every move; restoring fragments pushes it back. Rule 3 of the Archive is good advice.__'); };
  VF.score = function () { say('Score: **' + st.score + '** / ' + MAXSCORE + '  —  rank: ##' + rank(st.score) + '##\nMoves: ' + st.moves + '   Corruption: ' + st.corr + '%   Fragments: ' + fragsAll() + '/6'); };
  VF.endings = function () {
    var f = JSON.parse(lget('adv-endings') || '[]'), t = '**ENDINGS FOUND: ' + f.length + '/5**\n'; Object.keys(ENDINGS).forEach(function (k) { t += ' ' + (f.indexOf(k) > -1 ? '%%✔ ' + ENDINGS[k].title + '%%' : '__??? (undiscovered)__') + '\n'; }); say(t);
    say('Best score: ' + (lget('adv-best') || 0) + '   Deaths: ' + (lget('adv-deaths') || 0)); };
  VF.hint = function () { doHint(); };
  VF.save = function () { if (st.dead || st.done) { say("There is nothing worth saving right now."); return; } save(true); say('Game saved. (The game also autosaves after every move.)'); }; VF.loadgame = function () { var s = loadSave(MANUAL_KEY) || loadSave(); if (!s) { say('No saved game found.'); return; } st = s; UNDO = []; AMB = null; say('Game loaded.'); lookRoom(); };
  VF.undo = function () { if (!UNDO.length) { say('Nothing to undo.'); return; } st = JSON.parse(UNDO.pop()); AMB = null; say('(you take it back)'); lookRoom(); };
  VF.restart = function () { st.confirm = 'restart'; say('!!Restart the whole game?!! (yes / no)'); }; VF.quit = function () { st.confirm = 'quit'; say('!!Leave the Archive?!! (yes / no)'); };
  VF.yes = function () { say('That was not a question. But enthusiasm noted.'); }; VF.no = function () { say('Fair enough.'); }; VF.reset = function () { if (st.room === 'server') { OBJS.lever.pull(); } else say('Reset what?'); };
  VF.newgame = function () { newGame(); }; VF.continue = function () { say('(there is nothing to continue.)'); };
  /* — endgame verbs — */
  var KPWAKE = `You press the six fragments into the sockets one by one — blue, red, gold, green, violet, white. The pillar drinks the light, hums, then sings. The whole Core shudders. The static on the colossal screen collapses inward into a **face**: vast, cracked and grinning, made of error messages and blinking cursors.\n\n**KERNEL PANIC:** "FRAGMENTS. HOW QUAINT. YOU COLLECTED MY MEMORIES AND THINK THAT WILL STOP ME?"\n\nThe pillar blazes. Whatever happens next is up to you. You could ((fight|FIGHT)) it. You could ((talk screen|talk to it)). Or you could try something... cleverer.`;
  function inCoreFrag(c) {
    if (!/^(fragments?|shards?|all|everything|all fragments|the fragments)$/.test(c.p1)) return false;
    if (st.room !== 'core') { say(c.p1 === 'all' || c.p1 === 'everything' ? 'Put all of what, where?' : 'There is nothing here to put the fragments into. The sockets are in the Core, down the lift.'); NOTICK = true; return true; }
    insertAll(); return true; }
  function insertAll() {
    if (st.f.kpAwake) { say('The sockets are already full and blazing.'); return; } var h = fragIds().filter(has);
    if (h.length < 6) { say('You hold ' + h.length + ' fragment' + (h.length === 1 ? '' : 's') + ' against the sockets. The pillar flickers, but it needs all six. (' + h.length + '/6)'); return; }
    h.forEach(function (i) { moveTo(i, 'nowhere'); st.insd[i] = 1; }); st.f.kpAwake = 1; award('core', 10); say(KPWAKE); }
  VF.fight = function () {
    if (st.room !== 'core' || !st.f.kpAwake) { say(st.room === 'core' ? 'The Glitch is not yet awake. Perhaps the pillar needs something first.' : 'There is nothing to fight here. (The glitch is waiting in the Core.)'); NOTICK = true; return; }
    say('!!The screen cracks open. KERNEL PANIC roars. The glitch invaders pour out!!\n__(this is a real fight: defend the Archive. press Esc in the game to retreat.)__'); NOTICK = true;
    setTimeout(function () { if (FX.boss) FX.boss(); }, 800); };
  VF.debug = function () {
    if (st.room !== 'core' || !st.f.kpAwake) { if (has('duck')) { OBJS.duck.talk(); } else say('You have no one to explain things to. (Rule 3 suggests a duck.)'); return; }
    if (!has('duck')) { say('You begin to explain the problem, but there is no duck. Rule 3 is very clear about this. You need a listener who does not interrupt.'); return; }
    if (st.insight < 4) { say('You set the duck down and open your mouth... and realise you do not yet understand the problem. Gather more insight first: ((examine the fragments|the fragments hold the answers)). (' + st.insight + '/4 insights)'); return; }
    ending('B'); };
  VF.show = function (c) {
    if (/badge/.test(c.p1) || /badge/.test(c.raw)) { if (st.room !== 'core' || !st.f.kpAwake) { say('Nobody here to show it to.'); return; }
      if (lget('boss-beaten') === '1') { ending('A', true); return; } say('You pat your pockets for a BOSS SLAYER badge. You do not have one. (Yet. Defeat the glitch king in the arcade fight, or here.)'); return; }
    say('There is nobody here who needs convincing.'); };
  VF.become = function () {
    if (st.room !== 'core' || !st.f.kpAwake) { say('Become what? There is nothing here to join. Yet.'); return; }
    if (!has('shard')) { say('You reach toward the glitch, but there is nothing to bind you to it. A corrupted piece might help. (Maybe there is one somewhere dark and buggy.)'); return; } ending('D'); };

  /* ═════════════════════════ endings ═════════════════════════ */
  var ENDINGS = {
    A: { title: 'TRUE PURGE', bonus: 25, text: function (viaBadge) { return (viaBadge ? `You hold up your BOSS SLAYER badge. It catches the light of the pillar. KERNEL PANIC's cursors freeze. "...YOU. THE ONE WHO DID IT BEFORE." The glitch king remembers. It does not want to do that again. It shrinks, crackles and unravels into a rain of harmless pixels.\n\n` : `You hold the line. Wave after wave of error messages break against your ship, and finally the glitch king's last scream is a single, enormous "SEGMENTATION FAULT" — and the whole Core goes white.\n\n`) + `When your eyes recover, the screen is dark. The pillar hums, steady and calm. Across the Archive, six memos relight in order: the ORIGINAL, its two AMENDMENTS, the second memo and its SUPPLEMENT, and the WORKBOOK — each consistent with the last. The latest revision wins, as it should.\n\n◉ From the wall of the Lobby, the Neural Link opens its eye. "...well. that was extremely cool. i will deny saying that."`; }, tag: 'THE GLITCH IS PURGED. THE ARCHIVE IS SAFE.' },
    B: { title: 'DEBUGGED', bonus: 34, text: function () { return `You set the rubber duck on the pillar, facing the screen, and begin.\n\n"Okay," you say. "Let me explain the problem." And you do — line by line, fragment by fragment. The ORIGINAL said stop at N. AMENDMENT 1 changed the order. AMENDMENT 2 changed the count. The SUPPLEMENT supplied what the original forgot... but nobody told the loop. The first version is only ever a draft. Corrections are not admissions of failure. The latest revision wins, but only if someone tells the rest.\n\nKERNEL PANIC's cursors stop blinking. "...off by one," it whispers. "THE EXIT CONDITION. IT WAS ALWAYS OFF BY ONE."\n\n"Return zero," you say gently. "You're allowed to stop."\n\nFor the first time in its entire existence, KERNEL PANIC *exits*. Politely. The static clears. The pillar hums. Somewhere, a very small screen reads: ##PROCESS COMPLETE (0).## It stays on as the Archive's night watchman: KERNEL PANIC (RETIRED).\n\n◉ "i cannot believe the duck did it," says the Neural Link. "i am furious. i love the duck."`; }, tag: 'THE GLITCH IS AT PEACE. THE ARCHIVE IS WHOLE. THE DUCK IS A HERO.' },
    C: { title: 'FACTORY RESET', bonus: 0, text: function () { return `You haul the red lever down. The Archive lets out a long, dying sigh. Every memo — every ORIGINAL, every AMENDMENT, every SUPPLEMENT — blinks and vanishes. The fans spin down. The neon goes out. KERNEL PANIC goes with it, deleted by default.\n\nYou stand in a silent, clean Lobby. The kiosk reboots: **WELCOME TO INDEX-OS. THERE ARE NO MEMOS. PLEASE TAKE A NUMBER.**\n\n◉ The Neural Link's eye flickers on, brand new. "...well. that is one way to fix it."`; }, tag: 'THE GLITCH IS GONE. SO IS EVERYTHING ELSE.' },
    D: { title: 'THE NEW GLITCH KING', bonus: 15, text: function () { return `You raise the red shard. It sings, cold and bright. KERNEL PANIC's vast face tilts, and for a moment looks almost... pleased. "YOU UNDERSTAND," it says. "THE LOOP IS BEAUTIFUL."\n\nYou step toward the screen. The shard dissolves in your hand and flows up your arm in lines of red static. Your thoughts fragment, reorder, and — surprisingly — feel fine. Across the Archive, the memos rewrite themselves in your voice. Every revision is the latest. Every amendment is yours.\n\nYou are the new KERNEL PANIC. It is, honestly, surprisingly relaxing.\n\n◉ "i am going to need a new runner," says the Neural Link, from very far away.`; }, tag: 'ALL HAIL THE NEW GLITCH KING.' },
    E: { title: 'ARCHIVE LOST', bonus: 0, text: function () { return `The corruption reaches one hundred percent. The memos dissolve into static, one by one: first the AMENDMENTS, then the ORIGINALS, then even the SUPPLEMENTS. The lights fail. The rain keeps falling on the sealed doors, but nobody is left to hear it.\n\nThe last thing you see is the Neural Link's eye, dim and sorry. "...i should have said hurry up sooner."\n\n__(Tip: solving puzzles reduces corruption, and the clock is generous. Try again — you'll be faster.)__`; }, tag: 'THE ARCHIVE IS LOST.' }
  };
  function ending(id, via) {
    var e = ENDINGS[id]; st.score += e.bonus; st.done = true; st.dead = false; st.f.ending = id; delayIdx = 0;
    out('', ''); out(' ★ ★ ★   E N D I N G   ★ ★ ★ ', 'adv-room'); out('**' + e.title + '**', 'adv-room'); say(e.text(via)); out('!!' + e.tag + '!!', 'adv-score');
    var f = JSON.parse(lget('adv-endings') || '[]'); if (f.indexOf(id) === -1) f.push(id); lset('adv-endings', JSON.stringify(f)); var best = parseInt(lget('adv-best') || '0', 10); if (st.score > best) lset('adv-best', String(st.score));
    say('\nFinal score: **' + st.score + '** / ' + MAXSCORE + '  —  rank: ##' + rank(st.score) + '##   ·   moves: ' + st.moves + '   ·   endings found: ' + f.length + '/5');
    out('((restart|PLAY AGAIN))    ((endings|ENDINGS))    ((quit|EXIT))', 'adv-sysl'); try { localStorage.removeItem(SAVE_KEY); } catch (er) {}
    if (id === 'D' && FX.secrets && FX.secrets.rainbow) setTimeout(function () { FX.secrets.rainbow(); }, 800);
    var s = snd(); if (s.on) { s.tone(520, 0, .15, 'triangle', .07); s.tone(780, 0, .2, 'triangle', .07, .15); s.tone(1040, 0, .35, 'triangle', .07, .32); }
    FX.advEnded = { id: id, score: st.score }; renderSide();
  }
  FX.onBossEnd = function (lg) {
    if (!running || !st || st.room !== 'core' || !st.f.kpAwake || st.done) return; if (inpEl) inpEl.focus();
    if (lg && lg.win) { ending('A'); } else if (lg && !lg.win) { delayIdx = 0; bad('The glitch king throws you back. The fight is lost, for now — but the pillar still blazes. You could ((fight|try again)), or find a cleverer way.'); }
    else { delayIdx = 0; say('You back away from the screen. The glitch waits, patient as a bug report.'); } renderSide(); };

  /* ═════════════════════════ hints ═════════════════════════ */
  function got(n) { return has('frag' + n) || st.insd['frag' + n]; }
  var OBJECTIVES = [
    { id: 'eye', done: function () { return st.aw.eye; }, rel: function () { return true; }, rooms: ['lobby'], h: ['there is an eye on the Lobby wall. it seems to want to talk to you. (talk to the eye)'] },
    { id: 'frag1', done: function () { return got(1); }, rel: function () { return st.visited.vault1; }, rooms: ['vault1', 'annex1b', 'annex1c', 'hall1'], h: ['the cabinet in the Original Vault wants a four-digit code. paper clues are lying around the Memo 01 wing.', 'there are three notes: the Vault notice, the Annex 1 note, and the Annex 2 note. apply them in order. the latest amendment wins.', 'original code 4172 -> swap the last two digits (4127) -> replace the first digit with the number of revisions on the plaque (3). so: 3127.'] },
    { id: 'frag2', done: function () { return got(2); }, rel: function () { return st.visited.annex1b; }, rooms: ['annex1b', 'annex1c'], h: ['the wall display in Amendment 1 Annex shows a clearly wrong clause.', 'you need something red to strike out the offending word. try the annex next door.', 'take the red pen from Annex 2, then: strike late (or use pen on display).'] },
    { id: 'frag3', done: function () { return got(3); }, rel: function () { return st.visited.annex1c; }, rooms: ['annex1c', 'annex1b', 'vault1'], h: ['the machine in Annex 2 has three numbered slots.', 'three tokens exist: one in the Vault, one in Annex 1, one hidden in Annex 2. look at the timestamps on their rims.', 'insert them oldest first: original token, then amendment 1, then amendment 2. (search the desk in Annex 2 for the third.)'] },
    { id: 'frag4', done: function () { return got(4); }, rel: function () { return st.visited.bench2 || st.visited.bay2; }, rooms: ['bench2', 'bay2', 'lobby', 'hall2'], h: ['the workbench in Memo 02 has an empty gear socket.', 'the Supplement Bay supplies missing parts, but its dispenser wants a coin.', 'search the Lobby couch for a coin, put it in the dispenser, then put the gear in the workbench socket.'] },
    { id: 'term', done: function () { return st.f.serverOpen; }, rel: function () { return st.visited.term; }, rooms: ['term', 'atrium'], h: ['the terminal wants a five-letter password.', 'read the sticky notes. operation ___light. what is left glowing after a fire?', 'EMBER. (type: enter ember)'] },
    { id: 'frag5', done: function () { return got(5); }, rel: function () { return st.visited.floor3; }, rooms: ['floor3', 'server'], h: ['CRUDY-1 is out of power. the chalkboard lists the cart rules.', 'a battery pack sits in the Server Room, which is unlocked from the Terminal Room.', 'give the battery to CRUDY-1, then load parts: weight must be at most 5 and value at least 7. try coil + relay, or chip + lens. then send the cart.'] },
    { id: 'frag6', done: function () { return got(6); }, rel: function () { return st.visited.atrium; }, rooms: ['atrium', 'roof', 'term'], h: ['the stairs door has a keypad. the Atrium window shows a pattern in the traffic.', 'the cars pass cyan, magenta, yellow, purple. the code is the first letter of each: C M Y P.', 'on the roof, point a laser pointer (Terminal Room desk drawer) at each car in order, when it is overhead. use wait to let the right car pass.'] },
    { id: 'core', done: function () { return st.f.kpAwake; }, rel: function () { return fragsAll() >= 6; }, rooms: ['server', 'core'], h: ['you have all six fragments. the lift in the Server Room goes down to the Core.', 'in the Core, insert the fragments into the pillar.'] },
    { id: 'end', done: function () { return st.done; }, rel: function () { return st.f.kpAwake; }, rooms: ['core'], h: ['you can fight KERNEL PANIC, or you can be cleverer. rule 3 of the Archive is good advice.', 'a rubber duck (cellar, under the lobby rug) and enough insight from the fragments can end this peacefully. try: debug.', 'fight uses the real arcade game. there is also a way to join the glitch, if you found something red and corrupted. and a lever you really should not pull.'] }
  ];
  function doHint() {
    var cands = OBJECTIVES.filter(function (o) { return !o.done() && o.rel(); }), pickO = cands.filter(function (o) { return o.rooms.indexOf(st.room) > -1; })[0] || cands[0];
    if (!pickO) { lk('i have nothing for you. explore. open things. the lobby has more secrets than it admits.'); return; }
    var lvl = st.hl[pickO.id] || 0, txt = pickO.h[Math.min(lvl, pickO.h.length - 1)]; st.hl[pickO.id] = Math.min(lvl + 1, pickO.h.length - 1);
    if (FX.mood && FX.mood() === 'unhinged' && Math.random() < .3) lk('no. figure it out. (kidding.)'); lk(txt + (lvl >= pickO.h.length - 1 ? ' (that is all i have on this one.)' : ' (type hint again for more.)'));
  }

  /* ═════════════════════════ run loop, save, start/quit ═════════════════════════ */
  var FREE = { look: 1, examine: 1, read: 1, inventory: 1, hint: 1, score: 1, map: 1, help: 1, save: 1, loadgame: 1, load: 0, undo: 1, restart: 1, quit: 1, about: 1, endings: 1, status: 1, yes: 1, no: 1, newgame: 1, continue: 1 };
  function save(explicit) { if (!st || st.dead || st.done) return false; try { localStorage.setItem(explicit ? MANUAL_KEY : SAVE_KEY, JSON.stringify(st)); return true; } catch (e) { return false; } }
  function loadSave(key) { try { var s = JSON.parse(localStorage.getItem(key || SAVE_KEY)); if (s && s.room && s.loc && s.ver === 1) return s; } catch (e) {} return null; }
  function confirmAct(id) { if (id === 'restart') newGame(); else if (id === 'quit') closeAdv(); else if (id === 'reset') ending('C'); }
  function run(line) {
    if (!running) return; delayIdx = 0; var raw = String(line || '').trim(); if (!raw) return; out('> ' + raw, 'adv-cmd');
    if (!started) { var n = norm(raw); if (/^(continue|c|load)$/.test(n)) { var s = loadSave(); if (s) { st = s; started = true; say('Game loaded.'); lookRoom(); renderSide(); } else newGame(); } else if (/^(new|new game|n|newgame)$/.test(n)) newGame(); else say('Type ((continue|CONTINUE)) or ((new game|NEW GAME)).'); return; }
    if (st.confirm) { var cn = norm(raw), id = st.confirm; if (/^(y|yes)$/.test(cn)) { st.confirm = null; confirmAct(id); renderSide(); return; } if (/^(n|no)$/.test(cn)) { st.confirm = null; say('Cancelled.'); return; } st.confirm = null; }
    if (AMB) { var an = norm(raw); var hit = bestIn(AMB.opts, an); if (hit.length === 1) { var c2 = AMB.c; c2[AMB.slot] = '#' + hit[0]; AMB = null; return exec(c2, raw); } AMB = null; }
    var c = parse(raw); if (!c) return; if (!c.verb) { say('I don\'t know the word "' + c.word + '". (Type ((help|help)) for commands.)'); var sn = snd(); if (sn.on) sn.tone(170, 120, .12, 'sawtooth', .04); return; }
    exec(c, raw);
  }
  function exec(c, raw) {
    if (st.done && ['restart', 'quit', 'help', 'score', 'endings', 'about', 'undo', 'newgame'].indexOf(c.verb) === -1) { say('The story is over. ((restart|PLAY AGAIN)) or ((quit|EXIT)).'); return; }
    if (st.dead && ['undo', 'restart', 'loadgame', 'load', 'quit', 'help', 'score', 'save', 'hint', 'endings', 'about', 'newgame'].indexOf(c.verb) === -1) { say('You are dead. ((undo|UNDO)), ((restart|RESTART)) or ((load|LOAD)).'); return; }
    var f = FREE[c.verb]; if (c.verb === 'load' && !(!c.p1 || /^(game|save)$/.test(c.p1))) f = 0; if (c.verb === 'load' && (!c.p1 || /^(game|save)$/.test(c.p1))) f = 1;
    var pushed = false; if (!f) { UNDO.push(JSON.stringify(st)); pushed = true; } if (UNDO.length > 40) UNDO.shift();
    NOTICK = false; var fn = VF[c.verb]; if (!fn) { say("I don't understand that."); return; }
    fn(c); if (pushed && NOTICK && !st.dead && !st.done) UNDO.pop();
    if (!f && !NOTICK && !st.dead && !st.done) tick(); if (c.verb === 'undo' || c.verb === 'loadgame') { /* no tick */ }
    renderSide(); save(); if (outEl) outEl.scrollTop = outEl.scrollHeight;
  }
  function newGame() {
    st = newState(); started = true; UNDO = []; AMB = null; delayIdx = 0; if (outEl) outEl.innerHTML = '';
    out('T H E   M E M O   A R C H I V E', 'adv-ttl'); out('a text adventure in six revisions', 'adv-sysl');
    say(`\nIt is 03:07 and the Archive is screaming.\n\nSomething called ##KERNEL PANIC## crawled out of a footnote and is rewriting every memo it can reach. The doors sealed behind you the moment you walked in. Somewhere in this building are six memo fragments — and the only place they work is the Core, where whatever is waking up is waiting.\n\nYou are a runner. You have a few pockets, a lot of nerve, and an eyeball on the wall that already seems to like you.\n\n__(click highlighted words to examine them · type__ ((help|help)) __any time · press__ ((hint|hint)) __when stuck · corruption rises with every move)__\n`);
    lookRoom(); renderSide(); save(); if (inpEl) inpEl.focus();
  }
  function startAdv(opts) {
    if (running) return; opts = opts || {}; running = true; FX.advActive = true; started = false; FX.closeTerm && FX.closeTerm(); var pw = document.querySelector('.pal-wrap.open'); if (pw) pw.classList.remove('open');
    var prev = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden'; startAdv._prev = prev; OUTLOG = []; buildUI();
    var saved = loadSave(); st = newState();
    if (saved && !opts.fresh && saved.moves > 0) { out('T H E   M E M O   A R C H I V E', 'adv-ttl'); say('A saved game was found: move ' + saved.moves + ', score ' + saved.score + '.\n((continue|CONTINUE))     ((new game|NEW GAME))'); renderSide(); }
    else newGame();
    if (inpEl) setTimeout(function () { inpEl.focus(); }, 60);
  }
  function closeAdv() {
    if (!running) return; var ended = FX.advEnded; ov.remove(); ov = null; outEl = inpEl = sideEl = chipsEl = null; running = false; FX.advActive = false; document.documentElement.style.overflow = startAdv._prev || ''; FX.advEnded = null;
    if (ended && FX.say) setTimeout(function () { FX.say({ A: 'you actually purged the glitch. in a text adventure. i am proud of you and slightly scared.', B: 'the duck did it. i am telling everyone.', C: 'you pulled the lever. we do not talk about the lever.', D: 'oh no. you are the glitch now. i will keep an eye on you. (i have one.)', E: 'the archive was lost. we will do better next time. you will do better.' }[ended.id] || 'welcome back.', true); }, 600);
  }
  FX.adventure = startAdv;
  FX._adv = { run: function (l) { var n = OUTLOG.length; run(l); return OUTLOG.slice(n).join('\n'); }, st: function () { return st; }, close: closeAdv, log: function () { return OUTLOG; } };
  FX.advStats = function () { var f = JSON.parse(lget('adv-endings') || '[]'); return { endings: f.length, best: parseInt(lget('adv-best') || '0', 10), deaths: parseInt(lget('adv-deaths') || '0', 10) }; };
  var cmds = FX.cmds || {}, P = function (t, c) { FX.print && FX.print(t, c); };
  cmds.adventure = function () { P('loading THE MEMO ARCHIVE...'); setTimeout(function () { startAdv(); }, 350); }; cmds.adv = cmds.zork = cmds.quest = cmds.adventure;
  FX.helpExtra = (FX.helpExtra || []).concat(['  adventure | zork    play THE MEMO ARCHIVE (text adventure)']);
  var sec = FX.secrets || {}; sec.adventure = function () { startAdv(); }; sec.zork = function () { FX.toast && FX.toast('// WRONG GAME. (THE GRUE IS ON VACATION.) LOADING THE RIGHT ONE.'); setTimeout(startAdv, 900); }; sec.xyzzy = function () { FX.toast && FX.toast('// A HOLLOW VOICE SAYS "FOOL." ...BUT HERE IS AN ADVENTURE.'); setTimeout(startAdv, 900); };
  document.addEventListener('click', function (e) { var p = e.target.closest && e.target.closest('.pill[data-fx=adv]'); if (p) startAdv(); });
})();
