import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link2, ArrowUpRight, Network } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBacklinks, useOutgoingLinks } from '@/hooks/useBacklinks';

interface Props {
  postId: string;
}

export default function BacklinksList({ postId }: Props) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const backlinks = useBacklinks(postId);
  const outgoing = useOutgoingLinks(postId);

  if (backlinks.length === 0 && outgoing.length === 0) return null;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Network className="w-5 h-5 text-primary" />
          {isAr ? 'الترابطات (Zettelkasten)' : 'Connections (Zettelkasten)'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {backlinks.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <Link2 className="w-4 h-4" />
              <span>{isAr ? 'مقالات تشير إلى هذا المقال' : 'Posts linking here'}</span>
              <Badge variant="secondary">{backlinks.length}</Badge>
            </div>
            <ul className="space-y-2">
              {backlinks.map(p => (
                <li key={p.id}>
                  <Link
                    to={`/posts/${p.id}`}
                    className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted transition-colors group"
                  >
                    <span className="truncate">{p.title || (isAr ? '(بدون عنوان)' : '(untitled)')}</span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {outgoing.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <ArrowUpRight className="w-4 h-4" />
              <span>{isAr ? 'مقالات مرتبطة من هذا المقال' : 'Links from this post'}</span>
              <Badge variant="secondary">{outgoing.length}</Badge>
            </div>
            <ul className="space-y-2">
              {outgoing.map(p => (
                <li key={p.id}>
                  <Link
                    to={`/posts/${p.id}`}
                    className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted transition-colors group"
                  >
                    <span className="truncate">{p.title || (isAr ? '(بدون عنوان)' : '(untitled)')}</span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          {isAr
            ? 'استخدم [[عنوان المقال]] أو /posts/{id} داخل المحتوى لإنشاء ترابطات جديدة.'
            : 'Use [[Post Title]] or /posts/{id} inside content to create connections.'}
        </p>
      </CardContent>
    </Card>
  );
}
