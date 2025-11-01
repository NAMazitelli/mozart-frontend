import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isGuest: boolean;
  login: (token: string, user: User) => void;
  loginAsGuest: () => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedIsGuest = localStorage.getItem('isGuest');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else if (storedIsGuest === 'true') {
      setIsGuest(true);
      // Create a mock guest user
      setUser({
        id: 0,
        email: 'guest@mozart.app',
        username: 'Guest User',
        totalScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalExercisesCompleted: 0,
        language: 'en'
      });
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setIsGuest(false);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.removeItem('isGuest');
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    setToken(null);
    setUser({
      id: 0,
      email: 'guest@mozart.app',
      username: 'Guest User',
      totalScore: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalExercisesCompleted: 0,
      language: 'en'
    });
    localStorage.setItem('isGuest', 'true');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isGuest');
  };

  const value = {
    user,
    token,
    isGuest,
    login,
    loginAsGuest,
    logout,
    isAuthenticated: (!!token && !!user) || isGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};