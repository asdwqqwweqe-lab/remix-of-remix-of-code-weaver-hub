import { useParams, Link } from 'react-router-dom';
import { usePageBuilderStore } from '@/store/pageBuilderStore';
import { useLanguage } from '@/contexts/LanguageContext';
import BlockRenderer from '@/components/pageBuilder/BlockRenderer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function PagePreview() {
  const { slug } = useParams<{ slug: string }>();
  const { pages } = usePageBuilderStore();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const page = pages.find((p) => p.slug === slug);

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-muted-foreground mb-6">{isRTL ? 'الصفحة غير موجودة' : 'Page not found'}</p>
          <Link to="/page-builder"><Button>{isRTL ? 'العودة للمحرر' : 'Back to Editor'}</Button></Link>
        </div>
      </div>
    );
  }

  const BackIcon = page.direction === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background" dir={page.direction}>
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.title} />
        <html lang={page.direction === 'rtl' ? 'ar' : 'en'} dir={page.direction} />
      </Helmet>

      <div className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/page-builder">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <BackIcon className="w-4 h-4" />
              {isRTL ? 'العودة للمحرر' : 'Back to Editor'}
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground font-mono">/{page.slug}</span>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {page.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} isPreview />
        ))}
      </main>
    </div>
  );
}
