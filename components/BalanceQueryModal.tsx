import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/app/i18n";

interface BalanceQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultApiKey?: string;  // 添加一个可选的默认API Key属性
}

interface UsageDetail {
  time: string;
  model: string;
  prompt: string;
  completion: string;
  cost: string;
}

const BalanceQueryModal: React.FC<BalanceQueryModalProps> = ({ isOpen, onClose, defaultApiKey = "" }) => {
  const { fontClass } = useLanguage();
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balanceData, setBalanceData] = useState<{
    balance?: string;
    usageThisMonth?: string;
    usageDetails?: UsageDetail[];
  } | null>(null);

  // 当defaultApiKey变化时更新apiKey
  useEffect(() => {
    if (defaultApiKey) {
      setApiKey(defaultApiKey);
    }
  }, [defaultApiKey]);

  // 当模态框打开时，如果有默认API Key，自动查询
  useEffect(() => {
    if (isOpen && defaultApiKey && !balanceData) {
      handleSubmit();
    }
  }, [isOpen, defaultApiKey]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!apiKey.trim()) {
      setError("请输入API密钥");
      return;
    }

    setLoading(true);
    setError("");
    setBalanceData(null); // 重置之前的查询结果
    
    try {
      const response = await fetch("/api/balance-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "查询失败，请稍后重试");
      }

      setBalanceData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
          />

          {/* 模态框内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-[#1a1714] border border-amber-500/30 rounded-xl shadow-[0_0_20px_rgba(251,146,60,0.3)] p-6 max-w-3xl w-full m-4 relative z-10 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold text-[#f8d36a] ${fontClass}`}>
                余额查询
              </h2>
              <button
                onClick={onClose}
                className="text-[#c0a480] hover:text-[#f8d36a] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 查询表单 */}
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="mb-4">
                <label htmlFor="apiKey" className={`block text-[#c0a480] mb-2 ${fontClass}`}>
                  API密钥
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="apiKey"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="请输入您的API密钥"
                    className="flex-1 p-3 bg-[#2a2520] border border-[#3a3530] rounded-l-lg text-[#e0d0b0] focus:border-amber-500/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="p-3 bg-gradient-to-r from-amber-500 to-orange-400 text-black rounded-r-lg hover:from-amber-400 hover:to-orange-300 transition-all duration-200 font-bold disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        查询中
                      </div>
                    ) : "查询余额"}
                  </button>
                </div>
              </div>
            </form>

            {/* 错误提示 */}
            {error && (
              <div className="p-4 bg-red-500/20 text-red-400 rounded-lg mb-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {/* 加载状态 */}
            {loading && !error && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
                <p className="text-[#c0a480] text-lg">正在查询余额信息...</p>
              </div>
            )}

            {/* 查询结果 */}
            {!loading && balanceData && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* 余额信息 */}
                <div className="bg-gradient-to-r from-[#2a2520]/80 to-[#332e29]/80 backdrop-blur-sm border border-[#3a3530] rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-[#3a3530]/70 rounded-lg backdrop-blur-sm shadow-inner">
                      <p className={`text-[#c0a480] text-sm mb-1 ${fontClass}`}>账户余额</p>
                      <p className="text-2xl font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">
                        {balanceData.balance || "未知"}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-[#3a3530]/70 rounded-lg backdrop-blur-sm shadow-inner">
                      <p className={`text-[#c0a480] text-sm mb-1 ${fontClass}`}>本月已用</p>
                      <p className="text-2xl font-bold text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.5)]">
                        {balanceData.usageThisMonth || "0$"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 使用记录 */}
                {balanceData.usageDetails && balanceData.usageDetails.length > 0 ? (
                  <div>
                    <h3 className={`text-lg font-semibold text-[#f8d36a] mb-3 ${fontClass} flex items-center`}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      使用记录 ({balanceData.usageDetails.length})
                    </h3>
                    <div className="overflow-x-auto rounded-lg border border-[#3a3530] shadow-inner">
                      <table className="min-w-full bg-[#2a2520]/80 backdrop-blur-sm">
                        <thead className="bg-gradient-to-r from-[#3a3530]/90 to-[#433e39]/90 text-[#f8d36a]">
                          <tr>
                            <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">时间</th>
                            <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">模型</th>
                            <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">提示词</th>
                            <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">补全</th>
                            <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">消耗额度</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3a3530]/50">
                          {balanceData.usageDetails.map((detail, index) => (
                            <tr 
                              key={index} 
                              className={index % 2 === 0 ? "bg-[#2a2520]/60" : "bg-[#332e29]/60"}
                            >
                              <td className="py-2 px-4 text-sm text-[#e0d0b0]">{detail.time}</td>
                              <td className="py-2 px-4 text-sm text-[#e0d0b0] max-w-[150px] truncate" title={detail.model}>
                                {detail.model}
                              </td>
                              <td className="py-2 px-4 text-sm text-[#e0d0b0]">{detail.prompt}</td>
                              <td className="py-2 px-4 text-sm text-[#e0d0b0]">{detail.completion}</td>
                              <td className="py-2 px-4 text-sm text-amber-400 font-semibold">{detail.cost}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 bg-[#2a2520]/50 rounded-lg border border-[#3a3530]">
                    <svg className="w-16 h-16 text-[#c0a480]/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-center text-[#c0a480]">暂无使用记录</p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BalanceQueryModal; 