import { useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlogStore } from '@/store/blogStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildGraph } from '@/lib/backlinks';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Network, Search } from 'lucide-react';

interface Positioned {
  id: string;
  title: string;
  degree: number;
  x: number;
  y: number;
}

/**
 * Lightweight force-directed layout (no external deps).
 * Runs a fixed number of iterations synchronously — fine for < 500 nodes.
 */
function layout(nodes: { id: string; title: string; degree: number }[], edges: { source: string; target: string }[], width: number, height: number): Positioned[] {
  const N = nodes.length;
  if (N === 0) return [];
  // seed positions on a circle
  const positioned: Positioned[] = nodes.map((n, i) => ({
    ...n,
    x: width / 2 + Math.cos((i / N) * Math.PI * 2) * Math.min(width, height) * 0.35,
    y: height / 2 + Math.sin((i / N) * Math.PI * 2) * Math.min(width, height) * 0.35,
  }));
  const idIndex = new Map(positioned.map((p, i) => [p.id, i]));

  const iterations = 200;
  const k = Math.sqrt((width * height) / Math.max(N, 1)) * 0.6;
  const gravity = 0.02;

  for (let iter = 0; iter < iterations; iter++) {
    const disp = positioned.map(() => ({ x: 0, y: 0 }));
    // repulsion
    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dx = positioned[i].x - positioned[j].x;
        const dy = positioned[i].y - positioned[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = (k * k) / dist;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        disp[i].x += fx; disp[i].y += fy;
        disp[j].x -= fx; disp[j].y -= fy;
      }
    }
    // attraction along edges
    for (const e of edges) {
      const i = idIndex.get(e.source); const j = idIndex.get(e.target);
      if (i === undefined || j === undefined) continue;
      const dx = positioned[i].x - positioned[j].x;
      const dy = positioned[i].y - positioned[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      disp[i].x -= fx; disp[i].y -= fy;
      disp[j].x += fx; disp[j].y += fy;
    }
    // apply + gravity + cooling
    const temp = (1 - iter / iterations) * 40;
    for (let i = 0; i < N; i++) {
      const d = disp[i];
      const dlen = Math.sqrt(d.x * d.x + d.y * d.y) || 0.01;
      positioned[i].x += (d.x / dlen) * Math.min(dlen, temp);
      positioned[i].y += (d.y / dlen) * Math.min(dlen, temp);
      // gravity
      positioned[i].x += (width / 2 - positioned[i].x) * gravity;
      positioned[i].y += (height / 2 - positioned[i].y) * gravity;
      // bounds
      positioned[i].x = Math.max(30, Math.min(width - 30, positioned[i].x));
      positioned[i].y = Math.max(30, Math.min(height - 30, positioned[i].y));
    }
  }
  return positioned;
}

export default function KnowledgeGraph() {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const posts = useBlogStore(s => s.posts);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [hoverId, setHoverId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1000, h: 700 });

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setSize({ w: el.clientWidth, h: Math.max(600, window.innerHeight - 260) });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  const { nodes, edges } = useMemo(() => buildGraph(posts), [posts]);

  const positioned = useMemo(
    () => layout(nodes, edges, size.w, size.h),
    [nodes, edges, size.w, size.h]
  );

  const posMap = useMemo(() => new Map(positioned.map(p => [p.id, p])), [positioned]);

  const q = query.trim().toLowerCase();
  const isMatch = (title: string) => !q || title.toLowerCase().includes(q);

  const connected = new Set<string>();
  if (hoverId) {
    connected.add(hoverId);
    for (const e of edges) {
      if (e.source === hoverId) connected.add(e.target);
      if (e.target === hoverId) connected.add(e.source);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Network className="w-6 h-6 text-primary" />
            {isAr ? 'خريطة المعرفة' : 'Knowledge Graph'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr
              ? 'عرض بصري للترابطات بين المقالات (Zettelkasten). انقر عقدة للانتقال إلى المقال.'
              : 'Visual map of post connections (Zettelkasten). Click a node to open the post.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">{nodes.length} {isAr ? 'عقدة' : 'nodes'}</Badge>
          <Badge variant="secondary">{edges.length} {isAr ? 'رابط' : 'edges'}</Badge>
          <div className="relative">
            <Search className="w-4 h-4 absolute start-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={isAr ? 'ابحث في العقد…' : 'Search nodes…'}
              className="ps-8 w-56"
            />
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden" ref={containerRef as any}>
        {nodes.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {isAr ? 'لا توجد مقالات بعد.' : 'No posts yet.'}
          </div>
        ) : edges.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {isAr
              ? 'لا توجد ترابطات بعد. استخدم [[عنوان المقال]] داخل المحتوى لإنشاء روابط.'
              : 'No connections yet. Use [[Post Title]] inside content to create links.'}
          </div>
        ) : (
          <svg width={size.w} height={size.h} className="block bg-muted/20">
            {/* edges */}
            <g stroke="hsl(var(--muted-foreground))" strokeOpacity="0.35">
              {edges.map((e, i) => {
                const s = posMap.get(e.source); const t = posMap.get(e.target);
                if (!s || !t) return null;
                const active = hoverId && (e.source === hoverId || e.target === hoverId);
                return (
                  <line
                    key={i}
                    x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                    strokeWidth={active ? 2 : 1}
                    stroke={active ? 'hsl(var(--primary))' : undefined}
                    strokeOpacity={hoverId ? (active ? 0.9 : 0.08) : 0.35}
                  />
                );
              })}
            </g>
            {/* nodes */}
            <g>
              {positioned.map(n => {
                const match = isMatch(n.title);
                const highlight = hoverId ? connected.has(n.id) : match;
                const r = Math.max(6, Math.min(18, 6 + n.degree * 1.5));
                return (
                  <g
                    key={n.id}
                    transform={`translate(${n.x}, ${n.y})`}
                    style={{ cursor: 'pointer', opacity: match ? 1 : 0.25 }}
                    onMouseEnter={() => setHoverId(n.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => navigate(`/posts/${n.id}`)}
                  >
                    <circle
                      r={r}
                      fill={highlight ? 'hsl(var(--primary))' : 'hsl(var(--card))'}
                      stroke="hsl(var(--primary))"
                      strokeWidth={highlight ? 2 : 1}
                    />
                    <text
                      y={-r - 6}
                      textAnchor="middle"
                      fontSize={11}
                      fill="hsl(var(--foreground))"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {n.title.length > 28 ? n.title.slice(0, 28) + '…' : n.title}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </Card>
    </div>
  );
}
