"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/i18n";
import Image from "next/image";

export default function AdminLogin() {
  const { t } = useLanguage();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 简单验证硬编码的管理员账号密码
      if (username === "admin" && password === "0107151457nk") {
        // 存储管理员会话信息
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("adminUsername", username);
        
        // 重定向到管理首页
        router.push("/admin/dashboard");
      } else {
        setError("用户名或密码错误");
      }
    } catch (err) {
      console.error("登录失败:", err);
      setError("登录失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col justify-center items-center p-4">
      <div className="mb-8">
        <Image src="/logo.png" alt="Logo" width={150} height={50} />
      </div>
      
      <div className="w-full max-w-md p-6 bg-[#1c1c1c] rounded-lg border border-[#333] shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-[#f4e8c1] text-center">管理员登录</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 text-red-200 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[#a18d6f] text-sm mb-2" htmlFor="username">
              用户名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-[#252525] text-[#e0e0e0] border border-[#444] rounded-md focus:outline-none focus:border-amber-500 transition"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-[#a18d6f] text-sm mb-2" htmlFor="password">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-[#252525] text-[#e0e0e0] border border-[#444] rounded-md focus:outline-none focus:border-amber-500 transition"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-md ${
              isLoading ? "bg-[#444] text-[#aaa] cursor-not-allowed" : "bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400"
            } transition`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                正在登录...
              </div>
            ) : (
              "登录"
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 