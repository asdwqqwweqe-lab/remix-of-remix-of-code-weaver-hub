export interface Category {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgrammingLanguage {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

export type PostStatus = 'draft' | 'published' | 'archived';
export type ContentLanguage = 'ar' | 'en';
export type LinkType = 'github' | 'docs' | 'demo' | 'other';
export type AttachmentType = 'image' | 'screenshot' | 'pdf' | 'file';
export type CommentStatus = 'pending' | 'approved' | 'spam';

export interface PostLink {
  id: string;
  label: string;
  url: string;
  type: LinkType;
}

export interface Attachment {
  id: string;
  type: AttachmentType;
  path: string;
  caption?: string;
  createdAt: Date;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  mainLanguage: ContentLanguage;
  status: PostStatus;
  categoryId?: string;
  collectionId?: string;
  authorId?: string;
  isFavorite: boolean;
  viewsCount: number;
  commentsEnabled: boolean;
  tags: string[];
  programmingLanguages: string[];
  links: PostLink[];
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LanguageSection {
  id: string;
  languageId: string;
  title: string;
  slug: string;
  description?: string;
  sortOrder: number;
  targetPostsCount?: number;
  posts: { postId: string; sortOrder: number; completed?: boolean }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  parentId?: string;
  authorName: string;
  authorEmail?: string;
  content: string;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
  replies?: Comment[];
}

export interface Snippet {
  id: string;
  title: string;
  description?: string;
  code: string;
  languageId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Collection {
  id: string;
  title: string;
  slug: string;
  description?: string;
  targetPostsCount?: number;
  posts: { postId: string; sortOrder: number }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PostVersion {
  id: string;
  postId: string;
  versionNumber: number;
  titleSnapshot: string;
  summarySnapshot: string;
  contentSnapshot: string;
  createdAt: Date;
  createdBy?: string;
}

export interface BlogStats {
  totalPosts: number;
  totalViews: number;
  totalComments: number;
  postsByLanguage: { languageId: string; count: number }[];
  topTags: { tagId: string; count: number }[];
  mostViewed: Post[];
  mostCommented: { post: Post; commentsCount: number }[];
}

export interface GalleryImage {
  id: string;
  dataUrl: string;
  caption?: string;
  description?: string;
  code?: string;
  codeLanguage?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Roadmap types
export interface RoadmapTopic {
  id: string;
  title: string;
  postId?: string;
  completed: boolean;
  sortOrder: number;
}

export interface RoadmapSection {
  id: string;
  roadmapId: string;
  title: string;
  description?: string;
  topics: RoadmapTopic[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Roadmap {
  id: string;
  languageId: string;
  title: string;
  description?: string;
  sections: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Settings types
export interface OpenRouterKey {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  lastUsed?: Date;
  failCount: number;
}

export interface GeminiKey {
  id: string;
  key: string;
  name: string;
  isActive: boolean;
  lastUsed?: Date;
  failCount: number;
}

export interface CustomCss {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}

export type AIProvider = 'lovable' | 'openrouter' | 'gemini';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export interface AppSettings {
  openRouterKeys: OpenRouterKey[];
  geminiKeys: GeminiKey[];
  defaultModel: string;
  defaultProvider: AIProvider;
  theme: 'light' | 'dark' | 'system';
  customCss: CustomCss[];
  firebaseConfig?: FirebaseConfig;
  firebaseAutoSync?: boolean;
  syncNotifications?: boolean;
  soundNotificationsEnabled?: boolean;
}

// Report types
export interface QuickLink {
  id: string;
  label: string;
  url: string;
}

export interface Report {
  id: string;
  title: string;
  content: string;
  tags: string[];
  featuredImage?: string;
  linkedPostIds?: string[];
  linkedCollectionIds?: string[];
  quickLinks?: QuickLink[];
  createdAt: Date;
  updatedAt: Date;
}
