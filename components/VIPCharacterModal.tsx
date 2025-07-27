/**
 * VIP Character Modal Component
 *
 * This component provides a VIP character download interface with the following features:
 * - VIP角色展示和选择
 * - 未订阅用户显示订阅按钮
 * - 已订阅用户显示下载按钮
 * - 角色信息显示
 * - 标签分类和筛选
 * - 响应式UI设计
 */

"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { handleCharacterUpload } from "@/function/character/import";
import { useLanguage } from "@/app/i18n";  // 修复导入路径
import { MINIO_VIP_CONFIG } from "@/lib/config/minio-vip-config";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext"; // 导入Auth上下文

/**
 * Interface definitions for the component's props and data structures
 */
interface VIPCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
}

interface MinioFile {
  name: string;
  displayName: string;
  tags: string[]; 
  download_url: string;
}

interface CharacterInfo {
  displayName: string;
  tags: string[];
}

interface UserVIPStatus {
  isVIP: boolean;
  vipExpiry: string | null;
  credits: number;
}

/**
 * VIP Character modal component
 */
export default function VIPCharacterModal({
  isOpen,
  onClose,
  onImport,
}: VIPCharacterModalProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth(); // 使用Auth上下文获取用户信息
  
  const [characterFiles, setCharacterFiles] = useState<MinioFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tagScrollRef = React.useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [vipStatus, setVipStatus] = useState<UserVIPStatus | null>(null);  // 初始状态为null表示加载中
  
  const extractCharacterInfo = (fileName: string): CharacterInfo => {
    const nameWithoutExt = fileName.replace(/\.png$/, "");
    const parts = nameWithoutExt.split(/--/);

    let displayName = nameWithoutExt;
    let tags: string[] = [];

    if (parts.length >= 1) {
      displayName = parts[0].trim();

      // 提取标签（如果有的话）
      if (parts.length > 1) {
        const tagPart = parts.slice(1).join("--");
        tags = tagPart
          .split(/[,，、]/)
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      }
    }

    return { displayName, tags };
  };

  // 提取所有可用的标签
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    characterFiles.forEach((file) => {
      const { tags } = extractCharacterInfo(file.name);
      tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [characterFiles]);
  
  useEffect(() => {
    if (!isOpen) return;
    
    setLoading(true);
    setError(null);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
      // 无需在这里调用checkScrollButtons
    };
    
    window.addEventListener("resize", checkMobile);
    checkMobile();
    
    // 每次打开模态框时，强制刷新VIP状态
    const refreshData = async () => {
      try {
        // 检查用户认证状态
        if (!isAuthenticated || !user) {
          setError('用户未登录，请先登录');
          setLoading(false);
          return;
        }
        
        // 先获取VIP状态，确保权限检查
        await fetchVIPStatus();
        
        // 然后获取角色列表
        await fetchMinioFiles();
      } catch (err) {
        setError(`获取数据失败: ${err instanceof Error ? err.message : '未知错误'}`);
      } finally {
        // 设置加载完成
        setLoading(false);
      }
    };
    
    refreshData();
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [isOpen, isAuthenticated, user]);

  // 检测标签滚动区域是否需要显示滚动按钮
  useEffect(() => {
    if (!tagScrollRef.current || isMobile) return;
    
    const checkScrollButtons = () => {
      const element = tagScrollRef.current;
      if (!element) return;
      
      setShowLeftScroll(element.scrollLeft > 0);
      setShowRightScroll(element.scrollLeft < element.scrollWidth - element.clientWidth);
    };
    
    const scrollElement = tagScrollRef.current;
    scrollElement.addEventListener('scroll', checkScrollButtons);
    checkScrollButtons();
    
    return () => {
      scrollElement?.removeEventListener('scroll', checkScrollButtons);
    };
  }, [allTags, isMobile]);

  // 标签滚动函数
  const scrollTags = (direction: 'left' | 'right') => {
    if (!tagScrollRef.current) return;
    const scrollAmount = tagScrollRef.current.clientWidth / 2;
    const newScrollLeft = direction === 'left' 
      ? tagScrollRef.current.scrollLeft - scrollAmount
      : tagScrollRef.current.scrollLeft + scrollAmount;
    
    tagScrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const fetchMinioFiles = async () => {
    try {
      console.log('开始获取VIP角色列表...');
      const response = await fetch(MINIO_VIP_CONFIG.LIST_API_URL);
      
      if (!response.ok) {
        console.error(`获取VIP角色列表失败: HTTP ${response.status} - ${response.statusText}`);
        throw new Error(`获取VIP角色列表失败 (HTTP ${response.status})`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        console.error('获取VIP角色列表失败:', result.error);
        throw new Error(result.error || '获取VIP角色列表失败');
      }
      
      console.log(`成功获取 ${result.data.length} 个VIP角色`);
      setCharacterFiles(result.data);
      
      if (result.data.length === 0) {
        console.log('注意: VIP角色列表为空，请确认已在MinIO存储桶中上传角色卡文件');
      }
    } catch (err) {
      console.error('获取VIP角色列表时出错:', err);
      setError(err instanceof Error ? err.message : '获取VIP角色列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchVIPStatus = async () => {
    try {
      // 从Auth上下文获取用户信息
      if (!isAuthenticated || !user || !user.email) {
        throw new Error('用户未登录或用户信息不完整');
      }
      
      const email = user.email;
      
      // 添加时间戳参数，确保每次请求都是唯一的
      const timestamp = new Date().getTime();
      const url = `/api/user/vip-status?email=${encodeURIComponent(email)}&_=${timestamp}&force=true`;
      
      const response = await fetch(url, {
        // 添加缓存控制，防止浏览器缓存
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取VIP状态失败: HTTP ${response.status}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || '获取VIP状态失败');
      }
      
      // 确保isVIP是布尔值
      const isVIP = !!result.data.isVIP;
      const vipExpiry = result.data.vipExpiry;
      const credits = result.data.credits || 0;
      
      // 立即更新本地VIP状态
      setVipStatus({
        isVIP,
        vipExpiry,
        credits
      });
      
      // 同时更新localStorage中的VIP状态，以便其他组件使用
      localStorage.setItem('vipStatus', JSON.stringify({
        isVIP,
        vipExpiry,
        credits,
        lastUpdated: timestamp
      }));
      
      return isVIP;
    } catch (err) {
      console.error('获取VIP状态失败:', err);
      setVipStatus({ isVIP: false, vipExpiry: null, credits: 0 });
      return false;
    }
  };

  // 跳转到个人中心页面
  const navigateToProfilePage = () => {
    onClose(); // 关闭当前模态框
    router.push('/profile'); // 跳转到个人中心页面
  };

  const handleDownloadAndImport = async (file: MinioFile) => {
    setImporting(file.name);
    setError(null);
    try {
      const res = await fetch(file.download_url);
      if (!res.ok) throw new Error("下载角色失败");
      const blob = await res.blob();
      const fileObj = new File([blob], file.name, { type: blob.type });
      await handleCharacterUpload(fileObj);
      onImport();
      onClose();
    } catch (e: any) {
      setError(e.message || "导入角色失败");
    } finally {
      setImporting(null);
    }
  };

  // 根据选中的标签和搜索词筛选角色
  const filteredCharacters = React.useMemo(() => {
    return characterFiles.filter((file) => {
      const { displayName, tags } = extractCharacterInfo(file.name);
      // 应用标签筛选
      const matchesTag = selectedTag === "all" || tags.includes(selectedTag);
      // 应用搜索词筛选
      const matchesSearch = searchTerm === "" || 
                           displayName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTag && matchesSearch;
    });
  }, [characterFiles, selectedTag, searchTerm]);

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // 清除搜索
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  if (!isOpen) return null;

  const formatCompactDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm bg-black bg-opacity-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#1a1714] rounded-lg shadow-2xl p-4 sm:p-6 w-full max-w-6xl max-h-[90vh] relative z-10 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-1 sm:gap-3">
            <h2
              className={`text-lg sm:text-2xl text-[#eae6db] font-bold ${serifFontClass}`}
            >
              VIP角色专区
            </h2>
            
            {/* VIP状态显示 */}
            <div className={`flex items-center gap-1 sm:gap-2 ml-1 sm:ml-3 text-sm ${fontClass}`}>
              {vipStatus === null ? (
                <span className="px-1 py-0.5 sm:px-2 sm:py-1 bg-[#252220] text-[#a18d6f] rounded flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
                  <svg className="animate-spin h-2 w-2 sm:h-3 sm:w-3 text-[#c0a480]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  加载中...
                </span>
              ) : vipStatus.isVIP ? (
                <span className="px-1 py-0.5 sm:px-3 sm:py-1.5 bg-[#e0cfa0] text-[#534741] rounded border border-[#c0a480] shadow-sm text-[10px] sm:text-sm leading-tight">
                  {isMobile ? `VIP至${formatCompactDate(vipStatus.vipExpiry!)}` : `VIP有效期至: ${new Date(vipStatus.vipExpiry!).toLocaleDateString()}`}
                </span>
              ) : (
                <span className="px-1 py-0.5 sm:px-3 sm:py-1.5 bg-[#252220] text-[#c0a480] rounded border border-[#534741] shadow-sm text-[10px] sm:text-sm">
                  非VIP
                </span>
              )}
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  // 强制刷新VIP状态
                  setVipStatus(null); // 先清空状态触发加载效果
                  setTimeout(async () => {
                    const isVIP = await fetchVIPStatus();
                    if (isVIP) {
                      // 如果是VIP，强制重新加载角色列表
                      setLoading(true);
                      await fetchMinioFiles();
                      setLoading(false);
                    }
                  }, 100);
                }}
                title="刷新VIP状态"
                className="p-0.5 sm:p-1 text-[#c0a480] hover:text-[#ffd475] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          <button
            className="text-[#c0a480] hover:text-[#ffd475] text-2xl sm:text-3xl transition-colors"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* 搜索框 */}
        <div className="mb-4 relative">
          <div className={`text-xs sm:text-sm text-[#c0a480] mb-1.5 ${fontClass}`}>
            搜索角色
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="输入角色名称..."
              className={`w-full px-3 py-2 sm:py-2.5 text-sm bg-[#252220] text-[#eae6db] border border-[#534741] rounded-md focus:outline-none focus:ring-1 focus:ring-[#c0a480] ${fontClass}`}
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c0a480] hover:text-[#ffd475]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tag Filter - 移动端可折叠版本 */}
        {allTags.length > 0 && (
          <div className="mb-3 relative">
            <div className="flex justify-between items-center">
              <div className={`text-xs sm:text-sm text-[#c0a480] mb-1.5 sm:mb-2 ${fontClass}`}>
                按标签筛选
              </div>
              {isMobile && (
                <button 
                  onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                  className="text-[#c0a480] hover:text-[#ffd475] transition-colors"
                >
                  {isTagsExpanded ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            
            {/* 标签栏 - 在移动端可折叠 */}
            {(!isMobile || isTagsExpanded) && (
              <div className="relative">
                {/* PC端左侧滚动按钮 */}
                {!isMobile && showLeftScroll && (
                  <button 
                    onClick={() => scrollTags('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#1a1714] bg-opacity-80 p-1 rounded-full shadow-md text-[#c0a480] hover:text-[#ffd475]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                
                <div 
                  ref={tagScrollRef}
                  className="flex overflow-x-auto pb-2 scrollbar-hide gap-1.5 sm:gap-2" 
                  style={{WebkitOverflowScrolling: 'touch'}}
                >
                  <button
                    onClick={() => setSelectedTag("all")}
                    className={`px-2.5 sm:px-3 py-1.25 sm:py-1.5 rounded-full text-xs sm:text-sm min-w-[56px] flex-shrink-0 whitespace-nowrap transition-all duration-200 ${
                      selectedTag === "all"
                        ? "bg-[#e0cfa0] text-[#534741] border border-[#c0a480]"
                        : "bg-[#252220] text-[#c0a480] border border-[#534741] hover:bg-[#3a2a2a] hover:text-[#ffd475]"
                    } ${fontClass}`}
                  >
                    全部 ({characterFiles.length})
                  </button>
                  {allTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`px-2.5 sm:px-3 py-1.25 sm:py-1.5 rounded-full text-xs sm:text-sm min-w-[56px] flex-shrink-0 whitespace-nowrap transition-all duration-200 ${
                        selectedTag === tag
                          ? "bg-[#e0cfa0] text-[#534741] border border-[#c0a480]"
                          : "bg-[#252220] text-[#c0a480] border border-[#534741] hover:bg-[#3a2a2a] hover:text-[#ffd475]"
                      } ${fontClass}`}
                    >
                      {tag} (
                      {
                        characterFiles.filter((file) =>
                          extractCharacterInfo(file.name).tags.includes(tag),
                        ).length
                      }
                      )
                    </button>
                  ))}
                </div>
                
                {/* PC端右侧滚动按钮 */}
                {!isMobile && showRightScroll && (
                  <button 
                    onClick={() => scrollTags('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#1a1714] bg-opacity-80 p-1 rounded-full shadow-md text-[#c0a480] hover:text-[#ffd475]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            
            {/* 移动端选中标签指示器 - 当标签栏折叠时显示 */}
            {isMobile && !isTagsExpanded && selectedTag !== "all" && (
              <div className="mt-1 py-1 px-3 bg-[#252220] rounded-full inline-block text-xs text-[#c0a480]">
                当前筛选: <span className="text-[#ffd475]">{selectedTag}</span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className={`text-[#c0a480] py-8 text-center ${fontClass}`}>
              {t("vipCharacterModal.loading")}
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <div className={`text-red-400 mb-2 ${fontClass}`}>
                {t("vipCharacterModal.fetchError")}
              </div>
              <div className={`text-[#a18d6f] text-sm mb-4 ${fontClass}`}>
                {error}
              </div>
              <button 
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetchMinioFiles();
                }}
                className={`px-4 py-2 bg-[#3a2a2a] text-[#c0a480] hover:bg-[#4a3a3a] hover:text-[#ffd475] rounded-md transition-colors ${fontClass}`}
              >
                {t("vipCharacterModal.tryAgain")}
              </button>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className={`text-[#c0a480] py-8 text-center ${fontClass}`}>
              {searchTerm || selectedTag !== "all" 
                ? t("vipCharacterModal.noCharactersFound") 
                : t("vipCharacterModal.emptyBucket")}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 max-h-[60vh] overflow-y-auto fantasy-scrollbar pb-16 md:pb-4">
              {filteredCharacters.map((file) => {
                const { displayName, tags } = extractCharacterInfo(file.name);
                return (
                  <motion.div
                    key={file.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#252220] rounded-lg p-3 flex flex-col items-center hover:bg-[#2a1f1f] transition-colors duration-200"
                  >
                    <div className="relative w-full aspect-square mb-3">
                      <img
                        src={file.download_url}
                        alt={file.name}
                        className="w-full h-full object-cover rounded border border-[#534741]"
                      />
                    </div>
                    <div
                      className={`text-[#eae6db] text-sm mb-1 line-clamp-1 text-center ${fontClass}`}
                    >
                      {displayName}
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2 justify-center">
                        {tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 text-xs bg-[#3a2a2a] text-[#a18d6f] rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {tags.length > 2 && (
                          <span className="px-1.5 py-0.5 text-xs bg-[#3a2a2a] text-[#a18d6f] rounded">
                            +{tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                    {vipStatus?.isVIP ? (
                      <button
                        disabled={!!importing}
                        className={`px-3 py-1.5 text-xs rounded bg-[#e0cfa0] text-[#534741] hover:bg-[#ffd475] border border-[#c0a480] ${fontClass} shadow-sm transition-all duration-150 ${
                          importing === file.name ? "opacity-60 cursor-wait" : ""
                        }`}
                        onClick={() => handleDownloadAndImport(file)}
                      >
                        {importing === file.name ? "导入中..." : "下载并导入"}
                      </button>
                    ) : (
                      <button
                        className={`px-3 py-1.5 text-xs rounded bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 ${fontClass} shadow-sm transition-all duration-150`}
                        onClick={navigateToProfilePage}
                      >
                        订阅以获取角色卡
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-[#534741]">
          <div className={`text-xs text-[#a18d6f] text-center ${fontClass}`}>
            {filteredCharacters.length} 个VIP角色
          </div>
        </div>
      </motion.div>
    </div>
  );
} 