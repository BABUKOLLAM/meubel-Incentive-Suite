# Incentive Board Manual

`Incentive-Board-Manual-v1.2.pdf` is the settings manual cum user manual for administrators and top management:
63 pages, A4, with a contents page carrying page numbers, a "How to read this document" page, one section per
page start, sticky notes, lenses, policy rules and gamification call-outs, numbered figures and running headers.

## Rebuild

The text lives in `manual.md` (exported from the shared Claude Doc), the layout in `manual.css`, the images in
`img/`. `build.py` renders the cover and the body with headless Chromium (Playwright), reads the page each
section starts on with `pdftotext`, renders again with those numbers in the contents, and joins the cover in front.

```
pip install nothing            # standard library only
npm i -g playwright && npx playwright install chromium
sudo apt-get install poppler-utils   # pdftotext, pdfunite
python3 build.py               # writes out/Incentive-Board-Manual-v1.2.pdf
```

Set `CHROME_PATH` if Chromium is not where Playwright expects it.
