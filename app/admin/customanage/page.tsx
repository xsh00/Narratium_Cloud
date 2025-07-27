"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { motion } from "framer-motion";

// 定义自定义角色请求类型
interface CustomRequest {
  id: string;
  user_id: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
  username: string;
}

// 状态选项
const statusOptions = [
  { value: '', label: '所有状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'rejected', label: '已拒绝' }
];

/**
 * 角色卡定制管理页面组件
 */
export default function CustomManagePage() {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // 获取所有定制请求
  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = '/api/admin/custom-requests';
      if (statusFilter) {
        url += `?status=${statusFilter}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('获取定制请求失败');
      }
      
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('获取定制请求失败:', error);
      setError('获取定制请求失败，请刷新页面重试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 更新请求状态
  const updateRequestStatus = async (id: string, status: 'pending' | 'processing' | 'completed' | 'rejected') => {
    setIsUpdating(true);
    
    try {
      const response = await fetch('/api/admin/custom-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, status })
      });
      
      if (!response.ok) {
        throw new Error('更新状态失败');
      }
      
      const result = await response.json();
      
      // 更新本地状态
      setRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status } : req
      ));
      
      // 关闭详情并显示成功消息
      setSelectedRequest(null);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
      
      // 重新获取列表
      fetchRequests();
    } catch (error) {
      console.error('更新请求状态失败:', error);
      alert('更新状态失败，请重试');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // 初始加载时获取数据
  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);
  
  // 格式化日期显示
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 获取状态对应的中文文本和颜色
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: '待处理', color: 'bg-yellow-500/20 text-yellow-400' };
      case 'processing':
        return { text: '处理中', color: 'bg-blue-500/20 text-blue-400' };
      case 'completed':
        return { text: '已完成', color: 'bg-green-500/20 text-green-400' };
      case 'rejected':
        return { text: '已拒绝', color: 'bg-red-500/20 text-red-400' };
      default:
        return { text: '未知状态', color: 'bg-gray-500/20 text-gray-400' };
    }
  };
  
  return (
    <AdminLayout title="角色卡定制管理">
      <div className="space-y-6">
        {/* 顶部筛选和状态显示 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          {/* 状态筛选器 */}
          <div className="flex items-center space-x-4">
            <span className="text-[#c0a480]">状态筛选:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#1c1c1c] border border-[#333] rounded px-3 py-2 text-[#eae6db] focus:outline-none focus:border-amber-500/40"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* 刷新按钮 */}
          <button
            onClick={() => fetchRequests()}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg border ${
              isLoading 
                ? 'border-[#333] text-[#666] cursor-not-allowed' 
                : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
            } transition-colors`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                加载中...
              </span>
            ) : '刷新列表'}
          </button>
        </div>
        
        {/* 成功提示 */}
        {updateSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 text-green-400 px-4 py-3 rounded"
          >
            状态更新成功
          </motion.div>
        )}
        
        {/* 错误提示 */}
        {error && (
          <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {/* 请求列表 */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-[#a18d6f]">
            {statusFilter ? '没有符合筛选条件的定制请求' : '暂无定制请求'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1c1c1c]/60 text-[#c0a480]">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">用户</th>
                  <th className="px-4 py-3 text-left">描述</th>
                  <th className="px-4 py-3 text-left">提交时间</th>
                  <th className="px-4 py-3 text-left">状态</th>
                  <th className="px-4 py-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]/40">
                {requests.map((request) => {
                  const statusInfo = getStatusInfo(request.status);
                  
                  return (
                    <tr 
                      key={request.id} 
                      className="hover:bg-[#252525] transition-colors cursor-pointer"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <td className="px-4 py-3 text-[#eae6db] text-sm">{request.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-[#eae6db]">{request.username}</td>
                      <td className="px-4 py-3 text-[#eae6db] max-w-xs">
                        <div className="line-clamp-1">{request.description}</div>
                      </td>
                      <td className="px-4 py-3 text-[#c0a480] text-sm">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded text-xs ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#c0a480] text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequest(request);
                          }}
                          className="px-3 py-1 border border-amber-500/30 rounded hover:bg-amber-500/10 transition-colors"
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* 详情弹窗 */}
        {selectedRequest && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="px-6 py-4 border-b border-[#333] flex justify-between items-center">
                <h2 className="text-lg text-amber-400 font-medium">角色卡定制请求详情</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-[#a18d6f] hover:text-[#eae6db] transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-[#a18d6f] text-sm mb-1">请求ID:</div>
                  <div className="text-[#eae6db]">{selectedRequest.id}</div>
                </div>
                
                <div>
                  <div className="text-[#a18d6f] text-sm mb-1">用户名:</div>
                  <div className="text-[#eae6db]">{selectedRequest.username}</div>
                </div>
                
                <div>
                  <div className="text-[#a18d6f] text-sm mb-1">用户ID:</div>
                  <div className="text-[#eae6db] break-all">{selectedRequest.user_id}</div>
                </div>
                
                <div>
                  <div className="text-[#a18d6f] text-sm mb-1">提交时间:</div>
                  <div className="text-[#eae6db]">{formatDate(selectedRequest.created_at)}</div>
                </div>
                
                <div>
                  <div className="text-[#a18d6f] text-sm mb-1">当前状态:</div>
                  <div className="text-[#eae6db]">
                    <span className={`inline-flex px-2 py-1 rounded text-xs ${getStatusInfo(selectedRequest.status).color}`}>
                      {getStatusInfo(selectedRequest.status).text}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="text-[#a18d6f] text-sm mb-1">描述:</div>
                  <div className="bg-[#121212] p-4 rounded text-[#eae6db] whitespace-pre-wrap">
                    {selectedRequest.description}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-[#333]">
                  <div className="text-[#a18d6f] text-sm mb-2">更改状态:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, 'pending')}
                      disabled={isUpdating || selectedRequest.status === 'pending'}
                      className={`px-3 py-2 text-sm rounded ${
                        isUpdating || selectedRequest.status === 'pending'
                          ? 'bg-[#333] text-[#666] cursor-not-allowed'
                          : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                      } transition-colors`}
                    >
                      待处理
                    </button>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, 'processing')}
                      disabled={isUpdating || selectedRequest.status === 'processing'}
                      className={`px-3 py-2 text-sm rounded ${
                        isUpdating || selectedRequest.status === 'processing'
                          ? 'bg-[#333] text-[#666] cursor-not-allowed'
                          : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                      } transition-colors`}
                    >
                      处理中
                    </button>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, 'completed')}
                      disabled={isUpdating || selectedRequest.status === 'completed'}
                      className={`px-3 py-2 text-sm rounded ${
                        isUpdating || selectedRequest.status === 'completed'
                          ? 'bg-[#333] text-[#666] cursor-not-allowed'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      } transition-colors`}
                    >
                      已完成
                    </button>
                    <button
                      onClick={() => updateRequestStatus(selectedRequest.id, 'rejected')}
                      disabled={isUpdating || selectedRequest.status === 'rejected'}
                      className={`px-3 py-2 text-sm rounded ${
                        isUpdating || selectedRequest.status === 'rejected'
                          ? 'bg-[#333] text-[#666] cursor-not-allowed'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      } transition-colors`}
                    >
                      已拒绝
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 