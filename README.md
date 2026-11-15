# ⚡ GRIDCORE / GridVault — Live Grid Dashboard (Frontend)

Modern dark-theme React + Tailwind CSS + Chart.js live grid telemetry dashboard built with a modular component structure under `src/`.

## 📁 Folder Structure

```text
GridVault/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx                        # Routes (/, /simulation, /analytics)
    ├── components/
    │   ├── layout/                    # Ayush — Global Shell
    │   │   ├── DashboardLayout.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── Header.jsx
    │   └── dashboard/                 # Ayush — Dashboard Widgets
    │       ├── MetricCard.jsx
    │       ├── LiveGridChart.jsx
    │       └── BatteryGauge.jsx
    └── pages/
        └── DashboardPage.jsx          # Ayush — Main Live Grid Dashboard
```

## 🚀 Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. `LiveGridChart.jsx` connects via WebSocket to `VITE_WS_URL` (default `ws://localhost:4000`) and automatically falls back to a 1-second live local tick stream (`.slice(-50)`) when the backend is not yet running.
