#!/usr/bin/env python3
"""
Build the Memo Archive site.

  1. Put your marimo HTML exports in  notebooks/
  2. Add them to GROUPS below
  3. (optional, after adding/changing notebooks)  python tools/make_previews.py
  4. python build.py
  5. git add . && git commit -m "update" && git push

Safe to re-run any number of times. Generates:
  index.html, 404.html, and injects the INDEX / sections / prev-next widget into each notebook.
"""
import html, json, re, sys
from datetime import date
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).parent
NB_DIR = ROOT / "notebooks"

SITE_TITLE   = "MEMO ARCHIVE"
SITE_TAGLINE = "> marimo notebooks // static exports"
SITE_LEDE    = "Read-only HTML snapshots of my marimo work. Pick a notebook, hit Ctrl+K, or open the terminal with the ` key."
REPO_URL     = ""   # optional link shown in the footer

# ── EDIT ME ──────────────────────────────────────────────────
# status: original | amendment | supplement | workbook   (controls the badge colour; shown as its text)
# date:   optional, e.g. "2026-09-14" (shown on the timeline)
# desc:   optional one-liner (replaces the auto headline on the card)
# redacted: True  -> the card's description is blacked out until hover
GROUPS = [
    {"id": "memo-1", "name": "Memo 01", "blurb": "", "items": [
        {"file": "memo1_original.html",    "label": "Original",    "status": "original",   "date": "", "desc": "", "redacted": False},
        {"file": "memo1_amendment_1.html", "label": "Amendment 1", "status": "amendment",  "date": "", "desc": "", "redacted": False},
        {"file": "memo1_amendment_2.html", "label": "Amendment 2", "status": "amendment",  "date": "", "desc": "", "redacted": False},
    ]},
    {"id": "memo-2", "name": "Memo 02", "blurb": "", "items": [
        {"file": "memo2_original.html", "label": "Original",   "status": "original",   "date": "", "desc": "", "redacted": False},
        {"file": "memo2_supp.html",     "label": "Supplement", "status": "supplement", "date": "", "desc": "", "redacted": False},
    ]},
    {"id": "memo-3", "name": "Memo 03", "blurb": "", "items": [
        {"file": "memo3.html", "label": "Workbook", "status": "workbook", "date": "", "desc": "", "redacted": False},
    ]},
]

# About panel: (key, value). Tokens: {{redacted:TEXT}}  {{classified:TEXT}}  reveal on hover.
ABOUT = {
    "handle": "OPERATOR",
    "lines": [
        ("stack", "python + marimo"),
        ("hosting", "github pages"),
        ("theme", "cyberpunk-marimo.css"),
        ("mission", "{{classified:OPERATION EMBERLIGHT}}"),
        ("clearance", "{{redacted:LEVEL-5}}"),
    ],
}
CHANGELOG = [
    ("v3.0", "2026-11-07", "previews, status badges, timeline, section jump-list, terminal, rain, sound, page wipes, 404"),
    ("v2.0", "2026-11-07", "boot sequence, HUD, spotlight cards, command palette, hue switcher"),
    ("v1.0", "2026-11-07", "landing page, directory rail, notebook nav widget"),
]
# ─────────────────────────────────────────────────────────────

MARK_START, MARK_END = "<!-- memo-archive-nav:start -->", "<!-- memo-archive-nav:end -->"
STATUS_LABEL = {"original": "ORIGINAL", "amendment": "AMENDED", "supplement": "SUPPLEMENT", "workbook": "WORKBOOK"}

LOGO_SVG = ('<svg class="logo" viewBox="0 0 48 48" aria-hidden="true">'
            '<polygon class="hex" points="24,3 43,14 43,34 24,45 5,34 5,14"/>'
            '<path class="mm" d="M14 33V15l10 11 10-11v18"/></svg>')
FAVICON = "data:image/svg+xml," + quote(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><rect width='48' height='48' fill='#080b12'/>"
    "<polygon points='24,3 43,14 43,34 24,45 5,34 5,14' fill='none' stroke='#00f5ff' stroke-width='3'/>"
    "<path d='M14 33V15l10 11 10-11v18' fill='none' stroke='#ff2d78' stroke-width='3'/></svg>")


