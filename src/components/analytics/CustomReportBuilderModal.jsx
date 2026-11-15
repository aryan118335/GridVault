import React, { useState } from 'react';
import PdfVerificationPipeline from './PdfVerificationPipeline.jsx';
import {
  Check,
  CheckCircle2,
  FileCheck2,
  FileDown,
  FileText,
  Layers,
  Loader2,
  Shield,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';

const SECTIONS = [
  {
    id: 'executive_summary',
    label: 'Executive Summary & Environmental Impact',
    description: 'High-impact KPI cards, Total Money Saved (₹3,42,800), and Carbon Offset (128.4 MT CO₂e).',
    pages: 1,
    sizeKb: 420,
    required: true,
  },
  {
    id: 'financial_roi',
    label: 'Financial ROI & Arbitrage Breakdown',
    description: '30-day value streams (arbitrage, peak shaving, ancillary) vs traditional coal peaking cost.',
    pages: 2,
    sizeKb: 680,
    required: false,
  },
  {
    id: 'nerc_cerc_audit',
    label: 'NERC / CERC Statutory Audit Records',
    description: 'Frequency response benchmarks (50±0.05 Hz), reactive power, and pass/fail inspection log.',
    pages: 2,
    sizeKb: 540,
    required: false,
  },
  {
    id: 'payback_curve',
    label: 'Cumulative ROI vs Capex Payback Curve',
    description: '5-year cash flow projections against ₹2.5 Cr turnkey Capex with 3.8-year inflection point.',
    pages: 1,
    sizeKb: 360,
    required: false,
  },
  {
    id: 'battery_degradation',
    label: 'Battery Degradation & Cell Asset Ledger',
    description: 'Electrochemical cycle fade, LCOS depreciation calculations, and thermal threshold limits.',
    pages: 1,
    sizeKb: 290,
    required: false,
  },
];

/**
 * CustomReportBuilderModal
 * Nov 11 (5:00 PM) Milestone: Modal interface allowing users to select
 * custom report sections (Executive Summary, Financial ROI, NERC Audit)
 * before PDF compile, complete with direct browser download.
 */
export default function CustomReportBuilderModal({ isOpen, onClose }) {
  const [reportTitle, setReportTitle] = useState('GridVault ESS Operational & Regulatory Dossier');
  const [authority, setAuthority] = useState('CERC / CEA Regulatory Filing');
  const [period, setPeriod] = useState('Last 30 Days (Oct 19 – Nov 18, 2026)');
  const [selectedSections, setSelectedSections] = useState({
    executive_summary: true,
    financial_roi: true,
    nerc_cerc_audit: true,
    payback_curve: true,
    battery_degradation: false,
  });
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileSuccess, setCompileSuccess] = useState(false);
  const [showPipelineOverlay, setShowPipelineOverlay] = useState(false);

  if (!isOpen) return null;

  const toggleSection = (id) => {
    setSelectedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Dynamic calculations of pages and estimated size
  const totalPages = SECTIONS.reduce(
    (sum, s) => (selectedSections[s.id] ? sum + s.pages : sum),
    0
  );
  const totalSizeKb = SECTIONS.reduce(
    (sum, s) => (selectedSections[s.id] ? sum + s.sizeKb : sum),
    0
  );
  const estimatedMb = (totalSizeKb / 1024).toFixed(1);

  // Compile PDF with selected sections and trigger browser download
  const handleCompilePdf = async () => {
    setIsCompiling(true);
    setCompileSuccess(false);
    setShowPipelineOverlay(true); // Show 4-stage verification overlay

    try {
      // Smooth compilation simulation
      await new Promise((r) => setTimeout(r, 1200));

      const activeSectionTitles = SECTIONS.filter((s) => selectedSections[s.id])
        .map((s) => `  - ${s.label} (${s.pages} page)`)
        .join('\n');

      const pdfRaw = `%PDF-1.4
1 0 obj
<< /Title (${reportTitle})
   /Author (Varad Bhardwaj - GridVault ESS Analytics)
   /Subject (${authority})
   /Creator (GridVault Dynamic PDF Compiler Engine)
>>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page
   /Parent 3 0 R
   /MediaBox [0 0 612 792]
   /Contents 5 0 R
   /Resources << /Font << /F1 6 0 R >> >>
>>
endobj
5 0 obj
<< /Length 720 >>
stream
BT
/F1 20 Tf
50 720 Td
(GRIDVAULT ENERGY STORAGE SYSTEM) Tj
/F1 13 Tf
0 -28 Td
(${reportTitle.toUpperCase()}) Tj
/F1 10 Tf
0 -22 Td
(Target Authority: ${authority}  |  Period: ${period}) Tj
0 -16 Td
(Compilation Date: ${new Date().toLocaleDateString('en-US')}  |  Scope: ${totalPages} Pages) Tj
0 -26 Td
(================================================================================) Tj
0 -22 Td
(COMPILED REPORT SECTIONS INCLUDED IN THIS DOSSIER:) Tj
0 -18 Td
${activeSectionTitles}
0 -26 Td
(================================================================================) Tj
0 -20 Td
(KEY HIGHLIGHT METRICS:) Tj
0 -16 Td
(* Total Net Revenue / Money Saved: INR 3,42,800 [+14% vs baseline]) Tj
0 -16 Td
(* Carbon Offset Certified: 128.4 MT CO2e [Decarbonization Standard]) Tj
0 -16 Td
(* Peak Demand Surcharge Avoidance: INR 1,84,500 [480 kW shaved]) Tj
0 -16 Td
(* Projected Capex Payback Horizon: 3.8 Years [Month 45 inflection]) Tj
0 -24 Td
(AUTHORIZED SYSTEM ARCHITECT: VARAD BHARDWAJ  |  GRIDVAULT ESS v1.0) Tj
ET
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f 
0000000010 00000 n 
0000000210 00000 n 
0000000260 00000 n 
0000000320 00000 n 
0000000470 00000 n 
0000001220 00000 n 
trailer
<< /Size 7 /Root 2 0 R /Info 1 0 R >>
startxref
1290
%%EOF`;

      const blob = new Blob([pdfRaw], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GridVault_Custom_Dossier_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setCompileSuccess(true);
      setShowPipelineOverlay(false);
      setTimeout(() => {
        setIsCompiling(false);
        onClose();
      }, 1400);
    } catch {
      setIsCompiling(false);
      setShowPipelineOverlay(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Top Gradient Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-400 via-sky-500 to-emerald-500" />

        {/* 4-Stage Pipeline Verification Overlay — shown during compile */}
        {showPipelineOverlay && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-slate-900/95 backdrop-blur-sm p-6">
            <div className="w-full max-w-sm">
              <p className="mb-4 text-center text-sm font-semibold text-white">
                Verifying PDF Pipeline…
              </p>
              <PdfVerificationPipeline
                reportId={`GV-RPT-${Date.now()}`}
                onVerified={() => setShowPipelineOverlay(false)}
              />
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400 shadow-[0_0_16px_rgba(20,184,166,0.25)]">
              <FileCheck2 className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Custom PDF Report Builder</h3>
              <p className="text-xs text-slate-400">
                Compile bespoke regulatory dossiers with tailored audit sections
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5 text-xs">
          {/* Metadata Inputs */}
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Document Dossier Title
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Target Authority
                </label>
                <input
                  type="text"
                  value={authority}
                  onChange={(e) => setAuthority(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Reporting Horizon
                </label>
                <input
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section Toggles */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Report Sections to Compile
              </span>
              <span className="text-[11px] text-teal-400 font-mono">
                {totalPages} Pages (~{estimatedMb} MB)
              </span>
            </div>

            <div className="space-y-2">
              {SECTIONS.map((section) => {
                const isSelected = !!selectedSections[section.id];
                return (
                  <div
                    key={section.id}
                    onClick={() => toggleSection(section.id)}
                    className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? 'border-teal-500/40 bg-teal-500/10 shadow-[0_0_16px_rgba(20,184,166,0.12)]'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{section.label}</span>
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                          {section.pages} {section.pages === 1 ? 'page' : 'pages'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{section.description}</p>
                    </div>

                    <div className="pt-0.5 shrink-0">
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                          isSelected
                            ? 'border-teal-400 bg-teal-500 text-slate-950 font-bold'
                            : 'border-slate-600 bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="text-xs text-slate-400">
            <span>Dossier: </span>
            <span className="font-semibold text-white">{totalPages} Pages</span>
            <span className="mx-1">•</span>
            <span className="font-mono text-teal-400">~{estimatedMb} MB</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isCompiling}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:text-white"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleCompilePdf}
              disabled={isCompiling || totalPages === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-teal-500/20 transition-all hover:from-teal-400 hover:to-emerald-400 active:scale-95 disabled:opacity-50"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Compiling PDF...</span>
                </>
              ) : compileSuccess ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-slate-950" />
                  <span>Dossier Ready!</span>
                </>
              ) : (
                <>
                  <FileDown className="h-3.5 w-3.5 stroke-[2.4]" />
                  <span>Compile &amp; Download PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
