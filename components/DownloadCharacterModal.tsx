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
 * 
 * The component handles:
 * - GitHub API integration for character fetching
 * - Character file download and processing
 * - Character information parsing and display
 * - Import functionality integration
 * - Loading states and error management
 * - Modal state management and animations
 * - Tag extraction and filtering
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
import { GITHUB_CONFIG } from "@/lib/config/github-config";

const GITHUB_API_URL = GITHUB_CONFIG.API_URL;
const RAW_BASE_URL = GITHUB_CONFIG.RAW_BASE_URL;

/**
 * Interface definitions for the component's props and data structures
 */
interface DownloadCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
}

interface GithubFile {
  name: string;
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
 * 
 * @param {DownloadCharacterModalProps} props - Component props
 * @returns {JSX.Element | null} The download character modal or null if closed
 */
export default function DownloadCharacterModal({ isOpen, onClose, onImport }: DownloadCharacterModalProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [characterFiles, setCharacterFiles] = useState<GithubFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("all");

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    fetch(GITHUB_API_URL)
      .then(res => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCharacterFiles(data.filter((item: any) => item.name.endsWith(".png")));
        } else {
          setError(t("downloadModal.fetchError"));
        }
      })
      .catch(() => setError(t("downloadModal.fetchError")))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleDownloadAndImport = async (file: GithubFile) => {
    setImporting(file.name);
    setError(null);
    try {
      const res = await fetch(file.download_url || RAW_BASE_URL + file.name);
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
        tags = tagPart.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }

    return { displayName, tags };
  };

  // 提取所有可用的标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    characterFiles.forEach(file => {
      const { tags } = extractCharacterInfo(file.name);
      tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [characterFiles]);

  // 根据选中的标签筛选角色
  const filteredCharacters = useMemo(() => {
    if (selectedTag === "all") {
      return characterFiles;
    }
    return characterFiles.filter(file => {
      const { tags } = extractCharacterInfo(file.name);
      return tags.includes(selectedTag);
    });
  }, [characterFiles, selectedTag]);

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
          <h2 className={`text-xl sm:text-2xl text-[#eae6db] font-bold ${serifFontClass}`}>
            {t("downloadModal.title")}
          </h2>
          <button 
            className="text-[#c0a480] hover:text-[#ffd475] text-2xl sm:text-3xl transition-colors" 
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="mb-4">
            <div className={`text-sm text-[#c0a480] mb-2 ${fontClass}`}>
              {t("downloadModal.filterByTags")}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag("all")}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition-all duration-200 ${
                  selectedTag === "all"
                    ? "bg-[#e0cfa0] text-[#534741] border border-[#c0a480]"
                    : "bg-[#252220] text-[#c0a480] border border-[#534741] hover:bg-[#3a2a2a] hover:text-[#ffd475]"
                } ${fontClass}`}
              >
                {t("downloadModal.allTags")} ({characterFiles.length})
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition-all duration-200 ${
                    selectedTag === tag
                      ? "bg-[#e0cfa0] text-[#534741] border border-[#c0a480]"
                      : "bg-[#252220] text-[#c0a480] border border-[#534741] hover:bg-[#3a2a2a] hover:text-[#ffd475]"
                  } ${fontClass}`}
                >
                  {tag} ({characterFiles.filter(file => extractCharacterInfo(file.name).tags.includes(tag)).length})
                </button>
              ))}
            </div>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 max-h-[60vh] overflow-y-auto fantasy-scrollbar">
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
                        src={RAW_BASE_URL + file.name} 
                        alt={file.name} 
                        className="w-full h-full object-cover rounded border border-[#534741]" 
                      />
                    </div>
                    <div className={`text-[#eae6db] text-sm mb-1 line-clamp-1 text-center ${fontClass}`}>
                      {displayName}
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2 justify-center">
                        {tags.slice(0, 2).map(tag => (
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
                      {importing === file.name ? t("downloadModal.importing") : t("downloadModal.downloadAndImport")}
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
