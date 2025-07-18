"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, password: string, code: string) => Promise<{ success: boolean; message: string }>;
  sendVerificationCode: (email: string) => Promise<{ success: boolean; message: string }>;
  sendResetPasswordCode: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  updateUsername: (username: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 生成默认用户名的函数
function generateDefaultUsername(email: string): string {
  try {
    const emailPrefix = email.split('@')[0];
    return emailPrefix || 'user';
  } catch {
    return 'user';
  }
}

// 设置默认用户名到localStorage（如果还没有的话）
function setDefaultUsernameIfNeeded(email: string) {
  const existingUsername = localStorage.getItem('username');
  if (!existingUsername) {
    const defaultUsername = generateDefaultUsername(email);
    localStorage.setItem('username', defaultUsername);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储中的用户信息
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        // 确保有默认用户名
        setDefaultUsernameIfNeeded(userData.email);
      } catch (error) {
        console.error('解析用户数据失败:', error);
        localStorage.removeItem('user');
      }
    } else {
      // 如果没有用户信息，设置一个兜底用户名
      const existingUsername = localStorage.getItem('username');
      if (!existingUsername) {
        localStorage.setItem('username', 'user');
      }
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
        
        // 同步用户名到localStorage
        if (data.user.username) {
          localStorage.setItem('username', data.user.username);
        } else {
          setDefaultUsernameIfNeeded(data.user.email);
        }
        
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
        
        // 同步用户名到localStorage
        if (data.user.username) {
          localStorage.setItem('username', data.user.username);
        } else {
          setDefaultUsernameIfNeeded(data.user.email);
        }
        
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

  const sendResetPasswordCode = async (email: string) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
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
      console.error('发送重置密码验证码错误:', error);
      return { success: false, message: '网络错误，请重试' };
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code, newPassword, action: 'resetPassword' }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('重置密码错误:', error);
      return { success: false, message: '网络错误，请重试' };
    }
  };

  const updateUsername = async (username: string) => {
    if (!user) {
      return { success: false, message: '用户未登录' };
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, username }),
      });

      const data = await response.json();

      if (response.ok) {
        // 更新本地用户信息
        const updatedUser = { ...user, username };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('username', username);
        
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.error };
      }
    } catch (error) {
      console.error('更新用户名错误:', error);
      return { success: false, message: '网络错误，请重试' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userId');
    // 保留用户名，让用户下次可以继续使用
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    sendVerificationCode,
    sendResetPasswordCode,
    resetPassword,
    updateUsername,
    logout,
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