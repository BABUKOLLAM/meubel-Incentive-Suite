#!/usr/bin/env python3
"""Build the Incentive Board Manual as a print-ready PDF from the doc's markdown export.

Pass 1 renders the body without page numbers in the contents; pdftotext then tells us the page
each section starts on; pass 2 renders with the numbers; the cover (no header/footer) is joined in front.
"""
import re, json, subprocess, sys, html, os

HERE = os.path.dirname(os.path.abspath(__file__))
MD = open(os.path.join(HERE, 'manual.md'), encoding='utf-8').read()

# ---------- image mapping: placeholder alt text -> file ----------
IMG = [
    ('The header', '18-header.png'), ('Group lens', '01-group.png'), ('Company lens', '02-company.png'),
    ('Branch lens', '03-branch.png'), ('Team lens, Sales', '04-team-sales.png'), ('Team lens, CRE', '21-team-cre.png'),
    ('Individual lens', '05-person-sales.png'), ('Total view', '17-total.png'), ("A Branch Manager's view", '19-bm-view.png'),
    ("An employee's view", '22-employee-view.png'), ('The leaderboard:', '06-leaderboard.png'), ('TV mode', '32-tv-mode.png'),
    ('badge wall', '23-badge-wall.png'), ('badge ladder', '24-badge-ladder.png'), ('Sales leaderboard with the badges', '25-leaderboard-badges.png'),
    ('messages matrix', '08-messages-matrix.png'), ('weekly BM email', '07-messages-email.png'), ('weekly team WhatsApp', '08b-messages-wa.png'),
    ("employee's WhatsApp summary", '20-person-whatsapp.png'), ('Settings: pools', '09-settings.png'), ('Scorecard weights', '10b-settings-weights.png'),
    ('Data inputs', '10-settings-data.png'), ('Policy versions', '11-admin-policy.png'), ('Adjustments:', '12-admin-adjust.png'),
    ('Wirings', '13-admin-wiring.png'), ('Jobs and status', '14-admin-jobs.png'), ('Month close', '15-admin-close.png'),
    ('printed statement', '30-statement.png'), ('history card', '27-person-history.png'), ('Audit log', '16-admin-audit.png'),
]
def png_size(path):
    with open(os.path.join(HERE, path), 'rb') as fh:
        head = fh.read(24)
    return int.from_bytes(head[16:20], 'big'), int.from_bytes(head[20:24], 'big')
def is_tall(path):
    w, h = png_size(path)
    return h / w > 1.0

def img_file(alt):
    for key, f in IMG:
        if key.lower() in alt.lower():
            return 'img/' + f
    return None

# ---------- inline markdown ----------
def inline(s):
    s = s.replace('&#91;', '[').replace('\\]', ']').replace('\\[', '[').replace('\\*', '*').replace('\\_', '_')
    s = html.escape(s, quote=False)
    s = re.sub(r'`([^`]+)`', r'<code>\1</code>', s)
    s = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'<a href="\2">\1</a>', s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])', r'<em>\1</em>', s)
    return s

def highlight(s):
    """Marker-pen highlight on the figures that carry a rule: rupees, percentages, counts of days."""
    return re.sub(r'((?:₹\s?[\d,]+(?:\.\d+)?(?:\s?(?:L|Cr))?)|(?:\d+(?:\.\d+)?\s?%)|(?:\b\d+(?:\.\d+)?\s?(?:days?|pp|points?)\b))', r'<mark>\1</mark>', s)

# ---------- block parsing ----------
lines = MD.split('\n')
blocks = []  # (kind, payload)
i = 0
def flush_para(buf):
    if buf:
        blocks.append(('p', ' '.join(buf)))
buf = []
while i < len(lines):
    ln = lines[i]
    if ln.startswith('## '):
        flush_para(buf); buf = []; blocks.append(('h2', ln[3:].strip())); i += 1; continue
    if ln.startswith('### '):
        flush_para(buf); buf = []; blocks.append(('h3', ln[4:].strip())); i += 1; continue
    if ln.startswith('# '):
        flush_para(buf); buf = []; i += 1; continue
    if ln.startswith('|'):
        flush_para(buf); buf = []
        rows = []
        while i < len(lines) and lines[i].startswith('|'):
            cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?', c) for c in cells):
                rows.append(cells)
            i += 1
        blocks.append(('table', rows)); continue
    if ln.startswith('> '):
        flush_para(buf); buf = []
        q = []
        while i < len(lines) and lines[i].startswith('>'):
            q.append(lines[i][1:].strip()); i += 1
        blocks.append(('quote', ' '.join(x for x in q if x))); continue
    m = re.match(r'^(\d+)\. (.*)', ln)
    if m:
        flush_para(buf); buf = []
        items = []
        while i < len(lines) and re.match(r'^\d+\. ', lines[i]):
            items.append(re.sub(r'^\d+\. ', '', lines[i])); i += 1
        blocks.append(('ol', items)); continue
    if ln.startswith('- '):
        flush_para(buf); buf = []
        items = []
        while i < len(lines) and lines[i].startswith('- '):
            items.append(lines[i][2:]); i += 1
        blocks.append(('ul', items)); continue
    m = re.match(r'^&#91;image: (.*)\\\]$', ln)
    if m:
        flush_para(buf); buf = []; blocks.append(('img', m.group(1))); i += 1; continue
    if ln.startswith('&#91;embedded content'):
        flush_para(buf); buf = []; blocks.append(('diagram', 'The data path: seven feeds, one tracker, one engine, four outputs')); i += 1; continue
    if ln.strip() == '':
        flush_para(buf); buf = []; i += 1; continue
    buf.append(ln.strip()); i += 1
