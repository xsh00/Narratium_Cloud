"use client";

import { useState, useEffect } from 'react';

interface DatabaseStats {
  users: number;
  verificationCodes: number;
  dbPath: string;
}

interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export default function DatabaseAdminPage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const loadDatabaseInfo = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch('/api/admin/database');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setUsers(data.users);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('加载数据库信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (email: string) => {
    if (!confirm(`确定要删除用户 ${email} 吗？`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/database', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('用户删除成功');
        loadDatabaseInfo(); // 重新加载数据
      } else {
        alert(`删除失败: ${data.error}`);
      }
    } catch (error) {
      alert('删除用户时发生错误');
    }
  };

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen fantasy-bg flex items-center justify-center">
        <div className="text-[#f8d36a]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen fantasy-bg p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#f8d36a] mb-8">数据库管理</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* 数据库统计 */}
        {stats && (
          <div className="bg-[#1a1714] border border-[#534741] rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#f8d36a] mb-4">数据库统计</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#2a231c] rounded-lg">
                <div className="text-2xl font-bold text-[#f8d36a]">{stats.users}</div>
                <div className="text-[#a18d6f] text-sm">注册用户</div>
              </div>
              <div className="p-4 bg-[#2a231c] rounded-lg">
                <div className="text-2xl font-bold text-[#f8d36a]">{stats.verificationCodes}</div>
                <div className="text-[#a18d6f] text-sm">验证码</div>
              </div>
              <div className="p-4 bg-[#2a231c] rounded-lg">
                <div className="text-[#a18d6f] text-sm">数据库路径</div>
                <div className="text-[#f4e8c1] text-xs break-all">{stats.dbPath}</div>
              </div>
            </div>
          </div>
        )}

        {/* 用户列表 */}
        <div className="bg-[#1a1714] border border-[#534741] rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-[#f8d36a]">用户列表</h2>
            <button
              onClick={loadDatabaseInfo}
              className="px-4 py-2 bg-[#f8d36a] text-[#1a1714] rounded-lg hover:bg-[#e6c85a] transition-colors"
            >
              刷新
            </button>
          </div>

          {users.length === 0 ? (
            <div className="text-center text-[#a18d6f] py-8">暂无用户数据</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[#f4e8c1]">
                <thead>
                  <tr className="border-b border-[#534741]">
                    <th className="text-left py-3 px-4">邮箱</th>
                    <th className="text-left py-3 px-4">注册时间</th>
                    <th className="text-left py-3 px-4">更新时间</th>
                    <th className="text-left py-3 px-4">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-[#534741]/30">
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4 text-sm text-[#a18d6f]">
                        {new Date(user.createdAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#a18d6f]">
                        {new Date(user.updatedAt).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => deleteUser(user.email)}
                          className="px-3 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-sm"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <a href="/auth" className="text-[#f8d36a] hover:text-[#e6c85a]">
            返回登录页面
          </a>
        </div>
      </div>
    </div>
  );
} 