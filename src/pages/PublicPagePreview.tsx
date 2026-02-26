import { useParams } from 'react-router-dom';
import { usePageBuilderStore } from '@/store/pageBuilderStore';
import BlockRenderer from '@/components/pageBuilder/BlockRenderer';
import { Helmet } from 'react-helmet-async';

export default function PublicPagePreview() {
  const { slug } = useParams<{ slug: string }>();
  const { pages } = usePageBuilderStore();
  const page = pages.find((p) => p.slug === slug);

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-muted-foreground">الصفحة غير موجودة</p>
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

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {page.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} isPreview />
        ))}
      </main>
    </div>
  );
}
