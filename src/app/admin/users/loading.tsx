import SkeletonCard from '@/components/skeleton-card'

export default function Loading() {
  return (
    <main className="shell">
      <section className="panel">
        <div className="panel-inner" aria-live="polite" aria-busy="true">
          <div className="post-list">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </section>
    </main>
  )
}
