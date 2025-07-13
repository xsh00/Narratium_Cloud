"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n";
import AuthGuard from "@/components/AuthGuard";
import { trackButtonClick } from "@/utils/google-analytics";
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";

// 复制ModelSidebar中的类型定义
type LLMType = "openai" | "ollama";

interface APIConfig {
  id: string;
  name: string;
  type: LLMType;
  baseUrl: string;
  model: string;
  apiKey?: string;
}

const DEFAULT_API_KEY =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_KEY ||
      "sk-5zi5ZuqP_GADx_IYQFhA3AMbFj2X3ucDOqLB01CLvyOpcCZh"
    : "sk-5zi5ZuqP_GADx_IYQFhA3AMbFj2X3ucDOqLB01CLvyOpcCZh";
const DEFAULT_API_URL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "https://api.sillytarven.top/v1"
    : "https://api.sillytarven.top/v1";

export default function ApiSettingPage() {
  const { t, fontClass, serifFontClass, titleFontClass } = useLanguage();
  
  // 状态管理
  const [configs, setConfigs] = useState<APIConfig[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string>("");
  const [showNewConfigForm, setShowNewConfigForm] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string>("");
  const [editingName, setEditingName] = useState("");
  // 将tab的类型声明为字符串联合类型
  const [tab, setTab] = useState<'free' | 'pro'>("free");

  const [llmType, setLlmType] = useState<LLMType>("openai");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [openaiModelList, setOpenaiModelList] = useState<string[]>([]);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [getModelListSuccess, setGetModelListSuccess] = useState(false);
  const [getModelListError, setGetModelListError] = useState(false);
  const [testModelSuccess, setTestModelSuccess] = useState(false);
  const [testModelError, setTestModelError] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const [advancedApiKey, setAdvancedApiKey] = useState("");
  const [advancedConfigSuccess, setAdvancedConfigSuccess] = useState(false);
  const [advancedConfigError, setAdvancedConfigError] = useState(false);
  // 删除balance, balanceError, isCheckingBalance相关状态

  // 初始化配置
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedConfigsStr = localStorage.getItem("apiConfigs");
    let mergedConfigs: APIConfig[] = [];

    if (savedConfigsStr) {
      try {
        const parsedConfigs = JSON.parse(savedConfigsStr) as APIConfig[];
        mergedConfigs = validateConfigs(parsedConfigs);
      } catch (e) {
        console.error("Error parsing saved API configs", e);
      }
    }

    if (mergedConfigs.length === 0) {
      const defaultConfig: APIConfig = {
        id: generateId(),
        name: "【1】默认API配置",
        type: "openai",
        baseUrl: DEFAULT_API_URL,
        model: "gemini-2.5-pro",
        apiKey: DEFAULT_API_KEY,
      };
      mergedConfigs = [defaultConfig];
      localStorage.setItem("apiConfigs", JSON.stringify(mergedConfigs));
      localStorage.setItem("activeConfigId", defaultConfig.id);
    }

    const storedActiveId = localStorage.getItem("activeConfigId");
    const activeIdCandidate =
      storedActiveId && mergedConfigs.some((c) => c.id === storedActiveId)
        ? storedActiveId
        : mergedConfigs[0]?.id || "";

    setConfigs(mergedConfigs);
    setActiveConfigId(activeIdCandidate);

    if (mergedConfigs.length > 0) {
      const activeConfig = mergedConfigs.find((c) => c.id === activeIdCandidate);
      if (activeConfig) {
        loadConfigToForm(activeConfig);
      }
    }
  }, []);

  // 工具函数
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const validateConfigs = (configs: APIConfig[]): APIConfig[] => {
    return configs.filter(config => 
      config.id && config.name && config.type && config.baseUrl && config.model
    );
  };

  const loadConfigToForm = (config: APIConfig) => {
    setLlmType(config.type);
    setBaseUrl(config.baseUrl);
    setModel(config.model);
    setApiKey(config.apiKey || "");
  };

  const handleSwitchConfig = (id: string) => {
    const selectedConfig = configs.find((c) => c.id === id);
    if (selectedConfig) {
      setActiveConfigId(id);
      loadConfigToForm(selectedConfig);
      localStorage.setItem("activeConfigId", id);
    }
  };

  const handleSave = () => {
    if (!baseUrl.trim() || !model.trim()) {
      return;
    }

    const activeConfig = configs.find((c) => c.id === activeConfigId);
    if (!activeConfig) return;

    const updatedConfig: APIConfig = {
      ...activeConfig,
      type: llmType,
      baseUrl: baseUrl.trim(),
      model: model.trim(),
      apiKey: apiKey.trim(),
    };

    const updatedConfigs = configs.map((c) =>
      c.id === activeConfigId ? updatedConfig : c
    );

    setConfigs(updatedConfigs);
    localStorage.setItem("apiConfigs", JSON.stringify(updatedConfigs));
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    // 发送模型变更事件
    window.dispatchEvent(
      new CustomEvent("modelChanged", {
        detail: {
          configId: activeConfigId,
          modelName: model.trim(),
          configName: activeConfig.name,
        },
      })
    );
  };

  const handleTestModel = async () => {
    if (!baseUrl.trim() || !model.trim()) {
      return;
    }

    setIsTesting(true);
    setTestModelSuccess(false);
    setTestModelError(false);

    try {
      let llm;
      if (llmType === "openai") {
        llm = new ChatOpenAI({
          openAIApiKey: apiKey.trim(),
          modelName: model.trim(),
          configuration: {
            baseURL: baseUrl.trim(),
          },
        });
      } else {
        llm = new ChatOllama({
          baseUrl: baseUrl.trim(),
          model: model.trim(),
        });
      }

      await llm.invoke("Hello");
      setTestModelSuccess(true);
      setTimeout(() => setTestModelSuccess(false), 3000);
    } catch (error) {
      console.error("Model test failed:", error);
      setTestModelError(true);
      setTimeout(() => setTestModelError(false), 3000);
    } finally {
      setIsTesting(false);
    }
  };

  const handleGetModelList = async () => {
    if (!baseUrl.trim() || !apiKey.trim()) {
      return;
    }

    try {
      const response = await fetch(`${baseUrl.trim()}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const models = data.data?.map((model: any) => model.id) || [];
        setOpenaiModelList(models);
        setGetModelListSuccess(true);
        setTimeout(() => setGetModelListSuccess(false), 3000);
      } else {
        throw new Error("Failed to fetch models");
      }
    } catch (error) {
      console.error("Get model list failed:", error);
      setGetModelListError(true);
      setTimeout(() => setGetModelListError(false), 3000);
    }
  };

  const handleCreateConfig = () => {
    setShowNewConfigForm(true);
  };

  const handleCancelCreate = () => {
    setShowNewConfigForm(false);
  };

  const handleCreateNewConfig = (name: string) => {
    if (!name.trim()) return;

    const newConfig: APIConfig = {
      id: generateId(),
      name: name.trim(),
      type: "openai",
      baseUrl: DEFAULT_API_URL,
      model: "gemini-2.5-pro",
      apiKey: DEFAULT_API_KEY,
    };

    const updatedConfigs = [...configs, newConfig];
    setConfigs(updatedConfigs);
    localStorage.setItem("apiConfigs", JSON.stringify(updatedConfigs));
    setActiveConfigId(newConfig.id);
    loadConfigToForm(newConfig);
    setShowNewConfigForm(false);
  };

  const handleDeleteConfig = (id: string) => {
    if (configs.length <= 1) return;

    const updatedConfigs = configs.filter((c) => c.id !== id);
    setConfigs(updatedConfigs);
    localStorage.setItem("apiConfigs", JSON.stringify(updatedConfigs));

    if (activeConfigId === id) {
      const newActiveId = updatedConfigs[0].id;
      setActiveConfigId(newActiveId);
      loadConfigToForm(updatedConfigs[0]);
      localStorage.setItem("activeConfigId", newActiveId);
    }
  };

  // 判断是否为默认API（假设默认API为前3个）
  const defaultApiCount = 3;
  const defaultApis = configs.slice(0, defaultApiCount);
  const customApis = configs.slice(defaultApiCount);

  // 高级API相关逻辑
  const handleGetAdvancedAPI = () => {
    trackButtonClick("ModelSidebar", "获取高级API");
    window.open("https://68n.cn/azrj5", "_blank");
  };

  const handleCreateAdvancedConfig = () => {
    if (!advancedApiKey.trim()) {
      setAdvancedConfigError(true);
      setTimeout(() => setAdvancedConfigError(false), 2000);
      return;
    }
    try {
      const configName = "高级API配置";
      const newConfig = {
        id: generateId(),
        name: configName,
        type: 'openai' as LLMType,
        baseUrl: "https://api.gptbest.vip/v1",
        model: "gemini-2.5-pro",
        apiKey: advancedApiKey.trim(),
      };
      const currentConfigs = Array.isArray(configs) ? configs : [];
      const updatedConfigs = [...currentConfigs, newConfig];
      setConfigs(updatedConfigs);
      setActiveConfigId(newConfig.id);
      setAdvancedApiKey("");
      localStorage.setItem("apiConfigs", JSON.stringify(updatedConfigs));
      localStorage.setItem("activeConfigId", newConfig.id);
      loadConfigToForm(newConfig);
      window.dispatchEvent(
        new CustomEvent("modelChanged", {
          detail: {
            configId: newConfig.id,
            config: newConfig,
            modelName: newConfig.model,
            configName: newConfig.name,
          },
        })
      );
      setAdvancedConfigSuccess(true);
      setTimeout(() => setAdvancedConfigSuccess(false), 2000);
    } catch (error) {
      setAdvancedConfigError(true);
      setTimeout(() => setAdvancedConfigError(false), 2000);
    }
  };

  // 删除handleCheckBalance函数

  return (
    <AuthGuard>
      <div className="min-h-screen w-full h-full overflow-auto login-fantasy-bg relative">
        {/* 背景层 */}
        <div
          className="absolute inset-0 z-0 opacity-35"
          style={{
            backgroundImage: "url('/background_yellow.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div
          className="absolute inset-0 z-1 opacity-45"
          style={{
            backgroundImage: "url('/background_red.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            mixBlendMode: "multiply",
          }}
        />
        {/* 主体内容 */}
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* 顶部标题 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="p-6 text-center"
          >
            <h1
              className={
                "text-3xl md:text-4xl font-bold mb-4 font-cinzel bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]"
              }
            >
              {t("apiSetting.title")}
            </h1>
            <p
              className={`text-[#c0a480] text-sm md:text-base ${serifFontClass} italic`}
            >
              {t("apiSetting.subtitle")}
            </p>
          </motion.div>

          {/* 分页Tab */}
          <div className="flex justify-center mb-8">
            <button
              className={`px-8 py-3 rounded-t-lg text-lg font-bold transition-all duration-200 border-b-2 ${tab === 'free' ? 'bg-[#1a1714] text-amber-400 border-amber-400' : 'bg-[#23201c] text-[#c0a480]/60 border-transparent hover:text-amber-400'}`}
              onClick={() => setTab('free')}
            >
              免费API
            </button>
            <button
              className={`px-8 py-3 rounded-t-lg text-lg font-bold transition-all duration-200 border-b-2 ml-2 ${tab === 'pro' ? 'bg-[#1a1714] text-amber-400 border-amber-400' : 'bg-[#23201c] text-[#c0a480]/60 border-transparent hover:text-amber-400'}`}
              onClick={() => setTab('pro')}
            >
              高级API
            </button>
          </div>

          {/* Tab内容区 */}
          <div className="flex-1 flex justify-center px-4 pb-24">
            <div className="w-full max-w-3xl">
              {tab === 'free' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="bg-black/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-8 shadow-[0_0_20px_rgba(251,146,60,0.3)]"
                >
                  {/* 只显示默认3个API卡片，每个卡片有启用/测试按钮 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
                    {defaultApis.map((config) => (
                      <div
                        key={config.id}
                        className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-300 ${
                          activeConfigId === config.id
                            ? "border-amber-500/50 bg-amber-500/10"
                            : "border-[#333333] bg-[#1c1c1c] hover:border-amber-500/30"
                        }`}
                      >
                        <div className="w-full flex items-center justify-between mb-1">
                          <span className={`text-xs text-[#c0a480] ${fontClass}`}>{config.name}</span>
                        </div>
                        <div className="text-xs text-[#c0a480]/60 mb-2">{config.type} • {config.model}</div>
                        <button
                          onClick={() => { handleSwitchConfig(config.id); handleSave(); }}
                          className="w-full p-1.5 mb-1.5 bg-gradient-to-r from-amber-500 to-orange-400 text-black rounded-lg hover:from-amber-400 hover:to-orange-300 transition-all duration-200 font-medium text-xs"
                        >
                          {t("modelSettings.saveSettings")}
                        </button>
                        <button
                          onClick={handleTestModel}
                          disabled={isTesting}
                          className="w-full p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 text-xs"
                        >
                          {isTesting ? t("modelSettings.testing") : t("modelSettings.testModel")}
                        </button>
                        {/* 状态提示 */}
                        {activeConfigId === config.id && saveSuccess && (
                          <div className="p-1.5 mt-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs w-full text-center">{t("modelSettings.settingsSaved")}</div>
                        )}
                        {activeConfigId === config.id && testModelSuccess && (
                          <div className="p-1.5 mt-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs w-full text-center">{t("modelSettings.testSuccess")}</div>
                        )}
                        {activeConfigId === config.id && testModelError && (
                          <div className="p-1.5 mt-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs w-full text-center">{t("modelSettings.testError")}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              {tab === 'pro' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="bg-black/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-8 shadow-[0_0_20px_rgba(251,146,60,0.3)] flex flex-col items-center mb-8"
                  >
                    {/* 高级API设置区 */}
                    <div className="w-full max-w-md">
                      <h3 className={`text-lg font-semibold text-[#f8d36a] mb-4 ${fontClass}`}>高级模型设置</h3>
                      {/* 只显示API Key输入框，不显示Base URL */}
                      <input
                        type="password"
                        value={advancedApiKey}
                        onChange={(e) => setAdvancedApiKey(e.target.value)}
                        className="w-full p-3 bg-[#1c1c1c] border border-[#333333] rounded-lg text-[#c0a480] focus:border-amber-500/50 focus:outline-none mb-4"
                        placeholder="请输入您的API Key"
                      />
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={handleGetAdvancedAPI}
                          className="flex-1 p-3 bg-gradient-to-r from-pink-500 via-amber-400 to-orange-400 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-amber-300 animate-pulse"
                        >
                          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 3v18m9-9H3" /></svg>
                          获取高级API
                        </button>
                      </div>
                      <button
                        onClick={handleCreateAdvancedConfig}
                        className="w-full p-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                      >
                        创建高级配置
                      </button>
                      <button
                        onClick={() => window.open("https://usage.gptbest.vip/", "_blank")}
                        className="w-full p-3 mt-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                      >
                        查询余额
                      </button>
                      {advancedConfigSuccess && (
                        <div className="p-3 mt-3 bg-green-500/20 text-green-400 rounded-lg text-sm text-center">高级配置创建成功</div>
                      )}
                      {advancedConfigError && (
                        <div className="p-3 mt-3 bg-red-500/20 text-red-400 rounded-lg text-sm text-center">高级配置创建失败，请检查API Key</div>
                      )}
                    </div>
                  </motion.div>

                </>
              )}
            </div>
          </div>
          {/* 新建配置弹窗 */}
          {showNewConfigForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#1a1714] border border-amber-500/30 rounded-lg p-6 max-w-md w-full mx-4"
              >
                <h3 className={`text-lg font-semibold text-[#f8d36a] mb-4 ${fontClass}`}>{t("modelSettings.newConfig")}</h3>
                <input
                  type="text"
                  placeholder={t("modelSettings.configNamePlaceholder")}
                  className="w-full p-3 bg-[#1c1c1c] border border-[#333333] rounded-lg text-[#c0a480] focus:border-amber-500/50 focus:outline-none mb-4"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleCreateNewConfig((e.target as HTMLInputElement).value);
                    }
                  }}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelCreate}
                    className="flex-1 p-3 border border-[#333333] text-[#c0a480] rounded-lg hover:bg-[#333333] transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="配置"]') as HTMLInputElement;
                      if (input) {
                        handleCreateNewConfig(input.value);
                      }
                    }}
                    className="flex-1 p-3 bg-gradient-to-r from-amber-500 to-orange-400 text-black rounded-lg hover:from-amber-400 hover:to-orange-300 transition-all duration-200"
                  >
                    {t("modelSettings.createConfig")}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
} 