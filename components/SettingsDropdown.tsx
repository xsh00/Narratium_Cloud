"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/app/i18n";
import { useSoundContext } from "@/contexts/SoundContext";
import { useTour } from "@/hooks/useTour";
import { useAuth } from "@/contexts/AuthContext";
import {
  exportDataToFile,
  importDataFromFile,
  generateExportFilename,
  downloadFile,
} from "@/function/data/export-import";
import {
  backupToGoogle,
  getFolderList,
  getGoogleCodeByUrl,
  getGoogleLoginUrl,
  getBackUpFile,
} from "@/function/data/google-control";

interface SettingsDropdownProps {
  toggleModelSidebar: () => void;
}

export default function SettingsDropdown({
  toggleModelSidebar,
}: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage, t } = useLanguage();
  const { soundEnabled, toggleSound } = useSoundContext();
  const { resetTour } = useTour();
  const { user, updateUsername } = useAuth();

  // 用户名设置相关状态
  const [currentUsername, setCurrentUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  // 检测是否为手机端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 初始化位置
  useEffect(() => {
    if (isMobile) {
      const savedPosition = localStorage.getItem('settingsButtonPosition');
      if (savedPosition) {
        setPosition(JSON.parse(savedPosition));
      } else {
        // 默认位置：右下角
        setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 120 });
      }
    }
  }, [isMobile]);

  // 初始化用户名
  useEffect(() => {
    const username = localStorage.getItem('username') || 'user';
    setCurrentUsername(username);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 拖拽相关事件处理
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMobile) return;
    
    setIsDragging(true);
    e.preventDefault();
    
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;
    
    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      
      // 限制在屏幕范围内
      const maxX = window.innerWidth - 64;
      const maxY = window.innerHeight - 64;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      // 保存位置到本地存储
      localStorage.setItem('settingsButtonPosition', JSON.stringify(position));
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 触摸事件处理（移动端）
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    
    setIsDragging(true);
    e.preventDefault();
    
    const touch = e.touches[0];
    const startX = touch.clientX - position.x;
    const startY = touch.clientY - position.y;
    
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const newX = touch.clientX - startX;
      const newY = touch.clientY - startY;
      
      // 限制在屏幕范围内
      const maxX = window.innerWidth - 64;
      const maxY = window.innerHeight - 64;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
      // 保存位置到本地存储
      localStorage.setItem('settingsButtonPosition', JSON.stringify(position));
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const toggleLanguage = () => {
    const newLanguage = language === "zh" ? "en" : "zh";
    setLanguage(newLanguage);
    document.documentElement.lang = newLanguage;
  };

  const openModelSettings = () => {
    toggleModelSidebar();
    setIsOpen(false);
  };

  // 用户名设置相关函数
  const handleEditUsername = () => {
    setTempUsername(currentUsername);
    setIsEditingUsername(true);
    setIsOpen(false);
  };

  const handleCancelEditUsername = () => {
    setIsEditingUsername(false);
    setTempUsername("");
  };

  const handleSaveUsername = async () => {
    if (tempUsername.trim()) {
      const newUsername = tempUsername.trim();
      
      try {
        // 如果用户已登录，同步到数据库
        if (user) {
          const result = await updateUsername(newUsername);
          if (!result.success) {
            alert(result.message);
            return;
          }
        } else {
          // 未登录用户只更新本地存储
          localStorage.setItem('username', newUsername);
        }
        
        setCurrentUsername(newUsername);
        setIsEditingUsername(false);
        setUsernameSuccess(true);
        setTimeout(() => setUsernameSuccess(false), 3000);
      } catch (error) {
        console.error('保存用户名失败:', error);
        alert('保存用户名失败，请重试');
      }
    }
  };

  const handleUsernameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveUsername();
    } else if (e.key === 'Escape') {
      handleCancelEditUsername();
    }
  };

  const handleExportData = async () => {
    try {
      const blob = await exportDataToFile();
      const filename = generateExportFilename();
      downloadFile(blob, filename);
      setIsOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      alert(t("common.exportFailed"));
    }
  };

  const handleImportData = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          await importDataFromFile(file);
          setIsOpen(false);
          window.location.reload();
        }
      };
      input.click();
    } catch (error) {
      console.error("Import failed:", error);
      alert(t("common.importFailed"));
    }
  };

  async function handleImportDataFromGoogle() {
    const token = localStorage.getItem("google_drive_token");
    if (token) {
      const res = await getFolderList();
      if (res?.id) {
        const file = await getBackUpFile(res.id);
        if (file) {
          await importDataFromFile(file);
          setIsOpen(false);
          alert("导入成功！");
          window.location.reload();
        }
      }
    } else {
      const url = getGoogleLoginUrl();
      window.location.href = url;
    }
  }

  async function handleExportDataToGoogle() {
    const token = localStorage.getItem("google_drive_token");
    if (token) {
      const blob = await exportDataToFile();
      const filename = generateExportFilename();
      const res = await getFolderList();
      if (res?.id) {
        await backupToGoogle({
          blob,
          filename,
          folderId: res.id,
        });
        // todo
        alert("上传成功");
      }
    } else {
      const url = getGoogleLoginUrl();
      window.location.href = url;
    }
  }

  const useFirst = useRef(false);
  useEffect(() => {
    if (useFirst.current) return;
    useFirst.current = true;
    getGoogleCodeByUrl(window.location);
  }, []);

  // 手机端悬浮按钮
  if (isMobile) {
    // 判断菜单弹出方向
    const isTopHalf = position.y < window.innerHeight / 2;
    return (
      <div
        ref={dragRef}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999,
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="select-none"
      >
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            data-tour="settings-button"
            className={`w-12 h-12 flex items-center justify-center text-[#f4e8c1] bg-[#1c1c1c] rounded-full border-2 border-[#333333] shadow-lg transition-all duration-300 hover:bg-[#252525] hover:border-[#444444] hover:text-amber-400 hover:shadow-[0_0_12px_rgba(251,146,60,0.4)] ${
              isDragging ? 'scale-110' : 'scale-100'
            }`}
            aria-label={t("common.settings")}
            aria-expanded={isOpen}
            style={{ touchAction: 'none' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {isOpen && (
            <div className={`absolute right-0 w-56 rounded-lg shadow-xl bg-[#1c1c1c] border border-[#333333] z-50 overflow-hidden ${isTopHalf ? 'top-full mt-2' : 'bottom-full mb-2'}`}>
              <div className="py-2">
                <button
                  onClick={toggleLanguage}
                  className="flex items-center w-full px-4 py-3 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3"
                  >
                    <path d="M5 8l6 6"></path>
                    <path d="M4 14l6-6 2-3"></path>
                    <path d="M2 5h12"></path>
                    <path d="M7 2h1"></path>
                    <path d="M22 22l-5-10-5 10"></path>
                    <path d="M14 18h6"></path>
                  </svg>
                  {language === "zh"
                    ? t("common.switchToEnglish")
                    : t("common.switchToChinese")}
                </button>

                <button
                  onClick={openModelSettings}
                  className="flex items-center w-full px-4 py-3 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3"
                  >
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  {t("common.modelSettings")}
                </button>



                <button
                  onClick={toggleSound}
                  className="flex items-center w-full px-4 py-3 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3"
                  >
                    {soundEnabled ? (
                      <>
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </>
                    ) : (
                      <>
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                      </>
                    )}
                  </svg>
                  {soundEnabled ? t("common.soundOff") : t("common.soundOn")}
                </button>

                <button
                  onClick={resetTour}
                  className="flex items-center w-full px-4 py-3 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polygon points="10,8 16,12 10,16 10,8"></polygon>
                  </svg>
                  {t("common.restartTour")}
                </button>

                <div className="border-t border-[#333333] my-2"></div>

                <button
                  onClick={handleExportData}
                  className="flex items-center w-full px-4 py-3 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  {t("common.exportData")}
                </button>

                <button
                  onClick={handleImportData}
                  className="flex items-center w-full px-4 py-3 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17,8 12,3 7,8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  {t("common.importData")}
                </button>

                <button
                  onClick={handleExportDataToGoogle}
                  className="flex items-center w-full px-4 py-3 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  {t("common.exportDataToGoogle")}
                </button>

                <button
                  onClick={handleImportDataFromGoogle}
                  className="flex items-center w-full px-4 py-3 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-3"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17,8 12,3 7,8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  {t("common.importDataFromGoogle")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 桌面端原有样式
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-tour="settings-button"
        className="w-8 h-8 flex items-center justify-center text-[#f4e8c1] bg-[#1c1c1c] rounded-lg border border-[#333333] shadow-inner transition-all duration-300 hover:bg-[#252525] hover:border-[#444444] hover:text-amber-400 hover:shadow-[0_0_8px_rgba(251,146,60,0.4)]"
        aria-label={t("common.settings")}
        aria-expanded={isOpen}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-[#1c1c1c] border border-[#333333] z-50 overflow-hidden">
          <div className="py-1">
            <button
              onClick={toggleLanguage}
              className="flex items-center w-full px-4 py-2 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M5 8l6 6"></path>
                <path d="M4 14l6-6 2-3"></path>
                <path d="M2 5h12"></path>
                <path d="M7 2h1"></path>
                <path d="M22 22l-5-10-5 10"></path>
                <path d="M14 18h6"></path>
              </svg>
              {language === "zh"
                ? t("common.switchToEnglish")
                : t("common.switchToChinese")}
            </button>

            <button
              onClick={openModelSettings}
              className="flex items-center w-full px-4 py-2 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              {t("common.modelSettings")}
            </button>

            <button
              onClick={handleEditUsername}
              className="flex items-center w-full px-4 py-2 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              用户名设置
            </button>

            <button
              onClick={toggleSound}
              className="flex items-center w-full px-4 py-2 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                {soundEnabled ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                  </>
                )}
              </svg>
              {soundEnabled ? t("common.soundOff") : t("common.soundOn")}
            </button>

            <button
              onClick={resetTour}
              className="flex items-center w-full px-4 py-2 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polygon points="10,8 16,12 10,16 10,8"></polygon>
              </svg>
              {t("common.restartTour")}
            </button>

            <div className="border-t border-[#333333] my-1"></div>

            <button
              onClick={handleExportData}
              className="flex items-center w-full px-4 py-2 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {t("common.exportData")}
            </button>

            <button
              onClick={handleImportData}
              className="flex items-center w-full px-4 py-2 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17,8 12,3 7,8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              {t("common.importData")}
            </button>

            <button
              onClick={handleExportDataToGoogle}
              className="flex items-center w-full px-4 py-2 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              {t("common.exportDataToGoogle")}
            </button>

            <button
              onClick={handleImportDataFromGoogle}
              className="flex items-center w-full px-4 py-2 text-sm text-[#f4e8c1] hover:bg-[#252525] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17,8 12,3 7,8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              {t("common.importDataFromGoogle")}
            </button>
          </div>
        </div>
      )}

      {/* 用户名编辑模态框 */}
      {isEditingUsername && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[#1c1c1c] border border-[#333333] rounded-lg p-6 w-80 max-w-md">
            <h3 className="text-lg font-bold text-amber-400 mb-4 text-center">
              用户名设置
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-sm text-[#c0a480]">当前用户名:</span>
                <span className="text-amber-400 font-medium">{currentUsername}</span>
              </div>
              <div>
                <label className="block text-sm text-[#c0a480] mb-2">
                  新用户名
                </label>
                <input
                  type="text"
                  value={tempUsername}
                  onChange={(e) => setTempUsername(e.target.value)}
                  onKeyPress={handleUsernameKeyPress}
                  className="w-full px-3 py-2 bg-[#2c2c2c] border border-[#333333] rounded-lg text-[#c0a480] focus:border-amber-500/50 focus:outline-none"
                  placeholder="请输入新用户名"
                  autoFocus
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveUsername}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-400 text-black rounded-lg hover:from-amber-400 hover:to-orange-300 transition-all duration-200 text-sm font-medium"
                >
                  保存
                </button>
                <button
                  onClick={handleCancelEditUsername}
                  className="flex-1 px-4 py-2 border border-[#333333] text-[#c0a480] rounded-lg hover:bg-[#333333] transition-colors text-sm"
                >
                  取消
                </button>
              </div>
              {usernameSuccess && (
                <div className="flex items-center space-x-2 text-green-400 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>用户名已更新</span>
                </div>
              )}
              <p className="text-xs text-[#c0a480]/60">
                用户名用于区分不同用户的聊天记录，修改后将影响数据存储分类
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
