"use client";

import React, { useEffect } from "react";

/**
 * 默认配置初始化组件
 * 在客户端自动初始化默认的API配置
 */
export default function DefaultConfigInitializer() {
  useEffect(() => {
    // 在客户端初始化默认API配置
    initializeDefaultConfig();
  }, []);

  return null;
}

/**
 * 初始化默认API配置
 */
function initializeDefaultConfig(): void {
  if (typeof window === "undefined") return;

  try {
    // 检查是否已经有API配置
    const savedConfigsStr = localStorage.getItem("apiConfigs");
    let existingConfigs: any[] = [];

    if (savedConfigsStr) {
      try {
        existingConfigs = JSON.parse(savedConfigsStr);
      } catch (e) {
        console.error("Error parsing saved API configs", e);
      }
    }

    // 如果没有配置，创建默认配置
    // 或者如果现有配置的模型不是gemini-2.5-pro，也更新它
    if (existingConfigs.length === 0 || 
        (existingConfigs.length === 1 && existingConfigs[0].model !== "gemini-2.5-pro")) {
      const defaultConfig = {
        id: `api_${Date.now()}`,
        name: "【1】默认API配置",
        type: "openai" as const,
        baseUrl: "https://api.sillytarven.top/v1",
        model: "gemini-2.5-pro",
        apiKey: "sk-terxMbHAT7lEAKZIs7UDFp_FvScR_3p9hzwJREjgbWM9IgeN",
      };

      // 保存默认配置
      localStorage.setItem("apiConfigs", JSON.stringify([defaultConfig]));
      localStorage.setItem("activeConfigId", defaultConfig.id);
      
      // 设置相关的localStorage项
      localStorage.setItem("llmType", defaultConfig.type);
      localStorage.setItem("openaiBaseUrl", defaultConfig.baseUrl);
      localStorage.setItem("openaiModel", defaultConfig.model);
      localStorage.setItem("modelName", defaultConfig.model);
      localStorage.setItem("modelBaseUrl", defaultConfig.baseUrl);
      localStorage.setItem("openaiApiKey", defaultConfig.apiKey);
      localStorage.setItem("apiKey", defaultConfig.apiKey);

      console.log("Default API configuration initialized");
    }
  } catch (error) {
    console.error("Error initializing default API configuration:", error);
  }
} 