flush_para(buf)

# ---------- split: cover material, contents (regenerated), sections ----------
cover_blocks, sections, cur = [], [], None
state = 'cover'
for kind, pl in blocks:
    if kind == 'h2':
        t = pl
        if 'Contents' in t and state in ('cover', 'contents'):
            state = 'contents'; continue
        m = re.match(r'^(\S+)\s+(\d+)\.\s+(.*)$', t)
        if m:
            state = 'body'
            cur = {'icon': m.group(1), 'num': int(m.group(2)), 'title': m.group(3), 'blocks': []}
            sections.append(cur); continue
        if state == 'cover':
            continue  # the cover's own h2
    if state == 'cover':
        cover_blocks.append((kind, pl))
    elif state == 'contents':
        pass  # regenerated with page numbers
    else:
        cur['blocks'].append((kind, pl))

reader_table = next(pl for kind, pl in cover_blocks if kind == 'table')
credit = next(pl for kind, pl in cover_blocks if kind == 'p' and pl.startswith('Designed'))
lede = [pl for kind, pl in cover_blocks if kind == 'p' and pl.startswith('One board')] or ['']
# the last section carries the colophon logo placeholder: keep it small

# ---------- renderers ----------
fig_no = [0]
def render_table(rows, cls=''):
    head, body = rows[0], rows[1:]
    numeric = [all(re.fullmatch(r'[\d.,%₹+\-−×÷ /a-z]*\d[\d.,%₹+\-−×÷ /a-z]*', r[j]) or r[j] == '' for r in body if j < len(r)) and any(j < len(r) and r[j] for r in body) and len(head[j]) < 14 for j in range(len(head))]
    out = ['<table class="%s"><thead><tr>' % cls]
    for j, h in enumerate(head):
        out.append('<th class="%s">%s</th>' % ('num' if numeric[j] else '', inline(h)))
    out.append('</tr></thead><tbody>')
    for r in body:
        out.append('<tr>')
        for j in range(len(head)):
            c = r[j] if j < len(r) else ''
            out.append('<td class="%s">%s</td>' % ('num' if numeric[j] else '', inline(c)))
        out.append('</tr>')
    out.append('</tbody></table>')
    return ''.join(out)

QUOTE_KINDS = [('📌', 'sticky', 'Sticky note'), ('🔍', 'lens', 'Lens'), ('⚠️', 'policy', 'Policy rule'), ('🎮', 'game', 'Gamification')]
def render_quote(text):
    kind, label, icon = 'note', 'Note', '📝'
    for ic, k, l in QUOTE_KINDS:
        if text.startswith(ic):
            kind, label, icon = k, l, ic
            text = text[len(ic):].strip()
            break
    # drop the bold lead that repeats the label ("**Sticky note.**", "**Lens tip.**", "**Policy rule.**", "**Gamification in one line.**")
    m = re.match(r'^\*\*([^*]+)\*\*\s*(.*)$', text, re.S)
    lead = ''
    if m:
        lead_txt = m.group(1).rstrip('.')
        if lead_txt.lower().startswith(label.lower().split()[0]) or lead_txt.lower() in ('lens tip', 'last note'):
            label = lead_txt
            text = m.group(2)
        else:
            lead = '<strong>%s.</strong> ' % inline(lead_txt)
            text = m.group(2)
    body = inline(text)
    if kind in ('sticky', 'policy'):
        body = highlight(body)
    return '<aside class="call %s"><div class="tag"><span class="ic">%s</span>%s</div><p>%s%s</p></aside>' % (kind, icon, html.escape(label), lead, body)

