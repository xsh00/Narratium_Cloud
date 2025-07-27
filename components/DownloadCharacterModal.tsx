/**
 * Download Character Modal Component
 *
 * This component provides a character download interface with the following features:
 * - GitHub character repository integration
 * - Character preview and selection
 * - Download and import functionality
 * - Character information extraction
 * - Loading states and error handling
 * - Grid-based character display
 * - Tag-based categorization and filtering
 * - Enhanced UI with larger modal size
 * - Toggle between GitHub and COS sources
 * - Character name search functionality
 *
 * The component handles:
 * - GitHub API integration for character fetching
 * - Character file download and processing
 * - Character information parsing and display
 * - Import functionality integration
 * - Loading states and error management
 * - Modal state management and animations
 * - Tag extraction and filtering
 * - Source switching between GitHub and COS
 * - Character search filtering
 *
 * Dependencies:
 * - useLanguage: For internationalization
 * - handleCharacterUpload: For character import functionality
 * - framer-motion: For animations
 */

"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { handleCharacterUpload } from "@/function/character/import";
import { useLanguage } from "@/app/i18n";
import { MINIO_CONFIG } from "@/lib/config/minio-config";

/**
 * Interface definitions for the component's props and data structures
 */
interface DownloadCharacterModalProps {
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

/**
 * Download character modal component
 *
 * Provides a character download interface with:
 * - GitHub character repository integration
 * - Character preview and selection
 * - Download and import functionality
 * - Character information extraction
 * - Grid-based display and loading states
 * - Tag-based categorization and filtering
 * - Enhanced UI with larger modal size
 * - Toggle between GitHub and COS sources
 * - Character name search functionality
 *
 * @param {DownloadCharacterModalProps} props - Component props
 * @returns {JSX.Element | null} The download character modal or null if closed
 */
export default function DownloadCharacterModal({
  isOpen,
  onClose,
  onImport,
}: DownloadCharacterModalProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
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
  const allTags = useMemo(() => {
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
    
    // 检测是否为移动设备
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    // 使用MinIO API获取文件列表
    fetchMinioFiles();
    
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, [isOpen]);

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
      const response = await fetch(MINIO_CONFIG.LIST_API_URL);
      if (!response.ok) {
        throw new Error('Failed to fetch MinIO files');
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch MinIO files');
      }
      
      setCharacterFiles(result.data);
    } catch (err) {
      setError('Failed to fetch MinIO files');
      console.error('MinIO API error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAndImport = async (file: MinioFile) => {
    setImporting(file.name);
    setError(null);
    try {
      const res = await fetch(file.download_url);
      if (!res.ok) throw new Error(t("downloadModal.downloadFailed"));
      const blob = await res.blob();
      const fileObj = new File([blob], file.name, { type: blob.type });
      await handleCharacterUpload(fileObj);
      onImport();
      onClose();
    } catch (e: any) {
      setError(e.message || t("downloadModal.importFailed"));
    } finally {
      setImporting(null);
    }
  };

  // 根据选中的标签和搜索词筛选角色
  const filteredCharacters = useMemo(() => {
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2
              className={`text-xl sm:text-2xl text-[#eae6db] font-bold ${serifFontClass}`}
            >
              {t("downloadModal.title")}
            </h2>
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
            {t("downloadModal.searchCharacter") || "搜索角色"}
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t("downloadModal.searchPlaceholder") || "输入角色名称..."}
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
                {t("downloadModal.filterByTags")}
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
                    {t("downloadModal.allTags")} ({characterFiles.length})
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
              {t("downloadModal.loading")}
            </div>
          ) : error ? (
            <div className={`text-red-400 py-8 text-center ${fontClass}`}>
              {error}
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
                    <button
                      disabled={!!importing}
                      className={`px-3 py-1.5 text-xs rounded bg-[#e0cfa0] text-[#534741] hover:bg-[#ffd475] border border-[#c0a480] ${fontClass} shadow-sm transition-all duration-150 ${
                        importing === file.name ? "opacity-60 cursor-wait" : ""
                      }`}
                      onClick={() => handleDownloadAndImport(file)}
                    >
                      {importing === file.name
                        ? t("downloadModal.importing")
                        : t("downloadModal.downloadAndImport")}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-[#534741]">
          <div className={`text-xs text-[#a18d6f] text-center ${fontClass}`}>
            {filteredCharacters.length} {t("downloadModal.charactersFound")}
          </div>
        </div>
      </motion.div>
    </div>
  );
}