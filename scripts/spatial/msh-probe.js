/**
 * MSH probe — the tells of spatial hallucination that can be measured on
 * rendered pixels, with no baseline and no waiver.
 *
 * Paste into a page (or run through scripts/spatial/measure.mjs --expr) after
 * the route has settled. Returns plain numbers; deciding what they mean is the
 * reviewer's job. There is deliberately no "reason" field: a finding is either
 * fixed or it is a defect. (CLAUDE.md §11.12(b): an automated gate cannot waive
 * MSH, and a self-written reason is a waiver.)
 *
 *   chrome        header height as a share of the viewport (tell 1)
 *   boxes         interactive boxes with far more area than their label (tell 2)
 *   stretched     rows of >=3 controls that were widened to share a track (tell 3)
 *   occluded      text whose centre point is covered by something else (tell 9)
 *   scrolls       document height in viewport-heights (tell 4)
 *   sideways      the page scrolls horizontally
 */
(function mshProbe() {
  const vw = innerWidth, vh = innerHeight;
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return null;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return null;
    return r;
  };
  const sel = (el) => {
    const c = (el.className && el.className.toString().trim().split(/\s+/)[0]) || '';
    return el.tagName.toLowerCase() + (c ? '.' + c : '');
  };
  const textArea = (el) => {
    // area actually occupied by the element's own glyph boxes
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let a = 0, n;
    while ((n = w.nextNode())) {
      if (!n.nodeValue.trim()) continue;
      const rg = document.createRange();
      rg.selectNodeContents(n);
      for (const r of rg.getClientRects()) a += r.width * r.height;
    }
    return a;
  };

  // tell 1 — the masthead
  const hdr = document.querySelector('header');
  const hr = hdr && hdr.getBoundingClientRect();
  const chrome = hr ? { px: Math.round(hr.height), pct: +(100 * hr.height / vh).toFixed(1) } : null;

  // tell 2 — boxes bigger than their words
  const ctrl = [...document.querySelectorAll('a[href], button, summary, select, [role=tab], input:not([type=hidden])')];
  const boxes = [];
  for (const el of ctrl) {
    const r = vis(el);
    if (!r) continue;
    const t = textArea(el);
    if (!t) continue;               // icon-only controls are judged by eye
    if (el.querySelector('img,svg,video,canvas,picture')) continue;  // a media frame is sized by its picture, not its caption
    const ratio = (r.width * r.height) / t;
    if (ratio > 3 && r.width * r.height > 2500) {
      boxes.push({ el: sel(el), w: Math.round(r.width), h: Math.round(r.height), ratio: +ratio.toFixed(1),
        label: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28) });
    }
  }
  boxes.sort((a, b) => b.ratio - a.ratio);

  // tell 3 — stretch-to-fill: sibling controls of ~equal width, each far wider than its label
  const stretched = [];
  const seen = new Set();
  for (const el of ctrl) {
    const p = el.parentElement;
    if (!p || seen.has(p)) continue;
    seen.add(p);
    const kids = [...p.children].filter((k) => ctrl.includes(k) || k.matches('a,button'));
    if (kids.length < 3) continue;
    const rs = kids.map((k) => vis(k)).filter(Boolean);
    if (rs.length < 3) continue;
    const ws = rs.map((r) => r.width);
    const mean = ws.reduce((x, y) => x + y, 0) / ws.length;
    const equal = ws.every((w) => Math.abs(w - mean) < 2);
    const slack = kids.map((k, i) => {
      const t = textArea(k), r = rs[i];
      return t && r ? (r.width * r.height) / t : 0;
    });
    const avgSlack = slack.reduce((x, y) => x + y, 0) / slack.length;
    if (equal && avgSlack > 2.2 && mean > 120) {
      stretched.push({ row: sel(p), n: rs.length, w: Math.round(mean), slack: +avgSlack.toFixed(1) });
    }
  }

  // tell 9 — hidden information: visible text covered by another element
  const occluded = [];
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node, checked = 0;
  while ((node = tw.nextNode()) && checked < 2500) {
    const s = node.nodeValue.trim();
    if (s.length < 3) continue;
    const host = node.parentElement;
    if (!host || host.closest('script,style,noscript')) continue;
    const rg = document.createRange();
    rg.selectNodeContents(node);
    const r = rg.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
    if (!vis(host)) continue;
    checked++;
    const x = Math.min(vw - 1, Math.max(0, r.left + r.width / 2));
    const y = Math.min(vh - 1, Math.max(0, r.top + r.height / 2));
    const top = document.elementFromPoint(x, y);
    if (!top) continue;
    if (top === host || host.contains(top) || top.contains(host)) continue;
    // a label inside the same control is fine; a different, unrelated box is not
    occluded.push({ text: s.slice(0, 30), under: sel(top), host: sel(host) });
  }

  // tells 4 + sideways
  const docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  return {
    route: location.pathname, vw, vh,
    chrome,
    scrolls: +(docH / vh).toFixed(1),
    sideways: document.documentElement.scrollWidth > vw + 1,
    boxes: boxes.slice(0, 8), boxCount: boxes.length,
    stretched, occluded: occluded.slice(0, 6), occludedCount: occluded.length,
  };
})()
