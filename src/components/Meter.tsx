export default function Meter({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <span className="meter" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={`${clamped} of 100`}>
      <span className="meter-track">
        <span className="meter-fill" style={{ width: `${clamped}%` }} />
      </span>
    </span>
  )
}
