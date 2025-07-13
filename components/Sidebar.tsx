"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { isUpdateAvailable, fetchLatestRelease } from "@/utils/version-compare";
import "@/app/styles/fantasy-ui.css";

// Current app version from package.json
const CURRENT_VERSION = "1.1.9";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  openLoginModal: () => void;
}

export default function Sidebar({
  isOpen,
  toggleSidebar,
  openLoginModal,
}: SidebarProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [isHomeOpen, setIsHomeOpen] = useState(true);
  const [isGameOpen, setIsGameOpen] = useState(true);

  const { t, language, fontClass } = useLanguage();
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(true);
  const [updateInfo, setUpdateInfo] = useState<{
    version: string;
    url: string;
  } | null>(null);
  const [hasCheckedUpdate, setHasCheckedUpdate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setAnimationComplete(true), 50);
      return () => clearTimeout(timer);
    } else {
      setAnimationComplete(false);
    }
  }, [isOpen]);

  // Check for updates on component mount
  useEffect(() => {
    const checkForUpdates = async () => {
      if (hasCheckedUpdate) return;

      try {
        const latestRelease = await fetchLatestRelease();
        if (
          latestRelease &&
          isUpdateAvailable(CURRENT_VERSION, latestRelease.version)
        ) {
          setUpdateInfo(latestRelease);
        }
      } catch (error) {
        console.warn("Failed to check for updates:", error);
      } finally {
        setHasCheckedUpdate(true);
      }
    };

    // Delay the check to avoid blocking initial render
    const timer = setTimeout(checkForUpdates, 2000);
    return () => clearTimeout(timer);
  }, [hasCheckedUpdate]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <div
      className={`h-full breathing-bg magic-border text-[#d0d0d0] transition-all duration-300 ease-in-out flex flex-col ${isOpen ? "w-72" : "w-16"} z-50`}
    >
      <div className="flex justify-between items-center h-16 py-3 px-4">
        <div
          className={`logo-magic-container transition-all duration-300 ease-in-out ${isOpen ? "opacity-100 max-w-[200px]" : "opacity-0 max-w-0"}`}
          style={{
            overflow: "hidden",
            transitionDelay: isOpen ? "0ms" : "0ms",
          }}
        >
          <div className="flex items-center h-10">
            <div className={"w-[80px] h-10 flex items-center"}>
              <Image
                src="/logo.png"
                alt="Narratium"
                width={80}
                height={20}
                className="object-contain"
              />
            </div>
            <span
              className={
                "ml-1 text-lg font-cinzel font-bold tracking-wider h-10 flex items-center -translate-x-3"
              }
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              <span
                className={
                  "bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)] font-cinzel"
                }
              >
                Narratium
              </span>
            </span>
          </div>
        </div>
        <button
          onClick={() => {
            toggleSidebar();
            localStorage.setItem("sidebarState", isOpen ? "closed" : "open");
            document.documentElement.style.setProperty(
              "--app-sidebar-width",
              isOpen ? "4rem" : "-1rem",
            );
          }}
          className={
            "flex items-center justify-center text-[#f4e8c1] bg-[#1c1c1c] rounded-lg border border-[#333333] shadow-inner transition-all duration-300 hover:bg-[#252525] hover:border-[#444444] hover:text-amber-400 hover:shadow-[0_0_8px_rgba(251,146,60,0.4)] w-8 h-8"
          }
          aria-label={
            isOpen
              ? language === "zh"
                ? "收起侧边栏"
                : "Collapse Sidebar"
              : language === "zh"
                ? "展开侧边栏"
                : "Expand Sidebar"
          }
        >
          {isOpen ? (
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
              className="transition-transform duration-300"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          ) : (
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
              className="transition-transform duration-300"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          )}
        </button>
      </div>
      <div className="mx-2 my-1 menu-divider"></div>
      <nav className={"mt-3 flex-none px-2"}>
        <ul className="space-y-1">
          <li className="min-h-[10px]">
            <div className="mb-4">
              <div
                className="px-2 py-1 flex justify-between items-center text-xs text-[#8a8a8a] uppercase tracking-wider font-medium text-[10px] transition-all duration-300 ease-in-out overflow-hidden"
                style={{
                  width: isOpen ? "auto" : "0",
                  maxWidth: isOpen ? "100%" : "0",
                  padding: isOpen ? "0.25rem 0.5rem" : "0",
                  opacity: isOpen ? 1 : 0,
                  whiteSpace: "nowrap",
                  transitionDelay: isOpen ? "0ms" : "0ms",
                }}
              >
                <span>{t("sidebar.home")}</span>
                {isOpen && (
                  <button
                    onClick={() => setIsHomeOpen(!isHomeOpen)}
                    className="w-5 h-5 flex items-center justify-center text-[#8a8a8a] hover:text-amber-400 transition-colors duration-300 login-fantasy-bg rounded-sm"
                    aria-label={
                      isHomeOpen
                        ? t("sidebar.collapseHome")
                        : t("sidebar.expandHome")
                    }
                  >
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
                      className={`transition-transform duration-300 ${isHomeOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ${isOpen ? (isHomeOpen ? "max-h-20 opacity-100 mb-1" : "max-h-0 opacity-0 mb-0") : "max-h-20 opacity-100 mb-1"} mx-1`}
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {!isOpen ? (
                    <Link
                      href="/"
                      className={
                        "menu-item flex justify-center p-2 rounded-md cursor-pointer hover:bg-[#252525] transition-all duration-300"
                      }
                    >
                      <div
                        className={
                          "flex items-center justify-center text-[#f4e8c1] bg-[#1c1c1c] rounded-lg border border-[#333333] shadow-inner transition-all duration-300 group-hover:border-[#444444] hover:text-amber-400 hover:border-[#444444] hover:shadow-[0_0_8px_rgba(251,146,60,0.4)] w-8 h-8"
                        }
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
                        >
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      className="focus:outline-none group relative overflow-hidden rounded-md w-full transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center p-2 w-full transition-all duration-300 z-10">
                        <div className="absolute inset-0 w-full h-full bg-[#333] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                        <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#f8d36a] to-transparent w-0 group-hover:w-full transition-all duration-500"></div>
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-[#f4e8c1] bg-[#1c1c1c] rounded-lg border border-[#333333] shadow-inner transition-all duration-300 group-hover:border-[#444444] group-hover:text-amber-400 group-hover:shadow-[0_0_8px_rgba(251,146,60,0.4)]">
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
                          >
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                          </svg>
                        </div>
                        <div
                          className={
                            "ml-2 transition-all duration-300 ease-in-out overflow-hidden"
                          }
                          style={{
                            transitionDelay: isOpen ? "50ms" : "0ms",
                            opacity: isOpen ? 1 : 0,
                          }}
                        >
                          <span
                            className={`magical-text whitespace-nowrap block text-sm group-hover:text-amber-400 transition-colors duration-300 ${fontClass}`}
                          >
                            {isOpen &&
                              t("sidebar.home")
                                .split("")
                                .map((char, index) => (
                                  <span
                                    key={index}
                                    className="inline-block transition-all duration-300"
                                    style={{
                                      opacity: animationComplete ? 1 : 0,
                                      transform: animationComplete
                                        ? "translateY(0)"
                                        : "translateY(8px)",
                                      transitionDelay: `${100 + index * 30}ms`,
                                      width: char === " " ? "0.25em" : "auto",
                                    }}
                                  >
                                    {char}
                                  </span>
                                ))}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </li>

          <li className="min-h-[15px]">
            <div className="mb-4">
              <div
                className="px-2 py-1 flex justify-between items-center text-xs text-[#8a8a8a] uppercase tracking-wider font-medium text-[10px] transition-all duration-300 ease-in-out overflow-hidden"
                style={{
                  width: isOpen ? "auto" : "0",
                  maxWidth: isOpen ? "100%" : "0",
                  padding: isOpen ? "0.25rem 0.5rem" : "0",
                  opacity: isOpen ? 1 : 0,
                  whiteSpace: "nowrap",
                  transitionDelay: isOpen ? "0ms" : "0ms",
                }}
              >
                <span>{t("sidebar.gameArea")}</span>
                {isOpen && (
                  <button
                    onClick={() => setIsGameOpen(!isGameOpen)}
                    className="w-5 h-5 flex items-center justify-center text-[#8a8a8a] hover:text-amber-400 transition-colors duration-300 login-fantasy-bg rounded-sm"
                    aria-label={
                      isGameOpen
                        ? t("sidebar.collapseCreation")
                        : t("sidebar.expandCreation")
                    }
                  >
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
                      className={`transition-transform duration-300 ${isGameOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ${isOpen ? (isGameOpen ? "max-h-20 opacity-100 mt-1" : "max-h-0 opacity-0 mt-0") : "max-h-20 opacity-100 mt-1"} mx-1`}
              >
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {!isOpen ? (
                    <Link
                      href="/character-cards"
                      className={
                        "menu-item flex justify-center p-2 rounded-md cursor-pointer hover:bg-[#252525] transition-all duration-300"
                      }
                    >
                      <div
                        className={
                          "flex items-center justify-center text-[#f4e8c1] bg-[#1c1c1c] rounded-lg border border-[#333333] shadow-inner transition-all duration-300 group-hover:border-[#444444] hover:text-amber-400 hover:border-[#444444] hover:shadow-[0_0_8px_rgba(251,146,60,0.4)] w-8 h-8"
                        }
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
                          className="transition-transform duration-300"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href="/character-cards"
                      className="focus:outline-none group relative overflow-hidden rounded-md w-full transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center p-2 w-full transition-all duration-300 z-10">
                        <div className="absolute inset-0 w-full h-full bg-[#333] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                        <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#f8d36a] to-transparent w-0 group-hover:w-full transition-all duration-500"></div>
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-[#f4e8c1] bg-[#1c1c1c] rounded-lg border border-[#333333] shadow-inner transition-all duration-300 group-hover:border-[#444444] group-hover:text-amber-400 group-hover:shadow-[0_0_8px_rgba(251,146,60,0.4)]">
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
                            className="transition-transform duration-300"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <div
                          className={
                            "ml-2 transition-all duration-300 ease-in-out overflow-hidden"
                          }
                          style={{
                            transitionDelay: isOpen ? "50ms" : "0ms",
                            opacity: isOpen ? 1 : 0,
                          }}
                        >
                          <span
                            className={`magical-text whitespace-nowrap block text-sm group-hover:text-amber-400 transition-colors duration-300 ${fontClass}`}
                          >
                            {isOpen &&
                              t("sidebar.characterCards")
                                .split("")
                                .map((char, index) => (
                                  <span
                                    key={index}
                                    className="inline-block transition-all duration-300"
                                    style={{
                                      opacity: animationComplete ? 1 : 0,
                                      transform: animationComplete
                                        ? "translateY(0)"
                                        : "translateY(8px)",
                                      transitionDelay: `${200 + index * 30}ms`,
                                      width: char === " " ? "0.25em" : "auto",
                                    }}
                                  >
                                    {char}
                                  </span>
                                ))}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </li>
          <li className="min-h-[15px]">
            <div className="mb-4">
              <div
                className="px-2 py-1 flex justify-between items-center text-xs text-[#8a8a8a] uppercase tracking-wider font-medium text-[10px] transition-all duration-300 ease-in-out overflow-hidden"
                style={{
                  width: isOpen ? "auto" : "0",
                  maxWidth: isOpen ? "100%" : "0",
                  padding: isOpen ? "0.25rem 0.5rem" : "0",
                  opacity: isOpen ? 1 : 0,
                  whiteSpace: "nowrap",
                  transitionDelay: isOpen ? "0ms" : "0ms",
                }}
              >
                <span>{t("sidebar.creationArea")}</span>
                {isOpen && (
                  <button
                    onClick={() => setIsCreatorOpen(!isCreatorOpen)}
                    className="w-5 h-5 flex items-center justify-center text-[#8a8a8a] hover:text-amber-400 transition-colors duration-300 login-fantasy-bg rounded-sm"
                    aria-label={
                      isCreatorOpen
                        ? t("sidebar.collapseCreation")
                        : t("sidebar.expandCreation")
                    }
                  >
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
                      className={`transition-transform duration-300 ${isCreatorOpen ? "rotate-180" : ""}`}
                    >
                      <path d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ${isOpen ? (isCreatorOpen ? "max-h-20 opacity-100 mt-1" : "max-h-0 opacity-0 mt-0") : "max-h-20 opacity-100 mt-1"} mx-1`}
              >
                <div className="relative group mt-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {!isOpen ? (
                    <Link
                      href="/api-setting"
                      className={
                        "menu-item flex justify-center p-2 rounded-md cursor-pointer hover:bg-[#252525] transition-all duration-300"
                      }
                    >
                      <div
                        className={
                          "flex items-center justify-center text-[#f4e8c1] bg-[#1c1c1c] rounded-lg border border-[#333333] shadow-inner transition-all duration-300 group-hover:border-[#444444] hover:text-amber-400 hover:border-[#444444] hover:shadow-[0_0_8px_rgba(251,146,60,0.4)] w-8 h-8"
                        }
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
                          className="transition-transform duration-300"
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href="/api-setting"
                      className="focus:outline-none group relative overflow-hidden rounded-md w-full transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative flex items-center p-2 w-full transition-all duration-300 z-10">
                        <div className="absolute inset-0 w-full h-full bg-[#333] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                        <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#f8d36a] to-transparent w-0 group-hover:w-full transition-all duration-500"></div>
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-[#f4e8c1] bg-[#1c1c1c] rounded-lg border border-[#333333] shadow-inner transition-all duration-300 group-hover:border-[#444444] group-hover:text-amber-400 group-hover:shadow-[0_0_8px_rgba(251,146,60,0.4)]">
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
                            className="transition-transform duration-300"
                          >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                        </div>
                        <div
                          className={
                            "ml-2 transition-all duration-300 ease-in-out overflow-hidden"
                          }
                          style={{
                            transitionDelay: isOpen ? "50ms" : "0ms",
                            opacity: isOpen ? 1 : 0,
                          }}
                        >
                          <span
                            className={`magical-text whitespace-nowrap block text-sm group-hover:text-amber-400 transition-colors duration-300 ${fontClass}`}
                          >
                            {isOpen &&
                              t("sidebar.apiSetting")
                                .split("")
                                .map((char, index) => (
                                  <span
                                    key={index}
                                    className="inline-block transition-all duration-300"
                                    style={{
                                      opacity: animationComplete ? 1 : 0,
                                      transform: animationComplete
                                        ? "translateY(0)"
                                        : "translateY(8px)",
                                      transitionDelay: `${200 + index * 30}ms`,
                                      width: char === " " ? "0.25em" : "auto",
                                    }}
                                  >
                                    {char}
                                  </span>
                                ))}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </li>
        </ul>
      </nav>
      <div className="relative mt-auto pt-4 px-2 mb-3 transition-all duration-300 overflow-hidden group/footer">
        <div className="absolute top-0 left-0 right-0 h-[0.5px] bg-gradient-to-r from-transparent via-[#f8d36a] to-transparent opacity-70"></div>
        <div className="absolute top-0 left-0 right-0 h-[0.5px] bg-gradient-to-r from-transparent via-[#f8d36a] to-transparent opacity-40 blur-[1px] translate-y-[0.5px]"></div>
        <div className="absolute top-0 left-1/4 right-1/4 h-[0.5px] bg-[#f8d36a] opacity-20 blur-[2px] translate-y-[1px]"></div>

        <div
          className="absolute top-[-1px] w-8 h-[2px] bg-gradient-to-r from-transparent via-[#ffd76a] to-transparent opacity-0 group-hover/footer:opacity-80 blur-[1px] transition-all duration-500 ease-in-out"
          style={{
            left: "-10%",
            animation: "moveRight 3s ease-in-out infinite",
          }}
        ></div>

        <div className="absolute top-0 left-1/4 h-[2px] w-[2px] rounded-full bg-[#ffd76a] opacity-0 group-hover/footer:opacity-90 transition-opacity duration-500 delay-100"></div>
        <div className="absolute top-0 left-2/4 h-[2px] w-[2px] rounded-full bg-[#ffd76a] opacity-0 group-hover/footer:opacity-90 transition-opacity duration-500 delay-300"></div>
        <div className="absolute top-0 left-3/4 h-[2px] w-[2px] rounded-full bg-[#ffd76a] opacity-0 group-hover/footer:opacity-90 transition-opacity duration-500 delay-500"></div>

        <style jsx>{`
          @keyframes moveRight {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(100vw));
            }
          }
        `}</style>

        <div className="mb-2">
          {!isAuthenticated ? (
            <button
              onClick={openLoginModal}
              data-tour="login-button"
              className={`focus:outline-none group relative overflow-hidden rounded-md w-full transition-all duration-300 ${!isOpen ? "p-2 flex justify-center" : "py-1.5 px-2 flex items-center justify-center"} cursor-pointer`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#242424]/0 to-[#1a1a1a]/0 opacity-0 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center w-full transition-all duration-300 z-10">
                <div
                  className={`${isOpen ? "w-6 h-6" : "w-8 h-8"} flex items-center justify-center flex-shrink-0 text-[#f8d36a] group-hover:text-[#ffc107] transition-colors duration-300`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={isOpen ? "14" : "16"}
                    height={isOpen ? "14" : "16"}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-300 group-hover:scale-110"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                </div>
                {isOpen && (
                  <div
                    className="ml-2 transition-all duration-300 ease-in-out overflow-hidden"
                    style={{
                      transitionDelay: isOpen ? "50ms" : "0ms",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <span
                      className={`magical-text whitespace-nowrap block text-xs font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#f8d36a] to-[#ffc107] ${fontClass}`}
                    >
                      {isOpen &&
                        t("sidebar.nologin")
                          .split("")
                          .map((char, index) => (
                            <span
                              key={index}
                              className="inline-block transition-all duration-300"
                              style={{
                                opacity: animationComplete ? 1 : 0,
                                transform: animationComplete
                                  ? "translateY(0)"
                                  : "translateY(8px)",
                                transitionDelay: `${250 + index * 30}ms`,
                                width: char === " " ? "0.25em" : "auto",
                              }}
                            >
                              {char}
                            </span>
                          ))}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 w-full h-full bg-[#333] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#f8d36a] to-transparent w-0 group-hover:w-full transition-all duration-500"></div>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className={`focus:outline-none group relative overflow-hidden rounded-md w-full transition-all duration-300 ${!isOpen ? "p-2 flex justify-center" : "py-1.5 px-2 flex items-center justify-center"} cursor-pointer`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#242424]/0 to-[#1a1a1a]/0 opacity-0 group-hover:opacity-80 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center w-full transition-all duration-300 z-10">
                <div
                  className={`${isOpen ? "w-6 h-6" : "w-8 h-8"} flex items-center justify-center flex-shrink-0 text-[#f8d36a] group-hover:text-[#ffc107] transition-colors duration-300 `}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={isOpen ? "14" : "16"}
                    height={isOpen ? "14" : "16"}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-300 group-hover:scale-110"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                {isOpen && (
                  <div
                    className="ml-2 transition-all duration-300 ease-in-out overflow-hidden"
                    style={{
                      transitionDelay: isOpen ? "50ms" : "0ms",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div>
                      <span
                        className={`magical-text whitespace-nowrap block text-xs font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#f8d36a] to-[#ffc107] ${fontClass}`}
                      >
                        {isOpen &&
                          (localStorage.getItem('username') || user?.email || '').split("").map((char: string, index: number) => (
                            <span
                              key={index}
                              className="inline-block transition-all duration-300"
                              style={{
                                opacity: animationComplete ? 1 : 0,
                                transform: animationComplete
                                  ? "translateY(0)"
                                  : "translateY(8px)",
                                transitionDelay: `${250 + index * 30}ms`,
                                width: char === " " ? "0.25em" : "auto",
                              }}
                            >
                              {char}
                            </span>
                          ))}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span
                        className={`magical-text whitespace-nowrap block text-xs font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#f8d36a] to-[#ffc107] ${fontClass}`}
                      >
                        {isOpen &&
                          t("sidebar.logout")
                            .split("")
                            .map((char, index) => (
                              <span
                                key={index}
                                className="inline-block transition-all duration-300"
                                style={{
                                  opacity: animationComplete ? 1 : 0,
                                  transform: animationComplete
                                    ? "translateY(0)"
                                    : "translateY(8px)",
                                  transitionDelay: `${250 + index * 30}ms`,
                                  width: char === " " ? "0.25em" : "auto",
                                }}
                              >
                                {char}
                              </span>
                            ))}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 w-full h-full bg-[#333] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#f8d36a] to-transparent w-0 group-hover:w-full transition-all duration-500"></div>
            </button>
          )}
        </div>

        {/* Update notification */}
        {updateInfo && (
          <div className="mt-2">
            <a
              href={updateInfo.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`focus:outline-none group relative overflow-hidden rounded-md w-full transition-all duration-300 ${!isOpen ? "p-2 flex justify-center" : "py-1.5 px-2 flex items-center justify-center"}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
              <div className="absolute inset-0 w-full h-full bg-[#333] opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-0" />
              <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-green-400 to-transparent w-0 group-hover:w-full transition-all duration-500 z-5" />
              <div className="relative flex items-center justify-center transition-all duration-300 z-10">
                <div
                  className={`${isOpen ? "w-6 h-6" : "w-8 h-8"} flex items-center justify-center flex-shrink-0 text-green-400 group-hover:text-green-300 transition-colors duration-300`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={isOpen ? "14" : "16"}
                    height={isOpen ? "14" : "16"}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-300 group-hover:scale-110"
                  >
                    <path d="M21 12c0 1-.6 1.8-1.5 2.1l-.3.1c-.3.1-.6.4-.6.8 0 .3.1.6.3.8l.3.3c.6.6 1 1.4 1 2.2s-.4 1.6-1 2.2c-.6.6-1.4 1-2.2 1s-1.6-.4-2.2-1l-.3-.3c-.2-.2-.5-.3-.8-.3-.4 0-.7.3-.8.6l-.1.3C12.8 20.4 12 21 11 21s-1.8-.6-2.1-1.5l-.1-.3c-.1-.3-.4-.6-.8-.6-.3 0-.6.1-.8.3l-.3.3c-.6.6-1.4 1-2.2 1s-1.6-.4-2.2-1c-.6-.6-1-1.4-1-2.2s.4-1.6 1-2.2l.3-.3c.2-.2.3-.5.3-.8 0-.4-.3-.7-.6-.8l-.3-.1C3.6 13.8 3 13 3 12s.6-1.8 1.5-2.1l.3-.1c.3-.1.6-.4.6-.8 0-.3-.1-.6-.3-.8l-.3-.3C4.2 7.3 3.8 6.5 3.8 5.7s.4-1.6 1-2.2c.6-.6 1.4-1 2.2-1s1.6.4 2.2 1l.3.3c.2.2.5.3.8.3.4 0 .7-.3.8-.6l.1-.3C11.2 3.6 12 3 13 3s1.8.6 2.1 1.5l.1.3c.1.3.4.6.8.6.3 0 .6-.1.8-.3l.3-.3c.6-.6 1.4-1 2.2-1s1.6.4 2.2 1c.6.6 1 1.4 1 2.2s-.4 1.6-1 2.2l-.3.3c-.2.2-.3.5-.3.8 0 .4.3.7.6.8l.3.1c.9.3 1.5 1.1 1.5 2.1z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                {isOpen && (
                  <div
                    className="ml-2 transition-all duration-300 ease-in-out overflow-hidden"
                    style={{
                      transitionDelay: isOpen ? "50ms" : "0ms",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <span
                      className={`magical-text whitespace-nowrap block text-xs font-medium text-green-400 group-hover:text-green-300 transition-colors duration-300 ${fontClass}`}
                    >
                      {isOpen &&
                        t("sidebar.goToUpdate")
                          .split("")
                          .map((char, index) => (
                            <span
                              key={index}
                              className="inline-block transition-all duration-300"
                              style={{
                                opacity: animationComplete ? 1 : 0,
                                transform: animationComplete
                                  ? "translateY(0)"
                                  : "translateY(8px)",
                                transitionDelay: `${250 + index * 30}ms`,
                                width: char === " " ? "0.25em" : "auto",
                              }}
                            >
                              {char}
                            </span>
                          ))}
                    </span>
                  </div>
                )}
              </div>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
