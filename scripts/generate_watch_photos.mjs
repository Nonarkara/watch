import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const cardDir = join(ROOT, 'data/cards');
const cardFiles = readdirSync(cardDir).filter(f => f.endsWith('.json'));

const UNSPLASH_WATCH_IMAGES = [
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1539185441755-769473a23570?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1622434641406-a158123450f9?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526045612212-70caf35c14df?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1619134778706-7015533a6150?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1594576722512-582bcd46fba3?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517463668877-a1288f344bf1?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop"
];

const photos = [];
let imgIdx = 0;

for (const file of cardFiles) {
  const card = JSON.parse(readFileSync(join(cardDir, file), 'utf8'));
  const id = card.id;
  const brand = card.identity.brand;
  const ref = card.identity.reference;
  const name = card.identity.name;
  const tier = card.identity.tier;
  const material = card.identity.case?.material || 'Steel';
  const movement = card.identity.movement?.type || 'Automatic';
  
  const tags = [
    brand.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    tier,
    material.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    movement.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    card.identity.collection ? card.identity.collection.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'watch'
  ];

  if (card.identity.nickname) {
    tags.push(card.identity.nickname.toLowerCase().replace(/[^a-z0-9]/g, '-'));
  }
  if (card.identity.produced?.discontinued) {
    tags.push('discontinued');
  } else {
    tags.push('current-production');
  }
  if (card.retail?.current_msrp_usd && card.retail.current_msrp_usd < 2000) {
    tags.push('entry-level');
  } else if (card.retail?.current_msrp_usd && card.retail.current_msrp_usd > 30000) {
    tags.push('ultra-luxury');
  }

  const imageUrl = UNSPLASH_WATCH_IMAGES[imgIdx % UNSPLASH_WATCH_IMAGES.length];
  imgIdx++;

  photos.push({
    id: `photo-${id}`,
    card_id: id,
    brand,
    reference: ref,
    name: `${brand} ${name} ${ref}`,
    tier,
    image_url: imageUrl,
    license: "Unsplash License (Free commercial & non-commercial use)",
    tags: Array.from(new Set(tags))
  });
}

writeFileSync(join(ROOT, 'public/data/watch_photos.json'), JSON.stringify(photos, null, 2));
console.log(`✓ Generated ${photos.length} taggable watch photos in public/data/watch_photos.json`);
