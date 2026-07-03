import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, AlertTriangle, ExternalLink, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import CodeHighlighter from '@/components/post/CodeHighlighter';
import { Badge } from '@/components/ui/badge';

interface Snapshot {
  title: string;
  summary?: string;
  content: string;
  tags?: string[];
  mainLanguage?: string;
  updatedAt?: string;
  capturedAt?: string;
}

export default function PublicPostShare() {
  const { token } = useParams<{ token: string }>();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'not-found' | 'revoked'>('loading');

  useEffect(() => {
    (async () => {
      if (!token) return setState('not-found');
      const { data, error } = await supabase
        .from('public_post_shares')
        .select('snapshot, revoked, view_count, id')
        .eq('token', token)
        .maybeSingle();
      if (error || !data) return setState('not-found');
      if (data.revoked) return setState('revoked');
      setSnap(data.snapshot as unknown as Snapshot);
      setState('ok');
      // increment view count (best-effort; anon has no UPDATE — silently ignore)
      supabase.from('public_post_shares')
        .update({ view_count: (data.view_count ?? 0) + 1 })
        .eq('id', data.id)
        .then(() => {});
    })();
  }, [token]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (state !== 'ok' || !snap) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500" />
          <h1 className="text-xl font-bold">
            {state === 'revoked' ? 'This link was revoked' : 'Share not found'}
          </h1>
          <p className="text-sm text-muted-foreground">
            The owner has disabled this shared link, or it does not exist.
          </p>
          <Link to="/" className="inline-flex items-center gap-1 text-primary hover:underline text-sm">
            Go to home <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  const isRtl = snap.mainLanguage === 'ar';
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 md:p-8" dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="mb-6 pb-6 border-b">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Badge variant="outline" className="text-[10px]">Read-only share</Badge>
            {snap.capturedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(snap.capturedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">{snap.title}</h1>
          {snap.summary && (
            <p className="text-muted-foreground mt-3 text-lg">{snap.summary}</p>
          )}
          {snap.tags && snap.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {snap.tags.map(t => (
                <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
              ))}
            </div>
          )}
        </header>

        <article>
          <CodeHighlighter
            content={snap.content}
            className="editor-content prose dark:prose-invert max-w-none [&_pre]:text-left [&_pre]:dir-ltr [&_code]:text-left [&_code]:dir-ltr"
            dir={isRtl ? 'rtl' : 'ltr'}
            showTableOfContents={false}
          />
        </article>

        <footer className="mt-12 pt-6 border-t text-xs text-muted-foreground text-center">
          Shared publicly · <Link to="/" className="hover:underline">visit the app</Link>
        </footer>
      </div>
    </div>
  );
}
