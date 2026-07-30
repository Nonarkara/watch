export default function Meter({ value }: { value: number }) {
  return (
    <span className="meter" role="img" aria-label={`${value} of 100`}>
      <span className="meter-track">
        <span className="meter-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </span>
    </span>
  )
}
