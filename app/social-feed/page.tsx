"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/i18n";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/MainLayout";
import SocialFeedContent from "@/components/SocialFeedContent";

/**
 * 社交发帖页面组件
 * 此页面允许用户查看和创建帖子
 */
export default function SocialFeedPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 页面加载效果
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // 使用特定的MainLayout props，禁用底部导航栏，防止重叠
  return (
    <MainLayout hideBottomNav={true} hideSettings={true}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-[#f4e8c1] text-center">
          {t("socialFeed.title")}
        </h1>
        <p className="text-center mb-8 text-[#a18d6f]">
          {t("socialFeed.subtitle")}
        </p>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : (
          <SocialFeedContent />
        )}
      </div>
    </MainLayout>
  );
} 