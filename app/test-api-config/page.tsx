"use client";

import React, { useState, useEffect } from "react";

interface APIConfig {
  id: string;
  name: string;
  type: "openai" | "ollama";
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export default function TestAPIConfigPage() {
  const [configs, setConfigs] = useState<APIConfig[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string>("");
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = () => {
    if (typeof window === "undefined") return;

    const savedConfigsStr = localStorage.getItem("apiConfigs");
    if (savedConfigsStr) {
      try {
        const loadedConfigs = JSON.parse(savedConfigsStr) as APIConfig[];
        setConfigs(loadedConfigs);
        
        const storedActiveId = localStorage.getItem("activeConfigId");
        if (storedActiveId && loadedConfigs.some((c) => c.id === storedActiveId)) {
          setActiveConfigId(storedActiveId);
        } else if (loadedConfigs.length > 0) {
          setActiveConfigId(loadedConfigs[0].id);
        }
      } catch (e) {
        console.error("Error parsing saved API configs", e);
      }
    }
  };

  const handleResetConfigs = () => {
    if (typeof window === "undefined") return;
    
    // 清除现有配置
    localStorage.removeItem("apiConfigs");
    localStorage.removeItem("activeConfigId");
    
    // 重新加载页面以触发默认配置初始化
    window.location.reload();
  };

  const handleForceUpdateConfigs = () => {
    if (typeof window === "undefined") return;
    
    // 强制创建新的三组配置
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

    // 保存新配置
    localStorage.setItem("apiConfigs", JSON.stringify(defaultConfigs));
    localStorage.setItem("activeConfigId", defaultConfigs[0].id);

    // 设置相关的localStorage项
    const defaultConfig = defaultConfigs[0];
    localStorage.setItem("llmType", defaultConfig.type);
    localStorage.setItem("openaiBaseUrl", defaultConfig.baseUrl);
    localStorage.setItem("openaiModel", defaultConfig.model);
    localStorage.setItem("modelName", defaultConfig.model);
    localStorage.setItem("modelBaseUrl", defaultConfig.baseUrl);
    localStorage.setItem("openaiApiKey", defaultConfig.apiKey);
    localStorage.setItem("apiKey", defaultConfig.apiKey);

    // 重新加载配置
    loadConfigs();
    
    alert("已强制更新为三组新的API配置！");
  };

  const testConfig = async (config: APIConfig) => {
    setTestResults(prev => ({ ...prev, [config.id]: { status: "testing", message: "测试中..." } }));

    try {
      const response = await fetch("/api/test-model", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          model: config.model,
        }),
      });

      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [config.id]: {
          status: response.ok ? "success" : "error",
          message: response.ok ? "连接成功" : result.error || "连接失败",
          details: result
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [config.id]: {
          status: "error",
          message: "网络错误",
          details: error
        }
      }));
    }
  };

  const testAllConfigs = () => {
    configs.forEach(config => {
      testConfig(config);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#171717] via-[#1a1816] to-[#171717] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">API配置测试页面</h1>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">当前配置</h2>
            <div className="space-x-4">
              <button
                onClick={loadConfigs}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
              >
                刷新配置
              </button>
              <button
                onClick={handleForceUpdateConfigs}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
              >
                强制更新为三组配置
              </button>
              <button
                onClick={handleResetConfigs}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
              >
                重置配置
              </button>
            </div>
          </div>

          <div className="text-white mb-4">
            <p>配置数量: {configs.length}</p>
            <p>当前激活配置: {activeConfigId}</p>
            {configs.length === 1 && (
              <p className="text-yellow-400">⚠️ 当前只有一组配置，建议使用"强制更新为三组配置"按钮</p>
            )}
            {configs.length === 3 && (
              <p className="text-green-400">✅ 已成功创建三组API配置</p>
            )}
          </div>

          {configs.length === 0 && (
            <div className="text-yellow-400">
              未找到API配置，请刷新页面或重置配置以初始化默认配置
            </div>
          )}
        </div>

        {configs.length > 0 && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">API配置列表</h2>
              <button
                onClick={testAllConfigs}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
              >
                测试所有配置
              </button>
            </div>

            <div className="space-y-4">
              {configs.map((config) => (
                <div key={config.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {config.name}
                        {config.id === activeConfigId && (
                          <span className="ml-2 text-xs bg-green-600 text-white px-2 py-1 rounded">
                            当前激活
                          </span>
                        )}
                      </h3>
                      <div className="text-sm text-gray-300 space-y-1">
                        <div>类型: {config.type === "openai" ? "OpenAI API" : "Ollama API"}</div>
                        <div>模型: {config.model}</div>
                        <div>Base URL: {config.baseUrl}</div>
                        <div>API Key: {config.apiKey ? "••••••••" + config.apiKey.slice(-8) : "未设置"}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => testConfig(config)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-500"
                    >
                      测试连接
                    </button>
                  </div>

                  {testResults[config.id] && (
                    <div className={`mt-3 p-3 rounded text-sm ${
                      testResults[config.id].status === "success" 
                        ? "bg-green-900/50 text-green-300" 
                        : testResults[config.id].status === "error"
                        ? "bg-red-900/50 text-red-300"
                        : "bg-yellow-900/50 text-yellow-300"
                    }`}>
                      <div className="font-semibold">
                        {testResults[config.id].status === "testing" && "🔄 测试中..."}
                        {testResults[config.id].status === "success" && "✅ 成功"}
                        {testResults[config.id].status === "error" && "❌ 失败"}
                      </div>
                      <div>{testResults[config.id].message}</div>
                      {testResults[config.id].details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer">详细信息</summary>
                          <pre className="mt-2 text-xs overflow-auto">
                            {JSON.stringify(testResults[config.id].details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">说明</h2>
          <div className="text-gray-300 space-y-2">
            <p>• 此页面用于测试API配置是否正确工作</p>
            <p>• 默认会创建三组不同的API配置，每组使用不同的API Key</p>
            <p>• 如果当前只有一组配置，请点击"强制更新为三组配置"按钮</p>
            <p>• 点击"测试连接"可以验证API配置是否有效</p>
            <p>• 如果配置有问题，可以点击"重置配置"重新初始化</p>
            <p>• 当前激活的配置会在界面上显示"当前激活"标签</p>
          </div>
        </div>
      </div>
    </div>
  );
} 