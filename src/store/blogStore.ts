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

// Sample data for demo
const sampleCategories: Category[] = [
  { id: '1', nameAr: 'تطوير الويب', nameEn: 'Web Development', slug: 'web-development', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', nameAr: 'تطوير الموبايل', nameEn: 'Mobile Development', slug: 'mobile-development', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', nameAr: 'الخوادم والباك اند', nameEn: 'Backend & Servers', slug: 'backend-servers', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', nameAr: 'قواعد البيانات', nameEn: 'Databases', slug: 'databases', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', nameAr: 'DevOps', nameEn: 'DevOps', slug: 'devops', createdAt: new Date(), updatedAt: new Date() },
];

const sampleLanguages: ProgrammingLanguage[] = [
  { id: '1', name: 'JavaScript', slug: 'javascript', color: '#f7df1e', icon: 'js', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', name: 'TypeScript', slug: 'typescript', color: '#3178c6', icon: 'ts', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', name: 'React', slug: 'react', color: '#61dafb', icon: 'react', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', name: 'PHP', slug: 'php', color: '#777bb4', icon: 'php', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', name: 'Laravel', slug: 'laravel', color: '#ff2d20', icon: 'laravel', createdAt: new Date(), updatedAt: new Date() },
  { id: '6', name: 'Python', slug: 'python', color: '#3776ab', icon: 'python', createdAt: new Date(), updatedAt: new Date() },
  { id: '7', name: 'Node.js', slug: 'nodejs', color: '#339933', icon: 'node', createdAt: new Date(), updatedAt: new Date() },
  { id: '8', name: 'Vue.js', slug: 'vuejs', color: '#4fc08d', icon: 'vue', createdAt: new Date(), updatedAt: new Date() },
  { id: '9', name: 'CSS', slug: 'css', color: '#1572b6', icon: 'css', createdAt: new Date(), updatedAt: new Date() },
  { id: '10', name: 'HTML', slug: 'html', color: '#e34f26', icon: 'html', createdAt: new Date(), updatedAt: new Date() },
];

const sampleTags: Tag[] = [
  { id: '1', name: 'API', slug: 'api', color: '#3b82f6' },
  { id: '2', name: 'Authentication', slug: 'authentication', color: '#10b981' },
  { id: '3', name: 'Database', slug: 'database', color: '#f59e0b' },
  { id: '4', name: 'Frontend', slug: 'frontend', color: '#ec4899' },
  { id: '5', name: 'Backend', slug: 'backend', color: '#8b5cf6' },
  { id: '6', name: 'Security', slug: 'security', color: '#ef4444' },
  { id: '7', name: 'Performance', slug: 'performance', color: '#06b6d4' },
  { id: '8', name: 'Testing', slug: 'testing', color: '#84cc16' },
];

const sampleSections: LanguageSection[] = [
  {
    id: '1',
    languageId: '5',
    title: 'أساسيات Laravel',
    slug: 'laravel-basics',
    description: 'تعلم أساسيات Laravel من الصفر',
    sortOrder: 1,
    posts: [{ postId: '1', sortOrder: 1 }],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

const samplePosts: Post[] = [
  {
    id: '1',
    title: 'كيفية إنشاء REST API باستخدام Laravel',
    slug: 'laravel-rest-api',
    summary: 'دليل شامل لبناء واجهة برمجة تطبيقات RESTful باستخدام إطار عمل Laravel',
    content: '<h2>مقدمة</h2><p>في هذا المقال سنتعلم كيفية بناء REST API...</p><pre><code class="language-php">Route::apiResource("posts", PostController::class);</code></pre>',
    mainLanguage: 'ar',
    status: 'published',
    categoryId: '3',
    isFavorite: true,
    viewsCount: 245,
    commentsEnabled: true,
    tags: ['1', '5'],
    programmingLanguages: ['4', '5'],
    links: [{ id: '1', label: 'GitHub Repo', url: 'https://github.com/example', type: 'github' }],
    attachments: [],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    title: 'React Hooks: Complete Guide',
    slug: 'react-hooks-guide',
    summary: 'Learn everything about React Hooks including useState, useEffect, useContext, and custom hooks',
    content: '<h2>Introduction to Hooks</h2><p>React Hooks let you use state and other React features...</p><pre><code class="language-typescript">const [count, setCount] = useState(0);</code></pre>',
    mainLanguage: 'en',
    status: 'published',
    categoryId: '1',
    isFavorite: false,
    viewsCount: 389,
    commentsEnabled: true,
    tags: ['4', '7'],
    programmingLanguages: ['1', '2', '3'],
    links: [
      { id: '1', label: 'React Docs', url: 'https://react.dev', type: 'docs' },
      { id: '2', label: 'Live Demo', url: 'https://example.com/demo', type: 'demo' },
    ],
    attachments: [],
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
  },
  {
    id: '3',
    title: 'تأمين تطبيقات الويب من هجمات XSS',
    slug: 'xss-security',
    summary: 'تعلم كيفية حماية تطبيقك من ثغرات Cross-Site Scripting',
    content: '<h2>ما هي هجمات XSS؟</h2><p>هجمات XSS هي نوع من الهجمات الأمنية...</p>',
    mainLanguage: 'ar',
    status: 'published',
    categoryId: '1',
    isFavorite: true,
    viewsCount: 156,
    commentsEnabled: true,
    tags: ['6', '4'],
    programmingLanguages: ['1'],
    links: [],
    attachments: [],
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
  },
];

const sampleSnippets: Snippet[] = [
  {
    id: '1',
    title: 'React useState Hook',
    description: 'Basic usage of useState hook in React',
    code: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}`,
    languageId: '3',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    title: 'Laravel API Route',
    description: 'Define RESTful API routes in Laravel',
    code: `// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('posts', PostController::class);
    Route::apiResource('comments', CommentController::class);
});`,
    languageId: '5',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const sampleCollections: Collection[] = [
  {
    id: '1',
    title: 'تعلم Laravel من الصفر',
    slug: 'learn-laravel',
    description: 'سلسلة كاملة لتعلم Laravel من البداية للاحتراف',
    posts: [{ postId: '1', sortOrder: 1 }],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

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
        posts: [...state.posts, { 
          ...post, 
          id: generateId(), 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }],
      })),
      
      updatePost: (id, post) => set((state) => ({
        posts: state.posts.map((p) => 
          p.id === id ? { ...p, ...post, updatedAt: new Date() } : p
        ),
      })),
      
      deletePost: (id) => set((state) => ({
        posts: state.posts.filter((p) => p.id !== id),
      })),
      
      toggleFavorite: (id) => set((state) => ({
        posts: state.posts.map((p) => 
          p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
        ),
      })),
      
      incrementViews: (id) => set((state) => ({
        posts: state.posts.map((p) => 
          p.id === id ? { ...p, viewsCount: p.viewsCount + 1 } : p
        ),
      })),
      
      // Categories Actions
      addCategory: (category) => set((state) => ({
        categories: [...state.categories, { 
          ...category, 
          id: generateId(), 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }],
      })),
      
      updateCategory: (id, category) => set((state) => ({
        categories: state.categories.map((c) => 
          c.id === id ? { ...c, ...category, updatedAt: new Date() } : c
        ),
      })),
      
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
      })),
      
      // Tags Actions
      addTag: (tag) => set((state) => ({
        tags: [...state.tags, { ...tag, id: generateId() }],
      })),
      
      updateTag: (id, tag) => set((state) => ({
        tags: state.tags.map((t) => t.id === id ? { ...t, ...tag } : t),
      })),
      
      deleteTag: (id) => set((state) => ({
        tags: state.tags.filter((t) => t.id !== id),
      })),
      
      // Programming Languages Actions
      addProgrammingLanguage: (lang) => set((state) => ({
        programmingLanguages: [...state.programmingLanguages, { 
          ...lang, 
          id: generateId(), 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }],
      })),
      
      updateProgrammingLanguage: (id, lang) => set((state) => ({
        programmingLanguages: state.programmingLanguages.map((l) => 
          l.id === id ? { ...l, ...lang, updatedAt: new Date() } : l
        ),
      })),
      
      deleteProgrammingLanguage: (id) => set((state) => ({
        programmingLanguages: state.programmingLanguages.filter((l) => l.id !== id),
      })),
      
      // Snippets Actions
      addSnippet: (snippet) => set((state) => ({
        snippets: [...state.snippets, { 
          ...snippet, 
          id: generateId(), 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }],
      })),
      
      updateSnippet: (id, snippet) => set((state) => ({
        snippets: state.snippets.map((s) => 
          s.id === id ? { ...s, ...snippet, updatedAt: new Date() } : s
        ),
      })),
      
      deleteSnippet: (id) => set((state) => ({
        snippets: state.snippets.filter((s) => s.id !== id),
      })),
      
      // Collections Actions
      addCollection: (collection) => set((state) => ({
        collections: [...state.collections, { 
          ...collection, 
          id: generateId(), 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }],
      })),
      
      updateCollection: (id, collection) => set((state) => ({
        collections: state.collections.map((c) => 
          c.id === id ? { ...c, ...collection, updatedAt: new Date() } : c
        ),
      })),
      
      deleteCollection: (id) => set((state) => ({
        collections: state.collections.filter((c) => c.id !== id),
      })),
      
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
          c.id === collectionId 
            ? { ...c, posts: c.posts.filter(p => p.postId !== postId), updatedAt: new Date() }
            : c
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
        // Remove from old collection if exists
        let collections = state.collections.map((c) => {
          if (fromCollectionId && c.id === fromCollectionId) {
            return { ...c, posts: c.posts.filter(p => p.postId !== postId), updatedAt: new Date() };
          }
          return c;
        });
        // Add to new collection
        collections = collections.map((c) => {
          if (c.id === toCollectionId) {
            if (c.posts.some(p => p.postId === postId)) return c;
            const newSortOrder = c.posts.length > 0 ? Math.max(...c.posts.map(p => p.sortOrder)) + 1 : 1;
            return { ...c, posts: [...c.posts, { postId, sortOrder: newSortOrder }], updatedAt: new Date() };
          }
          return c;
        });
        // Update post's collectionId
        const posts = state.posts.map((p) => 
          p.id === postId ? { ...p, collectionId: toCollectionId, updatedAt: new Date() } : p
        );
        return { collections, posts };
      }),
      
      // Language Sections Actions
      addLanguageSection: (section) => set((state) => ({
        languageSections: [...state.languageSections, { 
          ...section, 
          id: generateId(), 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }],
      })),
      
      updateLanguageSection: (id, section) => set((state) => ({
        languageSections: state.languageSections.map((s) => 
          s.id === id ? { ...s, ...section, updatedAt: new Date() } : s
        ),
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
          s.id === sectionId 
            ? { ...s, posts: s.posts.filter(p => p.postId !== postId), updatedAt: new Date() }
            : s
        ),
      })),
      
      reorderSectionPosts: (sectionId, postIds) => set((state) => ({
        languageSections: state.languageSections.map((s) => {
          if (s.id !== sectionId) return s;
          const reorderedPosts = postIds.map((postId, index) => ({ 
            postId, 
            sortOrder: index + 1,
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
        comments: [...state.comments, { 
          ...comment, 
          id: generateId(), 
          createdAt: new Date(), 
          updatedAt: new Date() 
        }],
      })),
      
      updateCommentStatus: (id, status) => set((state) => ({
        comments: state.comments.map((c) => 
          c.id === id ? { ...c, status, updatedAt: new Date() } : c
        ),
      })),
      
      deleteComment: (id) => set((state) => ({
        comments: state.comments.filter((c) => c.id !== id),
      })),
      
      // Versions Actions
      createVersion: (postId) => {
        const post = get().posts.find((p) => p.id === postId);
        if (!post) return;
        
        const existingVersions = get().postVersions.filter((v) => v.postId === postId);
        const versionNumber = existingVersions.length + 1;
        
        set((state) => ({
          postVersions: [...state.postVersions, {
            id: generateId(),
            postId,
            versionNumber,
            titleSnapshot: post.title,
            summarySnapshot: post.summary,
            contentSnapshot: post.content,
            createdAt: new Date(),
          }],
        }));
      },
      
      restoreVersion: (versionId) => {
        const version = get().postVersions.find((v) => v.id === versionId);
        if (!version) return;
        
        set((state) => ({
          posts: state.posts.map((p) => 
            p.id === version.postId ? {
              ...p,
              title: version.titleSnapshot,
              summary: version.summarySnapshot,
              content: version.contentSnapshot,
              updatedAt: new Date(),
            } : p
          ),
        }));
      },
      
      // Gallery Actions
      addGalleryImage: (image) => set((state) => ({
        galleryImages: [...state.galleryImages, {
          ...image,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }],
      })),
      
      updateGalleryImage: (id, image) => set((state) => ({
        galleryImages: state.galleryImages.map((img) =>
          img.id === id ? { ...img, ...image, updatedAt: new Date() } : img
        ),
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
        searchQuery: '',
        selectedCategoryId: null,
        selectedTagIds: [],
        selectedLanguageIds: [],
        selectedStatus: null,
        selectedContentLanguage: null,
        sortBy: 'newest',
      }),
      
      // Getters
      getFilteredPosts: () => {
        const state = get();
        let filtered = [...state.posts];
        
        // Search
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter((p) => 
            p.title.toLowerCase().includes(query) ||
            p.summary.toLowerCase().includes(query) ||
            p.content.toLowerCase().includes(query)
          );
        }
        
        // Category filter
        if (state.selectedCategoryId) {
          filtered = filtered.filter((p) => p.categoryId === state.selectedCategoryId);
        }
        
        // Tags filter
        if (state.selectedTagIds.length > 0) {
          filtered = filtered.filter((p) => 
            state.selectedTagIds.some((tagId) => p.tags.includes(tagId))
          );
        }
        
        // Languages filter
        if (state.selectedLanguageIds.length > 0) {
          filtered = filtered.filter((p) => 
            state.selectedLanguageIds.some((langId) => p.programmingLanguages.includes(langId))
          );
        }
        
        // Status filter
        if (state.selectedStatus) {
          filtered = filtered.filter((p) => p.status === state.selectedStatus);
        }
        
        // Content language filter
        if (state.selectedContentLanguage) {
          filtered = filtered.filter((p) => p.mainLanguage === state.selectedContentLanguage);
        }
        
        // Sorting
        switch (state.sortBy) {
          case 'newest':
            filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            break;
          case 'oldest':
            filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            break;
          case 'mostViewed':
            filtered.sort((a, b) => b.viewsCount - a.viewsCount);
            break;
          case 'mostCommented':
            filtered.sort((a, b) => {
              const aComments = state.comments.filter((c) => c.postId === a.id).length;
              const bComments = state.comments.filter((c) => c.postId === b.id).length;
              return bComments - aComments;
            });
            break;
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
        posts: state.posts,
        categories: state.categories,
        tags: state.tags,
        programmingLanguages: state.programmingLanguages,
        snippets: state.snippets,
        collections: state.collections,
        comments: state.comments,
        postVersions: state.postVersions,
        languageSections: state.languageSections,
        galleryImages: state.galleryImages,
      }),
    }
  )
);
