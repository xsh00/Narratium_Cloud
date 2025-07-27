"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { motion } from "framer-motion";

// 管理功能项类型定义
interface AdminFeature {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
}

/**
 * 管理后台首页
 */
export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // 管理功能列表
  const adminFeatures: AdminFeature[] = [
    {
      id: "posts",
      title: "帖子管理",
      description: "查看、审核和管理用户发布的帖子",
      path: "/admin/posts",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
        </svg>
      )
    },
    {
      id: "customanage",
      title: "角色卡定制管理",
      description: "管理用户提交的角色卡定制请求",
      path: "/admin/customanage",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        </svg>
      )
    },
    {
      id: "codemanage",
      title: "积分兑换码管理",
      description: "创建、导入和管理积分兑换码",
      path: "/admin/codemanage",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
      )
    },
    {
      id: "database",
      title: "数据库管理",
      description: "查看数据库状态和统计信息",
      path: "/admin/database",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>
      )
    },
    {
      id: "email-pool",
      title: "邮箱池管理",
      description: "管理系统使用的邮箱池配置",
      path: "/admin/email-pool",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      )
    }
  ];

  // 验证管理员身份
  const handleLogin = async () => {
    if (!username || !password) {
      setLoginError("请输入用户名和密码");
      return;
    }
    
    setAuthLoading(true);
    setLoginError("");
    
    try {
      // 使用硬编码的管理员凭据进行验证
      if (username === "admin" && password === "0107151457nk") {
        // 保存身份验证信息到 localStorage
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("adminUsername", username);
        setIsAuthenticated(true);
      } else {
        setLoginError("用户名或密码不正确");
      }
    } catch (error) {
      console.error("验证失败:", error);
      setLoginError("验证失败，请重试");
    } finally {
      setAuthLoading(false);
    }
  };
  
  // 检查是否已登录
  useEffect(() => {
    const authenticated = localStorage.getItem("adminAuthenticated") === "true";
    setIsAuthenticated(authenticated);
  }, []);

  // 未登录时显示登录界面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#1c1c1c]/60 backdrop-blur-sm border border-amber-500/20 rounded-xl p-6 shadow-[0_0_20px_rgba(251,146,60,0.2)]">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-amber-400">管理员登录</h1>
            <p className="text-[#a18d6f] mt-2">请输入管理员账户和密码</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#c0a480] mb-2">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none"
                placeholder="输入用户名"
              />
            </div>
            
            <div>
              <label className="block text-sm text-[#c0a480] mb-2">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none"
                placeholder="输入密码"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            {loginError && (
              <div className="text-red-400 text-sm px-3 py-2 rounded bg-red-500/10">
                {loginError}
              </div>
            )}
            
            <div>
              <button
                onClick={handleLogin}
                disabled={authLoading}
                className={`w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-amber-500/80 to-orange-400/80 text-black rounded-lg hover:from-amber-400 hover:to-orange-300 transition-all duration-200 ${authLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {authLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登录中...
                  </>
                ) : "登录"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="管理后台">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature, index) => (
          <motion.div
            key={feature.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link href={feature.path} className="block h-full">
              <div className="bg-[#1c1c1c]/60 border border-[#333]/40 rounded-lg p-5 h-full hover:border-amber-500/30 hover:shadow-[0_0_15px_rgba(251,146,60,0.15)] transition-all duration-300">
                <div className="flex items-start">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center mr-4 text-amber-400">
                    {feature.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-amber-400 mb-2">
                      {feature.title}
                    </h2>
                    <p className="text-sm text-[#a18d6f]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </AdminLayout>
  );
} 