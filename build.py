#!/usr/bin/env python3
"""
Build the Memo Archive site.

  1. Put your marimo HTML exports in  notebooks/
  2. Add them to GROUPS below (file name, label, optional description)
  3. python build.py
  4. git add . && git commit -m "update" && git push

What it does (safe to re-run any number of times):
  - generates index.html (landing page: directory, search, cards)
  - injects a small floating INDEX / PREV / NEXT widget into every notebook
    (inside a shadow DOM, so your cyberpunk CSS can't mangle it)
"""
import html, json, re, sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).parent
NB_DIR = ROOT / "notebooks"

SITE_TITLE   = "MEMO ARCHIVE"
SITE_TAGLINE = "> marimo notebooks // static exports"
SITE_LEDE    = "Read-only HTML snapshots of my marimo work. Pick a notebook from the directory."
# Optional: link back to the source repo / your profile. Leave "" to hide.
REPO_URL     = ""

# ── EDIT ME ──────────────────────────────────────────────────
GROUPS = [
    {"id": "memo-1", "name": "Memo 01", "blurb": "", "items": [
        {"file": "memo1_original.html",    "label": "Original",    "desc": ""},
        {"file": "memo1_amendment_1.html", "label": "Amendment 1", "desc": ""},
        {"file": "memo1_amendment_2.html", "label": "Amendment 2", "desc": ""},
    ]},
    {"id": "memo-2", "name": "Memo 02", "blurb": "", "items": [
        {"file": "memo2_original.html", "label": "Original",   "desc": ""},
        {"file": "memo2_supp.html",     "label": "Supplement", "desc": ""},
    ]},
    {"id": "memo-3", "name": "Memo 03", "blurb": "", "items": [
        {"file": "memo3.html", "label": "Workbook", "desc": ""},
    ]},
]
# ─────────────────────────────────────────────────────────────

MARK_START, MARK_END = "<!-- memo-archive-nav:start -->", "<!-- memo-archive-nav:end -->"


def human_size(n: int) -> str:
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