def render_blocks(bl, sec):
    out = []
    prev_h3 = ''
    held = None  # an h3 waiting to see whether a full-page figure follows it
    def h3_html(pl):
        m = re.match(r'^(\d+\.\d+)\s+(.*)$', pl)
        if m:
            return '<h3><span class="n">%s</span>%s</h3>' % (m.group(1), inline(m.group(2)))
        if pl.lower().startswith('procedure:'):
            return '<h3 class="proc"><span class="n">▶</span>%s</h3>' % inline(pl)
        return '<h3>%s</h3>' % inline(pl)
    def flush_held():
        nonlocal held
        if held:
            out.append(held); held = None
    for kind, pl in bl:
        if kind == 'h3':
            flush_held()
            prev_h3 = pl
            held = h3_html(pl)
            continue
        if kind == 'img' and pl.strip() != 'Bpro':
            f = img_file(pl)
            if not f:
                print('no image for', pl, file=sys.stderr); continue
            fig_no[0] += 1
            fig = '<figure class="%s"><img src="%s" alt="%s"><figcaption><b>Figure %d.</b> %s</figcaption></figure>' % ('tall' if is_tall(f) else '', f, html.escape(pl, True), fig_no[0], inline(pl))
            if is_tall(f) and held:
                out.append('<div class="plate">%s%s</div>' % (held, fig)); held = None
            else:
                flush_held(); out.append(fig)
            continue
        flush_held()
        if kind == 'p':
            if sec['num'] in (13, 14) and pl.startswith('**'):
                m = re.match(r'^\*\*(.+?)\*\*\s*(.*)$', pl, re.S)
                out.append('<div class="qa"><div class="q"><span class="chip">Q</span>%s</div><div class="a">%s</div></div>' % (inline(m.group(1)), inline(m.group(2))))
            elif pl.startswith('**Procedure:'):
                m = re.match(r'^\*\*(.+?)\*\*\s*(.*)$', pl, re.S)
                out.append('<h3 class="proc"><span class="n">▶</span>%s</h3>' % inline(m.group(1)))
                if m.group(2).strip():
                    out.append('<p>%s</p>' % inline(m.group(2)))
            else:
                out.append('<p>%s</p>' % inline(pl))
        elif kind == 'table':
            cls = 'badges' if ('Badge' in pl[0][0] or 'Element' in pl[0][0]) else ('wide' if len(pl[0]) >= 6 else '')
            out.append(render_table(pl, cls))
        elif kind == 'quote':
            out.append(render_quote(pl))
        elif kind == 'ol':
            cls = 'steps' if ('procedure' in prev_h3.lower() or sec['num'] in (3, 7, 8, 9, 10, 15)) else ''
            out.append('<ol class="%s">%s</ol>' % (cls, ''.join('<li><span>%s</span></li>' % inline(x) for x in pl)))
        elif kind == 'ul':
            out.append('<ul>%s</ul>' % ''.join('<li>%s</li>' % inline(x) for x in pl))
        elif kind == 'img':
            out.append('<p class="logo-line"><img src="img/bpro.png" alt="Bpro"></p>')
        elif kind == 'diagram':
            fig_no[0] += 1
            out.append('<figure class="dia"><img src="img/diagram.png" alt="%s"><figcaption><b>Figure %d.</b> %s</figcaption></figure>' % (pl, fig_no[0], pl))
    flush_held()
    return '\n'.join(out)

CSS = open(os.path.join(HERE, 'manual.css'), encoding='utf-8').read()

def page_shell(body, title='Incentive Board Manual'):
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>%s</title><style>%s</style></head><body>%s</body></html>' % (title, CSS, body)

LEGEND = [
    ('📌', 'sticky', 'Sticky note', 'The one thing to remember from the section. Read these alone and you have the programme.'),
    ('🔍', 'lens', 'Lens', 'What to look at on the screen, and how to read it.'),
    ('⚠️', 'policy', 'Policy rule', 'A rule the board enforces that no setting can override.'),
    ('🎮', 'game', 'Gamification', 'A recognition element: medals, movement, badges. Never a rupee.'),
]

