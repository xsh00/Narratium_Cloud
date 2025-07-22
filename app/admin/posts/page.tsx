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
}

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  // 获取帖子
  const fetchPosts = async (reset = false) => {
    try {
      setIsLoading(true);
      const newOffset = reset ? 0 : offset;
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
      
      const response = await fetch(`/api/posts?limit=20&offset=${newOffset}${searchParam}`);
      
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

        {/* 帖子列表 */}
        <div className="bg-[#1c1c1c] rounded-lg border border-[#333] shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#252525]">
                <tr>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">用户</th>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">内容</th>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">图片</th>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">发布时间</th>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">点赞数</th>
                  <th className="px-4 py-3 text-left text-[#f4e8c1]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {posts.map(post => (
                  <tr key={post.id} className="hover:bg-[#1a1a1a]">
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