"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  username: string;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string, code: string) => Promise<{ success: boolean; message: string }>;
  sendVerificationCode: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  setUsername: (username: string) => void;
  getUsername: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 生成默认用户名的函数
function generateDefaultUsername(email: string): string {
  // 从邮箱中提取用户名部分，如果失败则使用默认值
  try {
    const emailPrefix = email.split('@')[0];
    return emailPrefix || 'user';
  } catch {
    return 'user';
  }
}

// 获取或设置用户名的函数
function getOrSetUsername(email?: string): string {
  // 首先尝试从localStorage获取用户自定义的用户名
  const customUsername = localStorage.getItem('custom_username');
  if (customUsername) {
    return customUsername;
  }

  // 如果没有自定义用户名，尝试从旧的localStorage获取
  const legacyUsername = localStorage.getItem('username');
  if (legacyUsername) {
    return legacyUsername;
  }

  // 如果都没有，根据邮箱生成默认用户名
  if (email) {
    const defaultUsername = generateDefaultUsername(email);
    localStorage.setItem('username', defaultUsername);
    return defaultUsername;
  }

  // 最后的兜底方案
  const fallbackUsername = 'user';
  localStorage.setItem('username', fallbackUsername);
  return fallbackUsername;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsernameState] = useState<string>('');

  useEffect(() => {
    // 检查本地存储中的用户信息
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        // 设置用户名
        const currentUsername = getOrSetUsername(userData.email);
        setUsernameState(currentUsername);
      } catch (error) {
        console.error('解析用户数据失败:', error);
        localStorage.removeItem('user');
      }
    } else {
      // 即使没有用户信息，也设置一个默认用户名
      const currentUsername = getOrSetUsername();
      setUsernameState(currentUsername);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // 设置用户名
        const currentUsername = getOrSetUsername(data.user.email);
        setUsernameState(currentUsername);
        
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('登录错误:', error);
      return { success: false, message: '网络错误，请重试' };
    }
  };

  const register = async (email: string, password: string, code: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, code, action: 'register' }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // 设置用户名
        const currentUsername = getOrSetUsername(data.user.email);
        setUsernameState(currentUsername);
        
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('注册错误:', error);
      return { success: false, message: '网络错误，请重试' };
    }
  };

  const sendVerificationCode = async (email: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, action: 'sendCode' }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('发送验证码错误:', error);
      return { success: false, message: '网络错误，请重试' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    // 不清除 custom_username，让用户的自定义用户名保持
    
    // 重置为默认用户名
    const defaultUsername = getOrSetUsername();
    setUsernameState(defaultUsername);
  };

  const setUsername = (newUsername: string) => {
    const trimmedUsername = newUsername.trim();
    if (trimmedUsername) {
      localStorage.setItem('custom_username', trimmedUsername);
      localStorage.setItem('username', trimmedUsername);
      setUsernameState(trimmedUsername);
    }
  };

  const getUsername = () => {
    return username;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    username,
    login,
    register,
    sendVerificationCode,
    logout,
    setUsername,
    getUsername,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 