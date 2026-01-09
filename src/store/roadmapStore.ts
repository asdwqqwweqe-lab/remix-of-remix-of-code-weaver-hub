import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Roadmap, RoadmapSection, RoadmapTopic } from '@/types/blog';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface RoadmapStore {
  roadmaps: Roadmap[];
  roadmapSections: RoadmapSection[];
  
  // Roadmap actions
  addRoadmap: (roadmap: Omit<Roadmap, 'id' | 'createdAt' | 'updatedAt' | 'sections'>) => string;
  updateRoadmap: (id: string, updates: Partial<Roadmap>) => void;
  deleteRoadmap: (id: string) => void;
  
  // Section actions
  addSection: (section: Omit<RoadmapSection, 'id' | 'createdAt' | 'updatedAt' | 'topics'>) => string;
  updateSection: (id: string, updates: Partial<RoadmapSection>) => void;
  deleteSection: (id: string) => void;
  reorderSections: (roadmapId: string, sectionIds: string[]) => void;
  
  // Topic actions
  addTopic: (sectionId: string, topic: Omit<RoadmapTopic, 'id' | 'sortOrder'>) => void;
  updateTopic: (sectionId: string, topicId: string, updates: Partial<RoadmapTopic>) => void;
  deleteTopic: (sectionId: string, topicId: string) => void;
  toggleTopicComplete: (sectionId: string, topicId: string) => void;
  reorderTopics: (sectionId: string, topicIds: string[]) => void;
  assignPostToTopic: (sectionId: string, topicId: string, postId: string | undefined) => void;
  
  // Getters
  getRoadmapsByLanguage: (languageId: string) => Roadmap[];
  getSectionsByRoadmap: (roadmapId: string) => RoadmapSection[];
  getRoadmapProgress: (roadmapId: string) => { completed: number; total: number; percentage: number };
  getSectionProgress: (sectionId: string) => { completed: number; total: number; percentage: number };
}

export const useRoadmapStore = create<RoadmapStore>()(
  persist(
    (set, get) => ({
      roadmaps: [],
      roadmapSections: [],
      
      addRoadmap: (roadmap) => {
        const id = generateId();
        set((state) => ({
          roadmaps: [
            ...state.roadmaps,
            {
              ...roadmap,
              id,
              sections: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        }));
        return id;
      },
      
      updateRoadmap: (id, updates) => set((state) => ({
        roadmaps: state.roadmaps.map((r) =>
          r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
        ),
      })),
      
      deleteRoadmap: (id) => set((state) => ({
        roadmaps: state.roadmaps.filter((r) => r.id !== id),
        roadmapSections: state.roadmapSections.filter((s) => s.roadmapId !== id),
      })),
      
      addSection: (section) => {
        const id = generateId();
        set((state) => {
          const roadmap = state.roadmaps.find((r) => r.id === section.roadmapId);
          return {
            roadmapSections: [
              ...state.roadmapSections,
              {
                ...section,
                id,
                topics: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            roadmaps: state.roadmaps.map((r) =>
              r.id === section.roadmapId
                ? { ...r, sections: [...r.sections, id], updatedAt: new Date() }
                : r
            ),
          };
        });
        return id;
      },
      
      updateSection: (id, updates) => set((state) => ({
        roadmapSections: state.roadmapSections.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
        ),
      })),
      
      deleteSection: (id) => set((state) => {
        const section = state.roadmapSections.find((s) => s.id === id);
        return {
          roadmapSections: state.roadmapSections.filter((s) => s.id !== id),
          roadmaps: state.roadmaps.map((r) =>
            r.id === section?.roadmapId
              ? { ...r, sections: r.sections.filter((sId) => sId !== id), updatedAt: new Date() }
              : r
          ),
        };
      }),
      
      reorderSections: (roadmapId, sectionIds) => set((state) => ({
        roadmaps: state.roadmaps.map((r) =>
          r.id === roadmapId ? { ...r, sections: sectionIds, updatedAt: new Date() } : r
        ),
        roadmapSections: state.roadmapSections.map((s) => {
          const index = sectionIds.indexOf(s.id);
          if (index !== -1) {
            return { ...s, sortOrder: index + 1 };
          }
          return s;
        }),
      })),
      
      addTopic: (sectionId, topic) => set((state) => ({
        roadmapSections: state.roadmapSections.map((s) => {
          if (s.id !== sectionId) return s;
          const maxOrder = s.topics.length > 0 ? Math.max(...s.topics.map((t) => t.sortOrder)) : 0;
          return {
            ...s,
            topics: [
              ...s.topics,
              {
                ...topic,
                id: generateId(),
                sortOrder: maxOrder + 1,
              },
            ],
            updatedAt: new Date(),
          };
        }),
      })),
      
      updateTopic: (sectionId, topicId, updates) => set((state) => ({
        roadmapSections: state.roadmapSections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                topics: s.topics.map((t) => (t.id === topicId ? { ...t, ...updates } : t)),
                updatedAt: new Date(),
              }
            : s
        ),
      })),
      
      deleteTopic: (sectionId, topicId) => set((state) => ({
        roadmapSections: state.roadmapSections.map((s) =>
          s.id === sectionId
            ? { ...s, topics: s.topics.filter((t) => t.id !== topicId), updatedAt: new Date() }
            : s
        ),
      })),
      
      toggleTopicComplete: (sectionId, topicId) => set((state) => ({
        roadmapSections: state.roadmapSections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                topics: s.topics.map((t) =>
                  t.id === topicId ? { ...t, completed: !t.completed } : t
                ),
                updatedAt: new Date(),
              }
            : s
        ),
      })),
      
      reorderTopics: (sectionId, topicIds) => set((state) => ({
        roadmapSections: state.roadmapSections.map((s) => {
          if (s.id !== sectionId) return s;
          const reorderedTopics = topicIds.map((id, index) => {
            const topic = s.topics.find((t) => t.id === id);
            return topic ? { ...topic, sortOrder: index + 1 } : null;
          }).filter(Boolean) as RoadmapTopic[];
          return { ...s, topics: reorderedTopics, updatedAt: new Date() };
        }),
      })),
      
      assignPostToTopic: (sectionId, topicId, postId) => set((state) => ({
        roadmapSections: state.roadmapSections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                topics: s.topics.map((t) =>
                  t.id === topicId ? { ...t, postId } : t
                ),
                updatedAt: new Date(),
              }
            : s
        ),
      })),
      
      getRoadmapsByLanguage: (languageId) => {
        return get().roadmaps.filter((r) => r.languageId === languageId);
      },
      
      getSectionsByRoadmap: (roadmapId) => {
        const roadmap = get().roadmaps.find((r) => r.id === roadmapId);
        if (!roadmap) return [];
        return roadmap.sections
          .map((sId) => get().roadmapSections.find((s) => s.id === sId))
          .filter(Boolean) as RoadmapSection[];
      },
      
      getRoadmapProgress: (roadmapId) => {
        const sections = get().getSectionsByRoadmap(roadmapId);
        let completed = 0;
        let total = 0;
        sections.forEach((section) => {
          section.topics.forEach((topic) => {
            total++;
            if (topic.completed) completed++;
          });
        });
        return {
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      },
      
      getSectionProgress: (sectionId) => {
        const section = get().roadmapSections.find((s) => s.id === sectionId);
        if (!section) return { completed: 0, total: 0, percentage: 0 };
        const total = section.topics.length;
        const completed = section.topics.filter((t) => t.completed).length;
        return {
          completed,
          total,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      },
    }),
    {
      name: 'blog-roadmap-storage',
    }
  )
);
