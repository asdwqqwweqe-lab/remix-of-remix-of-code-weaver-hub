import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const CORRECT_PIN = '4419';
const AUTH_KEY = 'blog_auth';
const FIRST_LOGIN_KEY = 'blog_first_login';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  firstLoginDate: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [firstLoginDate, setFirstLoginDate] = useState<string | null>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem(AUTH_KEY);
    const firstLogin = localStorage.getItem(FIRST_LOGIN_KEY);
    
    setIsAuthenticated(authStatus === 'true');
    if (firstLogin) {
      const parsed = JSON.parse(firstLogin);
      setFirstLoginDate(parsed.date);
    }
    setIsLoading(false);
  }, []);

  const login = (pin: string): boolean => {
    if (pin === CORRECT_PIN) {
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, 'true');
      
      // Save first login date if not already saved
      if (!localStorage.getItem(FIRST_LOGIN_KEY)) {
        const firstLoginData = {
          timestamp: new Date().toISOString(),
          date: new Date().toLocaleString('ar-EG'),
        };
        localStorage.setItem(FIRST_LOGIN_KEY, JSON.stringify(firstLoginData));
        setFirstLoginDate(firstLoginData.date);
      }
      
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      login, 
      logout,
      firstLoginDate
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
