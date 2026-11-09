/* Top Gear entrance: a button with ever-changing lore name -> full-screen trio + music -> visor wipe -> topgear.html */
(function () {
  var NAMES = ['SOME SAY THIS BUTTON HAS NEVER BEEN PRESSED', 'IGNITE THE REASONABLY PRICED POWAAAAH BUTTON', 'ENTER THE CAPTAIN SLOW CARAVAN OF SHAME', 'THE COOL WALL IS NOT COOL (CLICK ANYWAY)', 'HAMMOND HAS ALREADY CRASHED THIS BUTTON', 'ALL WE KNOW IS, IT\u2019S CALLED THE BUTTON', 'TAME RACING BUTTON: FASTEST LAP, ZERO DIGNITY', 'THE UNOFFICIAL HOLY TRINITY EXPERIENCE (TENT NOT INCLUDED)'];
  var st = document.createElement('style');
  st.textContent = 'button.tg-btn{position:fixed;left:14px;bottom:62px;z-index:61;max-width:290px;padding:8px 12px!important;background:#ffd200!important;color:#000!important;border:2px solid #000!important;font:bold 11px Impact,"Arial Narrow",sans-serif!important;text-transform:uppercase!important;letter-spacing:.06em!important;text-align:left!important;box-shadow:4px 4px 0 #e4002b;cursor:pointer}' +
    '.tg-ov{position:fixed;inset:0;z-index:10400;background:#000;overflow:hidden;animation:tgin .5s}.tg-ov *{text-transform:none!important}@keyframes tgin{from{opacity:0}}' +
    '.tg-ph{position:absolute;inset:0;animation:tgz 7s ease-out forwards}@keyframes tgz{from{transform:scale(1)}to{transform:scale(1.18)}}' +
    '.tg-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' +
    '.tg-cap{position:absolute;left:0;right:0;bottom:9vh;text-align:center;color:#ffd200!important;font:900 clamp(34px,7vw,110px) Impact,"Arial Narrow",sans-serif!important;letter-spacing:.06em;text-shadow:4px 4px 0 #000,0 0 30px #e4002b;text-transform:uppercase!important}' +
    '.tg-fl{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}.tg-fl.on{animation:tgf .6s}@keyframes tgf{0%{opacity:1}100%{opacity:0}}' +
    '.tg-vis{position:absolute;inset:0;pointer-events:none}.tg-vis:before,.tg-vis:after{content:"";position:absolute;left:0;right:0;height:50%;background:#111 repeating-linear-gradient(90deg,#222 0 10px,#111 10px 20px);transition:transform .7s cubic-bezier(.7,0,.2,1)}.tg-vis:before{top:0;transform:translateY(-100%)}.tg-vis:after{bottom:0;transform:translateY(100%)}.tg-vis.on:before,.tg-vis.on:after{transform:none}' +
    'button.tg-skip{position:absolute;top:12px;right:12px;padding:5px 12px!important;background:rgba(0,0,0,.6)!important;color:#fff!important;border:1px solid #fff!important;font:12px Arial,sans-serif!important}';
  document.head.appendChild(st);
  var b = document.createElement('button'), i = 0; b.className = 'tg-btn'; b.textContent = NAMES[0]; document.body.appendChild(b);
  setInterval(function () { b.textContent = NAMES[++i % NAMES.length]; }, 3500);

  var ctx = null;
  function synth() {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)(); var t = ctx.currentTime;
      var o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(); o.type = 'sawtooth'; f.type = 'lowpass'; f.frequency.value = 400;
      o.frequency.setValueAtTime(38, t); o.frequency.exponentialRampToValueAtTime(110, t + 1.6); o.frequency.exponentialRampToValueAtTime(60, t + 3); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.35, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
      o.connect(f); f.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 3.5);
      [262, 330, 392, 523, 392, 523, 659].forEach(function (n, k) { var q = ctx.createOscillator(), h = ctx.createGain(), s = t + 2.6 + k * 0.28; q.type = 'square'; q.frequency.value = n; h.gain.setValueAtTime(0.0001, s); h.gain.linearRampToValueAtTime(0.12, s + 0.03); h.gain.exponentialRampToValueAtTime(0.0001, s + 0.3); q.connect(h); h.connect(ctx.destination); q.start(s); q.stop(s + 0.32); });
    } catch (e) {}
  }
  b.onclick = function () {
    var o = document.createElement('div'); o.className = 'tg-ov';
    o.innerHTML = '<div class="tg-ph">' + window.TGsil() + '<img alt=""></div><div class="tg-cap">The Holy Trinity</div><div class="tg-fl"></div><div class="tg-vis"></div><button class="tg-skip">skip</button>';
    document.body.appendChild(o);
    var img = o.querySelector('img'); img.onerror = function () { img.remove(); }; img.src = 'assets/topgear/trio.jpg';
    var au = new Audio('assets/topgear/intro.mp3'), done = false;
    function go() { if (done) return; done = true; try { au.pause(); if (ctx) ctx.close(); } catch (e) {} location.href = 'topgear.html'; }
    var p = au.play(); if (p && p.catch) p.catch(synth); au.onerror = synth;
    o.querySelector('.tg-skip').onclick = go;
    setTimeout(function () { o.querySelector('.tg-fl').classList.add('on'); }, 5200);
    setTimeout(function () { o.querySelector('.tg-vis').classList.add('on'); }, 5700);
    setTimeout(go, 6600);
  };
})();
