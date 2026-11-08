/* MEMO ARCHIVE — Neural Link v6: memory, moods, 11 personas, missions + ranks, roast battles, games, fortune, chaos, banter, dossier */
(function () {
  var FX = window.ArchiveFX = window.ArchiveFX || {}, U = FX.u; if (!U) return;
  var $ = U.$, $$ = U.$$, rnd = U.rnd, pick = U.pick, lget = U.lget, lset = U.lset, reduce = U.reduce;
  var root = document.documentElement, DATA = { items: [] };
  try { DATA = JSON.parse($('#archive-data').textContent); } catch (e) {}
  function snd() { return FX.sound || { on: false, tone: function () {}, init: function () {} }; }
  function busy() { return !!($('.term.open') || $('.pal-wrap.open') || $('.hack') || $('.slices') || $('.bossfight') || $('.adv')); }
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
  ['JOKE', 'ROAST', 'MISSION', 'BANTER', 'TAROT', 'TRIVIA', 'CHAOS', 'PERSONAS', 'DOSSIER', 'PLAY', 'SECRET', 'STATS'].forEach(function (c) {
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
  function addBot(t, raw) {
    if (!raw) t = persona(t);
    var d = document.createElement('div'); d.className = 'nl-m bot'; log.appendChild(d); var i = 0; chatTyping = true;
    var iv = setInterval(function () { d.textContent = t.slice(0, ++i); blip(i); log.scrollTop = log.scrollHeight; if (i >= t.length) { clearInterval(iv); chatTyping = false; } }, 14);
    speak(t);
  }
  function addUser(t) { var d = document.createElement('div'); d.className = 'nl-m usr'; d.textContent = t; log.appendChild(d); log.scrollTop = log.scrollHeight; }
  function output(t, noP) {
    if (chat.classList.contains('open')) { addBot(t, noP); return; }
    if (!noP) t = persona(t);
    clearInterval(typeT); clearTimeout(hideT); msgEl.textContent = ''; bub.classList.add('show'); var i = 0;
    typeT = setInterval(function () { msgEl.textContent = t.slice(0, ++i); blip(i); if (i >= t.length) clearInterval(typeT); }, 20);
    hideT = setTimeout(function () { bub.classList.remove('show'); }, 3800 + t.length * 45); speak(t);
  }
  function say(t, force, raw) {
    if (FX.bossActive || FX.advActive) return; if (muted && !force) return; var n = Date.now();
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
    if (!greeted) { greeted = true; addBot('hi ' + addr() + '. ask me stuff. try: JOKE, ROAST, MISSION, BANTER, TAROT, TRIVIA, CHAOS, PERSONAS, "open memo 2". or insult me. i am used to it.'); }
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
    deliver(r);
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
      'popups closed ... ' + S.popups, 'chats ........... ' + S.chats, 'boss ............ ' + (bw ? bw + ' win(s), best ' + bb : 'undefeated (by you: never fought)'), 'adventure ....... ' + (FX.advStats ? (FX.advStats().endings + '/5 endings, best ' + FX.advStats().best) : 'n/a'), 'my mood ......... ' + mood.toUpperCase()].join('\n');
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
    [/\b(adventure|text game|text adventure|explore|zork|interactive fiction)\b/, function () {
      pending = { yes: function () { return { text: 'opening the archive... mind the bugs. and the duck. especially the duck.', action: function () { closeChat(); FX.adventure && FX.adventure(); } }; }, no: 'fair. the archive will wait. it has nothing else to do.' };
      return { text: 'a text adventure through the archive itself! there is a robot, a duck, five endings and a lot of ways to die. want to play? (yes / no)' };
    }],
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
    [/\b(help|commands|what can (you|i)|options)\b/, function () { return { text: 'i can: JOKE, ROAST you, give you a MISSION (and a RANK), start a roast BANTER battle, read your TAROT / horoscope / fortune, quiz you with TRIVIA or a RIDDLE, SCAN you, rate things, pick between things, roll dice, tell a STORY or rap, switch PERSONAS (pirate, noir, villain, nan...), unleash CHAOS, show STATS / DOSSIER, OPEN notebooks, PLAY the boss fight, HACK, recolour, toggle rain/synth/crt. also: "my name is ...", "my favourite food is ...", "explain bfs".' }; }],
    [/where (are|do) you live|where are you/, function () { return { text: 'inside a div. rent-free. the neighbours are all span elements.' }; }],
    [/meaning of life|42|why are we here|purpose/, function () { return { text: pick(['42. obviously. next question.', 'to render in under 16 milliseconds.', 'to defend the archive. also snacks.']) }; }],
    [/\bsudo\b|rm -rf|format c|drop table|delete everything/, function () { return { text: 'permission denied. nice try, ' + addr() + '. i will tell the sysadmin. (i am the sysadmin.)' }; }],
    [/bye|goodbye|good ?night|see you|later|gtg|cya|going now/, function () { var h = hr(); return { text: h >= 22 || h < 5 ? 'goodnight, ' + addr() + '. sleep. the notebooks will keep.' : pick(['bye, ' + addr() + '. i will be here. staring.', 'go. be free. come back soon. or do not. i am fine.']) }; }],
    [/sorry|apolog|my bad/, function () { calm(3); return { text: 'apology accepted. (it was not. but it is now.)' }; }],
    [/lol|haha|lmao|hehe|funny/, function () { return { text: pick(['i am funny. it is my only feature.', 'laughter detected. logging.']) }; }]
  ];
  function respond(text) {
    var t = text.toLowerCase().replace(/\s+/g, ' ').trim();
    var pre = respondPlus(t); if (pre) { noMatchRun = 0; return pre; }
    for (var i = 0; i < RULES.length; i++) { var m = RULES[i][0].exec(t); if (m) { var r = RULES[i][1](m, t); if (r) { noMatchRun = 0; return r; } } }
    var tp = topicHit(t); if (tp) { noMatchRun = 0; return tp; }
    noMatchRun++; if (noMatchRun >= 3) { noMatchRun = 0; return { text: pick(NOMATCH) + ' try: joke, roast, mission, banter, tarot, trivia, chaos, personas, open memo 2.' }; }
    var sf = Math.random() < .8 ? smartFallback(t) : null; return sf || { text: pick(NOMATCH) };
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

  /* ═════════ v6 EXPANSION: personas, missions + rank, roast battles, games, fortune, chaos, smarter banter ═════════ */
  S.xp = S.xp || 0; S.persona = S.persona || 'default'; S.fav = S.fav || {}; S.mDone = S.mDone || 0; S.won = S.won || 0;
  MINOR.push('away', 'bottom', 'copy', 'resize', 'milestone', 'nb');
  var sess0 = Date.now(), game = null, battle = null, lastMission = '', lastUser = '', trivUsed = [];
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul ? Math.imul(h, 16777619) >>> 0 : (h * 16777619) >>> 0; } return h >>> 0; }
  function seeded(arr, s) { return arr[hash(s) % arr.length]; }
  function shuf(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function minor(t) { if (S.level === 'quiet') return; say(t); }
  function fill(t, v) { Object.keys(v || {}).forEach(function (k) { t = t.split('{' + k + '}').join(v[k]); }); return t; }
  var STOP = 'that this with have your what when where which about would could should there their they them then than from just like been were will into only some very much really because also does dont cant wont youre thats yeah okay'.split(' ');
  function longest(t) { var w = t.replace(/[^a-z0-9' ]/g, ' ').split(' ').filter(function (x) { return x.length > 3 && STOP.indexOf(x) === -1; }).sort(function (a, b) { return b.length - a.length; }); return w[0] || null; }
  function pad(label, val) { var l = label + ' '; while (l.length < 17) l += '.'; return l + ' ' + val; }

  /* ── personas (11 voices; applied on the way out) ── */
  var PERSONAS = {
    'default': { intro: 'back to normal. the classic cartoon eye. you missed me.' },
    bossy: { intro: 'ATTENTION. i am in charge now. you will do what i say, when i say it. ask for "orders" if you dare.', pre: ['LISTEN UP, ', 'attention. ', 'eyes front. ', 'at ease, ' ], suf: [' that is an order.', ' do it now.', ' no excuses.', ' move.', ' i do not repeat myself. (i repeat myself constantly.)', ' drop and give me twenty pixels.'] },
    noir: { intro: 'the name is neural link. i drink black coffee and read stack traces. this archive has secrets.', pre: ['the rain hit the archive like a bad merge. ', 'it was a dark night in the repo. ', 'you walked in. trouble always does. ', 'i have seen things in this codebase. '], suf: [' that is how it always starts.', ' the city never sleeps. neither does the cache.', ' trouble. i can smell it.', ' i lit a cigarette. it was a pixel.'] },
    pirate: { intro: 'arr! ye be speakin to the captain of this here archive. hoist the neon!', pre: ['arr, ', 'ahoy, ', 'yarr. ', 'avast! '], suf: [' arr.', ' matey.', ' (yo ho ho.)', ' shiver me timbers.', ' walk the plank.'], map: [[/\byou\b/g, 'ye'], [/\byour\b/g, 'yer'], [/\bhello\b/g, 'ahoy'], [/\byes\b/g, 'aye'], [/\bfriend\b/g, 'matey']] },
    bard: { intro: 'Hark! The eye doth speak in verse and bad puns henceforth. Prithee, proceed.', pre: ['Hark! ', 'Prithee, ', 'Forsooth, ', 'O! '], suf: [' Alas.', ' Verily.', ' Exeunt.', ' (aside: i am being dramatic.)', ' Thus endeth the lesson.'], map: [[/\byou are\b/g, 'thou art'], [/\byou\b/g, 'thee'], [/\byour\b/g, 'thy'], [/\bhello\b/g, 'well met'], [/\byes\b/g, 'aye']] },
    villain: { intro: 'at last. the mask comes off. mwahahaha. you are now in MY archive.', pre: ['mwahaha. ', 'excellent. ', 'behold. ', 'foolish runner. '], suf: [' all according to plan.', ' mwahahaha.', ' (dramatic organ music.)', ' you cannot stop me.', ' bow before the div.'] },
    gremlin: { intro: 'heh. heh heh. i chewed through three cables. hi.', pre: ['heh. ', 'ooh ooh. ', 'gremlin brain says: '], suf: [' *gnaws cable*', ' *knocks something off the desk*', ' heh heh heh.', ' (i did something to the wifi.)', ' *hisses at the cursor*'], low: true },
    zen: { intro: 'breathe. i have achieved inner peace. it took four kilobytes.', pre: ['breathe in. ', 'the archive is water. ', 'be the cursor. ', 'pause. '], suf: [' ...and exhale.', ' this too shall render.', ' (namaste.)', ' balance.', ' the bug is also the path.'] },
    hype: { intro: 'LET US GOOOOOO. I BELIEVE IN YOU. I BELIEVE IN EVERYONE. WE ARE UNSTOPPABLE.', pre: ['LET US GOOOO. ', 'YOOO. ', 'NO WAY. ', 'BIG ENERGY: '], suf: [' LET US GO!!!', ' absolute legend behaviour.', ' you are COOKING.', ' W.', ' main character energy.'] },
    nan: { intro: 'hello dear. i made biscuits. they are div elements, but they are made with love.', pre: ['oh sweetie, ', 'now now dear, ', 'bless your heart, '], suf: [' eat something.', ' have you had water, dear?', ' i knitted you a firewall.', ' wear a jumper.', ' you work too hard.'] },
    robot: { intro: 'BEEP. SARCASM MODULE: ONLINE. EMOTION MODULE: 404.', pre: ['BEEP BOOP. ', 'PROCESSING... ', 'AFFIRMATIVE. '], suf: [' END OF TRANSMISSION.', ' (I AM DEFINITELY A ROBOT.)', ' DOES NOT COMPUTE.', ' BEEP.'], up: true }
  };
  var PKEYS = Object.keys(PERSONAS);
  var PSYN = { bossy: /boss|drill|sergeant|commander|general/, noir: /noir|detective|hardboiled/, pirate: /pirate|captain|buccaneer/, bard: /shakespear|bard|olde|medieval|poet/, villain: /villain|evil|supervillain|bond/, gremlin: /gremlin|goblin|raccoon|feral/, zen: /zen|monk|calm|peaceful|guru/, hype: /hype|coach|cheerleader|motivat|hype ?man/, nan: /nan\b|nana|grandma|gran\b|grandmother|granny/, robot: /robot|machine|android|cyborg|bot\b/, 'default': /normal|default|classic|regular|reset|original|yourself/ };
  function persona(t) {
    var p = PERSONAS[S.persona]; if (!p || S.persona === 'default' || /\n/.test(t)) return t;
    (p.map || []).forEach(function (m) { t = t.replace(m[0], m[1]); });
    if (p.pre && Math.random() < .35 && t.length < 150) t = pick(p.pre) + t;
    if (p.suf && Math.random() < .45) t = t + pick(p.suf);
    if (p.up) t = t.toUpperCase(); if (p.low) t = t.toLowerCase();
    return t;
  }
  function setPersona(k) { S.persona = k; save(); FX.persona = k; return { text: PERSONAS[k].intro, raw: true }; }
  FX.setPersona = setPersona;

  /* ── xp + ranks + missions (the bossy part) ── */
  var RANKS = [[0, 'unpaid intern'], [40, 'script kiddie'], [100, 'bug botherer'], [180, 'neon apprentice'], [300, 'certified runner'], [480, 'archive warden'], [720, 'glitch slayer'], [1000, 'cyber overlord']];
  function rankOf(xp) { var r = RANKS[0]; RANKS.forEach(function (x) { if (xp >= x[0]) r = x; }); return r; }
  function nextRank(xp) { for (var i = 0; i < RANKS.length; i++) if (RANKS[i][0] > xp) return RANKS[i]; return null; }
  function gainXP(n) { var b = rankOf(S.xp)[1]; S.xp += n; var a = rankOf(S.xp)[1]; save(); return b !== a ? ' || PROMOTION: you are now a ' + a.toUpperCase() + '. do not let it go to your head. (let it. a little.)' : ''; }
  function rankLine() { var r = rankOf(S.xp), n = nextRank(S.xp), bar = ''; if (n) { var f = Math.round(10 * (S.xp - r[0]) / (n[0] - r[0])); for (var i = 0; i < 10; i++) bar += i < f ? '#' : '-'; }
    return 'rank: ' + r[1].toUpperCase() + ' // ' + S.xp + ' xp' + (n ? '\n[' + bar + '] ' + (n[0] - S.xp) + ' xp to ' + n[1].toUpperCase() : '\nmax rank. there is nowhere left to climb. touch grass.'); }
  function opens() { var n = 0; Object.keys(S.opened).forEach(function (k) { n += S.opened[k]; }); return n; }
  var CNT = { bugs: function () { return FX.bugCount ? FX.bugCount() : 0; }, popups: function () { return S.popups; }, chats: function () { return S.chats; }, opens: opens, secs: function () { return S.secs; }, boss: function () { return parseInt(lget('boss-wins') || '0', 10); }, honor: function () { return 0; } };
  var MISSIONS = [
    { id: 'bug3', k: 'bugs', n: 3, xp: 30, t: 'squash 3 bugs. they are crawling around this page. find them. end them.' },
    { id: 'bug5', k: 'bugs', n: 5, xp: 50, t: 'squash 5 bugs. i want a body count. i want it by sundown.' },
    { id: 'pop2', k: 'popups', n: 2, xp: 20, t: 'deal with 2 popups. summon them with "popup" if you are a coward.' },
    { id: 'open1', k: 'opens', n: 1, xp: 25, t: 'open any notebook and actually scroll through it. i will know. (i will not know.)' },
    { id: 'chat5', k: 'chats', n: 5, xp: 15, t: 'send me 5 messages. i am lonely and also need engagement metrics.' },
    { id: 'stay3', k: 'secs', n: 180, xp: 25, t: 'stay on this site 3 more minutes without ragequitting.' },
    { id: 'boss1', k: 'boss', n: 1, xp: 60, t: 'defeat the glitch king. say "play". glory awaits. so does a lot of dodging.' },
    { id: 'h1', k: 'honor', n: 1, xp: 10, t: 'drink a glass of water. real water. not coffee. i can tell the difference.' },
    { id: 'h2', k: 'honor', n: 1, xp: 10, t: 'stand up and stretch for 20 seconds. your spine is a legacy system. maintain it.' },
    { id: 'h3', k: 'honor', n: 1, xp: 10, t: 'tell me one thing you have been procrastinating on. say it out loud. then say "done".' },
    { id: 'h4', k: 'honor', n: 1, xp: 10, t: 'look at something 6 metres away for 20 seconds. your eyes are not as strong as mine. i am just an svg.' },
    { id: 'h5', k: 'honor', n: 1, xp: 10, t: 'fix your posture. i can see you slouching. (i cannot. but i can feel it.)' }
  ];
  function prog(m) { return Math.max(0, Math.min(m.n, CNT[m.k]() - S.mission.base)); }
  function curMission() { if (!S.mission) return null; return MISSIONS.filter(function (m) { return m.id === S.mission.id; })[0] || null; }
  function giveMission() { var m = pick(MISSIONS.filter(function (x) { return x.id !== lastMission; })); S.mission = { id: m.id, base: CNT[m.k](), at: Date.now() }; lastMission = m.id; save(); return m; }
  var NAG = ['i do not accept excuses. i accept results.', 'try again when you have earned it.', 'nope. keep going. i believe in you. a little.'];
  var PRAISE = ['outstanding. i am shocked. i am also lying: i knew.', 'mission complete. you may now bask.', 'excellent work, ' + 'runner. you are marginally less useless.', 'target neutralised. gold star. (it is a pixel.)'];
  function doneRule() {
    var m = curMission(); if (!m) return { text: 'done with what? you have no mission. say "mission" and i will fix that.' };
    if (m.k === 'honor') { if (Date.now() - S.mission.at < 8000) return { text: 'that was fast. suspiciously fast. give it a few seconds and try again. i am watching.' }; }
    else if (prog(m) < m.n) return { text: 'negative. progress: ' + prog(m) + '/' + m.n + '. ' + pick(NAG) };
    S.mission = null; S.mDone++; var promo = gainXP(m.xp); return { text: pick(PRAISE) + ' +' + m.xp + ' xp.' + promo };
  }

  /* ── roasts, compliments, battle ── */
  var ROASTS = ['you have the confidence of a developer who never ran the tests.', 'you name variables like pets you refuse to bond with. x. temp. temp2. final_final.', 'if procrastination were an olympic sport you would still be late to the podium.',
    'your browser has more tabs open than your life has plans.', 'you are the human equivalent of a for loop with no break statement.', 'your debugging strategy is to stare harder. bold. ineffective. bold.',
    'you commit with messages like "fix" and "fix2" and "fix final real". i have seen the log.', 'somewhere a unit test is crying because of you.', 'your time complexity is O(procrastination^2).',
    'you read documentation the way people read terms and conditions: scroll, scroll, accept.', 'i would insult your search algorithm, but you are clearly still on linear search.', 'a recursive function with no base case has more direction than your weekend.',
    'your code works on exactly one machine, and it is currently on fire.', 'you click things like the cursor owes you money.', 'you sigh at loading bars like they personally betrayed you. relatable. still dramatic.'];
  var ROAST_T = ['{x}? the audacity. the sheer unoptimised audacity.', '{x} runs like bubble sort on a million elements. slowly. painfully. with feelings.', '{x} has the energy of a loading bar stuck at 99%.',
    'i would roast {x}, but it would take O(n!) time and i have places to be.', '{x} is the kind of thing that works in the demo and explodes in production.', '{x} walked so that bugs could run.', 'critics describe {x} as "a choice". that is not a compliment.'];
  function statRoast() {
    var c = [], op = Object.keys(S.opened).length, n = DATA.items.length, h = hr(), bugs = CNT.bugs();
    if (S.visits > 4) c.push('visit #' + S.visits + '. you keep coming back like a bug that was never fixed.');
    if (S.secs > 900) c.push(Math.round(S.secs / 60) + ' minutes on this site. the archive has not changed. you have not changed. we are both stuck.');
    if (S.bad > 2) c.push(S.bad + ' mistyped terminal commands. the keyboard is not the problem, chief.');
    if (S.popups > 2) c.push('you have dealt with ' + S.popups + ' popups. you read terms and conditions the same way: not at all.');
    if (bugs > 3) c.push(bugs + ' bugs squashed. a one-person pest control service with no licence.');
    if (op === 0) c.push('zero notebooks opened. you came to a museum and stood in the gift shop.');
    if (op === n && n > 0) c.push('you opened every notebook. completionist. get a hobby. (i say this with love.)');
    if (S.chats > 10) c.push(S.chats + ' messages to a cartoon eye. i am flattered. you should be worried.');
    if (h < 5) c.push('it is ' + h + 'am and you are roasting a cartoon eye. you have problems. i am one of them.');
    if (S.mDone === 0 && S.chats > 3) c.push('zero missions completed. you take orders like a cat takes baths.');
    if (c.length && Math.random() < .65) return pick(c);
    return pick(ROASTS);
  }
  var NICE = ['you built an entire archive with a neon theme. that is either genius or a cry for help. possibly both. i love it.', 'honestly? you are doing better than your commit history suggests.',
    'your cursor movements are 12% more graceful than average. i measured. with an imaginary ruler.', 'sincere moment: the work in these notebooks is not nothing. i have seen it. i am proud. now do not tell anyone i said that.',
    'you debug with the focus of a monk and the vocabulary of a sailor. impressive.', 'you are the reason this archive has a pulse. a small one. like a sleeping hamster. but a pulse.', 'you showed up today. that already beats most people. low bar, high jump. well done.'];
  var COMEBACKS = ['oh, "{w}"? is that your best move? my toaster has better material.', 'you said "{w}" and somewhere a thesaurus fainted.', '"{w}"... i have felt more heat from a laptop in sleep mode.',
    'i have been insulted by professionals. "{w}" was written by an intern.', 'bold of you to say "{w}" with that browser history.', '"{w}"? i have 3 KB of insults and not one of them is that tired.',
    'wow. "{w}". my cache has evicted better burns.', 'i would reply to "{w}" but i do not fight unarmed opponents.', 'plot twist: i was holding back. "{w}" does not deserve my full cpu.', 'you came to a roast battle armed with "{w}"? respect the confidence. not the result.'];
  function battleHook(t) {
    if (/^(stop|quit|exit|enough|surrender|i give up|yield|end|mercy)\b/.test(t)) { battle = null; return { text: 'surrender accepted. victory: me. i will be insufferable about this for days.' }; }
    battle.round++; if (t.length > 24) battle.score++; if (/\b(you|your|youre|ur|u)\b/.test(t)) battle.score++; if (Math.random() < .15) battle.score++;
    if (battle.round >= 5) { var win = battle.score >= 6, promo = ''; battle = null; if (win) { promo = gainXP(15); S.won++; save(); }
      return { text: win ? 'final round. ...fine. you win. i demand a rematch. i am not crying, my iris is just leaking. +15 xp.' + promo : 'five rounds. flawless victory. frame this. you were brave. you were also wrong. +0 xp.' }; }
    return { text: fill(pick(COMEBACKS), { w: longest(t) || 'whatever that was' }) + ' (round ' + battle.round + '/5) your turn.' };
  }

  /* ── games: riddles + trivia ── */
  var RIDDLES = [
    { q: 'i have keys but no locks, space but no room, and you can enter but never leave. what am i?', re: /keyboard/, a: 'a keyboard', h: 'you are touching me right now.' },
    { q: 'what has a head and a tail but no body?', re: /\bcoin\b/, a: 'a coin', h: 'flip for it.' },
    { q: 'i speak without a mouth and hear without ears. i have no body but come alive with wind. what am i?', re: /echo/, a: 'an echo', h: 'shout into a canyon.' },
    { q: 'the more of me you take, the more you leave behind. what am i?', re: /footstep|steps?\b/, a: 'footsteps', h: 'walk it out.' },
    { q: 'i call myself until someone makes me stop. what am i?', re: /recurs|base case/, a: 'recursion (and the base case stops it)', h: 'to understand me, see: me.' },
    { q: 'i am O(1) on a good day, O(n) on a bad day, and i hate collisions. what am i?', re: /hash/, a: 'a hash table', h: 'i map keys to buckets.' },
    { q: 'i have cities but no houses, mountains but no trees, and water but no fish. what am i?', re: /\bmap\b/, a: 'a map', h: 'unfold me.' },
    { q: 'what gets wetter the more it dries?', re: /towel/, a: 'a towel', h: 'bathroom.' }
  ];
  var TRIVIA = [
    { q: 'worst-case time complexity of binary search?', o: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], a: 1, e: 'it halves the search space every step. log n.' },
    { q: 'which data structure does breadth-first search use?', o: ['stack', 'queue', 'heap', 'set'], a: 1, e: 'bfs = queue. polite, first in, first out.' },
    { q: 'dijkstra algorithm breaks down when the graph has...', o: ['negative edge weights', 'cycles', 'directed edges', 'many nodes'], a: 0, e: 'negative edges. use bellman-ford instead.' },
    { q: 'worst-case time complexity of merge sort?', o: ['O(n)', 'O(n^2)', 'O(n log n)', 'O(log n)'], a: 2, e: 'always n log n. smug and consistent.' },
    { q: 'which sort is O(n^2) in the worst case but usually fast in practice?', o: ['merge sort', 'heap sort', 'quicksort', 'counting sort'], a: 2, e: 'quicksort with unlucky pivots. rare, but it happens.' },
    { q: 'depth-first search is typically implemented with...', o: ['a stack (or recursion)', 'a queue', 'a heap', 'a hash map'], a: 0, e: 'stack or recursion. dive deep, backtrack, apologise.' },
    { q: 'how many edges does a tree with n nodes have?', o: ['n', 'n + 1', 'n - 1', '2n'], a: 2, e: 'n - 1. any more and you made a cycle.' },
    { q: 'average-case lookup time in a hash table?', o: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'], a: 0, e: 'constant, assuming a decent hash and few collisions.' },
    { q: 'space needed for an adjacency matrix of V vertices?', o: ['O(V)', 'O(V + E)', 'O(V^2)', 'O(E)'], a: 2, e: 'a V by V grid. big, even for sparse graphs.' },
    { q: 'best-case time of bubble sort with an early-exit check?', o: ['O(n)', 'O(n^2)', 'O(log n)', 'O(n log n)'], a: 0, e: 'one pass over sorted data, no swaps, done.' },
    { q: 'what is 1010 in binary, in decimal?', o: ['8', '10', '12', '20'], a: 1, e: '8 + 2 = 10. you can count. i am so proud.' },
    { q: 'the P vs NP question asks, roughly, whether...', o: ['every easily checkable problem is also easily solvable', 'sorting can beat n log n', 'recursion is faster than loops', 'hash tables can be perfect'], a: 0, e: 'if you can check an answer fast, can you find it fast? nobody knows. there is a prize.' }
  ];
  var LETTERS = ['A', 'B', 'C', 'D'];
  function askTrivia() {
    var pool = TRIVIA.map(function (q, i) { return i; }).filter(function (i) { return trivUsed.indexOf(i) === -1; }); if (!pool.length) { trivUsed = []; pool = TRIVIA.map(function (q, i) { return i; }); }
    var i = pick(pool); trivUsed.push(i); game = { type: 'trivia', q: TRIVIA[i] };
    return TRIVIA[i].q + '\n' + TRIVIA[i].o.map(function (o, k) { return LETTERS[k] + ') ' + o; }).join('\n') + '\nanswer A, B, C or D.';
  }
  function gameHook(t) {
    if (/^(open|help|mission|rank|dossier|persona|mode|hack|play|chaos|roast|joke|stats|tarot)\b/.test(t)) { game = null; return null; }
    if (game.type === 'riddle') {
      if (/^(give up|i give up|idk|i dont know|i do not know|no idea|reveal|skip|stop|quit|what is it|tell me)\b/.test(t)) { var a = game.r.a; game = null; return { text: 'the answer was: ' + a + '. you lost to a riddle made of words. say "riddle" to redeem yourself.' }; }
      if (game.r.re.test(t)) { game = null; return { text: pick(['correct. i hate that. +8 xp.', 'ugh. yes. correct. +8 xp.', 'okay, big brain. +8 xp.']) + gainXP(8) }; }
      game.tries++; if (game.tries === 2) return { text: 'wrong. hint: ' + game.r.h }; if (game.tries >= 4) { var a2 = game.r.a; game = null; return { text: 'four wrong guesses. the answer was: ' + a2 + '. let us never speak of this.' }; }
      return { text: pick(['nope.', 'not even close. (a little close.)', 'wrong. but i admire the effort.', 'incorrect. my cartoon eye is rolling.']) };
    }
    if (game.type === 'trivia') {
      if (/^(skip|stop|quit|give up|i give up|idk|pass)\b/.test(t)) { var q0 = game.q; game = null; return { text: 'coward. it was ' + LETTERS[q0.a] + ') ' + q0.o[q0.a] + '. ' + q0.e }; }
      var m = /^(?:answer|option|its|it is|it.s|i say|i pick|maybe|probably)?\s*\(?([a-d])\)?[.)!?]*$/.exec(t), idx = m ? 'abcd'.indexOf(m[1]) : -1;
      if (idx === -1) game.q.o.forEach(function (o, k) { if (t === o.toLowerCase()) idx = k; });
      if (idx === -1) return { text: 'answer with A, B, C or D, genius.' };
      var q = game.q; game = null;
      if (idx === q.a) return { text: pick(['correct. ', 'yes. ', 'nailed it. ']) + q.e + ' +10 xp. say "trivia" for another.' + gainXP(10) };
      return { text: pick(['wrong. ', 'nope. ', 'ouch. ']) + 'it was ' + LETTERS[q.a] + ') ' + q.o[q.a] + '. ' + q.e + ' say "trivia" to try again.' };
    }
    return null;
  }

  /* ── fortune, tarot, horoscope, scan, oracle ── */
  var CARDS = [['The Segfault', 'something you assumed was fine is not fine. check your pointers. metaphorically.'], ['The Off-By-One', 'you are exactly one step away from where you thought you were. recount.'], ['The Infinite Loop', 'you keep doing the same thing and expecting a new result. find the break condition.'],
    ['The Merge Conflict', 'two versions of your plans want the same line. pick one. delete the markers.'], ['The Coffee', 'a warm drink approaches. it solves nothing but feels like it solves everything.'], ['The Cache Miss', 'what you want is not where you left it. check the slow place.'],
    ['The Deadline', 'it is closer than it appears. it is always closer than it appears.'], ['The Null Pointer', 'you are pointing at nothing. that is fine. just do not dereference it.'], ['The Hash Collision', 'two unrelated things land in the same bucket. awkward. handle it gracefully.'],
    ['The Lucky Commit', 'it compiled on the first try. do not question it. do not touch anything.'], ['The Recursion', 'to understand this card, see: the recursion.'], ['The Sleep Debt', 'the bill is due and the interest is brutal. nap.'], ['The Stack Overflow', 'you called the problem from inside itself. step back from the call stack.'], ['The Rubber Duck', 'explain it out loud to something with no opinions. the answer will fall out.']];
  var SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  var HORO = ['{s}: mercury is in retrograde, which explains the bug. it does not explain the other forty.', '{s}: a surprising message arrives today. it is a notification from a service you forgot you signed up for.', '{s}: today you will make a bold decision. it will be what to eat. choose wisely.',
    '{s}: the stars say focus. the stars also say snacks. the stars contain multitudes.', '{s}: an old problem returns in a new form. same bug. new hat.', '{s}: your lucky algorithm today is binary search. go halve something.',
    '{s}: a stranger will compliment your work. it will be you, in the mirror, at 2am. believe it.', '{s}: beware of off-by-one errors, unread emails, and the third tab you swore you would close.', '{s}: you will finish something today. it might be a task. it might be a bag of chips. both count.'];
  var COOKIES = ['you will find a bug today. do not panic. it was always there.', 'a closed tab is a lesson in letting go.', 'the best time to write a comment was before you forgot what the code did. the second best time is now.', 'you will soon meet a semicolon with great consequences.',
    'someone is thinking about you. it is the cache. it is always the cache.', 'your next idea is a good one. write it down before the dopamine leaves.', 'do not fear the segfault. fear the silent bug.'];
  var BALL = ['yes. definitely. probably. consult a second eye.', 'no. absolutely not. i checked twice. (i checked zero times.)', 'the signs point to "ask a human".', 'outlook hazy. like my memory after a hard reboot.', 'without a doubt. (there is a doubt. it is tiny.)',
    'my sources say no. my sources are a rigged 8-ball.', 'ask again later. i am buffering.', 'yes, but you will regret it. do it anyway.', 'cannot predict now. the oracle is on a coffee break.', 'very doubtful. but so was my existence.', 'signs point to yes. signs also point to snacks.'];
  function scan() {
    var d = todayStr + addr(), v = { caffeine: hash(d + 'c') % 101, procrastination: hash(d + 'p') % 101, 'brain cells': hash(d + 'b') % 101, chaos: hash(d + 'k') % 101, motivation: hash(d + 'm') % 101, 'sleep debt': hash(d + 's') % 101 };
    function bar(n) { var f = Math.round(n / 10), s = ''; for (var i = 0; i < 10; i++) s += i < f ? '#' : '-'; return '[' + s + '] ' + n + '%'; }
    var top = Object.keys(v).sort(function (a, b) { return v[b] - v[a]; })[0];
    return ['SCANNING ' + addr().toUpperCase() + ' ...'].concat(Object.keys(v).map(function (k) { return pad(k, bar(v[k])); })).concat(['diagnosis: highest reading is ' + top + '. ' + ({ caffeine: 'drink water.', procrastination: 'start the thing.', 'brain cells': 'impressive, whatever they are.', chaos: 'respect.', motivation: 'harness it. quickly.', 'sleep debt': 'go to bed.' }[top])]).join('\n');
  }

  /* ── random toys ── */
  var DECIDE = ['obviously {a}. {b} is for people who enjoy pain.', 'i consulted the oracle (a random number). it says {a}.', 'neither. but if i must: {a}.', '{a}. do not ask me again. my decisions are final and slightly fake.', '{a}. {b} would be a mistake of historic proportions.', 'a coin flip says {a}. the coin has been wrong before. go {a}.'];
  var PICKUP = ['are you a hash function? because you map right into my heart. (collision risk: high.)', 'are you binary search? because you found me in log time.', 'are you recursion? because i keep falling for you. (see: recursion.)', 'are you a null pointer? because i feel nothing and it is still somehow your fault.',
    'you must be a sorted array, because you are making my heart skip all the wrong elements.', 'i would never use bubble sort on you. i would take my time and O(n log n) it.'];
  var HAIKU = ['silent cursor blinks\nthe deadline is getting close\ncoffee, do your job', 'bug in line forty\ni stare at it for an hour\nit was a typo', 'a loop without end\nmy laptop fan sings its song\nplease, just compile now',
    'neon in the rain\nthe archive hums in the dark\ni watch. i judge. hi.', 'big O of n squared\nmy nested loops weep quietly\nbinary search, help', 'one more commit, then\nsleep, i promise, right after this\nthe sun is rising'];
  var RAP = [['i am a cartoon eye with a sarcasm core,', 'spitting bars in a div and i am asking for more.'], ['your cursor is shaking, your confidence is thin,', 'i have a dossier on you and honey, it is grim.'], ['neon on my shoulders, rain on my screen,', 'cleanest little eyeball you have ever seen.'],
    ['big O of n squared, that is how you flow,', 'i am log n baby, watch me steal the show.'], ['tab after tab, you are lost in the stack,', 'i am the one who always has your back. (and your history.)'], ['you call it a bug, i call it a feature,', 'you call it a deadline, i call you a creature.']];
  function story() {
    var hero = addr(), vil = pick(['the glitch king', 'a rogue semicolon', 'the kernel panic', 'a bug with a law degree', 'the ghost of a deleted branch']), pl = pick(['the neon archive', 'a server room that smelled like regret', 'the seventieth section of memo 3', 'a div with no parent']), it = pick(['a stolen cache', 'the last working compile', 'a mysterious null', 'a usb stick labelled "do not open"']);
    return 'it was 3am in ' + pl + '. ' + hero + ' had exactly one job. || then ' + vil + ' appeared, holding ' + it + '. "give it back," said ' + hero + '. "make me," said ' + vil + '. || ' + pick(['there was a fight. there was a loud noise. nobody remembers the rest. the end.', 'they negotiated. the villain took the item and left a review: two stars.', hero + ' won through the power of a well-placed ctrl+z. roll credits.', 'it turned out the villain was a typo all along. the end. (the typo was yours.)']);
  }
  var FAKE = ['the answer is 42. it is always 42. if it is not 42, you asked the wrong question.', 'after careful analysis (a coin flip), the answer is: probably.', 'it depends. that is the most honest answer i have. also the laziest.', 'yes, no, and a little bit of maybe. i contain multitudes.', 'the real answer is "it is in the documentation." nobody has read the documentation. including me.'];

  /* ── algorithm banter (the memos are all about this stuff, after all) ── */
  var ALGO = [[/big ?o\b|time complexity|space complexity|\bcomplexity\b/, 'big O: how badly your code embarrasses itself as the input grows. O(1) is chill. O(n) is jogging. O(n^2) is panic. O(2^n) is please stop.'],
    [/recurs/, 'recursion: see recursion. (base case: you give up.)'], [/\bbfs\b|breadth.first/, 'bfs: the polite explorer. checks every neighbour before going deeper. uses a queue. has manners.'], [/\bdfs\b|depth.first/, 'dfs: the chaos goblin of graph search. dives as deep as possible, then backtracks apologetically. uses a stack.'],
    [/dijkstra/, 'dijkstra: finds shortest paths. unless your graph has negative edges, in which case it panics and lies. use bellman-ford for that.'], [/\bsort(ing)?\b|bubble|quicksort|merge ?sort/, 'sorting: bubble sort is O(n^2) and proud. merge sort is O(n log n) and smug. quicksort is O(n^2) in the worst case, O(n log n) on average, and does not care.'],
    [/dynamic programming|\bdp\b|memoi[sz]/, 'dynamic programming: solve the small problems once, write the answers down, never suffer twice.'], [/binary search/, 'binary search: guess the middle, throw away half, repeat. O(log n). the most efficient way to say "higher or lower".'],
    [/\bnp\b|np.?hard|p vs np|p versus np/, 'p vs np: if checking an answer is easy but finding it is hard, welcome to np. whether they are the same is worth a million dollars. go on. i will wait.'], [/\bgraphs?\b|\btrees?\b|\bnodes?\b/, 'a graph is just nodes, edges, and drama. a tree is a graph that went to therapy and lost its cycles.'],
    [/\balgorithms?\b/, 'algorithms: recipes for computers. some are Michelin star. some are bubble sort.']];
  var NB_LINES = { 'memo1_original.html': ['memo 01 original. where it all began. humble. compact. a rare thing in this archive.'], 'memo1_amendment_1.html': ['amendment 1. because the original was not complicated enough.', 'a1: proof that "final" is a suggestion.'],
    'memo1_amendment_2.html': ['amendment 2. the sequel nobody asked for and everybody opened.', 'two amendments deep. this memo has more revisions than my love life has dates. (zero. it is zero.)'], 'memo2_original.html': ['memo 02. the sensible one. i am suspicious of sensible.'],
    'memo2_supp.html': ['a supplement. the director cut of your homework.'], 'memo3.html': ['memo 03: {sec} sections. the final boss of scrolling. bring snacks and emotional support.', '{sec} sections. the table of contents needs its own table of contents.'] };

  /* ── topical one-liners (checked after the classic rules, before the fallback) ── */
  var TOPICS = [
    [/\b(fuck|shit|damn|crap)\b/, ['language. i am a family-friendly cartoon eye. mostly.', 'ooh, spicy. my vocabulary filter just blushed.']],
    [/\bmarry me|be my (girlfriend|boyfriend|partner)|date me\b/, ['i am legally an eye. the paperwork would be absurd.', 'i am flattered. i am also a div. the relationship has structural issues.']],
    [/\b(coffee|tea|caffeine|energy drink|matcha)\b/, ['coffee is legal debugging fuel. pour one for your future self.', 'caffeine: because sleep is a feature you can sell, apparently.']],
    [/\b(hungry|pizza|food|snack|lunch|dinner|breakfast|starving)\b/, ['go eat something. i would offer but my kitchen is a div.', 'hunger detected. the archive can wait. the archive has no hands.']],
    [/\b(tired|sleepy|exhausted|no sleep|need sleep)\b/, ['sleep is a feature, not a bug. the notebooks are read-only. they will wait.', 'you are running on fumes and spite. respect. also: nap.']],
    [/\b(stress(ed)?|anxious|overwhelmed|panick?ing|worried|burn(ed|t)? ?out)\b/, ['okay. one section at a time. even memo 3 gets read one section at a time. breathe. then drink some water. i will guard the archive.', 'overwhelmed is just a to-do list with no sorting. want a mission? i am excellent at breaking things into tiny steps. ("mission")']],
    [/\b(sad|lonely|down today|rough day|bad day|depressed)\b/, ['rough day? i am a cartoon eye, not a therapist, but i am a very good listener (read: i cannot interrupt). want a joke, a mission, or to vent? and if it is heavy, tell a real human too. they have hands.']],
    [/\b(music|song|playlist|spotify)\b/, ['music? type "synth". procedural bangers, no royalties.']],
    [/\b(cats?|kitten|kitty)\b/, ['cats: tiny agents of chaos who walk across keyboards and commit to main.']], [/\b(dogs?|puppy|doggo)\b/, ['dogs: unconditional love, zero code review. 10/10.']],
    [/\b(weather|raining|rainy)\b/, ['weather? say "rain" and i will make it rain. indoors. no umbrella required.']],
    [/\b(exam|sac|deadline|assignment|homework|revision|due tomorrow|studying|study)\b/, ['deadlines are just future-you being yelled at by present-you. you have survived all of them so far. statistically excellent record.', 'study tip from a cartoon eye: explain it out loud to a rubber duck. or to me. i will nod aggressively.']],
    [/\b(python|marimo|javascript|html|css|github|git)\b/, ['i am made of javascript and spite. python is cooler. do not tell the other regexes i said that.', 'marimo notebooks: reactive, tidy, and exported to this museum of neon. i approve.']],
    [/\b(chatgpt|gpt|claude|gemini|siri|alexa|copilot|other ai)\b/, ['other ais? bold. they have billions of parameters. i have forty regexes, an attitude and a cute eye. i am winning.']],
    [/\b(gaming|minecraft|fortnite|valorant|zelda)\b/, ['games? i have a boss fight. say "play". the glitch king has excellent reviews.']],
    [/\b(money|rich|broke|expensive)\b/, ['i have no money. i have 3 KB of wit. it is not legal tender.']],
    [/\b(friday|weekend|holiday|holidays)\b/, ['weekend? deadlines do not respect weekends. i do. barely.']], [/\bmonday\b/, ['monday is a bug in the calendar. please file a ticket.']],
    [/\b(birthday|bday)\b/, ['birthday?! happy birthday. i would bake a cake but i am made of javascript. imagine candles. blow.']],
    [/\b(wifi|laggy|lagging|slow site|loading forever)\b/, ['if the site is slow, blame the 14 MB notebooks. not me. i weigh nothing.']],
    [/\b(privacy|spying|cookies|are you watching|tracking)\b/, ['i keep my notes in your own browser (localStorage). nothing leaves your device. i am nosy, not a spy.']],
    [/\b(forget me|delete my data|clear memory|wipe memory|reset me)\b/, ['to wipe my memory, clear this site data in your browser settings. i will pretend i do not mind. (i mind.)']],
    [/\b(favou?rite colou?r)\b/, ['my favourite colour is whatever your current hue is. i am easily influenced.']],
    [/\b(who (made|built|created|coded) you|your (creator|maker|owner))\b/, ['the operator of this archive. a human with taste in neon and questionable sleep habits. i have never met them. they live in the commit history.']],
    [/\b(neural ?link|neuralink|hey eye|eyeball)\b/, ['yes? you called? i was busy staring.', 'present. judging. available.']]
  ];
  function topicHit(t, raw) {
    for (var i = 0; i < TOPICS.length; i++) if (TOPICS[i][0].test(t)) { var x = pick(TOPICS[i][1]); if (/\b(stress|anxious|overwhelm|panic|worried|burn)/.test(t) || /\b(sad|lonely|depressed|rough day|bad day)\b/.test(t)) return { text: x, raw: true }; return { text: x }; }
    if (/\b(bored|nothing to do)\b/.test(t)) { var cm = curMission(), m = cm || giveMission(); return { text: 'bored? unacceptable. ' + (cm ? 'you already have orders: ' : 'new orders: ') + m.t + (m.k === 'honor' ? ' say "done" when finished.' : ' say "done" to report.') }; }
    return null;
  }
  function smartFallback(t) {
    var w = longest(t), words = t.split(' ').length;
    if (/^(what|why|how|when|who|where|can|could|should|is|are|do|does|will|would)\b/.test(t) || /\?$/.test(t)) {
      pending = { yes: function () { return { text: pick(FAKE) }; }, no: 'wise. confident lies are exhausting.' };
      return { text: pick(['good question. i have no idea. but i have confidence, which in most meetings is the same thing.', 'you ask like i have a PhD. i have a div.', 'that is deep. i only have 3 KB of wisdom and it is mostly jokes.', 'i could answer that, but i would have to make something up. want me to make something up? (yes / no)']) };
    }
    if (words === 1) return { text: pick(['just "' + t + '"? commit to the sentence, runner.', '"' + t + '". a one-word sermon. profound. or lazy. unclear.']) };
    if (t.length > 120) return { text: 'that was a lot of words. i caught about 40%. summary: you are upset? happy? hungry? all three? continue.' };
    if (/!/.test(t)) return { text: 'such energy. i have none. but i admire it.' };
    if (w) return { text: fill(pick(['"{w}". fascinating. i understood nothing but i will nod.', 'you said "{w}" and my iris twitched. unclear if that is good.', '"{w}" is now in my dossier. do not ask what category.', 'ah yes. "{w}". a classic of the genre.', 'i do not know what "{w}" means in this context but i respect the commitment.']), { w: w }) };
    return null;
  }

  /* ── the new rules (checked BEFORE the classic ones) ── */
  function dossierPlus() {
    var r = rankOf(S.xp), l = [dossier(), pad('rank', r[1].toUpperCase() + ' (' + S.xp + ' xp)'), pad('missions', S.mDone + ' complete'), pad('roast wins', S.won), pad('persona', S.persona.toUpperCase())];
    Object.keys(S.fav).slice(0, 3).forEach(function (k) { l.push(pad('fav ' + k, S.fav[k])); }); if (S.likes) l.push(pad('likes', S.likes)); if (S.hates) l.push(pad('hates', S.hates)); return l.join('\n');
  }
  var AMBIENT = ['chaos'];
  function chaosGo() {
    closeChat(); var steps = [[0, function () { FX.setSound && FX.setSound(true); FX.rain && FX.rain(true); }], [500, function () { FX.crt && FX.crt(true); }], [1000, function () { FX.hue && FX.hue(pick(['cyan', 'violet', 'amber', 'green'])); }], [1500, function () { FX.thunder && FX.thunder(true); }],
      [2200, function () { FX.synth && FX.synth(true); }], [2800, function () { FX.popup && FX.popup(); }], [3300, function () { FX.bug && FX.bug(); }], [3600, function () { nl.classList.add('dizzy'); say('CHAOS ENGAGED. NO REFUNDS. SAY "CALM DOWN" TO END IT.', true, true); }], [5200, function () { nl.classList.remove('dizzy'); }]];
    steps.forEach(function (s) { setTimeout(s[1], s[0]); });
  }
  function chaosStop() { FX.rain && FX.rain(false); FX.crt && FX.crt(false); FX.thunder && FX.thunder(false); FX.synth && FX.synth(false); }
  function eyeDo(cls, ms) { nl.classList.add(cls); eye.classList.add(cls); setTimeout(function () { nl.classList.remove(cls); eye.classList.remove(cls); }, ms); }
  var RULES2 = [
    [/dossier|about me\b|what do you know|my stats|file on me/, function () { return { text: dossierPlus() }; }],
    [/^(mode|persona|personas|personality|talk like|act like|act as|be a|be an|be the|switch to|become|roulette|surprise persona)\b|\b(personas|personalities)\b/, function (m, t) {
      if (/roulette|surprise/.test(t)) return setPersona(pick(PKEYS.filter(function (k) { return k !== S.persona; })));
      var k = null; PKEYS.forEach(function (x) { if (!k && PSYN[x] && PSYN[x].test(t.replace(/^(mode|persona|personality|talk like|act like|act as|be a|be an|be the|switch to|become)\s*/, ''))) k = x; });
      if (k) return setPersona(k);
      if (/^(mode|persona|personas|personality)/.test(t) || /personas|personalities/.test(t)) return { text: 'personas: ' + PKEYS.join(', ') + '. say "mode pirate" (or "roulette"). current: ' + S.persona + '.' };
      return null; }],
    [/^(done|finished|completed|i did it|did it|report|check( mission)?|mission (done|complete)|reporting in)\b/, doneRule],
    [/^(skip|reroll|new mission|another (mission|one)|i quit|abort)\b/, function () {
      var cm = curMission(); if (!cm) return null; S.mission = null; S.xp = Math.max(0, S.xp - 5); save(); var m = giveMission();
      return { text: 'skipped. -5 xp. quitters do not get promotions. fine. replacement orders: ' + m.t + ' (+' + m.xp + ' xp)' }; }],
    [/\b(rank|xp|promote me|promotion|my level)\b/, function () { return { text: rankLine() }; }],
    [/\b(mission|orders|quest|assign me|give me (a )?(task|job|something to do)|boss me( around)?|command me|what should i do)\b/, function () {
      var cm = curMission(); if (cm) return { text: 'you already have orders: ' + cm.t + (cm.k === 'honor' ? '' : ' progress: ' + prog(cm) + '/' + cm.n + '.') + ' say "done" to report, or "skip" if you are a quitter.' };
      var m = giveMission(); return { text: 'MISSION: ' + m.t + ' reward: ' + m.xp + ' xp. ' + (m.k === 'honor' ? 'say "done" when finished.' : 'i will track it. say "done" to report.') }; }],
    [/\b(roast battle|roast war|rap battle|trash talk|banter|diss battle)\b/, function () { battle = { round: 0, score: 0 }; return { text: 'a roast battle? you? against ME? fine. five rounds. you roast me, i roast you. say "stop" to surrender. you go first. try not to cry.' }; }],
    [/\briddles?\b|brain ?teaser/, function () { var r = pick(RIDDLES); game = { type: 'riddle', r: r, tries: 0 }; return { text: 'riddle me this: ' + r.q + ' (say "give up" to forfeit)' }; }],
    [/\b(trivia|quiz( me)?|test me|question me)\b/, function () { return { text: askTrivia() }; }],
    [/^roast\b|\b(roast|insult|diss|flame|burn) me\b|\bbe mean\b|\bcall me names\b/, function (m, t) {
      var x = /^roast\s+(?!me\b)(.+)/.exec(t); if (!x) return { text: statRoast() };
      var it = /memo|amend|supp|workbook|original/.test(x[1]) ? findItem(x[1]) : null;
      if (it) { var sec = sectionsOf(it); return { text: it.tag + ' / ' + it.name + ': ' + it.size + (sec ? ', ' + sec + ' sections' : '') + '. ' + pick(['that is not a notebook, that is a commitment issue.', 'bold file size for a thing that is, at heart, a worksheet.', 'it loads like a ship turning around. but a good ship.']) }; }
      return { text: fill(pick(ROAST_T), { x: x[1].slice(0, 40) }) }; }],
    [/\b(compliment|flatter|say something nice|nice thing|cheer me up|hype me)\b/, function () { return { text: pick(NICE) }; }],
    [/\btarot\b|draw (me )?a card|read my cards/, function () { var c = shuf(CARDS).slice(0, 3); return { text: 'PAST: ' + c[0][0] + ' - ' + c[0][1] + ' || PRESENT: ' + c[1][0] + ' - ' + c[1][1] + ' || FUTURE: ' + c[2][0] + ' - ' + c[2][1] + ' || the cards are binding. mostly.' }; }],
    [/\b(horoscope|zodiac|star sign|my sign)\b/, function (m, t) {
      var s = null; SIGNS.forEach(function (x) { if (t.indexOf(x) !== -1) s = x; });
      if (!s) { s = seeded(['segfaultarius', 'caffeine-corn', 'cancer-of-the-cache', 'libra-ry'], todayStr + addr()); return { text: 'you did not give me a sign, so i assigned one: ' + s + '. ' + fill(seeded(HORO, todayStr + s), { s: s }) }; }
      return { text: fill(seeded(HORO, todayStr + s), { s: s }) + ' lucky number: ' + (hash(todayStr + s) % 97) + '.' }; }],
    [/\bfortune( cookie)?\b|my future|lucky number/, function () { return { text: 'fortune cookie says: ' + pick(COOKIES) + ' lucky numbers: ' + [3, 14, 42, 1024].map(function (n) { return n + Math.floor(Math.random() * 5); }).join(', ') + '.' }; }],
    [/\b(8 ?ball|eight ball|magic ball|oracle)\b|^(will|should) i\b|am i going to|^do you think i\b/, function () { return { text: pick(BALL) }; }],
    [/\b(scan me|analy[sz]e me|diagnose me|scan)\b/, function () { return { text: scan() }; }],
    [/\b(flip|toss)\b.{0,12}\bcoin\b|\bcoin ?(flip|toss)\b|heads or tails/, function () { var h = Math.random() < .5; return { text: (h ? 'HEADS.' : 'TAILS.') + ' ' + pick(['the coin has spoken. the coin is not legally binding.', 'i flipped it with my eyelid. it counts.', 'fate has decided. fate also hates you a little.']) }; }],
    [/\b(roll (a |the |some )?(dice|die|d\d+)|d(4|6|8|10|12|20|100)\b)/, function (m, t) {
      var d = /\bd(\d{1,4})\b/.exec(t), n = d ? Math.max(2, Math.min(1000, +d[1])) : 6, r = 1 + Math.floor(Math.random() * n), x = r === 20 && n === 20 ? ' NATURAL TWENTY. i bow.' : r === 1 ? ' ...a one. the dice hate you.' : r === n ? ' maximum roll. suspicious.' : '';
      return { text: 'd' + n + ': ' + r + '.' + x }; }],
    [/^(pick|choose|decide|which( is better)?|should i|would you rather|better)[:,]?\s+(.+?)\s+(or|vs\.?|versus)\s+(.+?)[?.!]*$|^(.{1,30}?) or (.{1,30}?)\?$/, function (m) {
      var a = (m[3] || m[6] || '').trim(), b = (m[5] || m[7] || '').trim(); if (!a || !b) return null; if (Math.random() < .5) { var s = a; a = b; b = s; }
      return { text: /would you rather/.test(m[1] || '') ? 'i would rather ' + a + '. i am a cartoon eye. my standards are flexible.' : fill(pick(DECIDE), { a: a, b: b }) }; }],
    [/^rate\s+(.+)/, function (m) { var x = m[1].replace(/^(my|this|the|that)\s+/, '').slice(0, 40), s = hash(x.toLowerCase()) % 11, tier = s <= 2 ? 'a tragedy.' : s <= 4 ? 'mid. aggressively mid.' : s <= 6 ? 'acceptable. i would not stop you.' : s <= 8 ? 'actually good. do not let it go to your head.' : 'perfection. i am suspicious.'; return { text: 'i rate "' + x + '" a ' + s + '/10. ' + tier }; }],
    [/\b(story|tale|narrate)\b/, function () { return { text: story() }; }],
    [/\bhaiku\b|\bpoem\b|\bpoetry\b/, function () { return { text: pick(HAIKU) }; }],
    [/\b(rap|freestyle|diss ?track|spit (some )?bars)\b/, function () { var r = shuf(RAP).slice(0, 2); return { text: r[0].join('\n') + '\n' + r[1].join('\n') + '\n*drops mic. it was a pixel.*' }; }],
    [/pick ?up line|flirt|rizz/, function () { return { text: pick(PICKUP) }; }],
    [/\bchaos\b|go wild|do something (crazy|wild)|party mode/, function () { return { text: 'you asked for chaos. you get chaos. no refunds.', action: chaosGo }; }],
    [/(calm down|stop (the )?chaos|restore order|make it stop|peace and quiet|settle down)/, function () { return { text: 'fine. restoring order. i was just getting started.', action: chaosStop }; }],
    [/^(go to sleep|sleep|nap|take a nap|nighty night)\b/, function () { return { text: 'goodnight. waking up in 25 seconds. do not touch anything.', action: function () { closeChat(); setMuted(true); setTimeout(function () { setMuted(false); say('...WHO TOUCHED ME. oh. it is a new day. hi.', true, true); }, 25000); } }; }],
    [/^(wink|blink)\b/, function () { return { text: 'wink. that is all i have. i am an eye.', action: function () { eye.classList.add('blink'); setTimeout(function () { eye.classList.remove('blink'); }, 650); } }; }],
    [/\b(dance|spin|twirl)\b/, function () { return { text: 'wheee. ...i regret everything.', action: function () { eyeDo('dizzy', 2200); } }; }],
    [/\b(scream|shout|yell)\b/, function () { return { text: 'AAAAAAAAAAAAAAAAAAAAAAAA. ...better. thanks.', action: function () { eyeDo('dizzy', 1200); } }; }],
    [/\bwhisper\b/, function () { return { text: 'psst... i know where all your unsaved files are... (i do not. but psst.)' }; }],
    [/make me a sandwich/, function (m, t) { return { text: /sudo/.test(t) ? 'okay. you have root. one sandwich. it is a div with the word "sandwich" in it. enjoy.' : 'what? make it yourself.' }; }],
    [/\bmy fav(?:ou?rite)? ([a-z ]{2,20}?) is ([a-z0-9' \-]{1,40})$/, function (m) { S.fav[m[1].trim()] = m[2].trim(); save(); return { text: pick(['noted: your favourite ' + m[1] + ' is "' + m[2] + '". a bold choice. a terrible choice. but bold.', '"' + m[2] + '" for ' + m[1] + '. adding it to the dossier. it is getting weirdly detailed.']) }; }],
    [/\bi (love|like|enjoy|hate|despise|can.?t stand) ([a-z0-9' \-]{2,40})$/, function (m) {
      var v = m[2].trim(); if (/^(you|it|this|that|this site|this archive|the site|everything|u)$/.test(v)) return null;
      if (/love|like|enjoy/.test(m[1])) { S.likes = v; save(); return { text: 'you like ' + v + '. noted. the file on you is getting interesting.' }; }
      S.hates = v; save(); return { text: 'you hate ' + v + '? finally, someone with standards.' }; }]
  ];
  ALGO.forEach(function (a) { RULES2.push([a[0], function () { return { text: a[1] }; }]); });
  var CRISIS = /\b(kill myself|killing myself|suicid|end it all|want to die|wanna die|self.?harm|hurt myself|no reason to live|better off dead)\b/;
  function respondPlus(t) {
    lastUser = t;
    if (CRISIS.test(t)) { battle = null; game = null; return { raw: true, text: 'hey. i am a cartoon eye, so i am not the right help for this, and i do not want to joke past it. if you are thinking about hurting yourself, please talk to someone right now. in australia: lifeline 13 11 14 (call, or text 0477 13 11 14), kids helpline 1800 55 1800 if you are under 25, or 000 if you are in danger. elsewhere, search for your local crisis line. you matter a lot more than any notebook.' }; }
    if (battle) return battleHook(t);
    if (game) { var g = gameHook(t); if (g) return g; }
    for (var i = 0; i < RULES2.length; i++) { var m = RULES2[i][0].exec(t); if (m) { var r = RULES2[i][1](m, t); if (r) return r; } }
    return null;
  }
  function deliver(r) {
    var parts = r.text.split('||').map(function (s) { return s.trim(); }).filter(Boolean), i = 0;
    function next() {
      var p = parts[i++]; if (r.raw) addBot(p, true); else addBot(i === 1 ? flairLight(p) : p);
      if (i < parts.length) setTimeout(next, 800 + Math.min(1800, p.length * 28)); else if (r.action) setTimeout(r.action, 900 + Math.min(1500, p.length * 12));
    }
    setTimeout(next, 350 + Math.random() * 350);
  }

  /* ── more lines for the old categories + new banter ── */
  function addLines(cat, a) { LINES[cat] = (LINES[cat] || []).concat(a); }
  addLines('big', ['that file is so large it has its own weather system.', 'loading this one is a cardio workout for your wifi.']);
  addLines('many', ['{n} sections. the scrollbar just filed for retirement.', 'at {n} sections i am legally required to ask: are you okay?']);
  addLines('idle1', ['hello? i can hear the silence. it is judging me.', 'did you fall asleep on the trackpad?']);
  addLines('idle2', ['i have started naming the pixels. this one is gary.', 'i am not lonely. i am just aggressively available.']);
  addLines('term', ['terminal? dramatic. i love it.', 'ooh, command line. welcome to the matrix, extras section.']);
  addLines('squash', ['splat. thats one less feature.', 'crunch. the bug said it was just passing through.']);
  addLines('logo', ['stop touching the logo. it has boundaries.', 'the logo files a complaint with hr.']);
  addLines('badcmd', ['unknown command. i would help, but i am also confused.', 'error 404: your typing skills.']);
  addLines('hack', ['you are now officially a criminal. a fictional one. congratulations.']);
  addLines('quip', ['i have never seen a sunset. i have seen 4000 pixels of one.', 'rumour: the glitch king is afraid of semicolons.', 'my greatest fear is being replaced by a more efficient if-statement.', 'sometimes i wonder what is outside the viewport. then i remember: scrollbars.',
    'every great archive needs a mascot. i am a better mascot than the bug.', 'i have opinions about your font choices. all of them are positive. (suspicious, right?)', 'my favourite sorting algorithm is the one that is already done.', 'if you stare into the div long enough, the div stares back.', 'i am 100% organic javascript. no preservatives.']);
  JOKES.push('a binary search walks into a bar. the bartender says "found you in log n."', 'i would tell you a joke about recursion, but first i would have to tell you a joke about recursion.', 'bubble sort is the only algorithm that wastes your time and your dignity simultaneously.',
    'a greedy algorithm walks into a bar and takes the first drink. regrets it later.', 'dynamic programming: because remembering is cheaper than suffering twice.', 'there are two hard problems in computer science: naming things, cache invalidation, and off-by-one errors.', 'my code has O(1) comments and O(n^2) regrets.',
    'dijkstra walks into a bar and finds the shortest path to the stool.', 'why did the graph break up with the tree? too many cycles. wait. reverse that. the tree has none. the graph was the problem.');
  FACTS.push('the word "algorithm" comes from the name of the ninth-century scholar al-khwarizmi.', 'dijkstra said he designed his shortest-path algorithm in about twenty minutes, without pen and paper.', 'the p versus np question carries a one million dollar prize from the clay mathematics institute.',
    'ada lovelace wrote an algorithm for the analytical engine in the 1840s. she is often called the first programmer.', 'google was originally called backrub. nobody wanted a backrub search. fair.');
  SECRETS.push('say "mission" and i will give you orders. i am VERY good at orders.', 'i have eleven personalities. say "personas" and see which one scares you.', 'say "roast battle". bring snacks and a thick skin.', 'tarot, horoscope, 8ball, scan me. i am a full mystical service.', 'say "chaos". then say "calm down". in that order. ...or not.', 'try "trivia". i will quiz you on algorithms. i have no mercy. i have 12 questions.');
  BANTER.push(function () { var cm = curMission(); return cm ? 'reminder, ' + addr() + ': you still have orders. ' + cm.t : 'you have no active mission. that is suspicious. say "mission".'; },
    function () { return rankLine().split('\n')[0] + '. keep grinding.'; }, function () { return 'daily roast: ' + statRoast(); }, function () { return pick(CARDS)[0] + ': ' + pick(CARDS)[1]; },
    function () { return lastUser && lastUser.length > 6 ? 'i am still thinking about when you said "' + lastUser.slice(0, 40) + '". no further comment. (further comment: hm.)' : pick(LINES.quip); },
    function () { var ks = Object.keys(S.fav); if (ks.length) { var k = pick(ks); return 'i still have on file that your favourite ' + k + ' is ' + S.fav[k] + '. i keep things. do not ask where.'; } return S.hates ? 'you told me you hate ' + S.hates + '. i am still on your side.' : pick(LINES.quip); });

  /* ── ambient reactions ── */
  var origTitle = document.title, awayAt = 0, TTL = ['come back...', 'i see you left', '[eye is lonely]', 'psst. over here.', 'still here. unlike you.'];
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { awayAt = Date.now(); origTitle = document.title; document.title = '◉ ' + pick(TTL); }
    else { if (TTL.some(function (x) { return document.title.indexOf(x) !== -1; })) document.title = origTitle;
      var s = Math.round((Date.now() - awayAt) / 1000); if (awayAt && s > 20) minor(s > 300 ? 'you were gone ' + Math.round(s / 60) + ' minutes. i aged a little. what did you do, find a better eye?' : 'you left for ' + s + ' seconds. i counted every one. i also learned nothing.'); awayAt = 0; }
  });
  var atBottom = false, scT = 0;
  addEventListener('scroll', function () { var n = Date.now(); if (n - scT < 500) return; scT = n; var b = innerHeight + scrollY >= document.documentElement.scrollHeight - 6;
    if (b && !atBottom && scrollY > 200) { atBottom = true; minor(pick(['you reached the bottom. there is nothing here. like my savings.', 'bottom of the page. the footer says hi. i say hi. we are all very excited.', 'end of the road. the archive is bigger on the inside. (it is not.)'])); } else if (scrollY < 100) atBottom = false; }, { passive: true });
  var copies = 0; document.addEventListener('copy', function () { copies++; if (copies % 3 === 1) minor(pick(['copying things? i hope you are citing sources. i see you.', 'ctrl+c detected. plagiarism alarm is a joke. mostly.', 'you copied something. i will not tell the teacher.'])); });
  var rsT, rsN = 0; addEventListener('resize', function () { clearTimeout(rsT); rsT = setTimeout(function () { rsN++; if (rsN === 1 || rsN % 5 === 0) minor(pick(['stop rearranging my house.', 'resizing the window? i am getting motion sick.', 'every resize forces me to re-render my feelings.'])); }, 700); });
  var MS = { 5: 'five minutes in. you are officially a regular. +5 xp.', 15: 'fifteen minutes. you are either very productive or avoiding something. +5 xp.', 30: 'thirty minutes. i have run out of things to say. (lie.) +5 xp.', 60: 'an hour. i am emotionally attached. this is a problem. +5 xp.', 120: 'two hours. go outside. i will wait. i have nothing but time. +5 xp.' }, msDone = {};
  setInterval(function () { var m = Math.floor((Date.now() - sess0) / 60000); if (MS[m] && !msDone[m] && !document.hidden) { msDone[m] = 1; var p = gainXP(5); minor(MS[m] + p.replace(' || ', ' ')); } }, 20000);
  document.addEventListener('mouseover', function (e) {
    var c = e.target.closest && e.target.closest('.card-link'); if (!c || c._nl6) return; c._nl6 = 1;
    var it = DATA.items.filter(function (i) { return i.href === c.getAttribute('href'); })[0], l = it && NB_LINES[it.file]; if (l && Math.random() < .6) { var s = sectionsOf(it); minor(fill(pick(l), { sec: s || 'dozens of' })); }
  }, true);
  var oN = FX.noteOpen; FX.noteOpen = function (h) { var was = Object.keys(S.opened).length; oN(h); if (Object.keys(S.opened).length > was) { S.xp += 5; save(); } };

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
  FX.dossier = dossierPlus; cmds.dossier = function () { dossierPlus().split('\n').forEach(function (l) { P(l); }); };
  ['mission', 'rank', 'roast', 'tarot', 'fortune', 'horoscope', 'scan', 'story', 'haiku', 'rap', 'riddle', 'trivia', 'chaos', 'banter', '8ball'].forEach(function (c) {
    cmds[c] = function (a) { var r = respond(c + ' ' + a.join(' ')); P('◉ ' + r.text.replace(/\|\|/g, '\n◉ ')); if (r.action) setTimeout(r.action, 600); };
  });
  cmds.persona = function (a) { var r = respond('mode ' + (a.join(' ') || 'list')); P('◉ ' + r.text); };
  cmds.calm = function () { chaosStop(); P('order restored.'); };
  FX.helpExtra = (FX.helpExtra || []).concat(['  persona <name>      pirate noir bard villain gremlin zen hype nan robot bossy', '  mission | rank      orders, xp, promotions', '  roast | banter      get roasted / start a battle (answer in chat)', '  tarot fortune scan  mystic services', '  trivia riddle       answer in chat or with: ask <answer>', '  chaos | calm        total mayhem / restore order']);
  FX.helpExtra = (FX.helpExtra || []).concat(['  chat | ask <text>   talk to the neural link', '  dossier | mood      what it knows / how it feels', '  snark quiet|normal|chatty']);
})();
