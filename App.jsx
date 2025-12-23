import React, { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function App() {
  const [region, setRegion] = useState('All')
  const [products, setProducts] = useState([])
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const qs = new URLSearchParams({ region, sort: 'score', dir: 'desc' }).toString()
    const [p, f] = await Promise.all([
      fetch(`${API}/api/products?${qs}`).then(r => r.json()),
      fetch(`${API}/api/featured`).then(r => r.json())
    ])
    setProducts(p)
    setFeatured(f)
    setLoading(false)
  }

  useEffect(() => { load(); const i = setInterval(load, 15000); return () => clearInterval(i) }, [region])

  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>Trendkart 🔥</h1>
        <div>
          <select value={region} onChange={e => setRegion(e.target.value)}>
            <option>All</option>
            <option>Global</option>
            <option>India</option>
            <option>USA</option>
          </select>
        </div>
      </header>

      <section style={{ marginTop: 16 }}>
        <h2>Featured Now</h2>
        {featured.length === 0 && <p>No featured items yet. Check back soon.</p>}
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {featured.map(p => (
            <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div>Region: {p.region}</div>
              <div>Score: {p.score}</div>
              <div>FeaturedScore: {p.featuredScore}</div>
              <button style={{ marginTop: 8 }}>Buy Now</button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>All Trending Items {loading && '…'}</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {products.map(p => (
            <div key={p.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div>Region: {p.region}</div>
              <div>Score: {p.score}</div>
              <div>Price: ₹{p.price}</div>
              <div>Inventory: {p.inventory}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
