"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/app/i18n";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { v4 as uuidv4 } from "uuid";

// 帖子类型定义
interface Post {
  id: string;
  userId: string;
  userName: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  likesCount: number; // 修改字段名，从likes改为likesCount以匹配API
  liked: boolean;
}

/**
 * 社交发帖区内容组件
 * 包含发帖表单和帖子列表展示
 */
export default function SocialFeedContent() {
  const { t, fontClass } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载帖子
  const fetchPosts = useCallback(async (reset = false, search = "") => {
    try {
      setIsLoading(true);
      const newOffset = reset ? 0 : offset;
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const response = await fetch(`/api/posts?limit=10&offset=${newOffset}${searchParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      
      if (reset) {
        setPosts(data);
      } else {
        setPosts(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === 10);
      setOffset(newOffset + data.length);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [offset]);

  // 初始加载
  useEffect(() => {
    fetchPosts(true);
  }, [fetchPosts]);

  // 处理图片选择
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 移除选择的图片
  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 上传图片
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    
    // 添加用户ID到请求头，实际环境中应该使用更安全的方式
    const headers = new Headers();
    if (user?.id) {
      headers.append("x-user-id", user.id);
    }
    
    const response = await fetch("/api/posts/upload", {
      method: "POST",
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error("Failed to upload image");
    }
    
    const data = await response.json();
    return data.url;
  };

  // 提交发帖
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !image) return;
    if (!isAuthenticated) {
      alert(t("socialFeed.loginRequired"));
      return;
    }
    
    setIsSubmitting(true);

    try {
      let imageUrl = undefined;
      
      // 如果有图片，先上传
      if (image) {
        imageUrl = await uploadImage(image);
      }
      
      // 发布帖子
      const headers = new Headers({
        'Content-Type': 'application/json'
      });
      
      if (user?.id) {
        headers.append("x-user-id", user.id);
      }
      if (localStorage.getItem('username')) {
        headers.append("x-username", localStorage.getItem('username') || "");
      }
      
      const response = await fetch("/api/posts", {
        method: "POST",
        headers,
        body: JSON.stringify({ content, imageUrl }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create post");
      }
      
      const newPost = await response.json();
      
      setPosts(prevPosts => [newPost, ...prevPosts]);
      setContent("");
      removeImage();
    } catch (error) {
      console.error("Failed to create post:", error);
      alert(t("socialFeed.postFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(true, searchTerm);
  };

  // 处理点赞/取消点赞
  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!isAuthenticated) {
      alert(t("socialFeed.loginRequired"));
      return;
    }
    
    try {
      // 乐观更新
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              liked: !currentlyLiked,
              likesCount: currentlyLiked ? post.likesCount - 1 : post.likesCount + 1
            };
          }
          return post;
        })
      );
      
      // 发送请求
      const headers = new Headers();
      if (user?.id) {
        headers.append("x-user-id", user.id);
      }
      
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: currentlyLiked ? "DELETE" : "POST",
        headers
      });
      
      if (!response.ok) {
        // 如果请求失败，回滚UI状态
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === postId) {
              return {
                ...post,
                liked: currentlyLiked,
                likesCount: currentlyLiked ? post.likesCount + 1 : post.likesCount - 1
              };
            }
            return post;
          })
        );
        throw new Error("Failed to update like status");
      }
    } catch (error) {
      console.error("Failed to update like status:", error);
    }
  };

  // 加载更多
  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchPosts(false, searchTerm);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} ${t("socialFeed.minutesAgo")}`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)} ${t("socialFeed.hoursAgo")}`;
    } else {
      return `${Math.floor(diffMins / 1440)} ${t("socialFeed.daysAgo")}`;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* 搜索栏 */}
      <div className="bg-[#1c1c1c] rounded-lg p-3 mb-6 border border-[#333] shadow-md">
        <form onSubmit={handleSearch} className="flex items-center">
          <input
            type="text"
            placeholder={t("socialFeed.searchPosts")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-[#252525] text-[#e0e0e0] border border-[#444] rounded-md p-2 mr-2 focus:outline-none focus:border-amber-500 transition"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-md hover:from-amber-500 hover:to-amber-400 transition"
          >
            {t("socialFeed.search")}
          </button>
        </form>
      </div>
      
      {/* 发帖表单 */}
      <div className="bg-[#1c1c1c] rounded-lg p-4 mb-6 border border-[#333] shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <textarea
              className="w-full bg-[#252525] text-[#e0e0e0] border border-[#444] rounded-md p-3 focus:outline-none focus:border-amber-500 transition"
              rows={3}
              placeholder={t("socialFeed.whatOnYourMind")}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            ></textarea>
          </div>
          
          {/* 图片预览 */}
          {imagePreview && (
            <div className="mb-4 relative">
              <div className="relative w-full h-48 bg-[#1a1a1a] rounded-md overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-contain"
                  unoptimized={true}
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-[#333] text-white p-1 rounded-full hover:bg-[#444] transition"
                  onClick={removeImage}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                ref={fileInputRef}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-amber-400 hover:text-amber-300 mr-4 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                {t("socialFeed.addImage")}
              </button>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || (!content.trim() && !image)}
              className={`px-4 py-2 rounded-md ${
                isSubmitting || (!content.trim() && !image) 
                ? "bg-[#444] text-[#aaa] cursor-not-allowed" 
                : "bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400"
              } transition`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                  {t("socialFeed.posting")}
                </div>
              ) : (
                t("socialFeed.post")
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 帖子列表 */}
      <div className="space-y-6">
        {posts.length > 0 ? (
          <>
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-[#1c1c1c] rounded-lg p-5 border border-[#333] shadow-md transition hover:border-[#444]"
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 flex items-center justify-center text-white font-bold">
                    {post.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-[#f4e8c1] font-semibold">{post.userName}</h3>
                    <p className="text-[#a18d6f] text-xs">{formatDate(post.createdAt)}</p>
                  </div>
                </div>
                
                <p className="text-[#e0e0e0] mb-4 whitespace-pre-line">{post.content}</p>
                
                {/* 帖子中的图片显示 */}
                {post.imageUrl && (
                  <div className="mb-4 relative w-full h-80 bg-[#1a1a1a] rounded-md overflow-hidden">
                    <Image
                      src={post.imageUrl}
                      alt="Post image"
                      fill
                      className="object-contain"
                      unoptimized={true}
                      loader={({ src }) => src} // 确保使用原始URL，不添加Next.js的图片优化参数
                    />
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 border-t border-[#333]">
                  <button
                    onClick={() => handleLike(post.id, post.liked)}
                    className={`flex items-center ${
                      post.liked ? "text-amber-500" : "text-[#a18d6f] hover:text-amber-400"
                    } transition`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={post.liked ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    {post.likesCount} {t("socialFeed.likes")}
                  </button>
                </div>
              </div>
            ))}
            
            {/* 加载更多按钮 */}
            {hasMore && (
              <div className="flex justify-center mt-6 mb-4">
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="px-6 py-2 bg-[#1c1c1c] text-amber-400 border border-amber-500/50 rounded-md hover:bg-[#252525] transition"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-amber-400 rounded-full"></div>
                      {t("socialFeed.loading")}
                    </div>
                  ) : (
                    t("socialFeed.loadMore")
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-[#1c1c1c] rounded-lg p-5 border border-[#333] text-center">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin h-8 w-8 border-2 border-b-transparent border-amber-400 rounded-full"></div>
              </div>
            ) : (
              <p className="text-[#a18d6f]">{t("socialFeed.noPosts")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 