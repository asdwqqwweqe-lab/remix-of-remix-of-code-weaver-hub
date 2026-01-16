import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Report } from '@/types/blog';

interface ReportStore {
  reports: Report[];
  searchQuery: string;

  // Actions
  addReport: (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReport: (id: string, report: Partial<Report>) => void;
  deleteReport: (id: string) => void;
  deleteMultipleReports: (ids: string[]) => void;
  setSearchQuery: (query: string) => void;

  // Getters
  getReportById: (id: string) => Report | undefined;
  getFilteredReports: () => Report[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useReportStore = create<ReportStore>()(
  persist(
    (set, get) => ({
      reports: [],
      searchQuery: '',

      addReport: (report) => set((state) => ({
        reports: [{
          ...report,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }, ...state.reports],
      })),

      updateReport: (id, report) => set((state) => ({
        reports: state.reports.map((r) =>
          r.id === id ? { ...r, ...report, updatedAt: new Date() } : r
        ),
      })),

      deleteReport: (id) => set((state) => ({
        reports: state.reports.filter((r) => r.id !== id),
      })),

      deleteMultipleReports: (ids) => set((state) => ({
        reports: state.reports.filter((r) => !ids.includes(r.id)),
      })),

      setSearchQuery: (query) => set({ searchQuery: query }),

      getReportById: (id) => get().reports.find((r) => r.id === id),

      getFilteredReports: () => {
        const state = get();
        let filtered = [...state.reports];

        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter((r) =>
            r.title.toLowerCase().includes(query) ||
            r.content.toLowerCase().includes(query) ||
            r.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }

        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return filtered;
      },
    }),
    {
      name: 'reports-storage',
    }
  )
);
