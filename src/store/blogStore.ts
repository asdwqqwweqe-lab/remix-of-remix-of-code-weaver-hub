import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Post,
  Category,
  Tag,
  ProgrammingLanguage,
  Snippet,
  Collection,
  Comment,
  PostVersion,
  LanguageSection,
  GalleryImage
} from '@/types/blog';
import {
  sampleCategories,
  sampleLanguages,
  sampleTags,
  sampleSections,
  samplePosts,
  sampleSnippets,
  sampleCollections,
} from './blogStore/sampleData';

interface BlogStore {
  // Data
  posts: Post[];
  categories: Category[];
  tags: Tag[];
  programmingLanguages: ProgrammingLanguage[];
  snippets: Snippet[];
  collections: Collection[];
  comments: Comment[];
  postVersions: PostVersion[];
  languageSections: LanguageSection[];
  galleryImages: GalleryImage[];

  // Search & Filter state
  searchQuery: string;
  selectedCategoryId: string | null;
  selectedTagIds: string[];
  selectedLanguageIds: string[];
  selectedStatus: string | null;
  selectedContentLanguage: string | null;
  sortBy: 'newest' | 'oldest' | 'mostViewed' | 'mostCommented';

  // Actions - Posts
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePost: (id: string, post: Partial<Post>) => void;
  deletePost: (id: string) => void;
  deleteMultiplePosts: (ids: string[]) => void;
  toggleFavorite: (id: string) => void;
  incrementViews: (id: string) => void;

  // Actions - Categories
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Actions - Tags
  addTag: (tag: Omit<Tag, 'id'>) => void;
  updateTag: (id: string, tag: Partial<Tag>) => void;
  deleteTag: (id: string) => void;