# ── Injected widget (shadow DOM) ─────────────────────────────
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
    .wrap { position: fixed; left: 16px; bottom: 16px; z-index: 2147483000;
            font-family: 'Share Tech Mono', ui-monospace, Consolas, monospace; }
    .tab, .row a, .step a {
      font: 400 11px 'Share Tech Mono', ui-monospace, Consolas, monospace;
      letter-spacing: .14em; text-transform: uppercase; text-decoration: none;
    }
    .tab { cursor: pointer; padding: 9px 14px; color: #00f5ff; background: rgba(8,11,18,.94);
           border: 1px solid rgba(0,245,255,.55); border-radius: 3px;
           box-shadow: 0 0 12px rgba(0,245,255,.25); transition: all .15s; }
    .tab:hover { background: rgba(0,245,255,.12); box-shadow: 0 0 16px rgba(0,245,255,.5); }
    .menu { display: none; margin-bottom: 10px; width: 290px; max-height: 70vh; overflow-y: auto;
            background: rgba(8,11,18,.97); border: 1px solid rgba(0,245,255,.55); border-radius: 6px;
            box-shadow: 0 0 22px rgba(0,245,255,.25); padding: 12px; }
    .wrap.open .menu { display: block; }
    .grp { color: #b44dff; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; margin: 12px 0 5px; }
    .grp:first-of-type { margin-top: 2px; }
    .row a { display: block; padding: 7px 10px; color: #8a9ab8; border-left: 2px solid rgba(0,245,255,.15); transition: all .15s; }
    .row a:hover { color: #00f5ff; border-left-color: #00f5ff; background: rgba(0,245,255,.06); }
    .row a.cur { color: #ff2d78; border-left-color: #ff2d78; background: rgba(255,45,120,.07); pointer-events: none; }
    .home { display: block; padding: 8px 10px; margin-bottom: 4px; color: #00ff9f; text-decoration: none;
            font: 400 11px 'Share Tech Mono', monospace; letter-spacing: .14em; text-transform: uppercase;
            border: 1px solid rgba(0,255,159,.4); border-radius: 3px; text-align: center; }
    .home:hover { background: rgba(0,255,159,.1); }
    .step { display: flex; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(0,245,255,.15); }
    .step a, .step span { flex: 1; text-align: center; padding: 7px 4px; border-radius: 3px; }
    .step a { color: #00f5ff; border: 1px solid rgba(0,245,255,.4); }
    .step a:hover { background: rgba(0,245,255,.1); }
    .step span { color: #3b4658; border: 1px solid rgba(255,255,255,.07); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; }
  `;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]; }); }

  var html = '<div class="menu"><a class="home" href="' + HOME + '">&#9664; Back to index</a>';
  var lastGroup = null;
  MANIFEST.forEach(function (m, i) {
    if (m.group !== lastGroup) { html += '<div class="grp">' + esc(m.group) + '</div>'; lastGroup = m.group; }
    html += '<div class="row"><a href="' + esc(m.file) + '"' + (i === idx ? ' class="cur"' : '') + '>' + esc(m.label) + '</a></div>';
  });
  html += '<div class="step">' +
    (prev ? '<a href="' + esc(prev.file) + '">&#9664; Prev</a>' : '<span>&#9664; Prev</span>') +
    (next ? '<a href="' + esc(next.file) + '">Next &#9654;</a>' : '<span>Next &#9654;</span>') +
    '</div></div><div class="tab" role="button" tabindex="0">&#9636; Index</div>';

  root.innerHTML = '<style>' + css + '</style><div class="wrap">' + html + '</div>';

  var wrap = root.querySelector(".wrap");
  var tab = root.querySelector(".tab");
  function toggle() { wrap.classList.toggle("open"); }
  tab.addEventListener("click", toggle);
  tab.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") wrap.classList.remove("open"); });
})();
"""


def widget_block() -> str:
    manifest = [{"file": i["file"], "label": i["label"], "group": i["group"]} for i in flat_items()]
    js = WIDGET_JS.replace("__MANIFEST__", json.dumps(manifest))
    return f'{MARK_START}<div id="memo-archive-nav"></div><script>{js}</script>{MARK_END}'


def inject(path: Path, block: str) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(re.escape(MARK_START) + r".*?" + re.escape(MARK_END), "", text, flags=re.S)
    i = text.rfind("</body>")
    text = text[:i] + block + text[i:] if i != -1 else text + block
    path.write_text(text, encoding="utf-8")


# ── Landing page ─────────────────────────────────────────────
def build_index() -> str:
    rail, sections = [], []
    total = 0
    for g in GROUPS:
        links = "".join(
            f'<a class="rail-link" href="notebooks/{html.escape(it["file"])}">{html.escape(it["label"])}</a>'
            for it in g["items"]
        )
        rail.append(
            f'<div class="rail-group"><div class="rail-group-name">'
            f'<a href="#{g["id"]}" style="color:inherit !important;border:none !important">{html.escape(g["name"])}</a></div>{links}</div>'
        )
        cards = []
        for it in g["items"]:
            p = NB_DIR / it["file"]
            size = human_size(p.stat().st_size) if p.exists() else "missing"
            total += 1
            search = f'{g["name"]} {it["label"]} {it["desc"]} {it["file"]}'.lower()
            desc = f'<div class="card-desc">{html.escape(it["desc"])}</div>' if it["desc"] else ""
            cards.append(
                f'<a class="card-link cp-card" href="notebooks/{html.escape(it["file"])}" data-search="{html.escape(search)}">'
                f'<div class="card-tag">{html.escape(g["name"])}</div>'
                f'<div class="card-name">{html.escape(it["label"])}</div>{desc}'
                f'<div class="card-meta"><span class="size">{size}</span><span class="go">OPEN &#9654;</span></div></a>'
            )
        blurb = f'<p class="blurb">{html.escape(g["blurb"])}</p>' if g["blurb"] else ""
        sections.append(
            f'<section class="group" id="{g["id"]}"><h2>{html.escape(g["name"])}'
            f'<span class="count">{len(g["items"])} FILE{"S" if len(g["items"]) != 1 else ""}</span></h2>'
            f'{blurb}<div class="cards">{"".join(cards)}</div></section>'
        )

    repo = f'<a href="{html.escape(REPO_URL)}">SOURCE</a>' if REPO_URL else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(SITE_TITLE)}</title>
<link rel="stylesheet" href="assets/cyberpunk-marimo.css">
<link rel="stylesheet" href="assets/site.css">
</head>
<body>
<div class="shell">
  <div class="rail" role="navigation" aria-label="Directory">
    <a class="brand" href="#top">{html.escape(SITE_TITLE)}<small>// DIRECTORY</small></a>
    <div class="cp-label">Notebooks</div>
    {"".join(rail)}
  </div>

  <main class="main" id="top">
    <header class="hero">
      <h1>{html.escape(SITE_TITLE)}</h1>
      <span class="cp-type cp-type--hot cp-type--long">{html.escape(SITE_TAGLINE)}</span>
      <p class="lede">{html.escape(SITE_LEDE)}</p>
    </header>

    <div class="search-row">
      <span class="cp-label">Filter</span>
      <input type="search" id="q" placeholder="type to filter notebooks…" autocomplete="off">
      <span class="result-count" id="count">{total} / {total}</span>
    </div>

    {"".join(sections)}
    <div class="empty" id="empty">&gt; NO MATCHES FOUND</div>

    <footer class="foot"><span>BUILT {date.today().isoformat()} // {total} NOTEBOOKS</span><span>{repo}</span></footer>
  </main>
</div>

<script>
(function () {{
  var q = document.getElementById('q'), count = document.getElementById('count'), empty = document.getElementById('empty');
  var cards = [].slice.call(document.querySelectorAll('.card-link'));
  var groups = [].slice.call(document.querySelectorAll('.group'));
  function filter() {{
    var term = q.value.trim().toLowerCase(), shown = 0;
    cards.forEach(function (c) {{
      var ok = !term || c.dataset.search.indexOf(term) !== -1;
      c.hidden = !ok; if (ok) shown++;
    }});
    groups.forEach(function (g) {{ g.hidden = !g.querySelector('.card-link:not([hidden])'); }});
    count.textContent = shown + ' / ' + cards.length;
    empty.classList.toggle('show', shown === 0);
  }}
  q.addEventListener('input', filter);
  // "/" focuses the filter box
  document.addEventListener('keydown', function (e) {{
    if (e.key === '/' && document.activeElement !== q) {{ e.preventDefault(); q.focus(); }}
  }});

  // scroll-spy for the rail
  var links = {{}};
  [].forEach.call(document.querySelectorAll('.rail-group-name a'), function (a) {{ links[a.getAttribute('href').slice(1)] = a.closest('.rail-group'); }});
  var io = new IntersectionObserver(function (entries) {{
    entries.forEach(function (en) {{
      if (en.isIntersecting) {{
        Object.keys(links).forEach(function (k) {{ links[k].querySelector('.rail-group-name').style.textShadow = ''; }});
        var el = links[en.target.id];
        if (el) el.querySelector('.rail-group-name').style.textShadow = '0 0 10px rgba(180,77,255,.9)';
      }}
    }});
  }}, {{ rootMargin: '-20% 0px -70% 0px' }});
  groups.forEach(function (g) {{ io.observe(g); }});
}})();
</script>
</body>
</html>
"""


def main() -> int:
    missing = [i["file"] for i in flat_items() if not (NB_DIR / i["file"]).exists()]
    if missing:
        print("Missing from notebooks/:", ", ".join(missing))
        return 1
    known = {i["file"] for i in flat_items()}
    extra = sorted(p.name for p in NB_DIR.glob("*.html") if p.name not in known)
    if extra:
        print("Heads up, not listed in GROUPS (left untouched):", ", ".join(extra))

    block = widget_block()
    for it in flat_items():
        inject(NB_DIR / it["file"], block)
        print("  nav injected:", it["file"])
    (ROOT / "index.html").write_text(build_index(), encoding="utf-8")
    print("  wrote index.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
