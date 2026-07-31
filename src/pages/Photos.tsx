import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'

export interface WatchPhoto {
  id: string
  card_id: string
  brand: string
  reference: string
  name: string
  tier: string
  image_url: string
  license: string
  tags: string[]
}

export default function Photos() {
  const data = useDataset()
  const [photos, setPhotos] = useState<WatchPhoto[]>([])
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activePhoto, setActivePhoto] = useState<WatchPhoto | null>(null)

  useEffect(() => {
    fetch('/data/watch_photos.json')
      .then((r) => r.json())
      .then(setPhotos)
      .catch((e) => console.error('Failed to load watch photos', e))
  }, [])

  // Compute tag frequencies for tag cloud
  const allTags = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const p of photos) {
      for (const t of p.tags) {
        counts[t] = (counts[t] || 0) + 1
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30) // top 30 tags
  }, [photos])

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      const matchTag = selectedTag === 'all' || p.tags.includes(selectedTag)
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.reference.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q))
      return matchTag && matchSearch
    })
  }, [photos, selectedTag, searchQuery])

  return (
    <div className="photos-page">
      <Link to="/register" className="crumb">← REGISTER</Link>

      <div className="masthead">
        <p className="eyebrow">TAGGABLE VISUAL REGISTER · 180+ LICENSE-FREE PHOTOS</p>
        <h1 className="pagetitle">Watch Photo Archives</h1>
        <p className="lede">
          High-definition, license-free watch photography cataloged and tagged by horological specifications, tier, material, movement, and aesthetic features.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="photo-controls">
        <div className="search-wrap">
          <input
            type="text"
            placeholder="Search by brand, reference, dial color, material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="photo-search-input"
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="tag-cloud">
          <button
            className={`tag-chip ${selectedTag === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedTag('all')}
          >
            ALL PHOTOS ({photos.length})
          </button>
          {allTags.map(([tag, count]) => (
            <button
              key={tag}
              className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(tag)}
            >
              #{tag.toUpperCase()} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Photo Gallery Grid */}
      <div className="photo-grid">
        {filteredPhotos.map((p) => {
          const card = data?.cards.find((c) => c.id === p.card_id)
          return (
            <div key={p.id} className="photo-card" onClick={() => setActivePhoto(p)}>
              <div className="photo-thumb-wrap">
                <img src={p.image_url} alt={p.name} loading="lazy" className="photo-img" />
                <span className="tier-badge mono">{p.tier.toUpperCase()}</span>
              </div>
              <div className="photo-info">
                <span className="photo-brand eyebrow">{p.brand}</span>
                <h3 className="photo-title">{p.name}</h3>
                <p className="photo-ref mono">{p.reference}</p>
                <div className="photo-tags">
                  {p.tags.slice(0, 4).map((t) => (
                    <span key={t} className="mini-tag">#{t}</span>
                  ))}
                </div>
                {card && (
                  <div className="photo-card-link">
                    <Link to={`/w/${p.card_id}`} onClick={(e) => e.stopPropagation()} className="mono micro">
                      DOSSIER →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lightbox Modal */}
      {activePhoto && (
        <div className="lightbox-backdrop" onClick={() => setActivePhoto(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setActivePhoto(null)}>✕</button>
            <div className="lightbox-img-col">
              <img src={activePhoto.image_url} alt={activePhoto.name} className="lightbox-img" />
            </div>
            <div className="lightbox-info-col">
              <span className="eyebrow">{activePhoto.brand} · {activePhoto.tier.toUpperCase()}</span>
              <h2>{activePhoto.name}</h2>
              <p className="mono">{activePhoto.reference}</p>
              
              <div className="lightbox-license mono micro">
                <span className="lab">LICENSE:</span> {activePhoto.license}
              </div>

              <div className="lightbox-tags">
                <span className="lab mono micro">TAGS:</span>
                <div className="tag-chips-wrap">
                  {activePhoto.tags.map((t) => (
                    <button
                      key={t}
                      className="tag-chip mini"
                      onClick={() => {
                        setSelectedTag(t)
                        setActivePhoto(null)
                      }}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lightbox-action">
                <Link
                  to={`/w/${activePhoto.card_id}`}
                  className="btn"
                  onClick={() => setActivePhoto(null)}
                >
                  VIEW FULL REFERENCE DOSSIER →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
