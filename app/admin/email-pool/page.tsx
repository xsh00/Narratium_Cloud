"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface EmailAccount {
  name: string;
  user: string;
  dailyLimit: number;
  currentCount: number;
  isActive: boolean;
  lastResetDate: string;
}

interface EmailPoolStatus {
  totalAccounts: number;
  activeAccounts: number;
  accounts: EmailAccount[];
}

export default function EmailPoolPage() {
  const [status, setStatus] = useState<EmailPoolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetting, setResetting] = useState(false);

  // 获取邮箱池状态
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/admin/email-pool');
      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
      } else {
        setError(data.message || '获取邮箱池状态失败');
      }
    } catch (error) {
      console.error('获取邮箱池状态失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 重置邮箱池状态
  const handleReset = async () => {
    if (!confirm('确定要重置所有邮箱账户的发送计数吗？')) {
      return;
    }

    try {
      setResetting(true);
      setError('');
      setSuccess('');
      
      const response = await fetch('/api/admin/email-pool', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message);
        await fetchStatus(); // 重新获取状态
      } else {
        setError(data.message || '重置失败');
      }
    } catch (error) {
      console.error('重置邮箱池状态失败:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载邮箱池状态中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-amber-800 mb-2">邮箱池管理</h1>
          <p className="text-gray-600">管理多邮箱发送系统，解决Gmail每日发送限制问题</p>
        </motion.div>

        {/* 错误和成功消息 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6"
          >
            {success}
          </motion.div>
        )}

        {/* 统计信息 */}
        {status && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-amber-600">{status.totalAccounts}</div>
              <div className="text-gray-600 mt-2">总账户数</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{status.activeAccounts}</div>
              <div className="text-gray-600 mt-2">活跃账户数</div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {status.totalAccounts > 0 ? Math.round((status.activeAccounts / status.totalAccounts) * 100) : 0}%
              </div>
              <div className="text-gray-600 mt-2">可用率</div>
            </div>
          </motion.div>
        )}

        {/* 邮箱账户列表 */}
        {status && status.accounts.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="px-6 py-4 bg-amber-50 border-b">
              <h2 className="text-xl font-semibold text-amber-800">邮箱账户详情</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      账户名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      邮箱地址
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      今日发送
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      每日限制
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      使用率
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {status.accounts.map((account, index) => {
                    const usageRate = (account.currentCount / account.dailyLimit) * 100;
                    const isNearLimit = usageRate >= 80;
                    const isAtLimit = usageRate >= 100;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{account.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{account.user}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            isAtLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-gray-900'
                          }`}>
                            {account.currentCount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{account.dailyLimit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            account.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {account.isActive ? '活跃' : '已禁用'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(usageRate, 100)}%` }}
                              ></div>
                            </div>
                            <span className={`text-xs ${
                              isAtLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-gray-600'
                            }`}>
                              {Math.round(usageRate)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-8 text-center"
          >
            <div className="text-gray-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无邮箱账户</h3>
            <p className="text-gray-500">请配置邮箱账户以启用多邮箱发送功能</p>
          </motion.div>
        )}

        {/* 操作按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex justify-center space-x-4"
        >
          <button
            onClick={fetchStatus}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            刷新状态
          </button>
          
          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetting ? '重置中...' : '重置所有计数'}
          </button>
        </motion.div>

        {/* 配置说明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-blue-800 mb-4">配置说明</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>• 支持配置多个Gmail账户，格式：EMAIL_USER_1, EMAIL_PASS_1, EMAIL_USER_2, EMAIL_PASS_2...</p>
            <p>• 每个账户每日发送限制为500封邮件</p>
            <p>• 系统会自动轮换使用可用账户</p>
            <p>• 达到限制的账户会被自动标记为不可用</p>
            <p>• 每日0点自动重置发送计数</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 