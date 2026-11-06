import { useEffect, useRef, useState } from 'react';

/**
 * The city the page is standing in.
 *
 * One name, one place. The layer behind the page is Bangkok at night by
 * default — the site is Thai — and a reader can put the page in Tokyo, New
 * York or London instead. The choice is remembered, because a reader who
 * picked a city did not pick it for one visit.
 */

export type CitySummary = {
  slug: string;
  name: string;
  country: string;
  where: string;
};

const STORAGE_KEY = 'watch.city';
const FALLBACK: CitySummary = { slug: 'bangkok', name: 'Bangkok', country: 'Thailand', where: 'Sukhumvit' };

export function useCity(): [CitySummary, (slug: string) => void, CitySummary[]] {
  const [cities, setCities] = useState<CitySummary[]>([FALLBACK]);
  const [current, setCurrent] = useState<CitySummary>(FALLBACK);

  useEffect(() => {
    let alive = true;
    fetch('/data/city/index.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d || !Array.isArray(d.cities) || !d.cities.length) return;
        setCities(d.cities);
        const saved = localStorage.getItem(STORAGE_KEY);
        const pick = d.cities.find((c: CitySummary) => c.slug === saved) || d.cities[0];
        setCurrent(pick);
      })
      .catch(() => { /* Bangkok stands */ });
    return () => { alive = false; };
  }, []);

  const choose = (slug: string) => {
    const pick = cities.find((c) => c.slug === slug);
    if (!pick) return;
    setCurrent(pick);
    try { localStorage.setItem(STORAGE_KEY, pick.slug); } catch { /* private mode */ }
  };

  return [current, choose, cities];
}

export function CityToggle({
  current,
  cities,
  onPick,
}: {
  current: CitySummary;
  cities: CitySummary[];
  onPick: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  if (cities.length < 2) return null;

  return (
    <div className="city-toggle" ref={ref}>
      <button
        type="button"
        className="city-toggle-btn mono"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        title={`The page stands in ${current.name}. Change the city.`}
      >
        {current.name.toUpperCase()}
      </button>
      {open && (
        <ul className="city-toggle-menu" role="listbox" aria-label="City">
          {cities.map((c) => (
            <li key={c.slug} role="option" aria-selected={c.slug === current.slug}>
              <button
                type="button"
                className={'city-toggle-item mono' + (c.slug === current.slug ? ' on' : '')}
                onClick={() => { onPick(c.slug); setOpen(false); }}
              >
                {c.name.toUpperCase()}
                <span className="dim"> · {c.where.toUpperCase()}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
