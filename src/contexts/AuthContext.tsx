import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    isFirstTime: boolean;
    login: (pin: string) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CORRECT_PIN = '4419';
const AUTH_KEY = 'blog_auth';
const FIRST_TIME_KEY = 'blog_first_login';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isFirstTime, setIsFirstTime] = useState<boolean>(false);

    useEffect(() => {
        // Check if user is already authenticated
        const authStatus = localStorage.getItem(AUTH_KEY);
        if (authStatus === 'true') {
            setIsAuthenticated(true);
        }

        // Check if this is first time login
        const firstTimeStatus = localStorage.getItem(FIRST_TIME_KEY);
        if (!firstTimeStatus) {
            setIsFirstTime(true);
        }
    }, []);

    const login = (pin: string): boolean => {
        if (pin === CORRECT_PIN) {
            setIsAuthenticated(true);
            localStorage.setItem(AUTH_KEY, 'true');

            // If this is first time, record it
            const firstTimeStatus = localStorage.getItem(FIRST_TIME_KEY);
            if (!firstTimeStatus) {
                const firstLoginData = {
                    timestamp: new Date().toISOString(),
                    date: new Date().toLocaleString('ar-EG'),
                };
                localStorage.setItem(FIRST_TIME_KEY, JSON.stringify(firstLoginData));
                setIsFirstTime(true);
                console.log('🎉 تسجيل دخول لأول مرة:', firstLoginData);
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
        <AuthContext.Provider value={{ isAuthenticated, isFirstTime, login, logout }}>
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
