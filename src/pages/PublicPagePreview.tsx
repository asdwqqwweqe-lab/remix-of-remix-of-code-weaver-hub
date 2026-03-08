import { useParams } from 'react-router-dom';
import { usePageBuilderStore } from '@/store/pageBuilderStore';
import BlockRenderer from '@/components/pageBuilder/BlockRenderer';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Download } from 'lucide-react';

export default function PublicPagePreview() {
  const { slug } = useParams<{ slug: string }>();
  const { pages } = usePageBuilderStore();
  const page = pages.find((p) => p.slug === slug);
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const handleExportHTML = () => {
    if (!page) return;
    const blocksHtml = page.blocks.map(b => {
      switch (b.type) {
        case 'text': return b.level === 'p' ? `<p>${b.content}</p>` : `<${b.level}>${b.content}</${b.level}>`;
        case 'code': return `<pre><code class="language-${b.language}">${b.code}</code></pre>`;
        case 'quote': return `<blockquote><p>${b.text}</p>${b.author ? `<cite>— ${b.author}</cite>` : ''}</blockquote>`;
        case 'image': return `<figure><img src="${b.src}" alt="${b.alt}" />${b.caption ? `<figcaption>${b.caption}</figcaption>` : ''}</figure>`;
        case 'divider': return '<hr />';
        case 'list': {
          const tag = b.ordered ? 'ol' : 'ul';
          return `<${tag}>${b.items.map(i => `<li>${i}</li>`).join('')}</${tag}>`;
        }
        case 'alert': return `<div class="alert alert-${b.alertType}"><p>${b.message}</p></div>`;
        case 'button': return `<a href="${b.url}" class="button">${b.text}</a>`;
        case 'hero': return `<section class="hero"><h1>${b.title}</h1><p>${b.subtitle}</p></section>`;
        case 'table': return `<table><thead><tr>${b.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
        case 'card': return `<div class="card"><h3>${b.title}</h3><p>${b.content}</p></div>`;
        case 'terminal': return `<pre class="terminal">${b.commands.join('\n')}</pre>`;
        default: return '';
      }
    }).join('\n\n');

    const html = `<!DOCTYPE html>
<html lang="${page.direction === 'rtl' ? 'ar' : 'en'}" dir="${page.direction}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${page.title}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem 1rem; color: #1a1a1a; background: #fff; }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    h2 { font-size: 2rem; margin-bottom: 0.75rem; }
    h3 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { margin-bottom: 1rem; color: #555; }
    blockquote { border-left: 4px solid #6366f1; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; }
    pre { background: #1e1e2e; color: #cdd6f4; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin: 1rem 0; }
    code { font-family: 'Fira Code', monospace; }
    img { max-width: 100%; border-radius: 0.5rem; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.75rem; border: 1px solid #e5e7eb; text-align: start; }
    th { background: #f9fafb; font-weight: 600; }
    .card { border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1.5rem; margin: 1rem 0; }
    .button { display: inline-block; padding: 0.5rem 1.5rem; background: #6366f1; color: #fff; border-radius: 0.5rem; text-decoration: none; }
    .hero { text-align: center; padding: 3rem 1rem; background: #f0f0ff; border-radius: 1rem; margin: 1rem 0; }
    .alert { padding: 1rem; border-radius: 0.5rem; border: 1px solid; margin: 1rem 0; }
    .alert-info { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
    .alert-success { background: #f0fdf4; border-color: #22c55e; color: #166534; }
    .alert-warning { background: #fffbeb; border-color: #f59e0b; color: #92400e; }
    .alert-error { background: #fef2f2; border-color: #ef4444; color: #991b1b; }
    .terminal { background: #0d1117; color: #c9d1d9; }
    figcaption { text-align: center; color: #888; font-size: 0.875rem; margin-top: 0.5rem; }
  </style>
</head>
<body>
${blocksHtml}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-muted-foreground">Page not found — الصفحة غير موجودة</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={page.direction}>
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.title} />
        <html lang={page.direction === 'rtl' ? 'ar' : 'en'} dir={page.direction} />
      </Helmet>

      {/* Floating toolbar */}
      <div className="fixed top-4 end-4 z-50 flex items-center gap-2">
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm shadow-lg" onClick={() => setDark(!dark)}>
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm shadow-lg" onClick={handleExportHTML}>
          <Download className="w-4 h-4" />
        </Button>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {page.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} isPreview />
        ))}
      </main>
    </div>
  );
}
