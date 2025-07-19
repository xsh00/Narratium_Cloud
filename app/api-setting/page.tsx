"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../i18n";
import AuthGuard from "@/components/AuthGuard";
import { trackButtonClick } from "@/utils/google-analytics";
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";
import BalanceQueryModal from "@/components/BalanceQueryModal";
import ModelPricingTable from "@/components/ModelPricingTable";

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

// 模型类型定义
interface ModelType {
  id: string;
  name: string;
  description: string;
  model: string;
  responseTime: string;
  useCase: string;
  recommended: boolean;
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

// 模型类型配置
const MODEL_TYPES: ModelType[] = [
  {
    id: "fast",
    name: "快速模型",
    description: "极速响应，适合日常对话",
    model: "gemini-2.5-flash-lite-preview-06-17",
    responseTime: "平均回复时间15s左右",
    useCase: "推荐用于：日常聊天、快速问答、简单任务",
    recommended: false,
  },
  {
    id: "balanced",
    name: "性能模型",
    description: "平衡速度与质量",
    model: "gemini-2.5-flash",
    responseTime: "平均回复时间30s左右",
    useCase: "推荐用于：创意写作、角色扮演、中等复杂度任务",
    recommended: true,
  },
  {
    id: "premium",
    name: "顶级模型",
    description: "最高质量，适合复杂任务",
    model: "gemini-2.5-pro",
    responseTime: "平均回复时间大于30s",
    useCase: "推荐用于：复杂推理、深度分析、专业任务",
    recommended: false,
  },
];

export default function ApiSettingPage() {
  const { t, fontClass, serifFontClass, titleFontClass } = useLanguage();
  
  // 状态管理
  const [configs, setConfigs] = useState<APIConfig[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string>("");
  const [selectedModelType, setSelectedModelType] = useState<string>("fast");
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
  
  // 添加余额查询模态框状态
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

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
        name: "默认API配置",
        type: "openai",
        baseUrl: DEFAULT_API_URL,
        model: "gemini-2.5-flash",
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
        // 根据当前模型确定选中的模型类型
        const currentModelType = MODEL_TYPES.find(mt => mt.model === activeConfig.model);
        if (currentModelType) {
          setSelectedModelType(currentModelType.id);
        }
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

  // 选择模型类型
  const handleSelectModelType = (modelTypeId: string) => {
    setSelectedModelType(modelTypeId);
    const modelType = MODEL_TYPES.find(mt => mt.id === modelTypeId);
    if (modelType) {
      setModel(modelType.model);
    }
  };

  // 应用模型选择
  const handleApplyModelSelection = () => {
    const modelType = MODEL_TYPES.find(mt => mt.id === selectedModelType);
    if (!modelType) return;

    const activeConfig = configs.find((c) => c.id === activeConfigId);
    if (!activeConfig) return;

    const updatedConfig: APIConfig = {
      ...activeConfig,
      type: "openai",
      baseUrl: DEFAULT_API_URL,
      model: modelType.model,
      apiKey: DEFAULT_API_KEY,
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
          modelName: modelType.model,
          configName: activeConfig.name,
        },
      })
    );
  };

  const handleTestModel = async () => {
    const modelType = MODEL_TYPES.find(mt => mt.id === selectedModelType);
    if (!modelType) return;

    setIsTesting(true);
    setTestModelSuccess(false);
    setTestModelError(false);

    try {
      const llm = new ChatOpenAI({
        openAIApiKey: DEFAULT_API_KEY,
        modelName: modelType.model,
        configuration: {
          baseURL: DEFAULT_API_URL,
        },
      });

      const response = await llm.invoke("Hello");
      
      if (response) {
        setTestModelSuccess(true);
        setTimeout(() => setTestModelSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Model test failed:", error);
      setTestModelError(true);
      setTimeout(() => setTestModelError(false), 3000);
    } finally {
      setIsTesting(false);
    }
  };

  const handleGetModelList = async () => {
    setGetModelListSuccess(false);
    setGetModelListError(false);

    try {
      const response = await fetch(`${DEFAULT_API_URL}/models`, {
        headers: {
          Authorization: `Bearer ${DEFAULT_API_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const modelNames = data.data?.map((model: any) => model.id) || [];
        setOpenaiModelList(modelNames);
        setGetModelListSuccess(true);
        setTimeout(() => setGetModelListSuccess(false), 3000);
      } else {
        throw new Error("Failed to fetch model list");
      }
    } catch (error) {
      console.error("Error fetching model list:", error);
      setGetModelListError(true);
      setTimeout(() => setGetModelListError(false), 3000);
    }
  };

  const handleCreateConfig = () => {
    // 保留原有功能，但简化处理
  };

  const handleCancelCreate = () => {
    // 保留原有功能，但简化处理
  };

  const handleCreateNewConfig = (name: string) => {
    if (!name.trim()) return;

    const modelType = MODEL_TYPES.find(mt => mt.id === selectedModelType);
    const newConfig: APIConfig = {
      id: generateId(),
      name: name.trim(),
      type: "openai",
      baseUrl: DEFAULT_API_URL,
      model: modelType?.model || "gemini-2.5-flash",
      apiKey: DEFAULT_API_KEY,
    };

    const updatedConfigs = [...configs, newConfig];
    setConfigs(updatedConfigs);
    localStorage.setItem("apiConfigs", JSON.stringify(updatedConfigs));
    setActiveConfigId(newConfig.id);
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
        model: "gemini-2.5-flash",
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
  
  // 打开余额查询模态框
  const handleOpenBalanceModal = () => {
    trackButtonClick("ModelSidebar", "查询余额");
    setIsBalanceModalOpen(true);
  };

  const [showNewConfigForm, setShowNewConfigForm] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string>("");
  const [editingName, setEditingName] = useState("");

  return (
    <AuthGuard>
      {/* 模态框组件 */}
      <BalanceQueryModal 
        isOpen={isBalanceModalOpen} 
        onClose={() => setIsBalanceModalOpen(false)}
        defaultApiKey={advancedApiKey}
      />
      
      <div className="min-h-screen relative overflow-hidden fantasy-bg">
        {/* 背景图层 */}
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
              免费模型
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
            <div className="w-full max-w-4xl">
              {tab === 'free' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="bg-black/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-8 shadow-[0_0_20px_rgba(251,146,60,0.3)]"
                >
                  {/* 模型类型选择 */}
                  <div className="mb-6">
                    <h3 className={`text-xl font-semibold text-[#f8d36a] mb-4 ${fontClass}`}>
                      选择适合您的模型类型
                    </h3>
                    <p className={`text-[#c0a480] text-sm mb-6 ${fontClass}`}>
                      我们提供三种不同性能的模型，您可以根据使用场景选择合适的模型
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {MODEL_TYPES.map((modelType) => (
                      <div
                        key={modelType.id}
                        className={`relative p-6 rounded-xl border-2 transition-all duration-300 cursor-pointer ${
                          selectedModelType === modelType.id
                            ? "border-amber-500 bg-amber-500/10 shadow-[0_0_20px_rgba(251,146,60,0.3)]"
                            : "border-[#333333] bg-[#1c1c1c] hover:border-amber-500/30 hover:bg-[#1c1c1c]/80"
                        }`}
                        onClick={() => handleSelectModelType(modelType.id)}
                      >
                        {/* 推荐标签 */}
                        {modelType.recommended && (
                          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-amber-500 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-bold">
                            推荐
                          </div>
                        )}

                        {/* 模型名称 */}
                        <div className="mb-4">
                          <h4 className={`text-lg font-bold text-[#f8d36a] mb-2 ${fontClass}`}>
                            {modelType.name}
                          </h4>
                          <p className={`text-sm text-[#c0a480] ${fontClass}`}>
                            {modelType.description}
                          </p>
                        </div>

                        {/* 响应时间 */}
                        <div className="mb-4">
                          <div className="flex items-center mb-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            <span className={`text-sm text-[#c0a480] ${fontClass}`}>
                              {modelType.responseTime}
                            </span>
                          </div>
                        </div>

                        {/* 使用场景 */}
                        <div className="mb-4">
                          <p className={`text-xs text-[#c0a480]/70 leading-relaxed ${fontClass}`}>
                            {modelType.useCase}
                          </p>
                        </div>

                        {/* 选择指示器 */}
                        <div className="flex justify-center">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedModelType === modelType.id
                              ? "border-amber-500 bg-amber-500"
                              : "border-[#333333]"
                          }`}>
                            {selectedModelType === modelType.id && (
                              <div className="w-2 h-2 bg-black rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={handleApplyModelSelection}
                      className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-black rounded-lg hover:from-amber-400 hover:to-orange-300 transition-all duration-200 font-bold text-lg"
                    >
                      应用选择
                    </button>
                    <button
                      onClick={handleTestModel}
                      disabled={isTesting}
                      className="px-8 py-3 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 font-bold text-lg"
                    >
                      {isTesting ? "测试中..." : "测试模型"}
                    </button>
                  </div>

                  {/* 状态提示 */}
                  <div className="mt-6 text-center">
                    {saveSuccess && (
                      <div className="p-3 bg-green-500/20 text-green-400 rounded-lg text-sm">
                        模型设置已保存！
                      </div>
                    )}
                    {testModelSuccess && (
                      <div className="p-3 bg-green-500/20 text-green-400 rounded-lg text-sm">
                        模型测试成功！
                      </div>
                    )}
                    {testModelError && (
                      <div className="p-3 bg-red-500/20 text-red-400 rounded-lg text-sm">
                        模型测试失败，请稍后重试
                      </div>
                    )}
                  </div>

                  {/* 当前选择信息 */}
                  <div className="mt-6 p-4 bg-[#1c1c1c]/50 rounded-lg">
                    <h4 className={`text-sm font-semibold text-[#f8d36a] mb-2 ${fontClass}`}>
                      当前选择
                    </h4>
                    <p className={`text-sm text-[#c0a480] ${fontClass}`}>
                      模型：{MODEL_TYPES.find(mt => mt.id === selectedModelType)?.model}
                    </p>
                    <p className={`text-sm text-[#c0a480] ${fontClass}`}>
                      类型：{MODEL_TYPES.find(mt => mt.id === selectedModelType)?.name}
                    </p>
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
                        onClick={handleOpenBalanceModal}
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
                  
                  {/* 模型计费规则表格 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="bg-black/20 backdrop-blur-sm border border-amber-500/30 rounded-2xl p-8 shadow-[0_0_20px_rgba(251,146,60,0.3)] mb-8"
                  >
                    <ModelPricingTable />
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
} 