def human_size(n):
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.0f} {unit}" if unit in ("B", "KB") else f"{n:.1f} {unit}"
        n /= 1024


def flat_items():
    out = []
    for g in GROUPS:
        for it in g["items"]:
            out.append({**it, "group": g["name"], "group_id": g["id"]})
    return out


def load_previews():
    p = ROOT / "data" / "previews.json"
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {}


def tokens(text, plain=False):
    """Escape + expand {{redacted:X}} / {{classified:X}}."""
    def sub(m):
        kind, val = m.group(1), m.group(2)
        if plain:
            return "[CLASSIFIED]" if kind == "classified" else "[REDACTED]"
        cls = "cp-redacted cp-redacted--hot" if kind == "classified" else "cp-redacted"
        return f'<span class="{cls}">{html.escape(val)}</span>'
    if plain:
        return re.sub(r"\{\{(redacted|classified):(.*?)\}\}", sub, text)
    parts, last, out = re.finditer(r"\{\{(redacted|classified):(.*?)\}\}", text), 0, ""
    for m in parts:
        out += html.escape(text[last:m.start()]) + sub(m); last = m.end()
    return out + html.escape(text[last:])


# ── Injected widget (shadow DOM): index menu, sections, prev/next, wipe ──
WIDGET_JS = r"""
(function () {
  var MANIFEST = __MANIFEST__;
  var HOME = "../index.html";
  var here = decodeURIComponent(location.pathname.split("/").pop() || "");
  var idx = MANIFEST.findIndex(function (m) { return m.file === here; });
  var prev = idx > 0 ? MANIFEST[idx - 1] : null;
  var next = idx >= 0 && idx < MANIFEST.length - 1 ? MANIFEST[idx + 1] : null;

  var host = document.getElementById("memo-archive-nav");
  if (!host || host.shadowRoot) return;
  var root = host.attachShadow({ mode: "open" });

  var css = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .wrap { position: fixed; left: 16px; bottom: 16px; z-index: 2147483000; font-family: 'Share Tech Mono', ui-monospace, Consolas, monospace; }
    .tab, .row a, .step a, .sec, .sech {
      font: 400 11px 'Share Tech Mono', ui-monospace, Consolas, monospace; letter-spacing: .14em; text-transform: uppercase; text-decoration: none;
    }
    .tab { cursor: pointer; padding: 9px 14px; color: #00f5ff; background: rgba(8,11,18,.94); border: 1px solid rgba(0,245,255,.55);
           border-radius: 3px; box-shadow: 0 0 12px rgba(0,245,255,.25); transition: all .15s; }
    .tab:hover { background: rgba(0,245,255,.12); box-shadow: 0 0 16px rgba(0,245,255,.5); }
    .menu { display: none; margin-bottom: 10px; width: 300px; max-height: 72vh; overflow-y: auto; background: rgba(8,11,18,.97);
            border: 1px solid rgba(0,245,255,.55); border-radius: 6px; box-shadow: 0 0 22px rgba(0,245,255,.25); padding: 12px; }
    .wrap.open .menu { display: block; }
    .grp { color: #b44dff; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; margin: 12px 0 5px; }
    .grp:first-of-type { margin-top: 2px; }
    .row a { display: block; padding: 7px 10px; color: #8a9ab8; border-left: 2px solid rgba(0,245,255,.15); transition: all .15s; }
    .row a:hover { color: #00f5ff; border-left-color: #00f5ff; background: rgba(0,245,255,.06); }
    .row a.cur { color: #ff2d78; border-left-color: #ff2d78; background: rgba(255,45,120,.07); pointer-events: none; }
    .home { display: block; padding: 8px 10px; margin-bottom: 4px; color: #00ff9f; text-decoration: none; font: 400 11px 'Share Tech Mono', monospace;
            letter-spacing: .14em; text-transform: uppercase; border: 1px solid rgba(0,255,159,.4); border-radius: 3px; text-align: center; }
    .home:hover { background: rgba(0,255,159,.1); }
    .step { display: flex; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(0,245,255,.15); }
    .step a, .step span { flex: 1; text-align: center; padding: 7px 4px; border-radius: 3px; }
    .step a { color: #00f5ff; border: 1px solid rgba(0,245,255,.4); }
    .step a:hover { background: rgba(0,245,255,.1); }
    .step span { color: #3b4658; border: 1px solid rgba(255,255,255,.07); }
    .sech { display: flex; justify-content: space-between; cursor: pointer; margin-top: 12px; padding: 8px 10px; color: #f7ff00;
            border: 1px solid rgba(247,255,0,.3); border-radius: 3px; }
    .sech:hover { background: rgba(247,255,0,.07); }
    .secs { display: none; margin-top: 6px; max-height: 240px; overflow-y: auto; border-left: 1px solid rgba(247,255,0,.2); }
    .secs.show { display: block; }
    .sec { display: block; cursor: pointer; padding: 5px 8px; color: #8a9ab8; font-size: 10px; letter-spacing: .08em; text-transform: none;
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sec:hover { color: #f7ff00; background: rgba(247,255,0,.05); }
    .sec.l2 { padding-left: 20px; } .sec.l3 { padding-left: 32px; opacity: .85; }
  `;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]; }); }

  var html = '<div class="menu"><a class="home" href="' + HOME + '">&#9664; Back to index</a>';
  var lastGroup = null;
  MANIFEST.forEach(function (m, i) {
    if (m.group !== lastGroup) { html += '<div class="grp">' + esc(m.group) + '</div>'; lastGroup = m.group; }
    html += '<div class="row"><a href="' + esc(m.file) + '"' + (i === idx ? ' class="cur"' : '') + '>' + esc(m.label) + '</a></div>';
  });
  html += '<div class="sech"><span>&sect; Sections</span><span class="sn">&hellip;</span></div><div class="secs"></div>';
  html += '<div class="step">' +
    (prev ? '<a href="' + esc(prev.file) + '">&#9664; Prev</a>' : '<span>&#9664; Prev</span>') +
    (next ? '<a href="' + esc(next.file) + '">Next &#9654;</a>' : '<span>Next &#9654;</span>') +
    '</div></div><div class="tab" role="button" tabindex="0">&#9636; Index</div>';

  root.innerHTML = '<style>' + css + '</style><div class="wrap">' + html + '</div>';

  var wrap = root.querySelector(".wrap"), tab = root.querySelector(".tab");
  var secs = root.querySelector(".secs"), sech = root.querySelector(".sech"), sn = root.querySelector(".sn");
  var built = false, heads = [];

  function buildSections() {
    heads = [].slice.call(document.querySelectorAll("h1,h2,h3")).filter(function (h) {
      return h.textContent.trim() && !host.contains(h) && h.getClientRects().length;
    }).slice(0, 120);
    secs.innerHTML = "";
    heads.forEach(function (h, i) {
      var d = document.createElement("div");
      d.className = "sec l" + h.tagName.charAt(1);
      d.textContent = h.textContent.trim().replace(/\s+/g, " ");
      d.addEventListener("click", function () { h.scrollIntoView({ behavior: "smooth", block: "start" }); wrap.classList.remove("open"); });
      secs.appendChild(d);
    });
    sn.textContent = heads.length; built = true;
  }
  function toggle() {
    wrap.classList.toggle("open");
    if (wrap.classList.contains("open") && !built) buildSections();
  }
  tab.addEventListener("click", toggle);
  tab.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  sech.addEventListener("click", function () { if (!built) buildSections(); secs.classList.toggle("show"); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") wrap.classList.remove("open"); });

  /* page-transition wipe for links leaving this notebook */
  function wipe(href) {
    var o = document.createElement("div");
    o.style.cssText = "position:fixed;inset:0;z-index:2147483600;background:#04060a;pointer-events:all;" +
      "border-top:3px solid #00f5ff;box-shadow:0 0 40px #00f5ff;transform:translateY(-101%)";
    document.body.appendChild(o);
    if (!o.animate) { location.href = href; return; }
    o.animate([{ transform: "translateY(-101%)" }, { transform: "translateY(0)" }], { duration: 260, easing: "ease-in", fill: "forwards" });
    setTimeout(function () { location.href = href; }, 270);
    window.addEventListener("pageshow", function () { o.remove(); }, { once: true });
  }
  root.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); wipe(a.getAttribute("href"));
  });
})();
"""


