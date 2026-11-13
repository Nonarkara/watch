import { readFileSync } from 'node:fs';

const exclusions = JSON.parse(readFileSync(new URL('../../data/shared/portrait_exclusions.json', import.meta.url), 'utf8'));
const commonsHosts = new Set(['commons.wikimedia.org', 'upload.wikimedia.org', 'thumb.wikimedia.org']);
const key = name => name.replace(/^File:/i, '').replace(/_/g, ' ').normalize('NFC').toLowerCase();
const excluded = new Set(Object.keys(exclusions).map(key));

export function isExcludedPortrait(...urls) {
  return urls.some(value => {
    if (!value) return false;
    try {
      const url = new URL(value);
      if (!commonsHosts.has(url.hostname)) return false;
      // Thumbnails contain the original file title before the sized filename.
      return url.pathname.split('/').some(part => excluded.has(key(decodeURIComponent(part))));
    } catch {
      return false;
    }
  });
}