  // Actions - Programming Languages
  addProgrammingLanguage: (lang: Omit<ProgrammingLanguage, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProgrammingLanguage: (id: string, lang: Partial<ProgrammingLanguage>) => void;
  deleteProgrammingLanguage: (id: string) => void;

  // Actions - Snippets
  addSnippet: (snippet: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSnippet: (id: string, snippet: Partial<Snippet>) => void;
  deleteSnippet: (id: string) => void;

  // Actions - Collections
  addCollection: (collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCollection: (id: string, collection: Partial<Collection>) => void;
  deleteCollection: (id: string) => void;
  addPostToCollection: (collectionId: string, postId: string) => void;
  removePostFromCollection: (collectionId: string, postId: string) => void;
  reorderCollectionPosts: (collectionId: string, postIds: string[]) => void;
  movePostToCollection: (postId: string, fromCollectionId: string | null, toCollectionId: string) => void;

  // Actions - Language Sections
  addLanguageSection: (section: Omit<LanguageSection, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLanguageSection: (id: string, section: Partial<LanguageSection>) => void;
  deleteLanguageSection: (id: string) => void;
  addPostToSection: (sectionId: string, postId: string) => void;
  reorderSectionPosts: (sectionId: string, postIds: string[]) => void;
  reorderSections: (languageId: string, sectionIds: string[]) => void;
  removePostFromSection: (sectionId: string, postId: string) => void;

  // Actions - Comments
  addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCommentStatus: (id: string, status: Comment['status']) => void;
  deleteComment: (id: string) => void;

  // Actions - Versions
  createVersion: (postId: string) => void;
  restoreVersion: (versionId: string) => void;

  // Actions - Gallery
  addGalleryImage: (image: Omit<GalleryImage, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGalleryImage: (id: string, image: Partial<GalleryImage>) => void;
  deleteGalleryImage: (id: string) => void;

  // Actions - Search & Filter
  setSearchQuery: (query: string) => void;
  setSelectedCategoryId: (id: string | null) => void;
  setSelectedTagIds: (ids: string[]) => void;
  setSelectedLanguageIds: (ids: string[]) => void;
  setSelectedStatus: (status: string | null) => void;
  setSelectedContentLanguage: (lang: string | null) => void;
  setSortBy: (sort: 'newest' | 'oldest' | 'mostViewed' | 'mostCommented') => void;
  clearFilters: () => void;

  // Getters
  getFilteredPosts: () => Post[];
  getPostById: (id: string) => Post | undefined;
  getCategoryById: (id: string) => Category | undefined;
  getTagById: (id: string) => Tag | undefined;
  getLanguageById: (id: string) => ProgrammingLanguage | undefined;
  getCollectionById: (id: string) => Collection | undefined;
  getSectionsByLanguage: (langId: string) => LanguageSection[];
  getPostsByTag: (tagId: string) => Post[];
  getPostsByLanguage: (langId: string) => Post[];
  getPostsByCategory: (categoryId: string) => Post[];
  getFavoritePosts: () => Post[];
  getCommentsByPost: (postId: string) => Comment[];
  getPostVersions: (postId: string) => PostVersion[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useBlogStore = create<BlogStore>()(
  persist(
    (set, get) => ({
      // Initial Data
      posts: samplePosts,
      categories: sampleCategories,
      tags: sampleTags,
      programmingLanguages: sampleLanguages,
      snippets: sampleSnippets,
      collections: sampleCollections,
      comments: [],
      postVersions: [],
      languageSections: sampleSections,
      galleryImages: [],

      // Initial Search & Filter state
      searchQuery: '',
      selectedCategoryId: null,
      selectedTagIds: [],
      selectedLanguageIds: [],
      selectedStatus: null,
      selectedContentLanguage: null,
      sortBy: 'newest',

      // Posts Actions
      addPost: (post) => set((state) => ({
        posts: [...state.posts, { ...post, id: generateId(), createdAt: new Date(), updatedAt: new Date() }],
      })),
      updatePost: (id, post) => set((state) => ({
        posts: state.posts.map((p) => p.id === id ? { ...p, ...post, updatedAt: new Date() } : p),
      })),
      deletePost: (id) => set((state) => ({ posts: state.posts.filter((p) => p.id !== id) })),
      deleteMultiplePosts: (ids) => set((state) => ({ posts: state.posts.filter((p) => !ids.includes(p.id)) })),
      toggleFavorite: (id) => set((state) => ({
        posts: state.posts.map((p) => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p),
      })),
      incrementViews: (id) => set((state) => ({
        posts: state.posts.map((p) => p.id === id ? { ...p, viewsCount: p.viewsCount + 1 } : p),
      })),

      // Categories Actions
      addCategory: (category) => set((state) => ({
        categories: [...state.categories, { ...category, id: generateId(), createdAt: new Date(), updatedAt: new Date() }],
      })),
      updateCategory: (id, category) => set((state) => ({
        categories: state.categories.map((c) => c.id === id ? { ...c, ...category, updatedAt: new Date() } : c),
      })),
      deleteCategory: (id) => set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })),

      // Tags Actions
      addTag: (tag) => set((state) => ({ tags: [...state.tags, { ...tag, id: generateId() }] })),
      updateTag: (id, tag) => set((state) => ({ tags: state.tags.map((t) => t.id === id ? { ...t, ...tag } : t) })),
      deleteTag: (id) => set((state) => ({ tags: state.tags.filter((t) => t.id !== id) })),

      // Programming Languages Actions
      addProgrammingLanguage: (lang) => set((state) => ({
        programmingLanguages: [...state.programmingLanguages, { ...lang, id: generateId(), createdAt: new Date(), updatedAt: new Date() }],
      })),
      updateProgrammingLanguage: (id, lang) => set((state) => ({
        programmingLanguages: state.programmingLanguages.map((l) => l.id === id ? { ...l, ...lang, updatedAt: new Date() } : l),
      })),
      deleteProgrammingLanguage: (id) => set((state) => ({
        programmingLanguages: state.programmingLanguages.filter((l) => l.id !== id),
      })),

      // Snippets Actions
      addSnippet: (snippet) => set((state) => ({
        snippets: [...state.snippets, { ...snippet, id: generateId(), createdAt: new Date(), updatedAt: new Date() }],
      })),
      updateSnippet: (id, snippet) => set((state) => ({
        snippets: state.snippets.map((s) => s.id === id ? { ...s, ...snippet, updatedAt: new Date() } : s),
      })),
      deleteSnippet: (id) => set((state) => ({ snippets: state.snippets.filter((s) => s.id !== id) })),

      // Collections Actions
      addCollection: (collection) => set((state) => ({
        collections: [...state.collections, { ...collection, id: generateId(), createdAt: new Date(), updatedAt: new Date() }],
      })),
      updateCollection: (id, collection) => set((state) => ({
        collections: state.collections.map((c) => c.id === id ? { ...c, ...collection, updatedAt: new Date() } : c),
      })),
      deleteCollection: (id) => set((state) => ({ collections: state.collections.filter((c) => c.id !== id) })),
      addPostToCollection: (collectionId, postId) => set((state) => ({
        collections: state.collections.map((c) => {
          if (c.id !== collectionId) return c;
          if (c.posts.some(p => p.postId === postId)) return c;
          const newSortOrder = c.posts.length > 0 ? Math.max(...c.posts.map(p => p.sortOrder)) + 1 : 1;
          return { ...c, posts: [...c.posts, { postId, sortOrder: newSortOrder }], updatedAt: new Date() };
        }),
      })),
      removePostFromCollection: (collectionId, postId) => set((state) => ({
        collections: state.collections.map((c) =>
          c.id === collectionId ? { ...c, posts: c.posts.filter(p => p.postId !== postId), updatedAt: new Date() } : c
        ),
      })),
      reorderCollectionPosts: (collectionId, postIds) => set((state) => ({
        collections: state.collections.map((c) => {
          if (c.id !== collectionId) return c;
          const reorderedPosts = postIds.map((postId, index) => ({ postId, sortOrder: index + 1 }));
          return { ...c, posts: reorderedPosts, updatedAt: new Date() };
        }),
      })),
      movePostToCollection: (postId, fromCollectionId, toCollectionId) => set((state) => {
        let collections = state.collections.map((c) => {
          if (fromCollectionId && c.id === fromCollectionId) {
            return { ...c, posts: c.posts.filter(p => p.postId !== postId), updatedAt: new Date() };
          }
          return c;
        });
        collections = collections.map((c) => {
          if (c.id === toCollectionId) {
            if (c.posts.some(p => p.postId === postId)) return c;
            const newSortOrder = c.posts.length > 0 ? Math.max(...c.posts.map(p => p.sortOrder)) + 1 : 1;
            return { ...c, posts: [...c.posts, { postId, sortOrder: newSortOrder }], updatedAt: new Date() };
          }
          return c;
        });
        const posts = state.posts.map((p) =>
          p.id === postId ? { ...p, collectionId: toCollectionId, updatedAt: new Date() } : p
        );
        return { collections, posts };
      }),

      // Language Sections Actions
      addLanguageSection: (section) => set((state) => ({
        languageSections: [...state.languageSections, { ...section, id: generateId(), createdAt: new Date(), updatedAt: new Date() }],
      })),
      updateLanguageSection: (id, section) => set((state) => ({
        languageSections: state.languageSections.map((s) => s.id === id ? { ...s, ...section, updatedAt: new Date() } : s),
      })),
      deleteLanguageSection: (id) => set((state) => ({
        languageSections: state.languageSections.filter((s) => s.id !== id),
      })),
      addPostToSection: (sectionId, postId) => set((state) => ({
        languageSections: state.languageSections.map((s) => {
          if (s.id !== sectionId) return s;
          if (s.posts.some(p => p.postId === postId)) return s;
          const newSortOrder = s.posts.length > 0 ? Math.max(...s.posts.map(p => p.sortOrder)) + 1 : 1;
          return { ...s, posts: [...s.posts, { postId, sortOrder: newSortOrder }], updatedAt: new Date() };
        }),
      })),
      removePostFromSection: (sectionId, postId) => set((state) => ({
        languageSections: state.languageSections.map((s) =>
          s.id === sectionId ? { ...s, posts: s.posts.filter(p => p.postId !== postId), updatedAt: new Date() } : s
        ),
      })),
      reorderSectionPosts: (sectionId, postIds) => set((state) => ({
        languageSections: state.languageSections.map((s) => {
          if (s.id !== sectionId) return s;
          const reorderedPosts = postIds.map((postId, index) => ({
            postId, sortOrder: index + 1,
            completed: s.posts.find(p => p.postId === postId)?.completed || false
          }));
          return { ...s, posts: reorderedPosts, updatedAt: new Date() };
        }),
      })),
      reorderSections: (languageId, sectionIds) => set((state) => ({
        languageSections: state.languageSections.map((s) => {
          if (s.languageId !== languageId) return s;
          const newSortOrder = sectionIds.indexOf(s.id) + 1;
          return { ...s, sortOrder: newSortOrder, updatedAt: new Date() };
        }),
      })),

      // Comments Actions
      addComment: (comment) => set((state) => ({
        comments: [...state.comments, { ...comment, id: generateId(), createdAt: new Date(), updatedAt: new Date() }],
      })),
      updateCommentStatus: (id, status) => set((state) => ({
        comments: state.comments.map((c) => c.id === id ? { ...c, status, updatedAt: new Date() } : c),
      })),
      deleteComment: (id) => set((state) => ({ comments: state.comments.filter((c) => c.id !== id) })),

      // Versions Actions
      createVersion: (postId) => {
        const post = get().posts.find((p) => p.id === postId);
        if (!post) return;
        const existingVersions = get().postVersions.filter((v) => v.postId === postId);
        set((state) => ({
          postVersions: [...state.postVersions, {
            id: generateId(), postId, versionNumber: existingVersions.length + 1,
            titleSnapshot: post.title, summarySnapshot: post.summary, contentSnapshot: post.content,
            createdAt: new Date(),
          }],
        }));
      },
      restoreVersion: (versionId) => {
        const version = get().postVersions.find((v) => v.id === versionId);
        if (!version) return;
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === version.postId ? { ...p, title: version.titleSnapshot, summary: version.summarySnapshot, content: version.contentSnapshot, updatedAt: new Date() } : p
          ),
        }));
      },

      // Gallery Actions
      addGalleryImage: (image) => set((state) => ({
        galleryImages: [...state.galleryImages, { ...image, id: generateId(), createdAt: new Date(), updatedAt: new Date() }],
      })),
      updateGalleryImage: (id, image) => set((state) => ({
        galleryImages: state.galleryImages.map((img) => img.id === id ? { ...img, ...image, updatedAt: new Date() } : img),
      })),
      deleteGalleryImage: (id) => set((state) => ({
        galleryImages: state.galleryImages.filter((img) => img.id !== id),
      })),

      // Search & Filter Actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),
      setSelectedTagIds: (ids) => set({ selectedTagIds: ids }),
      setSelectedLanguageIds: (ids) => set({ selectedLanguageIds: ids }),
      setSelectedStatus: (status) => set({ selectedStatus: status }),
      setSelectedContentLanguage: (lang) => set({ selectedContentLanguage: lang }),
      setSortBy: (sort) => set({ sortBy: sort }),
      clearFilters: () => set({
        searchQuery: '', selectedCategoryId: null, selectedTagIds: [], selectedLanguageIds: [],
        selectedStatus: null, selectedContentLanguage: null, sortBy: 'newest',
      }),

      // Getters
      getFilteredPosts: () => {
        const state = get();
        let filtered = [...state.posts];
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter((p) => p.title.toLowerCase().includes(query) || p.summary.toLowerCase().includes(query) || p.content.toLowerCase().includes(query));
        }
        if (state.selectedCategoryId) filtered = filtered.filter((p) => p.categoryId === state.selectedCategoryId);
        if (state.selectedTagIds.length > 0) filtered = filtered.filter((p) => state.selectedTagIds.some((tagId) => p.tags.includes(tagId)));
        if (state.selectedLanguageIds.length > 0) filtered = filtered.filter((p) => state.selectedLanguageIds.some((langId) => p.programmingLanguages.includes(langId)));
        if (state.selectedStatus) filtered = filtered.filter((p) => p.status === state.selectedStatus);
        if (state.selectedContentLanguage) filtered = filtered.filter((p) => p.mainLanguage === state.selectedContentLanguage);
        switch (state.sortBy) {
          case 'newest': filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
          case 'oldest': filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
          case 'mostViewed': filtered.sort((a, b) => b.viewsCount - a.viewsCount); break;
          case 'mostCommented': filtered.sort((a, b) => {
            const aComments = state.comments.filter((c) => c.postId === a.id).length;
            const bComments = state.comments.filter((c) => c.postId === b.id).length;
            return bComments - aComments;
          }); break;
        }
        return filtered;
      },
      getPostById: (id) => get().posts.find((p) => p.id === id),
      getCategoryById: (id) => get().categories.find((c) => c.id === id),
      getTagById: (id) => get().tags.find((t) => t.id === id),
      getLanguageById: (id) => get().programmingLanguages.find((l) => l.id === id),
      getCollectionById: (id) => get().collections.find((c) => c.id === id),
      getSectionsByLanguage: (langId) => get().languageSections.filter((s) => s.languageId === langId).sort((a, b) => a.sortOrder - b.sortOrder),
      getPostsByTag: (tagId) => get().posts.filter((p) => p.tags.includes(tagId)),
      getPostsByLanguage: (langId) => get().posts.filter((p) => p.programmingLanguages.includes(langId)),
      getPostsByCategory: (categoryId) => get().posts.filter((p) => p.categoryId === categoryId),
      getFavoritePosts: () => get().posts.filter((p) => p.isFavorite),
      getCommentsByPost: (postId) => get().comments.filter((c) => c.postId === postId),
      getPostVersions: (postId) => get().postVersions.filter((v) => v.postId === postId).sort((a, b) => b.versionNumber - a.versionNumber),
    }),
    {
      name: 'blog-storage',
      partialize: (state) => ({
        posts: state.posts, categories: state.categories, tags: state.tags,
        programmingLanguages: state.programmingLanguages, snippets: state.snippets,
        collections: state.collections, comments: state.comments, postVersions: state.postVersions,
        languageSections: state.languageSections, galleryImages: state.galleryImages,
      }),
    }
  )
);
