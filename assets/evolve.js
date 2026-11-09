/* MEMO ARCHIVE — neural link evolution (reads rank from the eye, draws gear on it) */
(function () {
  var FX = window.ArchiveFX; if (!FX || !FX.rank) return;
  var eye = document.querySelector('.nl-eye'); if (!eye) return;
  var NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'svg'); g.setAttribute('class', 'nl-gear'); g.setAttribute('viewBox', '0 0 46 46'); eye.appendChild(g);
  var HP = '<path d="M6 24 A17 17 0 0 1 40 24"/><rect class="fl" x="2.5" y="20" width="6" height="12" rx="2.5"/><rect class="fl" x="37.5" y="20" width="6" height="12" rx="2.5"/>';
  var FORMS = [
    { n: 'unpaid intern', s: 1, d: 'a plain eye with a lanyard. the tag says INTERN. nobody reads it.', svg: '<path d="M18 43 L20 47 M28 43 L26 47"/><rect x="13" y="47" width="20" height="10" rx="1.5"/><text x="23" y="54.4" text-anchor="middle">INTERN</text>' },
    { n: 'script kiddie', s: 1, d: 'headphones. the eye is now "working". it is not working.', svg: HP },
    { n: 'bug botherer', s: 1.03, d: 'twin antennae for sniffing out bugs. both bobbing.', svg: '<path d="M16 5 Q12 -4 7 -8"/><circle class="fl" cx="7" cy="-8" r="2.3"/><path d="M30 5 Q34 -4 39 -8"/><circle class="fl" cx="39" cy="-8" r="2.3"/>' },
    { n: 'neon apprentice', s: 1.06, d: 'headphones and a monocle on a chain. distinguished. slightly pretentious.', svg: HP + '<circle cx="23" cy="23" r="17.5"/><path d="M39 31 Q46 43 37 53"/>' },
    { n: 'certified runner', s: 1.09, d: 'a baseball cap, brim forward, ready to run the net.', svg: '<path class="fl" d="M7 15 Q23 -9 39 15Z"/><path d="M33 13 L51 17 L47 21 L30 17Z" class="fl"/>' },
    { n: 'archive warden', s: 1.12, d: 'a peaked warden cap with a badge. keeper of the memos.', svg: '<path class="fl" d="M6 14 L10 -3 H36 L40 14Z" opacity=".9"/><rect class="fl" x="3" y="12" width="40" height="4" rx="1.5"/><circle cx="23" cy="5" r="3.2" style="stroke:#04060a;fill:#04060a;stroke-width:0" /><circle cx="23" cy="5" r="1.4" style="fill:currentColor;stroke:none"/>' },
    { n: 'glitch slayer', s: 1.16, d: 'a jagged glitch crown, red-hot, spitting sparks.', svg: '<path d="M5 15 L8 -4 L15 8 L23 -10 L31 8 L38 -4 L41 15" stroke-width="2"/><circle class="spark" cx="9" cy="-6" r="1.4"/><circle class="spark" cx="23" cy="-12" r="1.6"/><circle class="spark" cx="38" cy="-6" r="1.4"/>' },
    { n: 'cyber overlord', s: 1.22, d: 'a golden crown, an orbiting aura, absolute authority.', svg: '<circle class="aura" cx="23" cy="23" r="29"/><path class="fl" d="M7 14 L7 -3 L15 6 L23 -11 L31 6 L39 -3 L39 14Z"/><circle cx="23" cy="2" r="2" style="fill:#04060a;stroke:none"/><circle cx="12" cy="6" r="1.4" style="fill:#04060a;stroke:none"/><circle cx="34" cy="6" r="1.4" style="fill:#04060a;stroke:none"/>' }
  ];
  var cur = -1, preview = null;
  function apply(i) { var f = FORMS[Math.max(0, Math.min(FORMS.length - 1, i))]; g.innerHTML = f.svg; eye.style.setProperty('--evo', f.s); eye.setAttribute('data-evo', i); }
  function tick(first) {
    var r = FX.rank(), idx = preview != null ? preview : r.idx; if (idx === cur) return; var up = idx > cur && cur !== -1 && preview == null; cur = idx; apply(idx);
    if (up) { eye.classList.add('evolving'); setTimeout(function () { eye.classList.remove('evolving'); }, 1400); setTimeout(function () { FX.say && FX.say('EVOLUTION. i am now a ' + FORMS[idx].n + '. ' + FORMS[idx].d, true); }, 900); }
  }
  FX.evolveInfo = function () { var r = FX.rank(), f = FORMS[r.idx]; return 'form ' + (r.idx + 1) + '/' + FORMS.length + ': ' + f.n.toUpperCase() + '. ' + f.d + (r.next ? ' next form at ' + r.nextAt + ' xp (' + r.next + '), you are at ' + r.xp + '.' : ' final form. there is nothing above this. touch grass.'); };
  FX.evolvePreview = function (i) { preview = (i == null || isNaN(i)) ? null : Math.max(0, Math.min(FORMS.length - 1, i)); tick(); return preview == null ? 'back to your real form.' : 'previewing form ' + (preview + 1) + ': ' + FORMS[preview].n + ' (cosmetic only; earn it for real)'; };
  tick(true); setInterval(tick, 1500);
  var cmds = FX.cmds || {}, P = function (t) { FX.print && FX.print(t); };
  cmds.evolve = function (a) { var x = (a[0] || '').toLowerCase(); if (!x) return P(FX.evolveInfo()); if (x === 'reset') return P(FX.evolvePreview(null)); var n = parseInt(x, 10); if (n >= 1 && n <= FORMS.length) P(FX.evolvePreview(n - 1)); else P('usage: evolve [1-' + FORMS.length + '|reset]'); };
  FX.helpExtra = (FX.helpExtra || []).concat(['  evolve [1-8|reset]  your eye form (preview any form)']);
})();
