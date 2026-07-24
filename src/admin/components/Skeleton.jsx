export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded bg-ink-800 ${className}`} />
}

export function SkeletonRows({ columns = 4, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="px-4 py-3.5">
              <Skeleton className="h-4 w-full max-w-[160px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
