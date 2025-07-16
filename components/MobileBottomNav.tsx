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
          href="/"
          className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-300 ${
            isActive("/")
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
          <span className={`text-[7px] ${fontClass}`}>{t("sidebar.home")}</span>
        </Link>

        {/* Character Cards */}
        <Link
          href="/character-cards"
          className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-300 ${
            isActive("/character-cards")
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <span className={`text-[7px] ${fontClass}`}>
            {t("sidebar.characterCards")}
          </span>
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

        {/* Login/User */}
        <button
          onClick={isAuthenticated ? handleLogout : openLoginModal}
          className={`flex flex-col items-center justify-center p-1 rounded-lg transition-all duration-300 ${
            isAuthenticated
              ? "text-[#f8d36a] hover:bg-[#2a231c]/30"
              : "text-[#a18d6f] hover:text-[#f8d36a] hover:bg-[#2a231c]/30"
          }`}
        >
          <div className="w-4 h-4 flex items-center justify-center mb-0.5">
            {isAuthenticated ? (
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
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            ) : (
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
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            )}
          </div>
          <span className={`text-[7px] ${fontClass}`}>
            {isAuthenticated ? t("sidebar.logout") : t("sidebar.nologin")}
          </span>
        </button>
      </div>

      {/* Bottom safe area for devices with home indicator */}
      <div className={`bg-[#1a1714]/95 mobile-bottom-nav transition-all duration-300 ${
        isCollapsed ? "h-2" : "h-safe-area-inset-bottom"
      }`}></div>
    </div>
  );
}
