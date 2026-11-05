/**
 * GridVault ESS - Reports Download & PDF Verification REST Routes
 * Module: Analytics & Financial Backend (Varad Bhardwaj)
 * Milestone: Nov 05, 2026 14:30:00 +0530
 * Commit: feat(reports-api): wire report download and PDF compilation REST endpoints
 *
 * Express router consumed by:
 *   - RegulatoryReportTable.jsx     → GET /api/reports/download/:id
 *   - PdfVerificationPipeline.jsx   → GET /api/reports/verify/:id
 *   - SystemReadinessPanel.jsx      → GET /api/health/pdf
 */

import express from 'express';
import { query } from '../config/db.js';
import pdfGenerator from '../workers/pdfGenerator.js';
import complianceEngine from '../services/complianceVerificationEngine.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/download/:id
// Triggers PDF generation for a regulatory report and streams binary PDF.
// Falls back to metadata JSON when headless Chromium is unavailable (CI env).
// ─────────────────────────────────────────────────────────────────────────────
router.get('/download/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Pull report metadata
    const dbResult = await query(
      `
      SELECT
        report_id,
        report_title,
        report_type,
        generated_at,
        generated_by,
        regulation_period_start,
        regulation_period_end,
        pdf_file_path,
        is_verified
      FROM regulatory_reports
      WHERE report_id = $1
      LIMIT 1;
    `,
      [id]
    );

    if (!dbResult.rows || dbResult.rows.length === 0) {
      return res.status(404).json({ error: `Report '${id}' not found` });
    }

    const report = dbResult.rows[0];

    // Generate PDF via headless Chromium worker
    let pdfBuffer;
    try {
      pdfBuffer = await pdfGenerator.generateReportPDF({
        reportId: report.report_id,
        reportTitle: report.report_title,
        reportType: report.report_type,
        periodStart: report.regulation_period_start,
        periodEnd: report.regulation_period_end,
        generatedBy: report.generated_by,
      });
    } catch (pdfErr) {
      console.warn('[reportsRoutes] PDF generation failed, returning metadata JSON:', pdfErr.message);
      return res.status(200).json({
        note: 'PDF engine unavailable — returning report metadata',
        report,
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="gridvault_report_${id}_${Date.now()}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/verify/:id
// Runs the compliance verification pipeline and returns stage-by-stage results.
// Consumed by PdfVerificationPipeline.jsx.
// Response: { reportId, overallStatus, stages: [{ id, label, status, message }] }
// ─────────────────────────────────────────────────────────────────────────────
router.get('/verify/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pipelineStatus = await complianceEngine.getPipelineStatus(id);
    res.json(pipelineStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/health/pdf
// Health-check endpoint: confirms PDF generation engine is reachable.
// Consumed by SystemReadinessPanel.jsx.
// Response: { status: 'ok' | 'degraded', latencyMs: number, message: string }
// ─────────────────────────────────────────────────────────────────────────────
router.get('/health/pdf', async (req, res) => {
  const start = Date.now();

  try {
    // Lightweight probe: generate a minimal 1-page PDF and discard it
    await pdfGenerator.generateReportPDF({
      reportId: 'HEALTH_CHECK',
      reportTitle: 'GridVault PDF Engine Health Check',
      reportType: 'HEALTH',
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
      generatedBy: 'health-probe',
    });

    res.json({
      status: 'ok',
      latencyMs: Date.now() - start,
      message: 'PDF generation engine operational',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      status: 'degraded',
      latencyMs: Date.now() - start,
      message: `PDF engine error: ${err.message}`,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
