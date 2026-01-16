import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import "@/lib/i18n";
import MainLayout from "@/components/layout/MainLayout";
import GlobalContextMenu from "@/components/GlobalContextMenu";
import CustomCssInjector from "@/components/settings/CustomCssInjector";
import FirebaseAutoSyncProvider from "@/components/settings/FirebaseAutoSyncProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Posts from "./pages/Posts";
import PostDetails from "./pages/PostDetails";
import PostEditor from "./pages/PostEditor";
import Categories from "./pages/Categories";
import Tags from "./pages/Tags";
import Languages from "./pages/Languages";
import LanguageDetails from "./pages/LanguageDetails";
import CategoryDetails from "./pages/CategoryDetails";
import TagDetails from "./pages/TagDetails";
import Snippets from "./pages/Snippets";
import Collections from "./pages/Collections";
import CollectionDetails from "./pages/CollectionDetails";
import Favorites from "./pages/Favorites";
import Statistics from "./pages/Statistics";
import Gallery from "./pages/Gallery";
import Roadmap from "./pages/Roadmap";
import Reports from "./pages/Reports";
import ReportDetails from "./pages/ReportDetails";
import ReportEditor from "./pages/ReportEditor";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
                  <Routes>
                    {/* Public Route - Login */}
                    <Route path="/login" element={<Login />} />

                    {/* Protected Routes */}
                    <Route
                      path="/*"
                      element={
                        <ProtectedRoute>
                          <MainLayout>
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
                              <Route path="/collections" element={<Collections />} />
                              <Route path="/collections/:slug" element={<CollectionDetails />} />
                              <Route path="/favorites" element={<Favorites />} />
                              <Route path="/statistics" element={<Statistics />} />
                              <Route path="/gallery" element={<Gallery />} />
                              <Route path="/roadmap" element={<Roadmap />} />
                              <Route path="/reports" element={<Reports />} />
                              <Route path="/reports/new" element={<ReportEditor />} />
                              <Route path="/reports/:id" element={<ReportDetails />} />
                              <Route path="/reports/edit/:id" element={<ReportEditor />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </MainLayout>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </GlobalContextMenu>
              </BrowserRouter>
            </FirebaseAutoSyncProvider>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
