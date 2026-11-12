// Read legacy and range media-query widths, including minified CSS.
export function widthBreakpointTerms(query) {
  const out = [];
  const length = String.raw`([\d.]+)\s*(px|rem|em)`;
  const comparison = '[<>]=?|=';
  const legacy = new RegExp(String.raw`^(?:min|max)-width\s*:\s*${length}$`, 'i');
  const range = new RegExp(String.raw`^(?:${length}\s*(?:${comparison})\s*)?width(?:\s*(?:${comparison})\s*${length})?$`, 'i');
  for (const [, term] of query.matchAll(/\(([^()]*)\)/g)) {
    const match = legacy.exec(term.trim()) ?? range.exec(term.trim());
    if (!match) continue;
    for (let i = 1; i < match.length; i += 2) {
      const n = Number(match[i]);
      if (Number.isFinite(n) && n > 0) out.push({ value: n, unit: match[i + 1].toLowerCase() });
    }
  }
  return out;
}

export function widthBreakpoints(query) {
  return widthBreakpointTerms(query).map(({ value, unit }) => Math.round(unit === 'px' ? value : value * 16));
}
