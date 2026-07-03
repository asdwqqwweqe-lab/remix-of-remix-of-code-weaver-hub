import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Render HTML content into a paginated A4 PDF with RTL-friendly styling.
 * Works by rendering the HTML into an off-screen container then capturing it
 * with html2canvas and slicing the canvas across PDF pages.
 */
export async function exportHtmlToPdf(opts: {
  title: string;
  html: string;
  direction?: 'rtl' | 'ltr';
  filename?: string;
}) {
  const { title, html, direction = 'rtl' } = opts;
  const filename =
    opts.filename ??
    `${title.replace(/[^\w\u0600-\u06FF\s-]/g, '').replace(/\s+/g, '-') || 'document'}.pdf`;

  // Off-screen render container
  const host = document.createElement('div');
  host.setAttribute('dir', direction);
  host.style.cssText = `
    position: fixed; left: -10000px; top: 0;
    width: 794px; /* ~ A4 @ 96dpi */
    padding: 48px 56px;
    background: #ffffff;
    color: #111827;
    font-family: 'Tajawal', 'Segoe UI', Tahoma, sans-serif;
    line-height: 1.85;
    font-size: 15px;
  `;
  host.innerHTML = `
    <style>
      .pdf-doc h1 { font-size: 28px; margin: 0 0 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
      .pdf-doc h2 { font-size: 22px; margin: 22px 0 10px; color: #0f172a; }
      .pdf-doc h3 { font-size: 18px; margin: 18px 0 8px; }
      .pdf-doc p { margin: 0 0 12px; }
      .pdf-doc ul, .pdf-doc ol { margin: 0 0 12px; padding-${direction === 'rtl' ? 'right' : 'left'}: 24px; }
      .pdf-doc li { margin-bottom: 4px; }
      .pdf-doc code { background:#f3f4f6; padding:2px 6px; border-radius:4px; font-size:13px; font-family: 'JetBrains Mono', monospace; }
      .pdf-doc pre { background:#0f172a; color:#e2e8f0; padding:14px; border-radius:8px; overflow:hidden; direction: ltr; text-align: left; font-family:'JetBrains Mono', monospace; font-size:13px; white-space: pre-wrap; word-break: break-word; }
      .pdf-doc pre code { background: transparent; color: inherit; padding: 0; }
      .pdf-doc blockquote { border-${direction === 'rtl' ? 'right' : 'left'}: 4px solid #14b8a6; padding-${direction === 'rtl' ? 'right' : 'left'}: 14px; margin: 12px 0; color:#475569; }
      .pdf-doc img { max-width: 100%; border-radius: 8px; }
      .pdf-doc a { color: #0ea5e9; text-decoration: none; }
      .pdf-doc table { border-collapse: collapse; width: 100%; margin: 12px 0; }
      .pdf-doc th, .pdf-doc td { border: 1px solid #e5e7eb; padding: 6px 8px; }
      .pdf-header { display:flex; justify-content:space-between; align-items:baseline; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
      .pdf-header h1 { border:none; margin:0; font-size: 24px; }
      .pdf-header small { color:#64748b; font-size:12px; }
    </style>
    <div class="pdf-header">
      <h1>${escapeHtml(title)}</h1>
      <small>${new Date().toLocaleDateString(direction === 'rtl' ? 'ar-EG' : 'en-US')}</small>
    </div>
    <div class="pdf-doc">${html}</div>
  `;
  document.body.appendChild(host);

  try {
    // Wait for images
    await Promise.all(
      Array.from(host.querySelectorAll('img')).map(
        (img) =>
          new Promise<void>((res) => {
            if ((img as HTMLImageElement).complete) return res();
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
          }),
      ),
    );

    const canvas = await html2canvas(host, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    // Slice by page height
    const pxPerPt = canvas.width / pageW;
    const pageHeightPx = pageH * pxPerPt;
    let renderedPx = 0;
    let pageIndex = 0;

    while (renderedPx < canvas.height) {
      const sliceHeight = Math.min(pageHeightPx, canvas.height - renderedPx);
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sliceHeight;
      const ctx = slice.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(
        canvas,
        0, renderedPx, canvas.width, sliceHeight,
        0, 0, canvas.width, sliceHeight,
      );
      const imgData = slice.toDataURL('image/jpeg', 0.92);
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pageW, (sliceHeight * pageW) / canvas.width);
      renderedPx += sliceHeight;
      pageIndex += 1;
    }

    pdf.save(filename);
    return { pages: pageIndex, filename };
  } finally {
    host.remove();
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function markdownToHtml(md: string): string {
  // minimal converter to keep dependencies zero
  let h = md;
  h = h.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code${lang ? ` class="language-${lang}"` : ''}>${escapeHtml(code)}</code></pre>`);
  h = h.replace(/`([^`]+)`/g, (_, c) => `<code>${escapeHtml(c)}</code>`);
  h = h.replace(/^###### (.*)$/gm, '<h6>$1</h6>');
  h = h.replace(/^##### (.*)$/gm, '<h5>$1</h5>');
  h = h.replace(/^#### (.*)$/gm, '<h4>$1</h4>');
  h = h.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  h = h.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  h = h.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>');
  h = h.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  h = h.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
  h = h.replace(/^---$/gm, '<hr/>');
  h = h.replace(/^(?:- |\* )(.*)$/gm, '<li>$1</li>');
  h = h.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  h = h.split(/\n{2,}/).map((p) => (/^\s*<(h\d|ul|ol|pre|blockquote|img|hr)/.test(p) ? p : `<p>${p.replace(/\n/g, '<br/>')}</p>`)).join('\n');
  return h;
}
