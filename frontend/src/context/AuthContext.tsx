import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import i18n from '../i18n/i18n';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginDemo: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('faunax_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const u = await api.getMe();
          setUser(u);
          if (u && u.preferred_language && ['en', 'mr', 'hi'].includes(u.preferred_language)) {
            i18n.changeLanguage(u.preferred_language);
          }
        } catch {
          localStorage.removeItem('faunax_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    localStorage.setItem('faunax_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    if (res.user && res.user.preferred_language && ['en', 'mr', 'hi'].includes(res.user.preferred_language)) {
      i18n.changeLanguage(res.user.preferred_language);
    }
  };

  const loginDemo = async (targetRole: UserRole) => {
    const credentials: Record<UserRole, { e: string; p: string }> = {
      FARMER: { e: 'farmer@faunax.gov.in', p: 'Farmer@123' },
      VETERINARIAN: { e: 'vet@faunax.gov.in', p: 'Vet@123' },
      FIELD_OFFICER: { e: 'field@faunax.gov.in', p: 'Field@123' },
      DISTRICT_ADMIN: { e: 'district@faunax.gov.in', p: 'District@123' },
      STATE_ADMIN: { e: 'state@faunax.gov.in', p: 'State@123' },
      NATIONAL_ADMIN: { e: 'national@faunax.gov.in', p: 'National@123' },
      GOVERNMENT: { e: 'state@faunax.gov.in', p: 'State@123' },
      ADMIN: { e: 'admin@faunax.gov.in', p: 'Admin@123' },
    };
    const cred = credentials[targetRole] || credentials.ADMIN;
    await login(cred.e, cred.p);
  };

  const logout = () => {
    localStorage.removeItem('faunax_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        token,
        isAuthenticated: !!user,
        isLoading,
        loading: isLoading,
        login,
        loginDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
