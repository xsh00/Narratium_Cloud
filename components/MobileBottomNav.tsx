/**
 * Mobile Bottom Navigation Component
 *
 * This component provides a mobile-specific bottom navigation bar with the following features:
 * - Responsive mobile navigation interface
 * - Home, character cards, creator, and login/logout navigation
 * - User authentication state management
 * - Smooth transitions and hover effects
 * - Safe area handling for devices with home indicators
 *
 * The component handles:
 * - Mobile device detection and responsive behavior
 * - User authentication state from localStorage
 * - Navigation routing and active state management
 * - Logout functionality and state clearing
 * - Responsive design adaptation
 *
 * Dependencies:
 * - useLanguage: For internationalization
 * - useRouter, usePathname: For navigation
 * - fantasy-ui.css: For styling
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/app/i18n";
import { useAuth } from "@/contexts/AuthContext";
import "@/app/styles/fantasy-ui.css";

/**
 * Interface definitions for the component's props
 */
interface MobileBottomNavProps {
  openLoginModal: () => void;
}

/**
 * Mobile bottom navigation component
 *
 * Provides a mobile-specific navigation interface with:
 * - Bottom navigation bar with key app sections
 * - User authentication state management
 * - Responsive design with safe area handling
 * - Smooth animations and transitions
 *
 * @param {MobileBottomNavProps} props - Component props
 * @returns {JSX.Element | null} The mobile bottom navigation or null on desktop
 */
export default function MobileBottomNav({
  openLoginModal,
}: MobileBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { t, fontClass } = useLanguage();

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkIfMobile();

    window.addEventListener("resize", checkIfMobile);

    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background with blur effect */}
      <div className={`absolute inset-0 bg-[#1a1714]/95 backdrop-blur-md border-t border-[#534741]/50 transition-all duration-300 ${
        isCollapsed ? "h-8" : "h-auto"
      }`}></div>

      {/* 折叠按钮 */}
      <div className="relative flex justify-center">
        <button
          onClick={toggleCollapse}
          className="relative group -top-1 px-3 py-1 rounded-t-lg bg-[#1a1714]/95 backdrop-blur-md border border-[#534741]/50 border-b-0 hover:border-[#666]/70 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-lg"></div>
          <div className="relative z-5 text-[#a18d6f] group-hover:text-amber-300 transition-all duration-300 flex items-center justify-center cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
            >
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent group-hover:w-3/4 transition-all duration-500"></div>
        </button>
      </div>

      {/* Navigation items */}
      <div className={`relative flex items-center justify-around px-1 transition-all duration-300 ${
        isCollapsed ? "py-1 opacity-0 max-h-0 overflow-hidden" : "py-2 opacity-100"
      }`}>
        {/* Home */}
        <Link
          href="/character-cards"
          className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-300 ${
            isActive("/") || isActive("/character-cards")
              ? "text-[#f8d36a] bg-[#2a231c]/50"
              : "text-[#a18d6f] hover:text-[#f8d36a] hover:bg-[#2a231c]/30"
          }`}
        >
          <div className="w-4 h-4 flex items-center justify-center mb-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className={`text-[7px] ${fontClass}`}>{t("sidebar.characterCards")}</span>
        </Link>

        {/* API Setting */}
        <Link
          href="/api-setting"
          className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-300 ${
            isActive("/api-setting")
              ? "text-[#f8d36a] bg-[#2a231c]/50"
              : "text-[#a18d6f] hover:text-[#f8d36a] hover:bg-[#2a231c]/30"
          }`}
        >
          <div className="w-4 h-4 flex items-center justify-center mb-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <span className={`text-[7px] ${fontClass}`}>
            {t("sidebar.apiSetting")}
          </span>
        </Link>

        {/* Character Creator - 角色创作入口 */}
        <Link
          href="/creator-area"
          className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-300 ${
            isActive("/creator-area")
              ? "text-[#f8d36a] bg-[#2a231c]/50"
              : "text-[#a18d6f] hover:text-[#f8d36a] hover:bg-[#2a231c]/30"
          }`}
        >
          <div className="w-4 h-4 flex items-center justify-center mb-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
          </div>
          <span className={`text-[7px] ${fontClass}`}>
            {t("sidebar.creatorStudio")}
          </span>
        </Link>

        {/* 社区发帖 - 移到倒数第二位 */}
        <Link
          href="/social-feed"
          className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-300 ${
            isActive("/social-feed")
              ? "text-[#f8d36a] bg-[#2a231c]/50"
              : "text-[#a18d6f] hover:text-[#f8d36a] hover:bg-[#2a231c]/30"
          }`}
        >
          <div className="w-4 h-4 flex items-center justify-center mb-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <span className={`text-[7px] ${fontClass}`}>
            {t("sidebar.socialFeed")}
          </span>
        </Link>

        {/* 个人中心 - User Profile */}
        <Link
          href="/profile"
          className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-300 ${
            isActive("/profile")
              ? "text-[#f8d36a] bg-[#2a231c]/50"
              : "text-[#a18d6f] hover:text-[#f8d36a] hover:bg-[#2a231c]/30"
          }`}
        >
          <div className="w-4 h-4 flex items-center justify-center mb-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <span className={`text-[7px] ${fontClass}`}>
            {t("profile.title")}
          </span>
        </Link>
      </div>

      {/* Bottom safe area for devices with home indicator */}
      <div className={`bg-[#1a1714]/95 mobile-bottom-nav transition-all duration-300 ${
        isCollapsed ? "h-2" : "h-safe-area-inset-bottom"
      }`}></div>
    </div>
  );
}
