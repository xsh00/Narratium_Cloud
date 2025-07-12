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

    // 检查是否需要强制更新配置（如果只有一组配置且使用旧的API Key）
    const needsUpdate = existingConfigs.length === 1 && 
      existingConfigs[0].apiKey === "sk-terxMbHAT7lEAKZIs7UDFp_FvScR_3p9hzwJREjgbWM9IgeN";

    // 如果没有配置或需要更新，创建三组默认配置
    if (existingConfigs.length === 0 || needsUpdate) {
      const defaultConfigs = [
        {
          id: `api_${Date.now()}_1`,
          name: "【1】默认API配置",
          type: "openai" as const,
          baseUrl: "https://api.sillytarven.top/v1",
          model: "gemini-2.5-pro",
          apiKey: "sk-5zi5ZuqP_GADx_IYQFhA3AMbFj2X3ucDOqLB01CLvyOpcCZh",
        },
        {
          id: `api_${Date.now()}_2`,
          name: "【2】备用API配置",
          type: "openai" as const,
          baseUrl: "https://api.sillytarven.top/v1",
          model: "gemini-2.5-pro",
          apiKey: "sk-WanZhBPybGFKaA183aUtdqJzxXxt9X95UjUeN0XrTQReE8fS",
        },
        {
          id: `api_${Date.now()}_3`,
          name: "【3】备用API配置",
          type: "openai" as const,
          baseUrl: "https://api.sillytarven.top/v1",
          model: "gemini-2.5-pro",
          apiKey: "sk-rbQFBU405CbCnJwniaMmr1FXEJjZpFl1gLuJbU7oMlAIEt6D",
        },
      ];

      // 保存默认配置
      localStorage.setItem("apiConfigs", JSON.stringify(defaultConfigs));
      localStorage.setItem("activeConfigId", defaultConfigs[0].id);

      // 设置相关的localStorage项（使用第一个配置作为默认）
      const defaultConfig = defaultConfigs[0];
      localStorage.setItem("llmType", defaultConfig.type);
      localStorage.setItem("openaiBaseUrl", defaultConfig.baseUrl);
      localStorage.setItem("openaiModel", defaultConfig.model);
      localStorage.setItem("modelName", defaultConfig.model);
      localStorage.setItem("modelBaseUrl", defaultConfig.baseUrl);
      localStorage.setItem("openaiApiKey", defaultConfig.apiKey);
      localStorage.setItem("apiKey", defaultConfig.apiKey);

      if (needsUpdate) {
        console.log("Updated API configurations from old single config to 3 new configs");
      } else {
        console.log("Default API configurations initialized with 3 different keys");
      }
    }
  } catch (error) {
    console.error("Error initializing default API configuration:", error);
  }
}
