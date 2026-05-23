export default function Loading() {
  return (
    <main className="shell">
      <section className="panel">
        <div className="panel-inner">
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ height: 28, width: '40%', background: 'rgba(0,0,0,0.06)', borderRadius: 6 }} />
            <div style={{ height: 18, width: '60%', background: 'rgba(0,0,0,0.04)', borderRadius: 6 }} />
            <div style={{ height: 12, width: '100%', background: 'rgba(0,0,0,0.03)', borderRadius: 6 }} />
            <div style={{ height: 12, width: '100%', background: 'rgba(0,0,0,0.03)', borderRadius: 6 }} />
          </div>
        </div>
      </section>
    </main>
  )
}