def widget_block():
    manifest = [{"file": i["file"], "label": i["label"], "group": i["group"]} for i in flat_items()]
    js = WIDGET_JS.replace("__MANIFEST__", json.dumps(manifest))
    return f'{MARK_START}<div id="memo-archive-nav"></div><script>{js}</script>{MARK_END}'


def inject(path, block):
    text = path.read_text(encoding="utf-8")
    text = re.sub(re.escape(MARK_START) + r".*?" + re.escape(MARK_END), "", text, flags=re.S)
    i = text.rfind("</body>")
    text = text[:i] + block + text[i:] if i != -1 else text + block
    path.write_text(text, encoding="utf-8")


# ── Landing page ─────────────────────────────────────────────
INDEX_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__SITE_TITLE__</title>
<meta name="description" content="__LEDE__">
<meta property="og:title" content="__SITE_TITLE__"><meta property="og:description" content="__LEDE__">
<link rel="icon" href="__FAVICON__">
<link rel="stylesheet" href="assets/cyberpunk-marimo.css">
<link rel="stylesheet" href="assets/site.css">
<script>try{if(!sessionStorage.getItem("booted"))document.documentElement.classList.add("booting")}catch(e){}</script>
</head>
<body>
<div class="boot" id="boot" aria-hidden="true"><pre id="boot-log"></pre><span class="caret"></span><div class="skip">PRESS ANY KEY TO SKIP</div></div>
<canvas id="rain" aria-hidden="true"></canvas>
<div class="wipe" id="wipe"></div>
<div class="shell">
  <div class="rail" role="navigation" aria-label="Directory">
    <a class="brand" href="#top">__LOGO__<span class="brand-name">__SITE_TITLE__</span><small>// DIRECTORY</small></a>
    <div class="cp-label">Notebooks</div>
    __RAIL__
    <div class="rail-group"><div class="rail-group-name">Extras</div>
      <a class="rail-link" href="#timeline">Timeline</a><a class="rail-link" href="#about">About</a><a class="rail-link" href="#changelog">Changelog</a></div>
    <div class="cp-label">FX</div>
    <div class="pills">
      <i class="pill" role="button" tabindex="0" data-fx="rain">Rain</i>
      <i class="pill" role="button" tabindex="0" data-fx="sound">Sound</i>
      <i class="pill" role="button" tabindex="0" data-fx="crt">CRT</i>
    </div>
    <div class="cp-label">Hue</div>
    <div class="swatches">
      <i class="swatch on" role="button" tabindex="0" data-hue="cyan" title="Cyan" style="background:#00f5ff;color:#00f5ff"></i>
      <i class="swatch" role="button" tabindex="0" data-hue="violet" title="Violet" style="background:#b44dff;color:#b44dff"></i>
      <i class="swatch" role="button" tabindex="0" data-hue="amber" title="Amber" style="background:#ffb000;color:#ffb000"></i>
      <i class="swatch" role="button" tabindex="0" data-hue="green" title="Green" style="background:#00ff9f;color:#00ff9f"></i>
    </div>
    <div class="rail-hint"><kbd>CTRL</kbd>+<kbd>K</kbd> <a id="open-pal" href="#" onclick="return false" style="border:none !important">JUMP TO&hellip;</a><br>
      <kbd>`</kbd> <a id="open-term" href="#" onclick="return false" style="border:none !important">TERMINAL</a><br><kbd>/</kbd> FILTER</div>
  </div>

  <main class="main" id="top">
    <header class="hero">
      <h1>__SITE_TITLE__</h1>
      <span class="cp-type cp-type--hot tagline" style="--w:__TLEN__ch;--n:__TLEN__">__TAGLINE__</span>
      <p class="lede">__LEDE__</p>
    </header>

    <div class="hud">
      <div class="hud-tile"><div class="hud-k">Notebooks</div><div class="hud-v">__TOTAL2__</div></div>
      <div class="hud-tile"><div class="hud-k">Payload</div><div class="hud-v">__PAYLOAD__</div></div>
      <div class="hud-tile"><div class="hud-k">Time</div><div class="hud-v" id="hud-clock">--:--:--</div></div>
      <div class="hud-tile"><div class="hud-k">Status</div><div class="hud-v"><span class="dot"></span>ONLINE</div></div>
    </div>

    <div class="search-row">
      <span class="cp-label">Filter</span>
      <input type="search" id="q" placeholder="type to filter notebooks…" autocomplete="off">
      <span class="result-count" id="count">__TOTAL__ / __TOTAL__</span>
    </div>

    __SECTIONS__
    <div class="empty" id="empty">&gt; NO MATCHES FOUND</div>

    <section class="group" id="timeline">
      <h2>Timeline<span class="count">__TOTAL__ STEPS</span></h2>
      <p class="blurb">How the work evolved, in order.</p>
      <ol class="tl">__TIMELINE__</ol>
    </section>

    <section class="group" id="about">
      <h2>About<span class="count">// <span id="about-handle">__HANDLE__</span></span></h2>
      <div class="term-box">__ABOUT__</div>
    </section>

    <section class="group" id="changelog">
      <h2>Changelog</h2>
      <div class="term-box">__CHANGELOG__</div>
    </section>

    <footer class="foot"><span>BUILT __TODAY__ // __TOTAL__ NOTEBOOKS</span><span>__REPO__</span></footer>
  </main>
</div>

<script id="archive-data" type="application/json">__DATA__</script>
<script>
(function () {
  var q = document.getElementById('q'), count = document.getElementById('count'), empty = document.getElementById('empty');
  var cards = [].slice.call(document.querySelectorAll('.card-link'));
  var groups = [].slice.call(document.querySelectorAll('.group[data-nb]'));
  function filter() {
    var term = q.value.trim().toLowerCase(), shown = 0;
    cards.forEach(function (c) { var ok = !term || c.dataset.search.indexOf(term) !== -1; c.hidden = !ok; if (ok) shown++; });
    groups.forEach(function (g) { g.hidden = !g.querySelector('.card-link:not([hidden])'); });
    count.textContent = shown + ' / ' + cards.length;
    empty.classList.toggle('show', shown === 0);
  }
  q.addEventListener('input', filter);
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== q && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); q.focus(); }
  });
  var links = {};
  [].forEach.call(document.querySelectorAll('.rail-group-name a'), function (a) { links[a.getAttribute('href').slice(1)] = a.closest('.rail-group'); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        Object.keys(links).forEach(function (k) { links[k].querySelector('.rail-group-name').style.textShadow = ''; });
        var el = links[en.target.id]; if (el) el.querySelector('.rail-group-name').style.textShadow = '0 0 10px rgba(180,77,255,.9)';
      }
    });
  }, { rootMargin: '-20% 0px -70% 0px' });
  groups.forEach(function (g) { io.observe(g); });
  // timeline reveal
  var tio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); tio.unobserve(e.target); } }); }, { threshold: .25 });
  [].forEach.call(document.querySelectorAll('.tl li'), function (li) { tio.observe(li); });
})();
</script>
<script src="assets/site.js"></script>
<script src="assets/extras.js"></script>
</body>
</html>
"""


def build_index():
    pv = load_previews()
    rail, sections, timeline, items_data = [], [], [], []
    total, total_bytes, step = 0, 0, 0
    for g in GROUPS:
        links = "".join(
            f'<a class="rail-link" href="notebooks/{html.escape(it["file"])}">{html.escape(it["label"])}</a>' for it in g["items"])
        rail.append(f'<div class="rail-group"><div class="rail-group-name">'
                    f'<a href="#{g["id"]}" style="color:inherit !important;border:none !important">{html.escape(g["name"])}</a></div>{links}</div>')
        cards = []
        for it in g["items"]:
            p = NB_DIR / it["file"]
            size = human_size(p.stat().st_size) if p.exists() else "missing"
            total += 1; step += 1
            total_bytes += p.stat().st_size if p.exists() else 0
            info = pv.get(it["file"], {})
            headline = it.get("desc") or info.get("headline", "")
            status = it.get("status", "workbook")
            badge = f'<span class="badge st-{status}">{STATUS_LABEL.get(status, status.upper())}</span>'
            search = f'{g["name"]} {it["label"]} {headline} {it["file"]} {status}'.lower()
            img = (f'<div class="card-shot"><img src="{html.escape(info["preview"])}" alt="" loading="lazy">{badge}</div>'
                   if info.get("preview") else f'<div class="card-shot card-shot--none">{badge}</div>')
            if headline:
                inner = html.escape(headline)
                if it.get("redacted"):
                    inner = f'<span class="cp-redacted">{inner}</span>'
                desc = f'<div class="card-desc">{inner}</div>'
            else:
                desc = ""
            sec = f'{info["sections"]} SECTIONS' if info.get("sections") else size
            cards.append(
                f'<a class="card-link cp-card" href="notebooks/{html.escape(it["file"])}" data-search="{html.escape(search)}">'
                f'{img}<div class="card-tag">{html.escape(g["name"])}</div>'
                f'<div class="card-name">{html.escape(it["label"])}</div>{desc}'
                f'<div class="card-meta"><span class="size">{size} &middot; {sec}</span><span class="go">OPEN &#9654;</span></div></a>')
            when = f'<span class="tl-date">{html.escape(it["date"])}</span>' if it.get("date") else ""
            timeline.append(
                f'<li><a href="notebooks/{html.escape(it["file"])}"><div class="tl-step">STEP {step:02d} // {html.escape(g["name"])} // {html.escape(it["label"])}</div>'
                f'<div class="tl-name">{html.escape(headline or it["label"])}</div>'
                f'<div class="tl-meta">{badge}{when}<span class="size">{size}</span></div></a></li>')
            items_data.append({"name": it["label"], "tag": g["name"], "href": f'notebooks/{it["file"]}', "file": it["file"],
                               "size": size, "status": STATUS_LABEL.get(status, status.upper()), "headline": headline})
        blurb = f'<p class="blurb">{html.escape(g["blurb"])}</p>' if g["blurb"] else ""
        sections.append(
            f'<section class="group" id="{g["id"]}" data-nb="1"><h2>{html.escape(g["name"])}'
            f'<span class="count">{len(g["items"])} FILE{"S" if len(g["items"]) != 1 else ""}</span></h2>'
            f'{blurb}<div class="cards">{"".join(cards)}</div></section>')

    about = "".join(f'<div class="term-line"><span class="k">{html.escape(k)}</span> <span class="dots">........</span> <span class="v">{tokens(v)}</span></div>'
                    for k, v in ABOUT["lines"])
    about += f'<div class="term-line"><span class="k">notebooks</span> <span class="dots">........</span> <span class="v">{total}</span></div>'
    clog = "".join(f'<div class="term-line"><span class="k">{html.escape(v)}</span> <span class="dots">//</span> <span class="v">{html.escape(d)}</span> <span class="dots">//</span> {html.escape(t)}</div>'
                   for v, d, t in CHANGELOG)

    data = json.dumps({"items": items_data, "title": SITE_TITLE,
                       "about": [[k, tokens(v, plain=True)] for k, v in ABOUT["lines"]] + [["notebooks", str(total)]],
                       "handle": ABOUT["handle"]}).replace("</", "<\\/")
    repl = {
        "__SITE_TITLE__": html.escape(SITE_TITLE), "__LEDE__": html.escape(SITE_LEDE, quote=True), "__FAVICON__": FAVICON,
        "__LOGO__": LOGO_SVG, "__RAIL__": "".join(rail), "__TAGLINE__": html.escape(SITE_TAGLINE), "__TLEN__": str(len(SITE_TAGLINE)),
        "__TOTAL2__": f"{total:02d}", "__PAYLOAD__": human_size(total_bytes), "__TOTAL__": str(total),
        "__SECTIONS__": "".join(sections), "__TIMELINE__": "".join(timeline), "__ABOUT__": about, "__CHANGELOG__": clog,
        "__HANDLE__": html.escape(ABOUT["handle"]), "__TODAY__": date.today().isoformat(), "__DATA__": data,
        "__REPO__": f'<a href="{html.escape(REPO_URL)}">SOURCE</a>' if REPO_URL else "",
    }
    out = INDEX_TEMPLATE
    for k, v in repl.items():
        out = out.replace(k, v)
    return out


# ── 404 page (CSS inlined so it works at any depth) ──────────
NOTFOUND_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 // SIGNAL LOST</title><link rel="icon" href="__FAVICON__">
<style>
__CSS__
.lost { position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
        padding: 8vw; max-width: 900px; }
.lost h1 { font-size: clamp(5rem, 22vw, 12rem) !important; line-height: .9; margin: 0 !important; border-bottom: none !important; }
.lost h2 { margin: .5rem 0 1.5rem !important; }
.lost pre { font: 400 14px/1.7 var(--cp-font-mono) !important; color: var(--cp-neon-green) !important; background: none !important; border: none !important; padding: 0 !important; margin: 0 0 2rem !important; white-space: pre-wrap; }
.lost a.back { display: inline-block; padding: 12px 22px; font: 700 12px var(--cp-font-display); letter-spacing: .14em; text-transform: uppercase;
        border: 1px solid var(--cp-neon-magenta) !important; color: var(--cp-neon-magenta) !important; border-radius: 3px; transition: all .15s; }
.lost a.back:hover { background: rgba(255,45,120,.12); box-shadow: 0 0 20px rgba(255,45,120,.5); color: #fff !important; }
</style></head>
<body>
<div class="lost">
  <h1>404</h1>
  <h2>SIGNAL LOST</h2>
  <pre id="log"></pre>
  <a class="back" id="home" href="/">&#9664; Return to index</a>
</div>
<script>
(function () {
  var base = "/";
  if (/\.github\.io$/.test(location.hostname)) { var seg = location.pathname.split("/")[1]; if (seg) base = "/" + seg + "/"; }
  document.getElementById("home").href = base;
  var lines = ["> request .......... " + location.pathname, "> resolving ........ FAILED", "> nearest node ..... " + base + "index.html", "> advice ........... go back, runner"];
  var el = document.getElementById("log"), i = 0;
  (function tick() { if (i < lines.length) { el.textContent += (i ? "\n" : "") + lines[i++]; setTimeout(tick, 260); } })();
})();
</script></body></html>
"""


def build_404():
    css = (ROOT / "assets" / "cyberpunk-marimo.css").read_text(encoding="utf-8") + "\n" + (ROOT / "assets" / "site.css").read_text(encoding="utf-8")
    return NOTFOUND_TEMPLATE.replace("__FAVICON__", FAVICON).replace("__CSS__", css)


def main():
    missing = [i["file"] for i in flat_items() if not (NB_DIR / i["file"]).exists()]
    if missing:
        print("Missing from notebooks/:", ", ".join(missing)); return 1
    known = {i["file"] for i in flat_items()}
    extra = sorted(p.name for p in NB_DIR.glob("*.html") if p.name not in known)
    if extra:
        print("Heads up, not listed in GROUPS (left untouched):", ", ".join(extra))
    if not (ROOT / "data" / "previews.json").exists():
        print("Tip: run  python tools/make_previews.py  to generate card previews.")
    block = widget_block()
    for it in flat_items():
        inject(NB_DIR / it["file"], block)
        print("  nav injected:", it["file"])
    (ROOT / "index.html").write_text(build_index(), encoding="utf-8"); print("  wrote index.html")
    (ROOT / "404.html").write_text(build_404(), encoding="utf-8");     print("  wrote 404.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
