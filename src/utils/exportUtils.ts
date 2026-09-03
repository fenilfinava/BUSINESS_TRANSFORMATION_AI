/**
 * Export Utility for AI Solution Builder
 * Handles multi-format document generation: PDF, Word (.doc), Markdown (.md), and JSON (.json)
 */

export interface ExportableBlueprint {
  title: string;
  summary?: string;
  content: string;
  module_type?: string;
  module_name?: string;
  created_at?: string;
  key_recommendations?: string[];
  projectName?: string;
}

/**
 * Downloads raw text content as a file
 */
function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Sanitizes a title string into a clean filename
 */
function sanitizeFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Export as Markdown (.md)
 */
export function exportToMarkdown(blueprint: ExportableBlueprint) {
  const title = blueprint.title || "AI Blueprint";
  const dateStr = blueprint.created_at ? new Date(blueprint.created_at).toLocaleDateString() : new Date().toLocaleDateString();

  let md = `# ${title}\n\n`;
  if (blueprint.projectName) {
    md += `**Project:** ${blueprint.projectName}  \n`;
  }
  if (blueprint.module_name || blueprint.module_type) {
    md += `**Module:** ${(blueprint.module_name || blueprint.module_type || "").replace(/_/g, " ").toUpperCase()}  \n`;
  }
  md += `**Date:** ${dateStr}  \n\n`;

  if (blueprint.summary) {
    md += `## Executive Summary\n\n${blueprint.summary}\n\n`;
  }

  if (blueprint.key_recommendations && blueprint.key_recommendations.length > 0) {
    md += `## Key Strategic Recommendations\n\n`;
    blueprint.key_recommendations.forEach((rec, i) => {
      md += `${i + 1}. ${rec}\n`;
    });
    md += `\n`;
  }

  md += `## Detailed Blueprint\n\n${blueprint.content}\n`;

  const filename = `${sanitizeFilename(title)}-blueprint.md`;
  downloadBlob(md, filename, "text/markdown;charset=utf-8;");
}

/**
 * Export as JSON (.json)
 */
export function exportToJson(blueprint: ExportableBlueprint) {
  const title = blueprint.title || "AI Blueprint";
  const jsonStr = JSON.stringify(blueprint, null, 2);
  const filename = `${sanitizeFilename(title)}-data.json`;
  downloadBlob(jsonStr, filename, "application/json;charset=utf-8;");
}

/**
 * Export as Word Document (.doc via HTML MIME)
 */
