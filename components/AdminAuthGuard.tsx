"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AdminAuthGuardProps {
  children: React.ReactNode;
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 检查管理员是否已认证
    const adminAuthenticated = localStorage.getItem("adminAuthenticated");
    
    if (adminAuthenticated === "true") {
      setIsAuthenticated(true);
    } else {
      // 重定向到登录页面
      router.push("/admin/posts/login");
    }
    
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin h-12 w-12 border-4 border-amber-500 border-t-transparent rounded-full"></div>
          <p className="mt-4 text-amber-500">正在验证身份...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // 显示空内容，等待重定向
    return null;
  }

  // 已认证，显示子组件
  return <>{children}</>;
} 