def build_body(toc_pages):
    parts = []
    # ---- contents
    parts.append('<section class="toc"><h2 class="plain"><span class="ic">📑</span>Contents</h2><ol class="toc-list">')
    for s in sections:
        pg = toc_pages.get(s['num'], '')
        parts.append('<li><span class="tn">%d</span><span class="ti"><span class="ic">%s</span>%s</span><span class="dots"></span><span class="tp">%s</span></li>' % (s['num'], s['icon'], inline(s['title']), pg))
    parts.append('</ol>')
    # sub-contents: h3 numbered under each section, compact two columns
    parts.append('<div class="toc-sub"><h3 class="plain">Sections in detail</h3><div class="cols">')
    for s in sections:
        h3s = [pl for k, pl in s['blocks'] if k == 'h3' and re.match(r'^\d+\.\d+', pl)]
        if not h3s: continue
        parts.append('<div class="tocg"><b>%d. %s</b><ul>%s</ul></div>' % (s['num'], inline(s['title']), ''.join('<li>%s</li>' % inline(x) for x in h3s)))
    parts.append('</div></div></section>')
    # ---- how to read
    parts.append('<section class="howto"><h2 class="plain"><span class="ic">🧭</span>How to read this document</h2>')
    parts.append('<p class="lede">%s</p>' % inline(lede[0]))
    parts.append('<h3 class="plain">Where to start</h3>' + render_table(reader_table))
    parts.append('<h3 class="plain">The four call-outs</h3><div class="legend">')
    for ic, k, l, d in LEGEND:
        parts.append('<aside class="call %s"><div class="tag"><span class="ic">%s</span>%s</div><p>%s</p></aside>' % (k, ic, l, d))
    parts.append('</div>')
    parts.append('<h3 class="plain">Conventions</h3><ul class="conv">'
                 '<li><mark>Highlighted figures</mark> inside sticky notes and policy rules are the values that decide a payout; each is editable in ⚙️ Settings unless marked as a policy rule.</li>'
                 '<li><b>Figure n.</b> numbers every screenshot; all are from the sample build, so names, branches and rupee amounts are generated.</li>'
                 '<li><span class="chip-inline">▶ Procedure</span> marks step-by-step instructions for administrators, to be followed in order; <span class="chip-inline">Q</span> marks a question in the FAQ and RAQ.</li>'
                 '<li>Each numbered section starts on a new page and can be handed out alone; the contents page numbers match the footer. Board, Lens, Settings and Admin in the contents name the screen a section is about.</li>'
                 '</ul></section>')
    # ---- sections
    fig_no[0] = 0
    for s in sections:
        parts.append('<section class="sec" data-sec="%d"><div class="band"><span class="num">%d</span><h2><span class="ic">%s</span>%s</h2><span class="marker">[[SEC%d]]</span></div>' % (s['num'], s['num'], s['icon'], inline(s['title']), s['num']))
        parts.append(render_blocks(s['blocks'], s))
        parts.append('</section>')
    return page_shell('<main>' + '\n'.join(parts) + '</main>')

def build_cover():
    body = '''<div class="cover">
  <div class="cv-top"><img class="logo" src="img/bpro.png" alt="Bpro"><div class="cv-brand">Bpro Consulting &amp; Technologies<br><small>HRMS · PMS · LMS · Consulting · Process.ai</small></div></div>
  <div class="cv-mid">
    <div class="eyebrow">Meubel Grande · Royal Group</div>
    <h1>Incentive Board<br>Manual</h1>
    <p class="sub"><strong>Settings manual and user manual</strong> for administrators and top management<br>Release 1.2 · October 2026</p>
    <div class="cv-strip">%s</div>
  </div>
  <div class="cv-bottom">
    <p class="credit">%s</p>
    <p class="fine">Screenshots are from the sample build: every name, branch and rupee figure is generated. Policy values are the 19 September 2026 draft's placeholders until leadership confirms them in Settings.</p>
  </div>
</div>''' % (''.join('<span class="cv-chip %s">%s %s</span>' % (k, ic, l) for ic, k, l, d in LEGEND), inline(credit))
    return page_shell(body, 'Incentive Board Manual · cover').replace('</style>', '@page { margin: 0; }</style>')

def render_pdf(html_path, pdf_path, header=True):
    js = os.path.join(HERE, 'render.js')
    subprocess.run(['node', js, html_path, pdf_path, '1' if header else '0'], check=True)

def page_map(pdf_path):
    txt = subprocess.run(['pdftotext', pdf_path, '-'], capture_output=True, text=True, check=True).stdout
    pages = txt.split(chr(12))
    found = {}
    for s in sections:
        for n, pg in enumerate(pages, 1):
            if ('[[SEC%d]]' % s['num']) in pg.replace(chr(10), ''):
                found[s['num']] = n; break
    return found, len(pages)

if __name__ == '__main__':
    out = os.path.join(HERE, 'out'); os.makedirs(out, exist_ok=True)
    cover_html = os.path.join(HERE, 'cover.html'); open(cover_html, 'w', encoding='utf-8').write(build_cover())
    render_pdf(cover_html, os.path.join(out, 'cover.pdf'), header=False)
    pages = {}
    for p in range(3):
        body_html = os.path.join(HERE, 'body.html'); open(body_html, 'w', encoding='utf-8').write(build_body(pages))
        render_pdf(body_html, os.path.join(out, 'body.pdf'))
        new, total = page_map(os.path.join(out, 'body.pdf'))
        print('pass', p + 1, 'pages', total, 'sections found', len(new), 'of', len(sections))
        if new == pages: break
        pages = new
    final = os.path.join(out, 'Incentive-Board-Manual-v1.2.pdf')
    subprocess.run(['pdfunite', os.path.join(out, 'cover.pdf'), os.path.join(out, 'body.pdf'), final], check=True)
    print('wrote', final, json.dumps(pages))