export function exportToWord(blueprint: ExportableBlueprint) {
  const title = blueprint.title || "Enterprise Transformation Blueprint";
  const dateStr = blueprint.created_at ? new Date(blueprint.created_at).toLocaleDateString() : new Date().toLocaleDateString();

  // Convert simple markdown formatting to basic HTML for Word compatibility
  let htmlContent = blueprint.content
    .replace(/^### (.*$)/gim, '<h3 style="color: #1e3a8a; margin-top: 16px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color: #1e40af; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-top: 24px;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="color: #0f172a; margin-top: 28px;">$1</h1>')
    .replace(/^\* (.*$)/gim, '<li style="margin-bottom: 4px;">$1</li>')
    .replace(/^- (.*$)/gim, '<li style="margin-bottom: 4px;">$1</li>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\n\n/gim, '<p style="line-height: 1.6; margin-bottom: 12px;"></p>');

  let recommendationsHtml = "";
  if (blueprint.key_recommendations && blueprint.key_recommendations.length > 0) {
    recommendationsHtml = `
      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <h3 style="color: #1e40af; margin-top: 0; margin-bottom: 10px;">Key Strategic Recommendations</h3>
        <ol style="margin: 0; padding-left: 20px; line-height: 1.6;">
          ${blueprint.key_recommendations.map(r => `<li style="margin-bottom: 6px;">${r}</li>`).join("")}
        </ol>
      </div>
    `;
  }

  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Calibri', 'Segoe UI', sans-serif; color: #1e293b; font-size: 11pt; line-height: 1.5; padding: 40px; }
        h1 { font-size: 22pt; color: #0f172a; }
        h2 { font-size: 15pt; color: #1e40af; }
        h3 { font-size: 12pt; color: #334155; }
        .meta { color: #64748b; font-size: 10pt; margin-bottom: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
        .summary { font-size: 12pt; font-style: italic; color: #334155; background: #f1f5f9; padding: 14px; border-radius: 6px; margin-bottom: 24px; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">
        ${blueprint.projectName ? `<strong>Project:</strong> ${blueprint.projectName} &nbsp;|&nbsp; ` : ''}
        ${blueprint.module_name ? `<strong>Module:</strong> ${blueprint.module_name.replace(/_/g, ' ').toUpperCase()} &nbsp;|&nbsp; ` : ''}
        <strong>Generated:</strong> ${dateStr}
      </div>
      ${blueprint.summary ? `<div class="summary"><strong>Executive Summary:</strong> ${blueprint.summary}</div>` : ''}
      ${recommendationsHtml}
      <div>${htmlContent}</div>
    </body>
    </html>
  `;

  const filename = `${sanitizeFilename(title)}-blueprint.doc`;
  downloadBlob(docHtml, filename, "application/msword;charset=utf-8;");
}

/**
 * Export as PDF via high-fidelity print frame
 */
export function exportToPdf(blueprint: ExportableBlueprint) {
  const title = blueprint.title || "AI Solution Blueprint";
  const dateStr = blueprint.created_at ? new Date(blueprint.created_at).toLocaleDateString() : new Date().toLocaleDateString();

  let formattedRecs = "";
  if (blueprint.key_recommendations && blueprint.key_recommendations.length > 0) {
    formattedRecs = `
      <div class="recommendations">
        <h3>Key Strategic Recommendations</h3>
        <ul>
          ${blueprint.key_recommendations.map(r => `<li>${r}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  // Basic markdown to HTML
  let parsedContent = blueprint.content
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/\n\n/gim, '<p></p>');

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow pop-ups to generate PDF report.");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} - AI Solution Builder Report</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; line-height: 1.6; padding: 20px; font-size: 13px; }
        .header { border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
        .logo-title { font-size: 24px; font-weight: 800; color: #1e3a8a; margin: 0; }
        .badge { background: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #bfdbfe; }
        .meta-info { font-size: 11px; color: #64748b; margin-top: 6px; }
        .summary-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px; }
        .summary-box h4 { margin: 0 0 6px 0; color: #1e40af; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
        .summary-box p { margin: 0; font-size: 13px; color: #334155; }
        .recommendations { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
        .recommendations h3 { margin: 0 0 10px 0; color: #166534; font-size: 14px; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .recommendations li { margin-bottom: 6px; color: #14532d; }
        h1, h2, h3, h4 { color: #0f172a; font-weight: 700; }
        h2 { border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 24px; color: #1e40af; }
        h3 { margin-top: 18px; color: #334155; }
        code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; }
        .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="badge">AI Solution Builder &bull; Enterprise Report</div>
          <h1 class="logo-title" style="margin-top: 8px;">${title}</h1>
          <div class="meta-info">
            ${blueprint.projectName ? `Project: <strong>${blueprint.projectName}</strong> &bull; ` : ''}
            Generated: ${dateStr}
          </div>
        </div>
      </div>

      ${blueprint.summary ? `
        <div class="summary-box">
          <h4>Executive Summary</h4>
          <p>${blueprint.summary}</p>
        </div>
      ` : ''}

      ${formattedRecs}

      <div class="content">
        ${parsedContent}
      </div>

      <div class="footer">
        Generated by AI Solution Builder Platform &bull; Confidential Enterprise Blueprint &bull; Page 1
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
