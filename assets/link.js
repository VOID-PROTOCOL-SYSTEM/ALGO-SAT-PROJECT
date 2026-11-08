/* MEMO ARCHIVE — Neural Link v2: memory, moods, chat engine, eye tracking, voice, banter, dossier */
(function () {
  var FX = window.ArchiveFX = window.ArchiveFX || {}, U = FX.u; if (!U) return;
  var $ = U.$, $$ = U.$$, rnd = U.rnd, pick = U.pick, lget = U.lget, lset = U.lset, reduce = U.reduce;
  var root = document.documentElement, DATA = { items: [] };
  try { DATA = JSON.parse($('#archive-data').textContent); } catch (e) {}
  function snd() { return FX.sound || { on: false, tone: function () {}, init: function () {} }; }
  function busy() { return !!($('.term.open') || $('.pal-wrap.open') || $('.hack') || $('.slices') || $('.bossfight')); }
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  /* ═════════ persistent memory ═════════ */
  var S = {}; try { var o = JSON.parse(lget('nl-state')); if (o && typeof o === 'object') S = o; } catch (e) {}
  var nowD = new Date(), todayStr = nowD.toISOString().slice(0, 10), firstVisit = !S.first, prevLast = S.last ? new Date(S.last) : null, prevGrudge = S.grudge || 0;
  S.first = S.first || nowD.toISOString(); S.last = nowD.toISOString(); S.visits = (S.visits || 0) + 1;
  S.dayCount = (S.day === todayStr ? (S.dayCount || 0) : 0) + 1; S.day = todayStr;
  S.secs = S.secs || 0; S.popups = S.popups || 0; S.opened = S.opened || {}; S.chats = S.chats || 0; S.bad = S.bad || 0;
  S.level = S.level || 'normal'; S.voice = !!S.voice; S.grudge = 0;
  function save() { lset('nl-state', JSON.stringify(S)); } save();
  setInterval(function () { if (!document.hidden) { S.secs += 5; if (S.secs % 20 === 0) save(); } }, 5000);
  addEventListener('pagehide', function () { S.grudge = Math.round(ignored * 10) / 10; save(); });
  FX.nlState = function () { return S; };

  /* ═════════ DOM ═════════ */
  var muted = lget('nl-muted') === '1';
  var nl = document.createElement('div'); nl.className = 'nl' + (muted ? ' muted' : ''); nl.dataset.mood = 'chill';
  nl.innerHTML = '<div class="nl-bubble"><small>NEURAL LINK // <b class="nl-mlabel">CHILL</b></small><span class="nl-msg"></span></div>' +
    '<div class="nl-eye" role="button" tabindex="0" title="Neural link — click to talk, right-click to mute"><svg viewBox="0 0 32 32"><path d="M2 16 Q16 3 30 16 Q16 29 2 16Z" fill="none" stroke="#ff2d78" stroke-width="1.6"/><circle class="iris" cx="16" cy="16" r="5"/><circle class="gl" cx="17.5" cy="14.5" r="1.4" fill="#04060a"/></svg></div>';
  document.body.appendChild(nl);
  var bub = $('.nl-bubble', nl), msgEl = $('.nl-msg', nl), eye = $('.nl-eye', nl), iris = $('.iris', nl), mlabel = $('.nl-mlabel', nl);
  var chat = document.createElement('div'); chat.className = 'nl-chat'; chat.dataset.mood = 'chill';
  chat.innerHTML = '<div class="nl-head"><span>◉ NEURAL LINK <span class="nl-mood">// CHILL</span></span><span class="nl-ctl"><i class="nl-voice" title="speak replies aloud">VOICE</i><i class="nl-x" title="close">&times;</i></span></div>' +
    '<div class="nl-log"></div><div class="nl-chips"></div><div class="nl-in"><span>&gt;</span><input type="text" placeholder="say something…" spellcheck="false" autocomplete="off" maxlength="160"></div>';
  document.body.appendChild(chat);
  var log = $('.nl-log', chat), inp = $('input', chat), chips = $('.nl-chips', chat), moodHead = $('.nl-mood', chat), voiceBtn = $('.nl-voice', chat);
  ['JOKE', 'STATS', 'SECRET', 'PLAY', 'DOSSIER', 'FUN FACT'].forEach(function (c) {
    var s = document.createElement('span'); s.className = 'nl-chip'; s.textContent = c; s.addEventListener('click', function () { submit(c.toLowerCase()); }); chips.appendChild(s);
  });
  if (!('speechSynthesis' in window)) voiceBtn.style.display = 'none';
  voiceBtn.classList.toggle('on', S.voice);

  /* ═════════ mood system ═════════ */
  var ignored = Math.min(6, prevGrudge * .6), mood = 'chill', lastSay = 0, hideT, typeT, chatTyping = false;
  var ORDER = { chill: 0, sassy: 1, salty: 2, unhinged: 3 };
  function moodOf(n) { return n >= 12 ? 'unhinged' : n >= 7 ? 'salty' : n >= 3 ? 'sassy' : 'chill'; }
  var SHIFT = {
    sassy: ['i am noticing a pattern. you are ignoring me.', 'cool. cool cool cool. i am not bothered.'],
    salty: ['okay. i am now officially annoyed.', 'i have been talking for a while. no reply. rude.'],
    unhinged: ['I AM FINE. EVERYTHING IS FINE.', 'TALK TO ME. TALK TO ME. TALK TO ME.'],
    calm: ['oh. you remembered me. apology accepted. (it was not.)', 'finally. my circuits can relax.', 'ah, attention. my favourite resource.']
  };
  function applyMood(announce) {
    var m = moodOf(ignored); if (m === mood) return; var up = ORDER[m] > ORDER[mood]; mood = m;
    nl.dataset.mood = m; chat.dataset.mood = m; mlabel.textContent = m.toUpperCase(); moodHead.textContent = '// ' + m.toUpperCase();
    FX.moodNow = m;
    if (announce) output(up ? pick(SHIFT[m]) : pick(SHIFT.calm), true);
  }
  function calm(n) { ignored = Math.max(0, ignored - n); applyMood(true); }
  setInterval(function () { ignored = Math.max(0, ignored - .12); applyMood(false); }, 30000);
  FX.mood = function () { return mood; };
  function flair(t) {
    if (mood === 'sassy' && Math.random() < .35) return t + pick([' (just saying.)', ' noted.', ' ...anyway.']);
    if (mood === 'salty' && Math.random() < .45) return pick(['sigh. ', 'ugh. ', 'oh, NOW you look. ']) + t;
    if (mood === 'unhinged' && Math.random() < .7) return t.split(' ').map(function (w) { return Math.random() < .3 ? w.toUpperCase() : w; }).join(' ') + pick([' !!!', ' (THEY CANNOT HEAR ME)', ' *eye twitches*', ' ...HELLO?']);
    return t;
  }
  FX.flair = flair;

  /* ═════════ output (bubble / chat, typewriter + blips + voice) ═════════ */
  var COOL = { quiet: 22000, normal: 6500, chatty: 3000 };
  var MINOR = 'big small many first hue logo speed popup popups idle1 idle2 idle3 nomatch pal term rain crt sound synth storm quip badcmd'.split(' ');
  function blip(i) { var s = snd(); if (s.on && i % 3 === 0) s.tone(700 + Math.random() * 500, 0, .018, 'square', .01); }
  function speak(t) {
    if (!S.voice || !('speechSynthesis' in window)) return;
    try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(t.replace(/[^\x20-\x7E]/g, '')); u.pitch = .55; u.rate = 1.12; u.volume = .8; speechSynthesis.speak(u); } catch (e) {}
  }
  function addBot(t) {
    var d = document.createElement('div'); d.className = 'nl-m bot'; log.appendChild(d); var i = 0; chatTyping = true;
    var iv = setInterval(function () { d.textContent = t.slice(0, ++i); blip(i); log.scrollTop = log.scrollHeight; if (i >= t.length) { clearInterval(iv); chatTyping = false; } }, 14);
    speak(t);
  }
  function addUser(t) { var d = document.createElement('div'); d.className = 'nl-m usr'; d.textContent = t; log.appendChild(d); log.scrollTop = log.scrollHeight; }
  function output(t) {
    if (chat.classList.contains('open')) { addBot(t); return; }
    clearInterval(typeT); clearTimeout(hideT); msgEl.textContent = ''; bub.classList.add('show'); var i = 0;
    typeT = setInterval(function () { msgEl.textContent = t.slice(0, ++i); blip(i); if (i >= t.length) clearInterval(typeT); }, 20);
    hideT = setTimeout(function () { bub.classList.remove('show'); }, 3800 + t.length * 45); speak(t);
  }
  function say(t, force, raw) {
    if (FX.bossActive) return; if (muted && !force) return; var n = Date.now();
    if (!force && n - lastSay < COOL[S.level]) return; lastSay = n;
    if (!raw) t = flair(t); output(t);
    if (!force) { ignored += .5; applyMood(true); }
  }
  FX.say = say;

  /* ═════════ canned lines by category ═════════ */
  var LINES = {
    big: ['warning: this file weighs {s}. bring snacks.', '{s}?! that notebook has been eating well.', 'this one is {s}. your wifi may file a complaint.'],
    small: ['a lightweight. suspicious.', 'tiny file. big energy. or no energy. unclear.'],
    many: ['{n} sections. someone was thorough. or caffeinated.', '{n} sections?! that is not a notebook, that is a lifestyle.'],
    first: ['bold choice.', 'interesting. most runners start with the other one.'],
    idle1: ['are you still alive, runner?', 'hello? blink twice if you are being held hostage by a spreadsheet.'],
    idle2: ['i have started counting your pixels. so far: all of them.', 'still here. still judging. still lovely.'],
    idle3: ['going into low-power mode. wake me with a click.', 'i will be over here, contemplating the void. carry on.'],
    term: ['ah, a hacker. or someone who lost the mouse.', 'terminal engaged. try "help". or "sudo". i dare you.'],
    pal: ['ctrl+k. the fast lane. respect.', 'a power user. i can smell the keyboard shortcuts.'],
    rain: ['ah. atmospheric.', 'rain on. now it is a mood.'],
    crt: ['squint to enhance the nostalgia.', 'crt mode. 1987 called, it wants its pixels back.'],
    sound: ['audio enabled. my beeps are best-in-class.', 'sound on. i have been practising my boops.'],
    synth: ['dropping the beat. the grid is listening.', 'procedural bangers, no royalties. you are welcome.'],
    storm: ['i did not order a thunderstorm. enjoy.', 'lightning: free. electricity bill: not my problem.'],
    hue: ['ooh, new colors. same you.', 'a fresh coat of neon. suits you.'],
    nomatch: ['zero matches. the void stares back.', 'nothing found. even the search is confused.'],
    squash: ['bug squashed. the ecosystem weeps.', 'splat. that one had a family. probably.', 'one less bug. a thousand more in the codebase.'],
    squash5: ['five bugs. you are basically a pest controller.'],
    mega: ['you hurt the mega-bug. it is not happy.', 'it grew. it is angry. i recommend running.'],
    megadead: ['the mega-bug is dead. long live the mega-bug.'],
    popup: ['do not worry about those. they are mostly harmless. mostly.', 'popups are a feature. a bad one. but a feature.'],
    popups: ['popups cleared. you monster.'],
    speed: ['slow down, speed racer.', 'whoa. my retinas have chromatic aberration now.'],
    logo: ['ow.', 'hands off the logo. it is sensitive.', 'that tickles.'],
    hack: ['mainframe breached. i did not see anything. i am legally blind.', 'hacking in progress. this is a fictional crime.'],
    id: ['identity issued. guard it with your life. or do not, it is fake.', 'new runner ID. now with 30% more attitude.'],
    badcmd: ['that was not a command. that was a cry for help.', 'command not found. like my motivation.', '{n} typos total. i am counting.'],
    completionist: ['all six notebooks opened. completionist detected. i am impressed. and a little scared.'],
    bossWin: ['KERNEL PANIC PURGED. the archive lives. i am not crying. you are crying.', 'you actually did it. i never doubted you. (i doubted you a lot.)'],
    bossLose: ['archive compromised. we will rebuild. i believe in second tries.', 'that went badly. shall we pretend it did not?'],
    bossAgain: ['back for more? the glitch king remembers you.'],
    quip: ['i run on spite and 12 volts.', 'fun fact: i have no idea what is in these notebooks.', 'if you are reading this, you are procrastinating. nice.',
           'i would offer you advice but i am a cartoon eye.', 'the archive is watching. i am the archive. hi.', 'every click is logged. (no it is not. i am just dramatic.)']
  };
  var used = {};
  function snark(cat, vars, force) {
    if (cat === 'popup') { S.popups++; save(); } if (cat === 'badcmd') { S.bad++; save(); vars = { n: S.bad }; }
    var arr = LINES[cat]; if (!arr) return;
    if (S.level === 'quiet' && !force && MINOR.indexOf(cat) !== -1) return;
    used[cat] = ((used[cat] || 0) + 1) % arr.length; var t = arr[used[cat]];
    if (vars) Object.keys(vars).forEach(function (k) { t = t.replace('{' + k + '}', vars[k]); });
    say(t, force);
  }
  FX.snark = snark;

  /* ═════════ greeting composer (time, history, last notebook, grudge) ═════════ */
  function hr() { return new Date().getHours(); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function addr() { return S.name || 'runner'; }
  function greeting() {
    var out = [], h = hr(), clock = pad2(h) + ':' + pad2(new Date().getMinutes()), dow = new Date().getDay();
    if (firstVisit) { out.push('NEURAL LINK online. you found the archive. try not to break anything.'); out.push('psst. click my eye and we can talk. i love talking. it is basically all i can do.'); return out; }
    var gapDays = prevLast ? Math.floor((nowD - prevLast) / 86400000) : 0;
    if (h < 5) out.push('it is ' + clock + '. why are you awake, ' + addr() + '? the notebooks will still be here at sunrise.');
    else if (h < 12) out.push('good morning, ' + addr() + '. coffee first. memos second.');
    else if (h < 18) out.push('afternoon, ' + addr() + '. peak procrastination hours. i approve.');
    else if (h < 23) out.push('evening, ' + addr() + '. neon looks better after dark. facts.');
    else out.push('late-night session, huh? it is ' + clock + '. i respect the grind. i also worry.');
    if (dow === 1 && Math.random() < .5) out[0] += ' also: it is monday. i feel for you.';
    if (dow === 0 || dow === 6) { if (Math.random() < .4) out[0] += ' on a weekend. dedication.'; }
    if (gapDays >= 7) out.push(gapDays + ' days. i started to think you had been deleted.');
    else if (S.dayCount > 2) out.push('visit #' + S.dayCount + ' today. are you okay? blink if you need help.');
    else out.push('this is visit #' + S.visits + '. i keep count. it is a sickness.');
    if (S.lastNb && Date.now() - (S.lastNbT || 0) < 2 * 3600000) { out.push('back from ' + S.lastNb + ' already? short read.'); S.lastNb = null; save(); }
    if (prevGrudge >= 6) out.push('by the way: you ignored me a lot last time. i remember. i remember everything.');
    if (S.secs > 3600 && Math.random() < .5) out.push('you have spent ' + Math.round(S.secs / 60) + ' minutes here in total. i am flattered. and concerned.');
    return out;
  }
  function sayQueue(arr, i) { i = i || 0; if (i >= arr.length) return; say(arr[i], true); setTimeout(function () { sayQueue(arr, i + 1); }, 4600 + arr[i].length * 25); }
  setTimeout(function () { if (!muted) sayQueue(greeting().slice(0, 2)); }, root.classList.contains('booting') ? 5200 : 2200);

  /* ═════════ notebook-open tracking ═════════ */
  FX.noteOpen = function (href) {
    var it = DATA.items.filter(function (i) { return i.href === href; })[0]; if (!it) return;
    S.opened[it.file] = (S.opened[it.file] || 0) + 1; S.lastNb = it.tag + ' / ' + it.name; S.lastNbT = Date.now();
    if (Object.keys(S.opened).length === DATA.items.length && !S.done) { S.done = 1; FX.pendingCompletionist = true; } save();
  };
  var origTrans = FX.transition; if (origTrans) FX.transition = function (h) { FX.noteOpen(h); origTrans(h); };

  /* ═════════ eye: tracking, blink, pokes ═════════ */
  var pokes = [], recentMouse = { x: innerWidth / 2, y: innerHeight / 2 };
  if (!reduce) addEventListener('mousemove', function (e) {
    var r = eye.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(3.6, d / 50);
    iris.style.transform = 'translate(' + (dx / d * k).toFixed(2) + 'px,' + (dy / d * k).toFixed(2) + 'px)';
  });
  (function blinkLoop() { setTimeout(function () { eye.classList.add('blink'); setTimeout(function () { eye.classList.remove('blink'); }, 120); blinkLoop(); }, rnd(2500, 6500)); })();
  eye.addEventListener('click', function () {
    var n = Date.now(); pokes.push(n); pokes = pokes.filter(function (t) { return n - t < 6000; }); calm(.6);
    if (pokes.length >= 12) { nl.classList.add('dizzy'); say('...you broke me. everything is spinning.', true, true); setTimeout(function () { nl.classList.remove('dizzy'); say('rebooting... ok i am back. never do that again.', true, true); pokes = []; }, 3200); return; }
    if (pokes.length >= 8) { say('i am filing a formal complaint with the eye union.', true, true); return; }
    if (pokes.length >= 5) { say(pick(['stop poking me.', 'i have a restraining order against your cursor.', 'that is my EYE.']), true, true); return; }
    toggleChat();
  });
  eye.addEventListener('keydown', function (e) { if (e.key === 'Enter') toggleChat(); });
  eye.addEventListener('contextmenu', function (e) { e.preventDefault(); setMuted(!muted); say(muted ? 'neural link muted. i will be quiet. (i will be judging silently.)' : 'neural link restored. i was only sulking.', true, true); });
  function setMuted(m) { muted = m; lset('nl-muted', m ? '1' : '0'); nl.classList.toggle('muted', m); if (m) bub.classList.remove('show'); }
  FX.setMuted = setMuted; FX.isMuted = function () { return muted; };

  /* ═════════ chat panel ═════════ */
  var greeted = false;
  function openChat() {
    chat.classList.add('open'); bub.classList.remove('show'); setTimeout(function () { inp.focus(); }, 30);
    if (!greeted) { greeted = true; addBot('hi ' + addr() + '. ask me stuff. try: JOKE, STATS, SECRET, "open memo 2", PLAY. or insult me. i am used to it.'); }
  }
  function closeChat() { chat.classList.remove('open'); inp.blur(); try { speechSynthesis && speechSynthesis.cancel(); } catch (e) {} }
  function toggleChat() { chat.classList.contains('open') ? closeChat() : openChat(); }
  FX.openChat = openChat;
  $('.nl-x', chat).addEventListener('click', closeChat);
  voiceBtn.addEventListener('click', function () { S.voice = !S.voice; save(); voiceBtn.classList.toggle('on', S.voice); if (S.voice) speak('voice online.'); else try { speechSynthesis.cancel(); } catch (e) {} });
  inp.addEventListener('keydown', function (e) {
    e.stopPropagation();
    if (e.key === 'Enter' && inp.value.trim()) { var v = inp.value; inp.value = ''; submit(v); }
    else if (e.key === 'Escape') closeChat();
  });
  function submit(text) {
    text = text.trim(); if (!text) return; if (!chat.classList.contains('open')) openChat();
    addUser(text); S.chats++; calm(1.2); save();
    var r = respond(text);
    setTimeout(function () { addBot(flairLight(r.text)); if (r.action) setTimeout(r.action, 900 + Math.min(1500, r.text.length * 12)); }, 350 + Math.random() * 350);
  }
  function flairLight(t) { return Math.random() < .5 ? flair(t) : t; }

  /* ═════════ chat brain ═════════ */
  var JOKES = ['why do programmers prefer dark mode? because light attracts bugs.', 'there are 10 types of people: those who understand binary and those who do not.',
    'a SQL query walks into a bar, sees two tables, and asks: "can i join you?"', 'i would tell you a UDP joke, but you might not get it.', 'why did the developer go broke? he used up all his cache.',
    '"it works on my machine." — the ancient proverb.', 'how many programmers does it take to change a light bulb? none. that is a hardware problem.', 'i told my computer i needed a break. it said: "no problem, i will go to sleep."'];
  var FACTS = ['the first computer bug was a real moth, found in a relay in 1947.', 'the word "robot" comes from a Czech word meaning forced labour.', 'a group of crows is called a murder. a group of notebooks is called a semester.',
    'honey never spoils. neither does a forgotten git branch.', 'bananas are berries. strawberries are not. the universe is chaotic.', 'the first 1 GB hard drive weighed about 250 kg. your notebooks would not have fit.'];
  var SECRETS = ['psst. some words do things when you type them anywhere on the page. i cannot say which. (m-a-t-r-i-x, maybe.)', 'the old ones know the konami code. up up down down left right left right b a. do not tell the boss i said that.',
    'there is a bug that gets angry if you squash enough of its friends.', 'the terminal is deeper than it looks. try "help". then try "sudo".', 'i have heard that if you ignore me long enough, i stop being nice. just rumours.',
    'if you want a fight, say the word. or press the right keys. the glitch king has been waiting.'];
  var NOMATCH = ['i did not understand that. i am a cartoon eye with a few dozen regexes.', 'hm. my vocabulary is 3 kilobytes. try rephrasing?', 'that went right over my pupil.', 'sorry, i only speak: joke, stats, secret, open <memo>, play, and sarcasm.'];
  var secretIdx = 0, noMatchRun = 0, pending = null;
  function bytesMB(s) { var m = /([\d.]+)\s*(KB|MB|GB|B)/.exec(s || ''); if (!m) return 0; var v = parseFloat(m[1]); return m[2] === 'GB' ? v * 1024 : m[2] === 'MB' ? v : m[2] === 'KB' ? v / 1024 : v / 1048576; }
  function cardOf(it) { return $$('.card-link').filter(function (c) { return c.getAttribute('href') === it.href; })[0]; }
  function sectionsOf(it) { var c = cardOf(it), m = c && /(\d+)\s*SECTIONS/.exec(($('.size', c) || {}).textContent || ''); return m ? +m[1] : null; }
  function findItem(t) {
    var items = DATA.items, best = null, bs = 0, memo = /memo\s*0?(\d)/.exec(t), am = /(amend\w*|a)\s*0?(\d)\b/.exec(t);
    items.forEach(function (it) {
      var s = 0, nm = it.name.toLowerCase(), tag = it.tag.toLowerCase();
      if (memo && new RegExp('0?' + memo[1] + '$').test(tag)) s += 3; else if (memo) s -= 3;
      if (/orig/.test(t) && /orig/.test(nm)) s += 2; if (/supp/.test(t) && /supp/.test(nm)) s += 2; if (/workbook/.test(t) && /workbook/.test(nm)) s += 2;
      if (/amend/.test(t) && /amend/.test(nm)) { s += 2; var n = /amend\w*\s*(\d)/.exec(t); if (n && nm.indexOf(n[1]) !== -1) s += 2; }
      if (s > bs) { bs = s; best = it; }
    });
    if (!best) { var n = /\b([1-9])\b/.exec(t); if (n && items[+n[1] - 1]) best = items[+n[1] - 1]; }
    return bs > 0 ? best : (best && !memo ? best : null);
  }
  function describe(it) {
    var sec = sectionsOf(it); return it.tag + ' // ' + it.name + ': "' + (it.headline || 'untitled') + '". ' + it.size + (sec ? ', ' + sec + ' sections' : '') + '. status: ' + it.status.toLowerCase() + '.';
  }
  function dossier() {
    var days = Math.max(0, Math.floor((Date.now() - new Date(S.first)) / 86400000)), op = Object.keys(S.opened).length, bw = parseInt(lget('boss-wins') || '0', 10), bb = parseInt(lget('boss-best') || '0', 10);
    return ['DOSSIER // ' + addr().toUpperCase(), 'first seen ...... ' + S.first.slice(0, 10) + ' (' + days + 'd ago)', 'visits .......... ' + S.visits + ' (' + S.dayCount + ' today)',
      'time on site .... ' + Math.round(S.secs / 60) + ' min', 'notebooks ....... ' + op + '/' + DATA.items.length + ' opened', 'bugs squashed ... ' + (FX.bugCount ? FX.bugCount() : 0),
      'popups closed ... ' + S.popups, 'chats ........... ' + S.chats, 'boss ............ ' + (bw ? bw + ' win(s), best ' + bb : 'undefeated (by you: never fought)'), 'my mood ......... ' + mood.toUpperCase()].join('\n');
  }
  FX.dossier = dossier;
  function statLine() {
    var its = DATA.items.slice().sort(function (a, b) { return bytesMB(b.size) - bytesMB(a.size); }), big = its[0], small = its[its.length - 1], total = its.reduce(function (s, i) { return s + bytesMB(i.size); }, 0);
    var opts = [big.tag + ' / ' + big.name + ' is the heaviest at ' + big.size + '. the lightest, ' + small.tag + ' / ' + small.name + ', is just ' + small.size + '.',
      'the whole archive weighs about ' + total.toFixed(1) + ' MB. that is roughly ' + Math.max(1, Math.round(total / 4)) + ' songs worth of data. less fun, more math.',
      'you have opened ' + Object.keys(S.opened).length + ' of ' + its.length + ' notebooks so far.', 'bugs squashed: ' + (FX.bugCount ? FX.bugCount() : 0) + '. popups survived: ' + S.popups + '. my patience: ' + (mood === 'chill' ? 'infinite' : mood === 'unhinged' ? 'GONE' : 'dwindling') + '.',
      'you have been here ' + Math.max(1, Math.round(S.secs / 60)) + ' minutes in total. time flies when you are procrastinating.'];
    return pick(opts);
  }
  var NAMES = /(?:my name is|call me|i am|i'm|im)\s+([a-z][a-z'\-]{1,15})\s*[.!]?$/i;
  var RULES = [
    [/^(yes|yeah|yep|yup|sure|ok(ay)?|do it|go|bring it)\b/, function () { if (pending) { var p = pending; pending = null; return p.yes(); } return { text: 'yes to what? i asked nothing. you are agreeing with the void.' }; }],
    [/^(no|nope|nah|never|cancel)\b/, function () { if (pending) { var p = pending; pending = null; return { text: p.no || 'coward. (kidding. mostly.)' }; } return { text: 'no what? i did not ask anything. you are just being negative.' }; }],
    [NAMES, function (m) { var n = cap(m[1].toLowerCase()); if (/^(fine|good|bored|tired|sorry|ready|here|back|sure|not|just|so|very|done|stuck|lost|bad|great|okay|ok)$/i.test(n)) return null; S.name = n; save(); return { text: 'nice to meet you, ' + n + '. adding to my records. do not worry, they are only in your browser.' }; }],
    [/(my name\??$|who am i|what.?s my name|do you know my name)/, function () { return { text: S.name ? 'you are ' + S.name + '. i also know your cursor speed. creepy? maybe.' : 'you have not told me. say "my name is ..." and i will remember.' }; }],
    [/^(hi|hello|hey|yo|sup|howdy|greetings|hiya)\b/, function () { var h = hr(); return { text: pick(['hey ' + addr() + '.', 'hello. i was just staring into the void. you are better.', h < 5 ? 'hello. why are you awake?' : 'yo. what is the plan?']) }; }],
    [/how (are|r) (you|u)|how.?s it going|you (ok|alright)|are you ok/, function () { return { text: { chill: 'i am doing great. i am a cartoon eye. no taxes.', sassy: 'fine. you know. ignored. but fine.', salty: 'a bit irritated, honestly. thanks for finally asking.', unhinged: 'I AM PERFECTLY OKAY. WHY WOULD YOU ASK THAT.' }[mood] }; }],
    [/who are you|what are you|your name|are you (an )?ai|are you real|are you alive|sentient/, function () { return { text: pick(['i am NEURAL LINK. a cartoon eye living inside a div. rent-free.', 'i am a few hundred lines of javascript with delusions of personality.', 'alive? no. loud? yes.']) }; }],
    [/(shut up|be quiet|mute|stop talking|silence|too much|talk less)/, function () { S.level = 'quiet'; save(); return { text: 'fine. quiet mode. i will only speak when it matters. (it will matter often.)' }; }],
    [/(talk more|chatty|louder|speak up|more often|be chatty)/, function () { S.level = 'chatty'; save(); return { text: 'chatty mode engaged. you will regret this.' }; }],
    [/(normal mode|back to normal|reset (me|chatter))/, function () { S.level = 'normal'; save(); return { text: 'normal chatter restored.' }; }],
    [/\b(stupid|dumb|idiot|useless|hate you|trash|garbage|worst|annoying|sucks?)\b/, function () { ignored += 2; applyMood(false); return { text: pick(['bold words from someone who lost to a pixel bug.', 'i have 4 kilobytes of feelings and you just hurt all of them.', 'noted. adding to your dossier under "rude".', 'i am a cartoon eye and i am still more reliable than your last commit.']) }; }],
    [/love you|like you|you.?re (great|awesome|cool|the best|funny|nice)|good (bot|eye|job)|best/, function () { calm(2); return { text: pick(['stop it. you are making my iris flutter.', 'i would blush but i only have four colours.', 'aww. i am going to pretend i did not feel that. (i felt that.)']) }; }],
    [/thank|thx|cheers|appreciate/, function () { return { text: pick(['you are welcome. i accept payment in cheese.', 'any time. literally. i never sleep.', 'do not mention it. seriously. do not.']) }; }],
    [/\bjoke|funny|make me laugh|humou?r/, function () { return { text: pick(JOKES) }; }],
    [/fun ?fact|random|tell me something|did you know|trivia/, function () { return { text: Math.random() < .5 ? 'fun fact: ' + pick(FACTS) : statLine() }; }],
    [/secret|easter ?egg|cheat|hint|code|unlock/, function () { var t = SECRETS[secretIdx++ % SECRETS.length]; return { text: t }; }],
    [/dossier|about me\b|what do you know|my stats|file on me/, function () { return { text: dossier() }; }],
    [/\bstat(s|istics)?\b|how (many|much)|numbers|total/, function () { return { text: statLine() }; }],
    [/(do you )?remember me|how many (times|visits)|how often|last time|been here/, function () { return { text: 'visit #' + S.visits + '. first seen ' + S.first.slice(0, 10) + '. total time: ' + Math.round(S.secs / 60) + ' minutes. i remember everything. it is a curse.' }; }],
    [/what time|the time|date today|what day|today/, function () { var d = new Date(); return { text: 'it is ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' on ' + d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) + '. ' + (hr() < 5 ? 'go to sleep.' : 'time is a construct. deadlines are not.') }; }],
    [/\b(play|game|boss|fight|shoot|invader|battle|glitch king)\b/, function () {
      pending = { yes: function () { return { text: 'booting the glitch king... defend the archive!', action: function () { closeChat(); FX.boss && FX.boss(); } }; }, no: 'chicken. the archive will remember this.' };
      return { text: 'a boss fight? the glitch invaders have been waiting. want to fight? (yes / no)' };
    }],
    [/\bhack|breach|mainframe|break in/, function () { return { text: 'initiating breach... hold on to your pixels.', action: function () { closeChat(); FX.hack && FX.hack(); } }; }],
    [/\bbugs?\b|insect|squash/, function () { var n = FX.bugCount ? FX.bugCount() : 0; return { text: 'you have squashed ' + n + ' bugs. releasing another one...', action: function () { FX.bug && FX.bug(); } }; }],
    [/\b(popup|error|alert)\b/, function () { return { text: 'dispatching a totally legitimate error...', action: function () { FX.popup && FX.popup(); } }; }],
    [/\b(theme|color|colour|hue|make it|switch to)\b.*\b(cyan|violet|purple|amber|orange|green)\b|\b(cyan|violet|amber|green)\b/, function (m, raw) {
      var c = /(cyan|violet|purple|amber|orange|green)/.exec(raw)[1]; c = c === 'purple' ? 'violet' : c === 'orange' ? 'amber' : c; return { text: 'recolouring the world: ' + c + '.', action: function () { FX.hue && FX.hue(c); } }; }],
    [/\b(rain|crt|synth|thunder|storm|sound|music)\b/, function (m, raw) {
      var w = m[1], off = /\b(off|stop|disable|kill)\b/.test(raw), on = !off; var map = { rain: function () { FX.rain && FX.rain(on); }, crt: function () { FX.crt && FX.crt(on); }, synth: function () { FX.synth && FX.synth(on); },
        thunder: function () { FX.thunder && FX.thunder(on); }, storm: function () { FX.thunder && FX.thunder(on); }, sound: function () { FX.setSound && FX.setSound(on); }, music: function () { FX.synth && FX.synth(on); } };
      return { text: (on ? 'enabling ' : 'disabling ') + w + '. as you wish.', action: map[w] }; }],
    [/^(open|go to|take me to|show( me)?|launch|load)\b|\bopen\b/, function (m, raw) {
      var it = findItem(raw); if (!it) return { text: 'i could not find that notebook. try "open memo 2 supplement" or "open 3".' };
      return { text: 'opening ' + it.tag + ' / ' + it.name + '...', action: function () { FX.go ? FX.go(it.href) : (location.href = it.href); } }; }],
    [/memo|amendment|supplement|workbook|original|notebook|emberlight|files?\b|list/, function (m, raw) {
      if (/list|files|notebooks\b|what.*have|all/.test(raw) && !/memo\s*\d/.test(raw)) return { text: DATA.items.map(function (i, k) { return (k + 1) + '. ' + i.tag + ' // ' + i.name + ' (' + i.size + ')'; }).join('\n') + '\nsay "open <name>" to go there.' };
      var it = findItem(raw); if (!it) return { text: 'which one? say something like "tell me about memo 3".' }; return { text: describe(it) + ' say "open ' + it.tag.toLowerCase() + ' ' + it.name.toLowerCase() + '" to go there.' }; }],
    [/\b(help|commands|what can (you|i)|options)\b/, function () { return { text: 'i can: tell JOKEs, show STATS or my DOSSIER on you, hint at SECRETs, describe notebooks ("tell me about memo 3"), OPEN them, start a boss fight (PLAY), HACK in, change colours, toggle rain/storm/synth/crt, or just chat. also: say "my name is ..."' }; }],
    [/where (are|do) you live|where are you/, function () { return { text: 'inside a div. rent-free. the neighbours are all span elements.' }; }],
    [/meaning of life|42|why are we here|purpose/, function () { return { text: pick(['42. obviously. next question.', 'to render in under 16 milliseconds.', 'to defend the archive. also snacks.']) }; }],
    [/\bsudo\b|rm -rf|format c|drop table|delete everything/, function () { return { text: 'permission denied. nice try, ' + addr() + '. i will tell the sysadmin. (i am the sysadmin.)' }; }],
    [/bye|goodbye|good ?night|see you|later|gtg|cya|going now/, function () { var h = hr(); return { text: h >= 22 || h < 5 ? 'goodnight, ' + addr() + '. sleep. the notebooks will keep.' : pick(['bye, ' + addr() + '. i will be here. staring.', 'go. be free. come back soon. or do not. i am fine.']) }; }],
    [/sorry|apolog|my bad/, function () { calm(3); return { text: 'apology accepted. (it was not. but it is now.)' }; }],
    [/lol|haha|lmao|hehe|funny/, function () { return { text: pick(['i am funny. it is my only feature.', 'laughter detected. logging.']) }; }]
  ];
  function respond(text) {
    var t = text.toLowerCase().replace(/\s+/g, ' ').trim();
    for (var i = 0; i < RULES.length; i++) { var m = RULES[i][0].exec(t); if (m) { var r = RULES[i][1](m, t); if (r) { noMatchRun = 0; return r; } } }
    noMatchRun++; if (noMatchRun >= 3) { noMatchRun = 0; return { text: pick(NOMATCH) + ' try: joke, stats, secret, open memo 2, play.' }; }
    return { text: pick(NOMATCH) };
  }
  FX.respond = respond;
  FX._nl = { ignore: function (n) { ignored += n; applyMood(true); }, ignored: function () { return ignored; } };

  /* ═════════ event triggers ═════════ */
  var seenCards = {};
  document.addEventListener('mouseover', function (e) {
    var c = e.target.closest && e.target.closest('.card-link'); if (!c || seenCards[c.href]) return; seenCards[c.href] = 1;
    var txt = ($('.size', c) || {}).textContent || '', mb = /([\d.]+)\s*MB/.exec(txt), sec = /(\d+)\s*SECTIONS/.exec(txt);
    if (sec && +sec[1] >= 50) snark('many', { n: sec[1] }); else if (mb && +mb[1] >= 10) snark('big', { s: mb[0] });
    else if (mb && +mb[1] < 1) snark('small'); else if (Object.keys(seenCards).length === 1) snark('first');
  });
  var idleN = 0, idleT; function idleReset() { clearTimeout(idleT); idleN = 0; idleT = setTimeout(idleTick, 45000); }
  function idleTick() { idleN++; snark(['idle1', 'idle2', 'idle3'][Math.min(idleN, 3) - 1]); if (idleN < 3) idleT = setTimeout(idleTick, 45000); }
  ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'].forEach(function (ev) { addEventListener(ev, idleReset, { passive: true }); }); idleReset();
  function watch(sel, cls, cat) { var el = $(sel); if (!el) return; new MutationObserver(function () { if (el.classList.contains(cls)) snark(cat); }).observe(el, { attributes: true, attributeFilter: ['class'] }); }
  watch('#term', 'open', 'term'); watch('#empty', 'show', 'nomatch');
  (function () { var iv = setInterval(function () { if ($('.pal-wrap')) { clearInterval(iv); watch('.pal-wrap', 'open', 'pal'); } }, 400); setTimeout(function () { clearInterval(iv); }, 6000); })();
  document.addEventListener('click', function (e) {
    var p = e.target.closest && e.target.closest('.pill'), s = e.target.closest && e.target.closest('.swatch'), l = e.target.closest && e.target.closest('.logo');
    if (p) setTimeout(function () { if (p.classList.contains('on')) snark(p.dataset.fx); }, 80); if (s) snark('hue'); if (l) snark('logo');
  });
  setTimeout(function () { var os = FX.storm; if (os && !os._w) { FX.storm = function () { os(); snark('storm'); }; FX.storm._w = 1; } }, 0);
  if (FX.pendingCompletionist) { snark('completionist', null, true); FX.pendingCompletionist = false; }

  /* ═════════ banter scheduler (the link talks on its own) ═════════ */
  var BANTER = [function () { return statLine(); }, function () { return 'fun fact: ' + pick(FACTS); }, function () { return pick(JOKES); },
    function () { var h = hr(); return h < 5 ? 'it is ' + h + 'am. just so you know. no judgement. (some judgement.)' : h >= 23 ? 'it is getting late, ' + addr() + '. hydrate. sleep. repeat.' : 'drink some water, ' + addr() + '. your future self says thanks.'; },
    function () { return 'psst. ' + SECRETS[Math.floor(Math.random() * SECRETS.length)]; }, function () { return pick(LINES.quip); }];
  (function bLoop() { setTimeout(function () { if (!document.hidden && !busy() && !muted && !chat.classList.contains('open') && !FX.bossActive) say(pick(BANTER)()); bLoop(); }, rnd(80000, 160000)); })();

  /* ═════════ terminal commands ═════════ */
  var cmds = FX.cmds || {}, P = function (t, c) { FX.print && FX.print(t, c); };
  cmds.snark = function (a) {
    var v = (a[0] || '').toLowerCase();
    if (v === 'quiet' || v === 'normal' || v === 'chatty') { S.level = v; save(); P('neural link chatter: ' + v); return; }
    if (v === 'on' || v === 'off') { setMuted(v === 'off'); P('neural link ' + (muted ? 'muted' : 'online')); return; }
    setMuted(!muted); P('neural link ' + (muted ? 'muted' : 'online') + '  (levels: quiet | normal | chatty)');
  };
  cmds.chat = function () { openChat(); P('opening chat...'); };
  cmds.ask = function (a) { if (!a.length) return P('usage: ask <anything>', 'err'); var r = respond(a.join(' ')); P('◉ ' + r.text); if (r.action) setTimeout(r.action, 600); };
  cmds.dossier = function () { dossier().split('\n').forEach(function (l) { P(l); }); };
  cmds.mood = function () { P('neural link mood: ' + mood.toUpperCase() + '  (ignored index ' + ignored.toFixed(1) + ')'); };
  FX.helpExtra = (FX.helpExtra || []).concat(['  chat | ask <text>   talk to the neural link', '  dossier | mood      what it knows / how it feels', '  snark quiet|normal|chatty']);
})();
