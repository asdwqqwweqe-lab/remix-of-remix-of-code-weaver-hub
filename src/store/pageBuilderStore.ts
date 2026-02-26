import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Block, Page } from '@/types/pageBuilder';

interface PageBuilderState {
  pages: Page[];
  activePageId: string | null;
  addPage: (page: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updatePage: (id: string, data: Partial<Omit<Page, 'id'>>) => void;
  deletePage: (id: string) => void;
  setActivePage: (id: string | null) => void;
  reorderPages: (ids: string[]) => void;
  addBlock: (pageId: string, block: Record<string, any>, atIndex?: number) => void;
  updateBlock: (pageId: string, blockId: string, data: Record<string, any>) => void;
  deleteBlock: (pageId: string, blockId: string) => void;
  duplicateBlock: (pageId: string, blockId: string) => void;
  moveBlock: (pageId: string, blockId: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  reorderBlocks: (pageId: string, blockIds: string[]) => void;
}

export const usePageBuilderStore = create<PageBuilderState>()(
  persist(
    (set, get) => ({
      pages: [],
      activePageId: null,

      addPage: (pageData) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        set((state) => ({
          pages: [...state.pages, { ...pageData, id, createdAt: now, updatedAt: now }],
          activePageId: id,
        }));
        return id;
      },

      updatePage: (id, data) => {
        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deletePage: (id) => {
        set((state) => ({
          pages: state.pages.filter((p) => p.id !== id),
          activePageId: state.activePageId === id ? (state.pages.find(p => p.id !== id)?.id || null) : state.activePageId,
        }));
      },

      setActivePage: (id) => set({ activePageId: id }),

      reorderPages: (ids) => {
        set((state) => ({
          pages: ids.map((id, i) => {
            const page = state.pages.find((p) => p.id === id)!;
            return { ...page, order: i };
          }),
        }));
      },

      addBlock: (pageId, blockData, atIndex) => {
        set((state) => ({
          pages: state.pages.map((p) => {
            if (p.id !== pageId) return p;
            const newBlock = { ...blockData, id: uuidv4(), order: atIndex ?? p.blocks.length } as Block;
            const blocks = [...p.blocks];
            if (atIndex !== undefined) {
              blocks.splice(atIndex, 0, newBlock);
              blocks.forEach((b, i) => (b.order = i));
            } else {
              blocks.push(newBlock);
            }
            return { ...p, blocks, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      updateBlock: (pageId, blockId, data) => {
        set((state) => ({
          pages: state.pages.map((p) => {
            if (p.id !== pageId) return p;
            return {
              ...p,
              blocks: p.blocks.map((b) => (b.id === blockId ? { ...b, ...data } : b)),
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      deleteBlock: (pageId, blockId) => {
        set((state) => ({
          pages: state.pages.map((p) => {
            if (p.id !== pageId) return p;
            const blocks = p.blocks.filter((b) => b.id !== blockId);
            blocks.forEach((b, i) => (b.order = i));
            return { ...p, blocks, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      duplicateBlock: (pageId, blockId) => {
        set((state) => ({
          pages: state.pages.map((p) => {
            if (p.id !== pageId) return p;
            const idx = p.blocks.findIndex((b) => b.id === blockId);
            if (idx === -1) return p;
            const clone = { ...JSON.parse(JSON.stringify(p.blocks[idx])), id: uuidv4() };
            const blocks = [...p.blocks];
            blocks.splice(idx + 1, 0, clone);
            blocks.forEach((b, i) => (b.order = i));
            return { ...p, blocks, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      moveBlock: (pageId, blockId, direction) => {
        set((state) => ({
          pages: state.pages.map((p) => {
            if (p.id !== pageId) return p;
            const blocks = [...p.blocks];
            const idx = blocks.findIndex((b) => b.id === blockId);
            if (idx === -1) return p;
            let newIdx = idx;
            if (direction === 'up' && idx > 0) newIdx = idx - 1;
            if (direction === 'down' && idx < blocks.length - 1) newIdx = idx + 1;
            if (direction === 'top') newIdx = 0;
            if (direction === 'bottom') newIdx = blocks.length - 1;
            const [item] = blocks.splice(idx, 1);
            blocks.splice(newIdx, 0, item);
            blocks.forEach((b, i) => (b.order = i));
            return { ...p, blocks, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      reorderBlocks: (pageId, blockIds) => {
        set((state) => ({
          pages: state.pages.map((p) => {
            if (p.id !== pageId) return p;
            const blocks = blockIds.map((id, i) => {
              const block = p.blocks.find((b) => b.id === id)!;
              return { ...block, order: i };
            });
            return { ...p, blocks, updatedAt: new Date().toISOString() };
          }),
        }));
      },
    }),
    { name: 'page-builder-storage' }
  )
);
