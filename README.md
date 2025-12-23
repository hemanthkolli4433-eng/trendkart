# Trendkart Starter (Full Stack)

This is a minimal, runnable starter for **Trendkart** with:
- **Express backend** implementing the **Trend Scoring Formula** and alerts
- **Vite + React frontend** consuming the API
- Ready to extend with real ETL ingest and databases

## How to Run
### 1) Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
The API runs on `http://localhost:5000` (CORS allows `http://localhost:5173`).

### 2) Frontend
```bash
cd ../frontend
npm install
# (optional) echo VITE_API_URL=http://localhost:5000 > .env
npm run dev
```
Open `http://localhost:5173` in your browser.

## Next Steps
- Replace mock signal generator with real ETL (Google Trends, Twitter, TikTok, Amazon).
- Persist data using Postgres + Prisma or MongoDB + Mongoose.
- Add admin dashboard for alerts and feature toggles.
