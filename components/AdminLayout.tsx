"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminUsername");
    router.push("/admin/posts/login");
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-[#1c1c1c] border-b border-[#333] py-3 px-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/admin/posts" className="flex items-center">
            <Image src="/logo.png" alt="Logo" width={100} height={30} className="mr-2" />
            <span className="text-[#f4e8c1] font-bold text-lg">管理后台</span>
          </Link>
        </div>
        
        <div className="flex items-center">
          <span className="text-[#a18d6f] mr-4">
            管理员: {typeof window !== 'undefined' && localStorage.getItem("adminUsername")}
          </span>
          <button
            onClick={handleLogout}
            className="px-4 py-1.5 rounded bg-red-900/30 hover:bg-red-800/40 text-red-200 transition"
          >
            退出登录
          </button>
          
          {/* 移动端菜单按钮 */}
          <button 
            className="ml-4 text-[#a18d6f] md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMenuOpen ? (
                <> {/* X 图标 */}
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                <> {/* 汉堡菜单 */}
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* 侧边导航 */}
        <aside className={`
          bg-[#1a1a1a] w-64 border-r border-[#333] 
          md:relative md:block 
          fixed left-0 top-16 bottom-0 z-30 
          transition-all duration-300
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/admin/posts"
                  className="block py-2 px-4 rounded hover:bg-[#252525] text-[#a18d6f] hover:text-[#f4e8c1] transition-colors"
                >
                  帖子管理
                </Link>
              </li>
              <li>
                <Link 
                  href="/social-feed"
                  target="_blank"
                  className="block py-2 px-4 rounded hover:bg-[#252525] text-[#a18d6f] hover:text-[#f4e8c1] transition-colors"
                >
                  查看前台
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6 text-[#f4e8c1]">{title}</h1>
            {children}
          </div>
        </main>
      </div>

      {/* 移动端菜单背景遮罩 */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </div>
  );
} 