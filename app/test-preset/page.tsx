"use client";

import React, { useState, useEffect } from "react";
import { PresetInitializer } from "@/lib/core/preset-initializer";
import { DEFAULT_PRESET_CONFIGS } from "@/lib/config/preset-characters";

export default function TestPresetPage() {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const currentStatus = PresetInitializer.getInitializationStatus();
    setStatus(currentStatus);
  }, []);

  const handleTestInitialization = async () => {
    setIsLoading(true);
    try {
      await PresetInitializer.initializePresets();
      const newStatus = PresetInitializer.getInitializationStatus();
      setStatus(newStatus);
      alert("预设初始化测试完成！");
    } catch (error) {
      console.error("预设初始化测试失败:", error);
      alert("预设初始化测试失败，请查看控制台错误信息");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    PresetInitializer.resetInitialization();
    const newStatus = PresetInitializer.getInitializationStatus();
    setStatus(newStatus);
    alert("预设初始化状态已重置");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#171717] via-[#1a1816] to-[#171717] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">预设功能测试页面</h1>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">初始化状态</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div
                className={`w-4 h-4 rounded-full ${status?.initialized ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <span className="text-white">
                状态: {status?.initialized ? "已初始化" : "未初始化"}
              </span>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleTestInitialization}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
              >
                {isLoading ? "测试中..." : "测试预设初始化"}
              </button>

              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
              >
                重置状态
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">预设配置</h2>
          <div className="space-y-4">
            {DEFAULT_PRESET_CONFIGS.map((config, index) => (
              <div key={config.name} className="bg-white/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {config.displayName.zh}
                </h3>
                <p className="text-gray-300 text-sm mb-2">
                  {config.description.zh}
                </p>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>文件名: {config.filename}</div>
                  <div>自动导入: {config.autoImport ? "是" : "否"}</div>
                  <div>默认启用: {config.enabled ? "是" : "否"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
