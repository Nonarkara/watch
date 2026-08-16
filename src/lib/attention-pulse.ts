export interface AttentionRankRow {
  card_id: string
  rank: number
}

export interface AttentionRankSnapshot {
  as_of: string
  ranks: Record<string, number>
}

export interface AttentionHistory {
  current: AttentionRankSnapshot
  previous: AttentionRankSnapshot | null
}

export type AttentionMovement = 'current' | 'new' | 'up' | 'down' | 'steady' | 'out' | 'quiet'

export interface SavedAttentionPulse {
  card_id: string
  current_rank: number | null
  previous_rank: number | null
  movement: AttentionMovement
  places: number
}

export function snapshotFromRows(asOf: string, rows: AttentionRankRow[]): AttentionRankSnapshot {
  const ranks: Record<string, number> = {}
  for (const row of rows) {
    if (row.card_id && Number.isInteger(row.rank) && row.rank > 0) ranks[row.card_id] = row.rank
  }
  return { as_of: asOf, ranks }
}

export function parseAttentionHistory(value: unknown): AttentionHistory | null {
  if (!value || typeof value !== 'object') return null
  const history = value as Partial<AttentionHistory>
  if (!history.current || typeof history.current.as_of !== 'string' || !history.current.ranks || typeof history.current.ranks !== 'object') return null
  if (history.previous != null && (
    typeof history.previous !== 'object'
    || typeof history.previous.as_of !== 'string'
    || !history.previous.ranks
    || typeof history.previous.ranks !== 'object'
  )) return null
  return history as AttentionHistory
}

export function advanceAttentionHistory(
  history: AttentionHistory | null,
  incoming: AttentionRankSnapshot,
): AttentionHistory {
  if (!history) return { current: incoming, previous: null }
  if (history.current.as_of === incoming.as_of) return { ...history, current: incoming }
  return { current: incoming, previous: history.current }
}

export function compareSavedAttention(
  ids: string[],
  current: AttentionRankSnapshot,
  previous: AttentionRankSnapshot | null,
): SavedAttentionPulse[] {
  return ids.map((cardId) => {
    const currentRank = current.ranks[cardId] ?? null
    const previousRank = previous?.ranks[cardId] ?? null
    let movement: AttentionMovement = 'quiet'
    let places = 0

    if (currentRank != null && previous == null) movement = 'current'
    else if (currentRank != null && previousRank == null) movement = 'new'
    else if (currentRank == null && previousRank != null) movement = 'out'
    else if (currentRank != null && previousRank != null) {
      places = previousRank - currentRank
      movement = places > 0 ? 'up' : places < 0 ? 'down' : 'steady'
    }

    return { card_id: cardId, current_rank: currentRank, previous_rank: previousRank, movement, places: Math.abs(places) }
  }).sort((a, b) => {
    const activeA = a.current_rank ?? (a.previous_rank != null ? 100 + a.previous_rank : 999)
    const activeB = b.current_rank ?? (b.previous_rank != null ? 100 + b.previous_rank : 999)
    return activeA - activeB
  })
}

export function attentionAgeDays(asOf: string, now = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(asOf)
  if (!match) return null
  const snapshot = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const localToday = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  if (!Number.isFinite(snapshot)) return null
  return Math.max(0, Math.round((localToday - snapshot) / 86_400_000))
}
