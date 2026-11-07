#!/usr/bin/env python3
"""
Generate card preview images + headline data for each notebook.
  pip install playwright && playwright install chromium
  python tools/make_previews.py
Writes assets/previews/<name>.jpg and data/previews.json (read by build.py).
Tables are hidden before the screenshot so ID tables / personal details don't end up in previews.
"""
import asyncio, json, sys
from pathlib import Path
from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
NB = ROOT / "notebooks"
OUT = ROOT / "assets" / "previews"
OUT.mkdir(parents=True, exist_ok=True)

HIDE_JS = """
() => {
  const host = document.getElementById('memo-archive-nav'); if (host) host.style.display = 'none';
  const ld = document.getElementById('memo-archive-load'); if (ld) ld.style.display = 'none';
  document.querySelectorAll('table').forEach(t => t.style.visibility = 'hidden');
}
"""
INFO_JS = """
() => {
  const hs = [...document.querySelectorAll('h1,h2,h3')].filter(h => h.textContent.trim());
  const h1 = document.querySelector('h1');
  return { headline: h1 ? h1.textContent.trim() : (hs[0] ? hs[0].textContent.trim() : ''),
           sections: hs.length };
}
"""

async def main():
    data = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for f in sorted(NB.glob("*.html")):
            pg = await b.new_page(viewport={"width": 760, "height": 440})
            try:
                await pg.goto(f.as_uri(), wait_until="load", timeout=120000)
                await pg.wait_for_timeout(3500)
                await pg.evaluate(HIDE_JS)
                info = await pg.evaluate(INFO_JS)
                await pg.screenshot(path=str(OUT / (f.stem + ".jpg")), type="jpeg", quality=62)
                data[f.name] = {**info, "preview": f"assets/previews/{f.stem}.jpg"}
                print("ok", f.name, info)
            except Exception as e:
                print("FAIL", f.name, e); 
            await pg.close()
        await b.close()
    (ROOT / "data" / "previews.json").write_text(json.dumps(data, indent=2), encoding="utf-8")

asyncio.run(main())
