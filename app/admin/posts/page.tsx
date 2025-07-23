"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import Image from "next/image";

interface Post {
  id: string;
  userId: string;
  userName: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likesCount: number;
  liked: boolean;
  status: string; // 帖子状态：pending, approved, rejected
  isPinned: boolean; // 是否置顶
}

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const router = useRouter();

  // 获取帖子
  const fetchPosts = async (reset = false) => {
    try {
      setIsLoading(true);
      const newOffset = reset ? 0 : offset;
      
      // 构建查询参数
      const params = new URLSearchParams();
      params.append('limit', '20');
      params.append('offset', newOffset.toString());
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/posts?${params.toString()}`, {
        headers: {
          'x-admin-token': 'true'
        }
      });
      
      if (!response.ok) {
        throw new Error("获取帖子失败");
      }
      
      const data = await response.json();
      
      if (reset) {
        setPosts(data);
      } else {
        setPosts(prevPosts => [...prevPosts, ...data]);
      }
      
      setHasMore(data.length === 20);
      setOffset(newOffset + data.length);
    } catch (error) {
      console.error("获取帖子失败:", error);
      setError("获取帖子失败，请刷新页面重试");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(true);
  }, []);

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(true);
  };

  // 处理批准帖子
  const handleApprovePost = async (postId: string) => {
    setIsProcessing(postId);
    try {
      const response = await fetch(`/api/posts/${postId}/approve`, {
        method: "POST",
        headers: {
          "x-admin-token": "true"
        }
      });
      
      if (!response.ok) {
        throw new Error("批准帖子失败");
      }
      
      // 更新帖子状态
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId ? { ...post, status: "approved" } : post
        )
      );
      
      setSuccessMessage("帖子已成功批准");
      
      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("批准帖子失败:", error);
      setError("批准帖子失败，请重试");
      
      // 3秒后清除错误消息
      setTimeout(() => {
        setError("");
      }, 3000);
    } finally {
      setIsProcessing(null);
    }
  };

  // 处理拒绝帖子
  const handleRejectPost = async (postId: string) => {
    if (confirm("确定要拒绝这个帖子吗？")) {
      setIsProcessing(postId);
      try {
        const response = await fetch(`/api/posts/${postId}/reject`, {
          method: "POST",
          headers: {
            "x-admin-token": "true"
          }
        });
        
        if (!response.ok) {
          throw new Error("拒绝帖子失败");
        }
        
        // 更新帖子状态
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId ? { ...post, status: "rejected" } : post
          )
        );
        
        setSuccessMessage("帖子已被拒绝");
        
        // 3秒后清除成功消息
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } catch (error) {
        console.error("拒绝帖子失败:", error);
        setError("拒绝帖子失败，请重试");
        
        // 3秒后清除错误消息
        setTimeout(() => {
          setError("");
        }, 3000);
      } finally {
        setIsProcessing(null);
      }
    }
  };

  // 处理置顶/取消置顶帖子
  const handleTogglePin = async (postId: string, currentPinnedStatus: boolean) => {
    const newPinnedStatus = !currentPinnedStatus;
    const actionText = newPinnedStatus ? "置顶" : "取消置顶";
    
    setIsProcessing(postId);
    try {
      const response = await fetch(`/api/posts/${postId}/pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": "true"
        },
        body: JSON.stringify({ isPinned: newPinnedStatus })
      });
      
      if (!response.ok) {
        throw new Error(`${actionText}帖子失败`);
      }
      
      // 更新帖子置顶状态
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId ? { ...post, isPinned: newPinnedStatus } : post
        )
      );
      
      setSuccessMessage(`帖子已${actionText}`);
      
      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error(`${actionText}帖子失败:`, error);
      setError(`${actionText}帖子失败，请重试`);
      
      // 3秒后清除错误消息
      setTimeout(() => {
        setError("");
      }, 3000);
    } finally {
      setIsProcessing(null);
    }
  };

  // 处理删除帖子
  const handleDeletePost = async (postId: string) => {
    if (confirm("确定要删除这个帖子吗？此操作无法撤销。")) {
      setIsDeleting(postId);
      try {
        const response = await fetch(`/api/posts/${postId}`, {
          method: "DELETE",
          headers: {
            "x-admin-token": "true" // 简单的管理员标识
          }
        });
        
        if (!response.ok) {
          throw new Error("删除帖子失败");
        }
        
        // 从列表中移除
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
        setSuccessMessage("帖子已成功删除");
        
        // 3秒后清除成功消息
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } catch (error) {
        console.error("删除帖子失败:", error);
        setError("删除帖子失败，请重试");
        
        // 3秒后清除错误消息
        setTimeout(() => {
          setError("");
        }, 3000);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // 处理批量审批
  const handleBatchApprove = async () => {
    if (selectedPosts.length === 0) {
      alert("请至少选择一个帖子进行批准");
      return;
    }
    
    setIsBatchProcessing(true);
    let successCount = 0;
    let failCount = 0;
    
    try {
      for (const postId of selectedPosts) {
        try {
          const response = await fetch(`/api/posts/${postId}/approve`, {
            method: "POST",
            headers: {
              "x-admin-token": "true"
            }
          });
          
          if (response.ok) {
            successCount++;
            // 更新本地状态
            setPosts(prevPosts => 
              prevPosts.map(post => 
                post.id === postId ? { ...post, status: "approved" } : post
              )
            );
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }
      
      setSuccessMessage(`批量审批完成: ${successCount}个成功, ${failCount}个失败`);
      
      // 清空选择
      setSelectedPosts([]);
      
      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("批量审批失败:", error);
      setError("批量审批失败，请重试");
      
      // 3秒后清除错误消息
      setTimeout(() => {
        setError("");
      }, 3000);
    } finally {
      setIsBatchProcessing(false);
    }
  };
  
  // 处理批量拒绝
  const handleBatchReject = async () => {
    if (selectedPosts.length === 0) {
      alert("请至少选择一个帖子进行拒绝");
      return;
    }
    
    if (!confirm(`确定要拒绝选中的${selectedPosts.length}个帖子吗？`)) {
      return;
    }
    
    setIsBatchProcessing(true);
    let successCount = 0;
    let failCount = 0;
    
    try {
      for (const postId of selectedPosts) {
        try {
          const response = await fetch(`/api/posts/${postId}/reject`, {
            method: "POST",
            headers: {
              "x-admin-token": "true"
            }
          });
          
          if (response.ok) {
            successCount++;
            // 更新本地状态
            setPosts(prevPosts => 
              prevPosts.map(post => 
                post.id === postId ? { ...post, status: "rejected" } : post
              )
            );
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }
      
      setSuccessMessage(`批量拒绝完成: ${successCount}个成功, ${failCount}个失败`);
      
      // 清空选择
      setSelectedPosts([]);
      
      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("批量拒绝失败:", error);
      setError("批量拒绝失败，请重试");
      
      // 3秒后清除错误消息
      setTimeout(() => {
        setError("");
      }, 3000);
    } finally {
      setIsBatchProcessing(false);
    }
  };
  
  // 处理全选/取消全选
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // 只选择待审核的帖子
      const pendingPostIds = posts
        .filter(post => post.status === 'pending')
        .map(post => post.id);
      setSelectedPosts(pendingPostIds);
    } else {
      setSelectedPosts([]);
    }
  };
  
  // 处理单个帖子选择
  const handleSelectPost = (postId: string, checked: boolean) => {
    if (checked) {
      setSelectedPosts(prev => [...prev, postId]);
    } else {
      setSelectedPosts(prev => prev.filter(id => id !== postId));
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN", { 
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <AdminAuthGuard>
      <AdminLayout title="帖子管理">
        {/* 搜索栏 */}
        <div className="bg-[#1c1c1c] rounded-lg p-4 mb-6 border border-[#333] shadow-md">
          <form onSubmit={handleSearch} className="flex flex-wrap md:flex-nowrap items-center gap-4">
            <input
              type="text"
              placeholder="搜索帖子内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-[#252525] text-[#e0e0e0] border border-[#444] rounded-md p-2 focus:outline-none focus:border-amber-500 transition w-full md:w-auto"
            />
            <select 
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setOffset(0); // 重置分页
              }}
              className="bg-[#252525] text-[#e0e0e0] border border-[#444] rounded-md p-2 focus:outline-none focus:border-amber-500 transition w-full md:w-auto"
            >
              <option value="">全部状态</option>
              <option value="pending">待审核</option>
              <option value="approved">已批准</option>
              <option value="rejected">已拒绝</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-md hover:from-amber-500 hover:to-amber-400 transition flex-shrink-0 w-full md:w-auto"
            >
              搜索
            </button>
          </form>
        </div>

        {/* 消息提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-800 text-green-200 rounded-md">
            {successMessage}
          </div>
        )}

        {/* 批量操作按钮 */}
        {statusFilter === 'pending' && posts.length > 0 && (
          <div className="mb-4 p-4 bg-[#1c1c1c] rounded-lg border border-[#333] flex flex-wrap md:flex-nowrap items-center gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                onChange={handleSelectAll}
                checked={selectedPosts.length > 0 && selectedPosts.length === posts.filter(p => p.status === 'pending').length}
                className="w-4 h-4 rounded mr-2 cursor-pointer accent-amber-500"
                id="select-all"
              />
              <label htmlFor="select-all" className="text-[#e0e0e0] cursor-pointer">
                全选待审核帖子
              </label>
              <span className="ml-2 text-[#999]">
                {selectedPosts.length > 0 ? `已选择 ${selectedPosts.length} 个帖子` : ''}
              </span>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={handleBatchApprove}
                disabled={isBatchProcessing || selectedPosts.length === 0}
                className={`px-4 py-2 rounded-md ${
                  isBatchProcessing || selectedPosts.length === 0
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-green-900/30 hover:bg-green-800/40 text-green-200 transition"
                }`}
              >
                {isBatchProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-1 h-4 w-4 border-2 border-b-transparent border-green-200 rounded-full"></div>
                    批量审批中
                  </div>
                ) : "批量批准"}
              </button>
              <button
                onClick={handleBatchReject}
                disabled={isBatchProcessing || selectedPosts.length === 0}
                className={`px-4 py-2 rounded-md ${
                  isBatchProcessing || selectedPosts.length === 0
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-orange-900/30 hover:bg-orange-800/40 text-orange-200 transition"
                }`}
              >
                批量拒绝
              </button>
            </div>
          </div>
        )}

        {/* 帖子列表 */}
        <div className="bg-[#1c1c1c] rounded-lg border border-[#333] shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#252525]">
                <tr>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">
                    {statusFilter === 'pending' && (
                      <input 
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedPosts.length > 0 && selectedPosts.length === posts.filter(p => p.status === 'pending').length}
                        className="w-4 h-4 rounded cursor-pointer accent-amber-500"
                      />
                    )}
                  </th>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">用户</th>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">内容</th>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">图片</th>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">发布时间</th>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">点赞数</th>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">状态</th>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">置顶</th>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {posts.map(post => (
                  <tr key={post.id} className="hover:bg-[#1a1a1a]">
                    <td className="px-4 py-3">
                      {post.status === 'pending' && (
                        <input 
                          type="checkbox"
                          checked={selectedPosts.includes(post.id)}
                          onChange={(e) => handleSelectPost(post.id, e.target.checked)}
                          className="w-4 h-4 rounded cursor-pointer accent-amber-500"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#e0e0e0]">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 flex items-center justify-center text-white font-bold mr-2">
                          {post.userName.charAt(0).toUpperCase()}
                        </div>
                        <span>{post.userName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#e0e0e0]">
                      <div className="max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                        {post.content}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {post.imageUrl && (
                        <div className="w-16 h-16 relative rounded-md overflow-hidden bg-[#1a1a1a]">
                          <Image 
                            src={post.imageUrl} 
                            alt="Post thumbnail" 
                            fill 
                            sizes="64px"
                            className="object-cover"
                            unoptimized={true}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#e0e0e0] whitespace-nowrap">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-[#e0e0e0]">
                      {post.likesCount}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs ${
                        post.status === 'approved' ? 'bg-green-900/30 text-green-200' : 
                        post.status === 'rejected' ? 'bg-red-900/30 text-red-200' : 
                        'bg-yellow-900/30 text-yellow-200'
                      }`}>
                        {post.status === 'approved' ? '已批准' : 
                         post.status === 'rejected' ? '已拒绝' : 
                         '待审核'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs ${
                        post.isPinned ? 'bg-amber-900/30 text-amber-200' : 'bg-gray-700/30 text-gray-300'
                      }`}>
                        {post.isPinned ? '已置顶' : '未置顶'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {post.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprovePost(post.id)}
                              disabled={isProcessing === post.id}
                              className={`px-3 py-1 rounded-md ${
                                isProcessing === post.id
                                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                  : "bg-green-900/30 hover:bg-green-800/40 text-green-200 transition"
                              }`}
                            >
                              {isProcessing === post.id ? (
                                <div className="flex items-center">
                                  <div className="animate-spin mr-1 h-4 w-4 border-2 border-b-transparent border-green-200 rounded-full"></div>
                                  处理中
                                </div>
                              ) : "批准"}
                            </button>
                            <button
                              onClick={() => handleRejectPost(post.id)}
                              disabled={isProcessing === post.id}
                              className={`px-3 py-1 rounded-md ${
                                isProcessing === post.id
                                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                  : "bg-orange-900/30 hover:bg-orange-800/40 text-orange-200 transition"
                              }`}
                            >
                              拒绝
                            </button>
                          </>
                        )}
                        
                        {post.status === 'approved' && (
                          <button
                            onClick={() => handleTogglePin(post.id, post.isPinned)}
                            disabled={isProcessing === post.id}
                            className={`px-3 py-1 rounded-md ${
                              isProcessing === post.id
                                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                                : post.isPinned 
                                  ? "bg-gray-700/30 hover:bg-gray-600/40 text-gray-200 transition"
                                  : "bg-amber-900/30 hover:bg-amber-800/40 text-amber-200 transition"
                            }`}
                          >
                            {isProcessing === post.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin mr-1 h-4 w-4 border-2 border-b-transparent border-amber-200 rounded-full"></div>
                                处理中
                              </div>
                            ) : (post.isPinned ? "取消置顶" : "置顶")}
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={isDeleting === post.id}
                          className={`px-3 py-1 rounded-md ${
                            isDeleting === post.id
                              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                              : "bg-red-900/30 hover:bg-red-800/40 text-red-200 transition"
                          }`}
                        >
                          {isDeleting === post.id ? (
                            <div className="flex items-center">
                              <div className="animate-spin mr-1 h-4 w-4 border-2 border-b-transparent border-red-200 rounded-full"></div>
                              删除中
                            </div>
                          ) : (
                            "删除"
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 加载更多 */}
          {posts.length === 0 && !isLoading ? (
            <div className="py-8 text-center text-[#a18d6f]">
              没有找到帖子
            </div>
          ) : hasMore ? (
            <div className="p-4 text-center">
              <button
                onClick={() => fetchPosts(false)}
                disabled={isLoading}
                className={`px-6 py-2 rounded-md ${
                  isLoading
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-[#252525] text-amber-400 hover:bg-[#2a2a2a] transition"
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-amber-400 rounded-full"></div>
                    加载中...
                  </div>
                ) : (
                  "加载更多"
                )}
              </button>
            </div>
          ) : null}
        </div>
      </AdminLayout>
    </AdminAuthGuard>
  );
} 