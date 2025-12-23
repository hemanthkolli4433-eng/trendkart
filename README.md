# Trendkart Backend (Express)

## Quick Start
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
API runs on `http://localhost:${PORT:-5000}`.

## Endpoints
- `GET /health`
- `GET /api/products?region=Global&sort=score&dir=desc`
- `GET /api/featured`
- `POST /api/products` (admin, header: `x-admin-key`)
- `PATCH /api/products/:id` (admin)
- `GET /api/alerts?onlyActive=true`
- `POST /api/alerts/:id/resolve` (admin)

Scores auto-refresh every 30s using the Trend Scoring Formula (see `scoring.js`).
