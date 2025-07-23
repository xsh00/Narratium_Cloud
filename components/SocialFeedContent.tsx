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
  status?: string; // 帖子状态：pending, approved, rejected
  isPinned?: boolean; // 是否置顶
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
  const [activeSearch, setActiveSearch] = useState(""); // 添加当前活动的搜索词状态

  // 加载帖子
  const fetchPosts = useCallback(async (reset = false, search = "") => {
    try {
      setIsLoading(true);
      const newOffset = reset ? 0 : offset;
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      
      console.log(`Fetching posts with search: "${search}", params: ${searchParam}`);
      
      const response = await fetch(`/api/posts?limit=10&offset=${newOffset}${searchParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      
      console.log(`Received ${data.length} posts for search: "${search}"`);
      
      if (reset) {
        setPosts(data);
        if (search) {
          setActiveSearch(search); // 更新当前活动的搜索词
        }
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
    // 初始加载时不应该有搜索词
    if (!activeSearch) {
      fetchPosts(true);
    }
  }, []); // 移除fetchPosts依赖，避免循环加载

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
    const response = await fetch("/api/posts/upload", {
      method: "POST",
      body: formData,
      headers: {
        "x-user-id": user?.id || ""
      }
    });
    
    if (!response.ok) {
      throw new Error("Image upload failed");
    }
    
    const data = await response.json();
    return data.url;
  };
  
  // 提交新帖子
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert(t("socialFeed.pleaseLogin"));
      return;
    }
    
    if (!content.trim() && !image) {
      alert(t("socialFeed.emptyPost"));
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // 上传图片（如果有）
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }
      
      // 创建帖子
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
          "x-username": user?.username || ""
        },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl
        })
      });
      
      if (!response.ok) {
        throw new Error("Failed to create post");
      }
      
      // 获取刚创建的帖子数据
      const newPost = await response.json();
      
      // 清除表单
      setContent("");
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // 提示用户帖子已提交，等待审核
      alert(t("socialFeed.postSubmittedForReview"));
      
      // 添加新发布的待审核帖子到列表顶部，这样用户可以看到自己发布的内容，但会显示"待审核"标记
      setPosts(prevPosts => [
        { 
          ...newPost, 
          status: 'pending' 
        }, 
        ...prevPosts
      ]);
      
    } catch (error) {
      console.error("Error creating post:", error);
      alert(t("socialFeed.errorCreatingPost"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`Initiating search for: "${searchTerm}"`);
    setOffset(0); // 重置偏移量
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
      fetchPosts(false, activeSearch);
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
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder={t("socialFeed.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#252525] text-[#e0e0e0] border border-[#444] rounded-md p-2 pl-3 pr-10 focus:outline-none focus:border-amber-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setActiveSearch("");
                  fetchPosts(true, "");
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-md hover:from-amber-500 hover:to-amber-400 transition ml-2"
          >
            {t("socialFeed.search")}
          </button>
        </form>
      </div>
      
      {/* 搜索结果提示 */}
      {activeSearch && (
        <div className="mb-4 text-[#a18d6f]">
          {posts.length > 0 ? (
            <p>{t("socialFeed.searchResults").replace('{count}', String(posts.length)).replace('{term}', activeSearch)}</p>
          ) : (
            <p>{t("socialFeed.noSearchResults").replace('{term}', activeSearch)}</p>
          )}
        </div>
      )}
      
      {/* 发帖表单 */}
      <div className="bg-[#1c1c1c] rounded-lg p-4 mb-6 border border-[#333] shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <textarea
              className="w-full bg-[#252525] text-[#e0e0e0] border border-[#444] rounded-md p-3 focus:outline-none focus:border-amber-500 transition"
              rows={3}
              placeholder={t("socialFeed.writeContent")}
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
                t("socialFeed.postButton")
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 帖子列表 */}
      <div className="mt-8">
        {posts.map((post) => (
          <div key={post.id} className={`mb-6 p-4 bg-[#1c1c1c] rounded-lg border ${post.isPinned ? 'border-amber-500' : 'border-[#333]'} shadow-md transition-all duration-200`}>
            {post.isPinned && (
              <div className="flex items-center mb-2 text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <path d="m12 1 9 9-9 9-9-9z" />
                </svg>
                <span className="text-xs font-bold">{t("socialFeed.pinnedPost")}</span>
              </div>
            )}
            
            {post.status === 'pending' && (
              <div className="flex items-center mb-2 text-yellow-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span className="text-xs font-bold">{t("socialFeed.pendingReview")}</span>
              </div>
            )}
            
            {/* 帖子头部：用户名和时间 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-600 to-amber-400 flex items-center justify-center text-white font-bold mr-3">
                  {post.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-[#e0e0e0]">{post.userName}</div>
                  <div className="text-xs text-[#999]">{formatDate(post.createdAt)}</div>
                </div>
              </div>
            </div>
            
            {/* 帖子内容 */}
            <div className={`text-[#e0e0e0] mb-3 whitespace-pre-wrap ${fontClass}`}>
              {post.content}
            </div>
            
            {/* 帖子图片（如果有） */}
            {post.imageUrl && (
              <div className="mb-3 relative">
                <div className="rounded-lg overflow-hidden max-w-full">
                  <Image 
                    src={post.imageUrl} 
                    alt="Post" 
                    width={0} 
                    height={0} 
                    sizes="100vw"
                    className="max-h-[400px] w-auto object-contain"
                    unoptimized={true}
                  />
                </div>
              </div>
            )}
            
            {/* 帖子互动区：点赞和评论 */}
            <div className="flex items-center pt-2 border-t border-[#333]">
              {/* 点赞按钮 */}
              <button 
                className={`flex items-center mr-4 ${post.liked ? 'text-red-500' : 'text-[#aaa] hover:text-red-400'} transition`}
                onClick={() => handleLike(post.id, post.liked)}
                disabled={!isAuthenticated}
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
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span>{post.likesCount}</span>
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
      </div>
    </div>
  );
} 