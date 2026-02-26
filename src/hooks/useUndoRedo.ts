import { useState, useCallback, useRef, useEffect } from 'react';
import { Block } from '@/types/pageBuilder';

interface HistoryEntry {
  blocks: Block[];
  timestamp: number;
}

const MAX_HISTORY = 50;

export function useUndoRedo(pageId: string | null, blocks: Block[], onRestore: (blocks: Block[]) => void) {
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const lastPageIdRef = useRef<string | null>(null);
  const skipNextRef = useRef(false);

  // Reset history when page changes
  useEffect(() => {
    if (pageId !== lastPageIdRef.current) {
      setPast([]);
      setFuture([]);
      lastPageIdRef.current = pageId;
    }
  }, [pageId]);

  const pushState = useCallback((blocksSnapshot: Block[]) => {
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }
    setPast((prev) => {
      const entry: HistoryEntry = { blocks: JSON.parse(JSON.stringify(blocksSnapshot)), timestamp: Date.now() };
      const newPast = [...prev, entry];
      if (newPast.length > MAX_HISTORY) newPast.shift();
      return newPast;
    });
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const prev = [...past];
    const entry = prev.pop()!;
    setPast(prev);
    setFuture((f) => [...f, { blocks: JSON.parse(JSON.stringify(blocks)), timestamp: Date.now() }]);
    skipNextRef.current = true;
    onRestore(entry.blocks);
  }, [past, blocks, onRestore]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = [...future];
    const entry = next.pop()!;
    setFuture(next);
    setPast((p) => [...p, { blocks: JSON.parse(JSON.stringify(blocks)), timestamp: Date.now() }]);
    skipNextRef.current = true;
    onRestore(entry.blocks);
  }, [future, blocks, onRestore]);

  return {
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    pushState,
    historyLength: past.length,
    futureLength: future.length,
  };
}
