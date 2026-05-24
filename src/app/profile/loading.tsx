import SkeletonCard from '@/components/skeleton-card'

export default function Loading() {
  return (
    <main className="shell">
      <section className="panel">
        <div className="panel-inner" aria-live="polite" aria-busy="true">
          <div className="stack-tight">
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
          </div>
        </div>
      </section>
    </main>
  )
}

