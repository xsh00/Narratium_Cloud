"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TestAuthPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen fantasy-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f8d36a] mx-auto mb-4"></div>
          <p className="text-[#a18d6f]">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen fantasy-bg flex items-center justify-center p-4">
      <div className="bg-[#1a1714] border border-[#534741] rounded-lg p-6 shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-[#f8d36a] mb-4">认证测试页面</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg text-[#f4e8c1] mb-2">用户信息</h2>
            <div className="bg-[#2a231c] p-3 rounded-lg">
              <p className="text-[#a18d6f]">用户ID: {user?.id}</p>
              <p className="text-[#a18d6f]">邮箱: {user?.email}</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg text-[#f4e8c1] mb-2">认证状态</h2>
            <div className="bg-[#2a231c] p-3 rounded-lg">
              <p className="text-green-400">✓ 已认证</p>
              <p className="text-[#a18d6f]">您可以访问受保护的内容</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push('/')}
            className="w-full py-2 bg-[#f8d36a] text-[#1a1714] rounded-lg hover:bg-[#e6c85a] transition-colors"
          >
            返回主页
          </button>
        </div>
      </div>
    </div>
  );
} 