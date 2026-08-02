// Targeted image verifier for Asia cards. We try direct title lookups
// against file names that exist on Commons photographer pages (EMore98,
// OpaleHorse, Clyde94, Pittigrilli, Mostra-store, and the Openverse
// watch category).

import { writeFileSync } from 'node:fs'

const ACCEPTED = new Set([
  'CC0', 'PD', 'PUBLIC DOMAIN',
  'CC BY 2.0', 'CC BY 3.0', 'CC BY 4.0',
  'CC BY-SA 2.0', 'CC BY-SA 2.5', 'CC BY-SA 3.0', 'CC BY-SA 4.0',
])

const normLicense = (raw) => {
  if (!raw) return null
  const v = raw.trim().toUpperCase()
  if (v.includes('CC0') || v === 'PUBLIC DOMAIN' || v === 'PD') return 'CC0'
  if (v.startsWith('CC BY-SA')) {
    const m = v.match(/CC BY-SA (\d+\.\d+)/)
    return m ? `CC BY-SA ${m[1]}` : 'CC BY-SA 4.0'
  }
  if (v.startsWith('CC BY')) {
    const m = v.match(/CC BY (\d+\.\d+)/)
    return m ? `CC BY ${m[1]}` : 'CC BY 4.0'
  }
  return null
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getInfo(title) {
  const enc = encodeURIComponent(title).replace(/%2F/g, '/')
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${enc}&prop=imageinfo&iiprop=url|extmetadata&format=json`
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'WatchRegister/1.0 (https://watch.nonarkara.org)' } })
      if (res.status === 429) { await sleep(20000 * (attempt + 1)); continue }
      if (!res.ok) return null
      const data = await res.json()
      const pages = data.query?.pages ?? {}
      for (const p of Object.values(pages)) if (p.imageinfo) return p.imageinfo[0]
      return null
    } catch {
      if (attempt === 3) return null
      await sleep(3000 * (attempt + 1))
    }
  }
  return null
}

// Targeted titles per card. We list the most likely file names — many of
// these were discovered by browsing the photographer pages on Commons
// (search is rate-limited so direct lookup is more reliable).
const TITLES = {
  // Seiko Prospex 1965 Heritage / SPB
  'seiko-spb313j1': ['Seiko SPB313.jpg', 'Seiko Prospex SPB313.jpg', 'Seiko 62MAS 1965 reissue SPB313.jpg'],
  'seiko-spb451j1': ['Seiko SPB451.jpg', 'Seiko Prospex 1965 SPB451.jpg'],
  'seiko-sla069j1': ['Seiko SLA069.jpg', 'Seiko Prospex 1965 cement SLA069.jpg'],
  'seiko-sbdx101j': ['Seiko SBDX101.jpg', 'Seiko Marinemaster 600m SBDX101.jpg', 'Seiko Marinemaster 600 SBDX101.jpg'],
  'seiko-sary200j': ['Seiko SARY200.jpg', 'Seiko Presage Sharp Edged SARY200.jpg'],
  'king-seiko-sje109j1': ['King Seiko SJE109.jpg', 'King Seiko KS1969 SJE109.jpg'],

  // Grand Seiko
  'grandseiko-slgw003': ['Grand Seiko SLGW003.jpg', 'Grand Seiko Genbi SLGW003.jpg', 'Grand Seiko 9SA4 SLGW003.jpg'],
  'grandseiko-sbge201': ['Grand Seiko SBGE201.jpg', 'Grand Seiko Spring Drive GMT SBGE201.jpg'],
  'grandseiko-sbga413g': ['Grand Seiko SBGA413G.jpg', 'Grand Seiko Shunbun gold SBGA413G.jpg'],
  'grandseiko-sbgc249': ['Grand Seiko SBGC249.jpg', 'Grand Seiko Chronograph Spring Drive SBGC249.jpg'],
  'grandseiko-sbga405': ['Grand Seiko SBGA405.jpg', 'Grand Seiko Snowflake Titanium SBGA405.jpg'],

  // Casio
  'casio-gm-b2100': ['Casio GM-B2100.jpg', 'Casio G-Shock Full Metal GM-B2100.jpg', 'Casio GM-B2100D-1A.jpg'],
  'casio-gw-5000u-1jf': ['Casio GW-5000U.jpg', 'Casio G-Shock 5000 GW-5000U.jpg'],
  'casio-gw-m5610u-1jf': ['Casio GW-M5610U.jpg', 'Casio G-Shock 5600 GW-M5610U.jpg'],
  'casio-ocw-t4000a-1jf': ['Casio Oceanus OCW-T4000.jpg', 'Casio Oceanus Manta OCW-T4000.jpg'],

  // Asian indie (likely no CC images — try anyway)
  'credor-gc9950': ['Credor Eichi II.jpg', 'Credor Eichi.jpg', 'Credor GC9950.jpg'],
  'naoya-hida-type-6d': ['Naoya Hida Type 6.jpg', 'Naoya Hida Type 6D.jpg'],
  'hajime-asaoka-tsunami': ['Hajime Asaoka Tsunami.jpg'],
  'kurono-tokyo-seigaiha': ['Kurono Seigaiha.jpg', 'Kurono Tokyo Seigaiha.jpg'],
  'minase-7-windows': ['Minase 7 Windows.jpg', 'Minase Divido.jpg'],

  // Trinity / high-end
  'patek-philippe-5235': ['Patek Philippe 5235.jpg', 'Patek 5235R.jpg', 'Patek Regulator 5235.jpg'],
  'patek-philippe-5320g': ['Patek Philippe 5320G.jpg', 'Patek 5320.jpg', 'Patek 5320G-001.jpg'],
  'patek-philippe-5205g': ['Patek Philippe 5205G.jpg', 'Patek 5205.jpg', 'Patek 5205G-013.jpg'],
  'patek-philippe-5196g': ['Patek Philippe 5196G.jpg', 'Patek 5196.jpg', 'Patek 5196G-001.jpg'],
  'vacheron-constantin-4520v': ['Vacheron Constantin Overseas 4520V.jpg', 'Vacheron Overseas 4520V.jpg', 'Vacheron Constantin 4520V-110A.jpg'],
  'audemars-piguet-15500st': ['Audemars Piguet 15500ST.jpg', 'AP Royal Oak 15500ST.jpg'],
  'richard-mille-rm-67-02': ['Richard Mille RM 67-02.jpg', 'Richard Mille RM67-02.jpg'],
  'h-moser--cie-streamliner-centre-seconds': ['H. Moser Streamliner.jpg', 'H. Moser Streamliner Centre Seconds.jpg', 'Moser Streamliner Salmon.jpg'],
  'fp-journe-octa-chronometre-souverain': ['F.P. Journe Octa.jpg', 'F.P. Journe Octa Chronometre Souverain.jpg'],
  'longines-l3-821-1-53-2': ['Longines Spirit Zulu Time.jpg', 'Longines L3.821.jpg', 'Longines Spirit Zulu.jpg'],
  'cartier-wgta0211': ['Cartier Tank Louis Cartier.jpg', 'Cartier Tank WGTA0211.jpg', 'Cartier Tank Louis yellow gold.jpg'],
  'jaeger-lecoultre-q3848420': ['Jaeger-LeCoultre Master Control Date.jpg', 'JLC Master Control Date Q3848420.jpg', 'JLC Master Control Date.jpg'],
  'a-lange--shne-101-025': ['A. Lange Söhne 101.025.jpg', 'A. Lange Söhne Lange 1 101.025.jpg', 'Lange 1 101.025.jpg'],
  'mb-f-lm101': ['MB&F LM101.jpg', 'MB&F Legacy Machine 101.jpg', 'MB&F LM101 titanium.jpg'],
  'dewitt-academia-endless-drive': ['DeWitt Academia Endless Drive.jpg', 'DeWitt Academia.jpg'],
  'citizen-attesa-at8185-71e': ['Citizen Attesa AT8185.jpg', 'Citizen Attesa AT8185-71E.jpg', 'Citizen Attesa Chrono Satellite.jpg'],
}

const all = {}
const ids = Object.keys(TITLES)
let done = 0
let found = 0
for (const id of ids) {
  if (all[id]) { done++; continue }
  const candidates = TITLES[id]
  let result = null
  for (const term of candidates) {
    const info = await getInfo(term)
    if (!info) { await sleep(500); continue }
    const license = normLicense(info.extmetadata?.LicenseShortName?.value)
    if (!license || !ACCEPTED.has(license)) { await sleep(500); continue }
    const artist = info.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, '').trim() || 'Wikimedia Commons'
    result = {
      title: term,
      url: info.url,
      license,
      artist,
      source_url: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(term).replace(/%2F/g, '/')}`,
    }
    break
  }
  if (result) {
    all[id] = result
    found++
    console.log(`OK ${id} → ${result.title} [${result.license}]`)
  } else {
    console.log(`NO ${id}`)
  }
  done++
  // Write incrementally
  writeFileSync('/tmp/verified-asia.json', JSON.stringify(all, null, 2))
  await sleep(2000)
}

console.log(`\nWrote ${Object.keys(all).length} verified files (${found} new this run)`)
