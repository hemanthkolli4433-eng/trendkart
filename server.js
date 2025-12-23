import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import { computeTrendScore, featuredScore, normalize } from './scoring.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'supersecret';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(morgan('dev'));

// --- In-memory store ---
let products = [
  { id: nanoid(), name: 'Viral LED Water Bottle', region: 'Global', price: 1999, inventory: 120, reorderPoint: 40, image: '', tags: ['#hydration','#aesthetic'] },
  { id: nanoid(), name: 'Self-Stirring Mug', region: 'India', price: 1299, inventory: 60, reorderPoint: 30, image: '', tags: ['#coffee','#office'] },
  { id: nanoid(), name: 'Foldable Keyboard', region: 'USA', price: 3499, inventory: 35, reorderPoint: 25, image: '', tags: ['#productivity','#mobile'] },
];

// track scores over time
let history = {}; // { productId: [scores...] }
let featured = new Set();
let alerts = [];

// helper
function adminOnly(req, res, next) {
  const k = req.header('x-admin-key');
  if (k !== ADMIN_API_KEY) return res.status(401).json({ error: 'unauthorized' });
  next();
}

function pushAlert(type, product, message) {
  alerts.unshift({ id: nanoid(), type, productId: product.id, message, createdAt: new Date().toISOString(), resolved: false });
}

function computeAndUpdateScores() {
  // Simulate incoming raw signals and compute normalized/combined scores
  // In real system, you'd load raw data per product from your ETL layer.
  products = products.map(p => {
    // Simulate raw signals
    const raw = {
      google: Math.floor(Math.random()*100),          // 0..100
      twitterMentions: Math.floor(Math.random()*8000),// 0..8000
      tiktokShares: Math.floor(Math.random()*800000), // 0..800k
      amazonDeltaRank: Math.floor(Math.random()*10000), // 0..10k (lower is better)
      socialBuzz: Math.floor(Math.random()*1000)      // 0..1000
    };

    // Normalize (MVP min/max constants; later use rolling mins/maxs)
    const g = normalize(raw.google, 0, 100);
    const t = normalize(raw.twitterMentions, 0, 8000);
    const tt = normalize(raw.tiktokShares, 0, 800000);
    const a = normalize(raw.amazonDeltaRank, 0, 10000, true); // invert
    const s = normalize(raw.socialBuzz, 0, 1000);

    const score = computeTrendScore({ g, t, tt, a, s }, {});
    const prev = (history[p.id] && history[p.id][history[p.id].length-1]) || score;
    const fScore = featuredScore(score, prev, 0.5);

    // maintain history
    history[p.id] = (history[p.id] || []).concat([score]).slice(-48);

    // determine feature + alerts
    const wasFeatured = featured.has(p.id);
    const shouldFeature = (score > 0.65) && (score - prev > 0);

    if (!wasFeatured && shouldFeature) {
      featured.add(p.id);
      pushAlert('rising', p, `${p.name} rising: score ${score.toFixed(2)} (Δ ${(score - prev).toFixed(2)})`);
    }
    if (wasFeatured && (score < 0.45)) {
      featured.delete(p.id);
      pushAlert('fading', p, `${p.name} fading: score ${score.toFixed(2)}`);
    }
    if (p.inventory <= p.reorderPoint) {
      pushAlert('low_inventory', p, `${p.name} low stock: ${p.inventory} (≤ ${p.reorderPoint})`);
    }

    return { ...p, score: Number(score.toFixed(3)), featuredScore: Number(fScore.toFixed(3)), updatedAt: new Date().toISOString() };
  });
}

// Run every 30s
setInterval(computeAndUpdateScores, 30000);
computeAndUpdateScores();

// --- Routes ---
app.get('/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.get('/api/products', (req, res) => {
  const { region, sort='score', dir='desc' } = req.query;
  let list = [...products];
  if (region && region !== 'All') list = list.filter(p => p.region === region);
  list.sort((a,b) => dir === 'asc' ? (a[sort] - b[sort]) : (b[sort] - a[sort]));
  res.json(list);
});

app.get('/api/featured', (req, res) => {
  const ids = new Set([...featured]);
  res.json(products.filter(p => ids.has(p.id)));
});

app.post('/api/products', adminOnly, (req, res) => {
  const { name, region='Global', price=999, inventory=100, reorderPoint=20, image='', tags=[] } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const p = { id: nanoid(), name, region, price, inventory, reorderPoint, image, tags };
  products.unshift(p);
  res.status(201).json(p);
});

app.patch('/api/products/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  products[idx] = { ...products[idx], ...req.body, updatedAt: new Date().toISOString() };
  res.json(products[idx]);
});

app.get('/api/alerts', (req, res) => {
  const onlyActive = (req.query.onlyActive ?? 'true') === 'true';
  const data = onlyActive ? alerts.filter(a => !a.resolved) : alerts;
  res.json({ count: data.length, data });
});

app.post('/api/alerts/:id/resolve', adminOnly, (req, res) => {
  const { id } = req.params;
  const a = alerts.find(x => x.id === id);
  if (!a) return res.status(404).json({ error: 'not found' });
  a.resolved = true;
  res.json(a);
});

app.listen(PORT, () => {
  console.log(`Trendkart API listening on http://localhost:${PORT}`);
});
