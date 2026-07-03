import { useEffect, useMemo, useRef, useState, PointerEvent as RPE } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Plus, Trash2, Download, Upload, Save, Maximize2, ZoomIn, ZoomOut, RotateCcw,
  Palette, Edit3, Link2,
} from 'lucide-react';

interface MNode {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  parentId: string | null;
}

const STORAGE_KEY = 'mindmap-data-v1';
const COLORS = ['#14b8a6', '#f43f5e', '#8b5cf6', '#f59e0b', '#3b82f6', '#22c55e', '#ec4899', '#06b6d4'];

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultData = (): MNode[] => [
  { id: 'root', text: 'الفكرة الرئيسية', x: 600, y: 400, color: COLORS[0], parentId: null },
  { id: uid(), text: 'فرع ١', x: 350, y: 250, color: COLORS[1], parentId: 'root' },
  { id: uid(), text: 'فرع ٢', x: 850, y: 250, color: COLORS[2], parentId: 'root' },
  { id: uid(), text: 'فرع ٣', x: 350, y: 550, color: COLORS[3], parentId: 'root' },
  { id: uid(), text: 'فرع ٤', x: 850, y: 550, color: COLORS[4], parentId: 'root' },
];

export default function MindMap() {
  const { language, isRTL } = useLanguage();
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  const [nodes, setNodes] = useState<MNode[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return defaultData();
  });
  const [selectedId, setSelectedId] = useState<string | null>('root');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; offX: number; offY: number } | null>(null);
  const panRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const id = setTimeout(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes)), 200);
    return () => clearTimeout(id);
  }, [nodes]);

  const selected = useMemo(() => nodes.find((n) => n.id === selectedId) || null, [nodes, selectedId]);

  const addChild = (parentId: string | null) => {
    const parent = nodes.find((n) => n.id === parentId);
    const cx = parent ? parent.x + 180 : 600;
    const cy = parent ? parent.y + 80 : 400;
    const color = COLORS[nodes.length % COLORS.length];
    const node: MNode = {
      id: uid(),
      text: t('عقدة جديدة', 'New node'),
      x: cx, y: cy, color, parentId: parentId ?? null,
    };
    setNodes((p) => [...p, node]);
    setSelectedId(node.id);
    setEditingId(node.id);
  };

  const deleteNode = (id: string) => {
    if (id === 'root') { toast.error(t('لا يمكن حذف الجذر', 'Cannot delete root')); return; }
    // remove node and reparent children to its parent
    const target = nodes.find((n) => n.id === id);
    if (!target) return;
    setNodes((p) => p
      .filter((n) => n.id !== id)
      .map((n) => (n.parentId === id ? { ...n, parentId: target.parentId } : n)));
    if (selectedId === id) setSelectedId('root');
  };

  const updateNode = (id: string, patch: Partial<MNode>) => {
    setNodes((p) => p.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const startDrag = (e: RPE<HTMLDivElement>, id: string) => {
    if (editingId === id) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const node = nodes.find((n) => n.id === id)!;
    dragRef.current = { id, offX: e.clientX / zoom - node.x, offY: e.clientY / zoom - node.y };
    setSelectedId(id);
  };
  const onPointerMove = (e: RPE<HTMLDivElement>) => {
    if (dragRef.current) {
      const { id, offX, offY } = dragRef.current;
      updateNode(id, { x: e.clientX / zoom - offX, y: e.clientY / zoom - offY });
    } else if (panRef.current) {
      setPan({ x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y });
    }
  };
  const endDrag = () => { dragRef.current = null; panRef.current = null; };

  const startPan = (e: RPE<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    panRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    setSelectedId(null);
  };

  const handleConnect = (targetId: string) => {
    if (!connectFrom) return;
    if (connectFrom === targetId) { setConnectFrom(null); return; }
    // prevent creating a cycle: don't set parent to one of your descendants
    const isDescendant = (a: string, b: string): boolean => {
      const kids = nodes.filter((n) => n.parentId === a);
      return kids.some((k) => k.id === b || isDescendant(k.id, b));
    };
    if (isDescendant(connectFrom, targetId)) {
      toast.error(t('لا يمكن إنشاء دائرة', 'Cannot create a cycle'));
      setConnectFrom(null); return;
    }
    updateNode(connectFrom, { parentId: targetId });
    toast.success(t('تم الربط', 'Connected'));
    setConnectFrom(null);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mindmap.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const importJson = (file: File) => {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const data = JSON.parse(String(fr.result));
        if (Array.isArray(data)) { setNodes(data); toast.success(t('تم الاستيراد', 'Imported')); }
      } catch { toast.error(t('ملف غير صالح', 'Invalid file')); }
    };
    fr.readAsText(file);
  };
  const resetMap = () => {
    if (!confirm(t('إعادة تعيين الخريطة؟', 'Reset the map?'))) return;
    setNodes(defaultData()); setSelectedId('root'); setPan({ x: 0, y: 0 }); setZoom(1);
  };

  // Curves between parent and child
  const paths = nodes
    .filter((n) => n.parentId)
    .map((n) => {
      const p = nodes.find((x) => x.id === n.parentId);
      if (!p) return null;
      const mx = (p.x + n.x) / 2;
      return { id: n.id, d: `M ${p.x} ${p.y} C ${mx} ${p.y}, ${mx} ${n.y}, ${n.x} ${n.y}`, color: n.color };
    })
    .filter(Boolean) as { id: string; d: string; color: string }[];

  return (
    <div className="p-4 md:p-6 space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('الخريطة الذهنية', 'Mind Map')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('اسحب العقد، أضف فروعاً، واربط الأفكار بصرياً', 'Drag nodes, add branches, and connect ideas visually')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => addChild(selectedId ?? 'root')}>
            <Plus className="w-4 h-4 me-1" />{t('عقدة فرعية', 'Add child')}
          </Button>
          <Button size="sm" variant="outline" onClick={exportJson}>
            <Download className="w-4 h-4 me-1" />{t('تصدير', 'Export')}
          </Button>
          <label className="inline-flex">
            <Button size="sm" variant="outline" asChild>
              <span><Upload className="w-4 h-4 me-1" />{t('استيراد', 'Import')}</span>
            </Button>
            <input type="file" accept="application/json" className="hidden"
              onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
          </label>
          <Button size="sm" variant="outline" onClick={resetMap}>
            <RotateCcw className="w-4 h-4 me-1" />{t('إعادة', 'Reset')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-background to-muted/30" style={{ height: '75vh' }}>
          <div className="absolute top-3 end-3 z-10 flex gap-1 bg-background/80 backdrop-blur rounded-md border p-1">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}><ZoomIn className="w-4 h-4" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}><ZoomOut className="w-4 h-4" /></Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><Maximize2 className="w-4 h-4" /></Button>
            <span className="px-2 self-center text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
          </div>
          {connectFrom && (
            <div className="absolute top-3 start-3 z-10 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-md">
              {t('اضغط على عقدة لجعلها الأب', 'Click a node to set as parent')}
            </div>
          )}
          <div
            ref={canvasRef}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onPointerDown={startPan}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            <div
              className="relative origin-top-left"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: 2000, height: 1400 }}
            >
              <svg width={2000} height={1400} className="absolute inset-0 pointer-events-none">
                {paths.map((p) => (
                  <path key={p.id} d={p.d} stroke={p.color} strokeWidth={2.5} fill="none" opacity={0.7} />
                ))}
              </svg>
              {nodes.map((n) => (
                <div
                  key={n.id}
                  onPointerDown={(e) => startDrag(e, n.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (connectFrom) handleConnect(n.id);
                    else setSelectedId(n.id);
                  }}
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingId(n.id); }}
                  className={`absolute select-none rounded-xl px-4 py-2 shadow-lg cursor-move text-sm font-medium
                    transition-transform hover:scale-105
                    ${selectedId === n.id ? 'ring-2 ring-offset-2 ring-offset-background' : ''}
                    ${n.id === 'root' ? 'text-base px-6 py-3' : ''}`}
                  style={{
                    left: n.x, top: n.y, transform: 'translate(-50%, -50%)',
                    background: n.color, color: '#fff',
                    boxShadow: `0 8px 24px ${n.color}55`,
                    // @ts-expect-error ring color via CSS var
                    '--tw-ring-color': n.color,
                  }}
                >
                  {editingId === n.id ? (
                    <input
                      autoFocus
                      value={n.text}
                      onChange={(e) => updateNode(n.id, { text: e.target.value })}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setEditingId(null); }}
                      className="bg-transparent border-b border-white/60 outline-none min-w-[80px] text-white placeholder-white/70"
                    />
                  ) : (
                    <span>{n.text || t('بدون عنوان', 'Untitled')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-4 space-y-4 h-fit">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{t('حفظ تلقائي محلي', 'Auto-saved locally')}</span>
          </div>

          {selected ? (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">{t('النص', 'Text')}</label>
                <Input
                  value={selected.text}
                  onChange={(e) => updateNode(selected.id, { text: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5" />{t('اللون', 'Color')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateNode(selected.id, { color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition ${selected.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ background: c }}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => addChild(selected.id)}>
                  <Plus className="w-4 h-4 me-1" />{t('فرع', 'Child')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(selected.id)}>
                  <Edit3 className="w-4 h-4 me-1" />{t('تعديل', 'Edit')}
                </Button>
                <Button size="sm" variant="outline"
                  onClick={() => setConnectFrom(selected.id)}
                  disabled={selected.id === 'root'}>
                  <Link2 className="w-4 h-4 me-1" />{t('ربط بأب', 'Reparent')}
                </Button>
                <Button size="sm" variant="outline" className="text-destructive"
                  onClick={() => deleteNode(selected.id)}
                  disabled={selected.id === 'root'}>
                  <Trash2 className="w-4 h-4 me-1" />{t('حذف', 'Delete')}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t space-y-1">
                <div>{t('نقر مزدوج للتحرير', 'Double-click to edit')}</div>
                <div>{t('اسحب الخلفية للتحريك', 'Drag background to pan')}</div>
                <div>{t('اسحب العقدة لتحريكها', 'Drag a node to move it')}</div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('اختر عقدة لتحرير خصائصها', 'Select a node to edit its properties')}
            </p>
          )}

          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              {nodes.length} {t('عقدة', 'nodes')}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
