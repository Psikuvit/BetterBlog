import React from 'react'

type Props = {
  lines?: number
}

export default function SkeletonCard({ lines = 3 }: Props) {
  return (
    <div className="post-row" aria-hidden>
      <div style={{ width: 56, height: 56, borderRadius: 999 }} className="skeleton avatar" />
      <div style={{ minWidth: 0 }}>
        <div className="skeleton line short" />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton line" style={{ marginTop: 8 }} />
        ))}
        <div className="post-meta" style={{ marginTop: 10 }}>
          <div className="skeleton chip" style={{ width: 80, height: 28 }} />
          <div className="skeleton chip" style={{ width: 60, height: 28, marginLeft: 8 }} />
        </div>
      </div>
      <div style={{ width: 80 }} />
    </div>
  )
}
