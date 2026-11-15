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
    ├── utils/
    │   └── formatters.js              # Shared Intl.NumberFormat INR locale utilities
    ├── components/
    │   ├── layout/                    # Ayush — Global Shell
    │   │   ├── DashboardLayout.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── Header.jsx
    │   ├── dashboard/                 # Ayush — Dashboard Widgets
    │   │   ├── MetricCard.jsx
    │   │   ├── LiveGridChart.jsx
    │   │   └── BatteryGauge.jsx
    │   └── analytics/                 # Varad — Analytics & Financial Reports Module
    │       ├── AnalyticsPage.jsx                  # Root page — tabs, layout, modal trigger
    │       ├── KPIHeaderRibbon.jsx                # Slim KPI strip (SoC, Dispatch, Uptime)
    │       ├── DateRangeSelector.jsx              # Custom date range picker + aggregation filter
    │       ├── TabbedViewSwitch.jsx               # Tab switcher (Overview / Financial / Compliance)
    │       ├── ExecutiveSummary.jsx               # 4-card KPI grid (money, demand, carbon, IRR)
    │       ├── SummaryCard.jsx                    # Reusable KPI card with glow variants
    │       ├── ExecutiveTrendBadge.jsx            # Animated +/- trend badge component
    │       ├── MoneySavedCard.jsx                 # Total Money Saved card (Emerald)
    │       ├── CarbonOffsetCard.jsx               # Carbon Offset MT CO₂e card (Cyan)
    │       ├── PeakDemandCard.jsx                 # Peak Demand Cost Avoided card (Amber)
    │       ├── IRRandLCOSCard.jsx                 # Cumulative IRR & LCOS card (Violet)
    │       ├── FinancialChart.jsx                 # Stacked bar chart — revenue & cost comparison
    │       ├── PaybackCurveChart.jsx              # Line chart — cumulative ROI vs Capex payback
    │       ├── ComplianceTable.jsx                # Regulatory report table with PDF download
    │       ├── ComplianceAuditLog.jsx             # Audit history log with search & CSV export
    │       ├── CustomReportBuilderModal.jsx        # PDF report builder modal with section toggles
    │       ├── BulkTelemetryExportButton.jsx       # Bulk CSV export for telemetry ledger data
    │       ├── TariffComparisonCalculator.jsx      # Tariff comparison tool & scenario savings
    │       ├── PdfVerificationPipeline.jsx         # 4-stage PDF pipeline verification panel
    │       ├── SystemReadinessPanel.jsx            # Deployment readiness checklist widget
    │       └── formatters.js                      # Re-export shim → ../../utils/formatters.js
    └── pages/
        └── DashboardPage.jsx          # Ayush — Main Live Grid Dashboard
```

## 🚀 Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. `LiveGridChart.jsx` connects via WebSocket to `VITE_WS_URL` (default `ws://localhost:4000`) and automatically falls back to a 1-second live local tick stream (`.slice(-50)`) when the backend is not yet running.

## 🔬 Analytics Module — Varad Bhardwaj

The `/analytics` route renders `AnalyticsPage.jsx` which provides:

- **Executive Financial KPI Cards** — Total Money Saved, Peak Demand Avoided, Carbon Offset, IRR & LCOS
- **Monthly Revenue Breakdown** — Stacked bar chart: Arbitrage + Peak Shaving + Ancillary income streams
- **Cumulative ROI vs Capex Payback Curve** — Line chart with 3.8-year breakeven inflection
- **Regulatory Compliance Table** — CERC/CEA/FERC/SLDC reports with signed PDF download
- **Compliance Audit History** — Searchable log with CSV bulk export
- **Custom PDF Report Builder** — Section toggles + 4-stage NERC verification pipeline overlay
- **Bulk Telemetry CSV Export** — Full ledger export with column filter
- **Tariff Comparison Calculator** — Flat vs TOU vs GridVault ESS scenario savings model
- **PDF Verification Pipeline** — Compile → Sign → NERC Validate → Signed & Ready status panel
- **System Readiness Panel** — Green/amber/red health checks: DB, WebSocket, PDF, Charts, Auth

All currency formatted via shared `src/utils/formatters.js` using `Intl.NumberFormat('en-IN')`.

