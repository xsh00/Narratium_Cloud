"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/app/i18n";
import { PresetInitializer } from "@/lib/core/preset-initializer";
import { DEFAULT_PRESET_CONFIGS } from "@/lib/config/preset-characters";
import { toast } from "react-hot-toast";

export default function PresetManagementPage() {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [initializationStatus, setInitializationStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const status = PresetInitializer.getInitializationStatus();
    setInitializationStatus(status);
  }, []);

  const handleInitializePresets = async () => {
    setIsLoading(true);
    try {
      await PresetInitializer.initializePresets();
      const newStatus = PresetInitializer.getInitializationStatus();
      setInitializationStatus(newStatus);
      toast.success("预设初始化成功！");
    } catch (error) {
      console.error("预设初始化失败:", error);
      toast.error("预设初始化失败，请检查控制台错误信息");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetInitialization = () => {
    PresetInitializer.resetInitialization();
    const newStatus = PresetInitializer.getInitializationStatus();
    setInitializationStatus(newStatus);
    toast.success("预设初始化状态已重置");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#171717] via-[#1a1816] to-[#171717] p-4">
      <div className="max-w-4xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1
            className={`text-3xl font-bold text-[#eae6db] ${serifFontClass} bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 bg-clip-text text-transparent mb-2`}
          >
            预设管理系统
          </h1>
          <p className="text-[#a18d6f] text-lg">管理角色对话的预设JSON文件</p>
        </div>

        {/* 初始化状态 */}
        <div className="bg-gradient-to-br from-[#1a1816]/95 via-[#252220]/95 to-[#1a1816]/95 backdrop-blur-xl border border-[#534741]/60 rounded-xl p-6 mb-6">
          <h2
            className={`text-xl font-semibold text-[#eae6db] ${serifFontClass} mb-4`}
          >
            预设初始化状态
          </h2>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${initializationStatus?.initialized ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <span className="text-[#eae6db]">
                初始化状态:{" "}
                {initializationStatus?.initialized ? "已完成" : "未完成"}
              </span>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleInitializePresets}
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 text-white rounded-lg hover:from-amber-500 hover:to-amber-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "初始化中..." : "初始化预设"}
              </button>

              <button
                onClick={handleResetInitialization}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-400 transition-all duration-300"
              >
                重置初始化状态
              </button>
            </div>
          </div>
        </div>

        {/* 预设配置列表 */}
        <div className="bg-gradient-to-br from-[#1a1816]/95 via-[#252220]/95 to-[#1a1816]/95 backdrop-blur-xl border border-[#534741]/60 rounded-xl p-6">
          <h2
            className={`text-xl font-semibold text-[#eae6db] ${serifFontClass} mb-4`}
          >
            预设配置列表
          </h2>

          <div className="grid gap-4">
            {DEFAULT_PRESET_CONFIGS.map((config, index) => (
              <div
                key={config.name}
                className="bg-gradient-to-br from-[#252220]/80 via-[#1a1816]/60 to-[#252220]/80 backdrop-blur-sm border border-[#534741]/40 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-semibold text-[#eae6db] ${fontClass} mb-2`}
                    >
                      {config.displayName.zh}
                    </h3>
                    <p className="text-[#a18d6f] text-sm mb-2">
                      {config.description.zh}
                    </p>
                    <div className="space-y-1 text-xs text-[#8a7c6f]">
                      <div>文件名: {config.filename}</div>
                      <div>自动导入: {config.autoImport ? "是" : "否"}</div>
                      <div>默认启用: {config.enabled ? "是" : "否"}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {config.enabled && (
                      <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded">
                        默认启用
                      </span>
                    )}
                    {config.autoImport && (
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded">
                        自动导入
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="bg-gradient-to-br from-[#1a1816]/95 via-[#252220]/95 to-[#1a1816]/95 backdrop-blur-xl border border-[#534741]/60 rounded-xl p-6 mt-6">
          <h2
            className={`text-xl font-semibold text-[#eae6db] ${serifFontClass} mb-4`}
          >
            使用说明
          </h2>

          <div className="space-y-4 text-[#a18d6f]">
            <div>
              <h3 className="text-[#eae6db] font-semibold mb-2">
                1. 预设文件位置
              </h3>
              <p className="text-sm">
                预设JSON文件应放置在{" "}
                <code className="bg-[#333]/50 px-2 py-1 rounded">
                  public/presets/
                </code>{" "}
                目录下
              </p>
            </div>

            <div>
              <h3 className="text-[#eae6db] font-semibold mb-2">2. 自动导入</h3>
              <p className="text-sm">
                用户首次访问应用时，系统会自动导入配置为{" "}
                <code className="bg-[#333]/50 px-2 py-1 rounded">
                  autoImport: true
                </code>{" "}
                的预设文件
              </p>
            </div>

            <div>
              <h3 className="text-[#eae6db] font-semibold mb-2">
                3. 手动初始化
              </h3>
              <p className="text-sm">
                点击"初始化预设"按钮可以手动触发预设导入过程
              </p>
            </div>

            <div>
              <h3 className="text-[#eae6db] font-semibold mb-2">4. 重置状态</h3>
              <p className="text-sm">
                点击"重置初始化状态"可以清除初始化标记，允许重新导入预设
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
