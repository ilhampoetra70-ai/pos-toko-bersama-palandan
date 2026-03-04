import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User, UserRole } from '@/types/api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    requirePasswordChange: boolean;
    setRequirePasswordChange: (val: boolean) => void;
    login: (username: string, password: string) => Promise<any>;
    logout: () => void;
    hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(sessionStorage.getItem('pos_token'));
    const [loading, setLoading] = useState(true);
    const [requirePasswordChange, setRequirePasswordChange] = useState(false);

    // Session Timeout Logic
    const lastActivityRef = useRef(Date.now());
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    useEffect(() => {
        if (token) {
            window.api.verifyToken(token).then((result: any) => {
                if (result.success) {
                    setUser(result.user);
                    if (result.user.password_changed === 0) setRequirePasswordChange(true);
                } else {
                    sessionStorage.removeItem('pos_token');
                    setToken(null);
                    setUser(null);
                }
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (username: string, password: string) => {
        const result = await window.api.login(username, password);
        if (result.success && result.token && result.user) {
            sessionStorage.setItem('pos_token', result.token);
            setToken(result.token);
            // The API returns UserInfo which lacks 'active' and 'created_at'.
            // We supplement it to match the standard User interface expected by the state.
            setUser({ ...result.user, active: true } as User);
            if (result.user.password_changed === 0) setRequirePasswordChange(true);
            lastActivityRef.current = Date.now(); // Reset timer on login
        }
        return result;
    };

    const logout = useCallback(() => {
        // Invalidate token di server (best-effort: jangan block logout jika gagal)
        if (user?.id) {
            window.api.logoutUser(user.id).catch(() => { });
        }
        sessionStorage.removeItem('pos_token');
        setToken(null);
        setUser(null);
    }, [user]);

    // Idle Timer Effect
    useEffect(() => {
        if (!user) return;

        const updateActivity = () => {
            const now = Date.now();
            if (now - lastActivityRef.current > 10000) { // Throttle to 10s
                lastActivityRef.current = now;
            }
        };

        // Events to track activity
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        // Add listeners
        events.forEach(event => window.addEventListener(event, updateActivity));

        // Check for timeout every minute
        const checkInterval = setInterval(() => {
            if (Date.now() - lastActivityRef.current > SESSION_TIMEOUT) {
                sessionStorage.setItem('session_expired_msg', 'Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit.');
                logout();
            }
        }, 60000);

        return () => {
            events.forEach(event => window.removeEventListener(event, updateActivity));
            clearInterval(checkInterval);
        };
    }, [user, logout]);

    const hasRole = (...roles: UserRole[]) => {
        return !!(user && roles.includes(user.role));
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, requirePasswordChange, setRequirePasswordChange, login, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
