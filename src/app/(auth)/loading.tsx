export default function Loading() {
  return (
    <main className="shell">
      <section className="panel">
        <div className="panel-inner">
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ height: 28, width: '30%', background: 'rgba(0,0,0,0.06)', borderRadius: 6 }} />
            <div style={{ height: 18, width: '50%', background: 'rgba(0,0,0,0.04)', borderRadius: 6 }} />
          </div>
        </div>
      </section>
    </main>
  )
}
