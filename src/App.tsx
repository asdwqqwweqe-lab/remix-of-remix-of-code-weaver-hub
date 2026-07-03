import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelmetProvider } from "react-helmet-async";
import "@/lib/i18n";
import MainLayout from "@/components/layout/MainLayout";
import GlobalContextMenu from "@/components/GlobalContextMenu";
import CustomCssInjector from "@/components/settings/CustomCssInjector";
import FirebaseAutoSyncProvider from "@/components/settings/FirebaseAutoSyncProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Eager: Login only (fast auth check + always needed first)
import Login from "./pages/Login";

// Lazy-loaded route pages (code splitting per route)
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Posts = lazy(() => import("./pages/Posts"));
const PostDetails = lazy(() => import("./pages/PostDetails"));
const PostEditor = lazy(() => import("./pages/PostEditor"));
const Categories = lazy(() => import("./pages/Categories"));
const Tags = lazy(() => import("./pages/Tags"));
const Languages = lazy(() => import("./pages/Languages"));
const LanguageDetails = lazy(() => import("./pages/LanguageDetails"));
const CategoryDetails = lazy(() => import("./pages/CategoryDetails"));
const TagDetails = lazy(() => import("./pages/TagDetails"));
const Snippets = lazy(() => import("./pages/Snippets"));
const Collaborate = lazy(() => import("./pages/Collaborate"));
const DataCenter = lazy(() => import("./pages/DataCenter"));
const Playground = lazy(() => import("./pages/Playground"));
const Collections = lazy(() => import("./pages/Collections"));
const CollectionDetails = lazy(() => import("./pages/CollectionDetails"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Statistics = lazy(() => import("./pages/Statistics"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Reports = lazy(() => import("./pages/Reports"));
const ReportDetails = lazy(() => import("./pages/ReportDetails"));
const ReportEditor = lazy(() => import("./pages/ReportEditor"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PageBuilder = lazy(() => import("./pages/PageBuilder"));
const PagePreview = lazy(() => import("./pages/PagePreview"));
const PublicPagePreview = lazy(() => import("./pages/PublicPagePreview"));
const TodoList = lazy(() => import("./pages/TodoList"));
const Citations = lazy(() => import("./pages/Citations"));
const KnowledgeGraph = lazy(() => import("./pages/KnowledgeGraph"));
const ContentCalendar = lazy(() => import("./pages/ContentCalendar"));
const Feeds = lazy(() => import("./pages/Feeds"));
const SharedLibrary = lazy(() => import("./pages/SharedLibrary"));
const WeeklyReview = lazy(() => import("./pages/WeeklyReview"));
const TemplatesGallery = lazy(() => import("./pages/TemplatesGallery"));
const DataPortability = lazy(() => import("./pages/DataPortability"));
const PublicPostShare = lazy(() => import("./pages/PublicPostShare"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
  </div>
);

const App = () => {
  useEffect(() => {
    // Run weekly auto-backup on app boot (silent no-op if signed out or run <7d ago)
    import("@/lib/backupService").then(({ maybeRunWeeklyBackup }) => maybeRunWeeklyBackup());
  }, []);

  return (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <CustomCssInjector />
              <FirebaseAutoSyncProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <GlobalContextMenu>
                    <Suspense fallback={<RouteFallback />}>
                      <Routes>
                        {/* Public Route - Login */}
                        <Route path="/login" element={<Login />} />

                        {/* Public Page Preview - no auth required */}
                        <Route path="/p/:slug" element={<PublicPagePreview />} />
                        <Route path="/share/post/:token" element={<PublicPostShare />} />

                        {/* Preview Route - outside MainLayout */}
                        <Route path="/preview/:slug" element={
                          <ProtectedRoute><PagePreview /></ProtectedRoute>
                        } />

                        {/* Protected Routes */}
                        <Route
                          path="/*"
                          element={
                            <ProtectedRoute>
                              <MainLayout>
                                <Suspense fallback={<RouteFallback />}>
                                  <Routes>
                                    <Route path="/" element={<Index />} />
                                    <Route path="/dashboard" element={<Dashboard />} />
                                    <Route path="/posts" element={<Posts />} />
                                    <Route path="/posts/new" element={<PostEditor />} />
                                    <Route path="/posts/:id" element={<PostDetails />} />
                                    <Route path="/posts/:id/edit" element={<PostEditor />} />
                                    <Route path="/categories" element={<Categories />} />
                                    <Route path="/categories/:slug" element={<CategoryDetails />} />
                                    <Route path="/tags" element={<Tags />} />
                                    <Route path="/tags/:slug" element={<TagDetails />} />
                                    <Route path="/languages" element={<Languages />} />
                                    <Route path="/languages/:slug" element={<LanguageDetails />} />
                                    <Route path="/snippets" element={<Snippets />} />
                                    <Route path="/collaborate" element={<Collaborate />} />
                                    <Route path="/data" element={<DataCenter />} />
                                    <Route path="/playground" element={<Playground />} />
                                    <Route path="/collections" element={<Collections />} />
                                    <Route path="/collections/:slug" element={<CollectionDetails />} />
                                    <Route path="/favorites" element={<Favorites />} />
                                    <Route path="/statistics" element={<Statistics />} />
                                    <Route path="/gallery" element={<Gallery />} />
                                    <Route path="/todo" element={<TodoList />} />
                                    <Route path="/citations" element={<Citations />} />
                                    <Route path="/graph" element={<KnowledgeGraph />} />
                                    <Route path="/calendar" element={<ContentCalendar />} />
                                    <Route path="/feeds" element={<Feeds />} />
                                    <Route path="/library" element={<SharedLibrary />} />
                                    <Route path="/weekly-review" element={<WeeklyReview />} />
                                    <Route path="/templates" element={<TemplatesGallery />} />
                                    <Route path="/data" element={<DataPortability />} />
                                    <Route path="/roadmap" element={<Roadmap />} />
                                    <Route path="/reports" element={<Reports />} />
                                    <Route path="/reports/new" element={<ReportEditor />} />
                                    <Route path="/reports/:id" element={<ReportDetails />} />
                                    <Route path="/reports/edit/:id" element={<ReportEditor />} />
                                    <Route path="/page-builder" element={<PageBuilder />} />
                                    <Route path="/settings" element={<Settings />} />
                                    <Route path="*" element={<NotFound />} />
                                  </Routes>
                                </Suspense>
                              </MainLayout>
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </Suspense>
                  </GlobalContextMenu>
                </BrowserRouter>
              </FirebaseAutoSyncProvider>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;
