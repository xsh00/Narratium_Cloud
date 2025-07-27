"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/app/i18n";
import { motion } from "framer-motion";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";

// 定义积分历史记录类型
interface CreditHistory {
  id: number;
  date: string;
  amount: number;
  description: string;
}

/**
 * 个人中心页面组件
 * 包含用户名修改、账户管理和积分管理功能
 */
export default function ProfilePage() {
  const { t, fontClass, serifFontClass } = useLanguage();
  const { user, updateUsername } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // 用户名设置相关状态
  const [currentUsername, setCurrentUsername] = useState("");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  
  // 积分相关状态
  const [credits, setCredits] = useState(0);
  const [creditHistory, setCreditHistory] = useState<CreditHistory[]>([]);
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditError, setCreditError] = useState("");
  
  // 积分兑换相关状态
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  useEffect(() => {
    setMounted(true);
    const yellowImg = new Image();
    const redImg = new Image();

    yellowImg.src = "/background_yellow.png";
    redImg.src = "/background_red.png";

    Promise.all([
      new Promise((resolve) => (yellowImg.onload = resolve)),
      new Promise((resolve) => (redImg.onload = resolve)),
    ]).then(() => {
      setImagesLoaded(true);
    });
  }, []);

  // 初始化用户名
  useEffect(() => {
    const username = localStorage.getItem('username') || 'user';
    setCurrentUsername(username);
  }, []);

  // 从API获取积分数据
  useEffect(() => {
    if (user) {
      fetchCreditsData();
    } else {
      // 未登录用户，设置积分为0并清空历史记录
      setCredits(0);
      setCreditHistory([]);
      setIsLoadingCredits(false);
      // 不显示错误信息，只清空历史记录
      setCreditError("");
    }
  }, [user]);

  const fetchCreditsData = async () => {
    try {
      setIsLoadingCredits(true);
      setCreditError("");
      
      // 确保用户已登录且有ID
      if (!user?.id) {
        // 未登录用户不显示错误信息
        setIsLoadingCredits(false);
        return;
      }
      
      // 添加userId参数到请求URL中
      const response = await fetch(`/api/user/credits?userId=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setCredits(data.credits);
        setCreditHistory(data.history || []);
      } else {
        setCreditError(data.message || "获取积分数据失败");
      }
    } catch (error) {
      console.error("获取积分数据出错:", error);
      setCreditError("获取积分数据时出错，请稍后再试");
    } finally {
      setIsLoadingCredits(false);
    }
  };

  // 用户名设置相关函数
  const handleEditUsername = () => {
    setTempUsername(currentUsername);
    setIsEditingUsername(true);
  };

  const handleCancelEditUsername = () => {
    setIsEditingUsername(false);
    setTempUsername("");
  };

  const handleSaveUsername = async () => {
    if (tempUsername.trim()) {
      const newUsername = tempUsername.trim();
      
      try {
        // 如果用户已登录，同步到数据库
        if (user) {
          const result = await updateUsername(newUsername);
          if (!result.success) {
            alert(result.message);
            return;
          }
        } else {
          // 未登录用户只更新本地存储
          localStorage.setItem('username', newUsername);
        }
        
        setCurrentUsername(newUsername);
        setIsEditingUsername(false);
        setUsernameSuccess(true);
        setTimeout(() => setUsernameSuccess(false), 3000);
      } catch (error) {
        console.error('保存用户名失败:', error);
        alert('保存用户名失败，请重试');
      }
    }
  };

  const handleUsernameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveUsername();
    } else if (e.key === 'Escape') {
      handleCancelEditUsername();
    }
  };
  
  // 处理积分购买
  const handleBuyCredits = () => {
    window.open('https://68n.cn/azrj5', '_blank');
  };
  
  // 处理积分兑换
  const handleOpenRedeemModal = () => {
    setIsRedeemModalOpen(true);
    setRedeemCode("");
    setRedeemError("");
    setRedeemSuccess("");
  };
  
  const handleCloseRedeemModal = () => {
    setIsRedeemModalOpen(false);
  };
  
  const handleRedeemSubmit = async () => {
    if (!redeemCode.trim()) {
      setRedeemError("请输入兑换码");
      return;
    }
    
    if (!user?.id) {
      setRedeemError("请先登录后再兑换");
      return;
    }
    
    try {
      setIsRedeeming(true);
      setRedeemError("");
      setRedeemSuccess("");
      
      const response = await fetch('/api/user/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: redeemCode.trim(),
          userId: user.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRedeemSuccess(data.message || "兑换成功！");
        setRedeemCode("");
        // 刷新积分数据
        fetchCreditsData();
        
        // 3秒后关闭模态框
        setTimeout(() => {
          setIsRedeemModalOpen(false);
        }, 3000);
      } else {
        setRedeemError(data.message || "兑换失败，请检查兑换码是否正确");
      }
    } catch (error) {
      console.error("兑换积分失败:", error);
      setRedeemError("兑换过程中出错，请稍后再试");
    } finally {
      setIsRedeeming(false);
    }
  };
  
  const handleRedeemKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRedeemSubmit();
    } else if (e.key === 'Escape') {
      handleCloseRedeemModal();
    }
  };

  if (!mounted) return null;

  return (
    <AuthGuard>
      <div className="h-full w-full overflow-hidden login-fantasy-bg relative">
        <div
          className={`absolute inset-0 z-0 opacity-35 transition-opacity duration-500 ${
            imagesLoaded ? "opacity-35" : "opacity-0"
          }`}
          style={{
            backgroundImage: "url('/background_yellow.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        <div
          className={`absolute inset-0 z-1 opacity-45 transition-opacity duration-500 ${
            imagesLoaded ? "opacity-45" : "opacity-0"
          }`}
          style={{
            backgroundImage: "url('/background_red.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            mixBlendMode: "multiply",
          }}
        />

        <div className="relative z-10 h-full w-full overflow-y-auto">
          <div className="flex flex-col items-center justify-start w-full py-8 pb-20 md:pb-8">
            <div className="w-full max-w-2xl px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <h1
                  className={`text-xl sm:text-2xl magical-login-text ${serifFontClass} mb-4`}
                >
                  {t("profile.title")}
                </h1>
                <p className={`text-[#c0a480] mb-6 ${fontClass}`}>
                  {t("profile.subtitle")}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-8"
              >
                <div className="bg-black/30 backdrop-blur-sm border border-amber-500/20 rounded-xl p-5 shadow-[0_0_20px_rgba(251,146,60,0.2)] mx-auto">
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/20 flex items-center justify-center mr-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-amber-400"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <div>
                      <h2 className={`text-lg text-amber-400 font-medium ${fontClass}`}>
                        {t("profile.accountSettings")}
                      </h2>
                      <p className={`text-xs text-[#c0a480] ${fontClass}`}>
                        {t("profile.manageYourProfile")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* 用户名设置 */}
                    <div className="bg-[#1c1c1c]/60 rounded-lg p-4 border border-[#333]/40">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-amber-400 mr-2"
                          >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          <span className={`text-amber-400 font-medium ${fontClass}`}>
                            {t("profile.username")}
                          </span>
                        </div>
                        {!isEditingUsername && (
                          <motion.button
                            onClick={handleEditUsername}
                            className={`text-xs px-2 py-1 text-[#c0a480] hover:text-amber-400 border border-[#534741] rounded hover:border-[#c0a480] transition-colors duration-200 ${fontClass}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {t("profile.change")}
                          </motion.button>
                        )}
                      </div>

                      {!isEditingUsername ? (
                        <div>
                          <p className={`text-[#f4e8c1] ${fontClass} break-all`}>
                            {currentUsername}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={tempUsername}
                            onChange={(e) => setTempUsername(e.target.value)}
                            onKeyDown={handleUsernameKeyPress}
                            className="w-full px-3 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none placeholder-[#c0a480]/60"
                            placeholder={t("profile.enterUsername")}
                            autoFocus
                          />
                          <div className="flex space-x-2">
                            <motion.button
                              onClick={handleSaveUsername}
                              className="flex-1 px-3 py-2 bg-gradient-to-r from-amber-500/80 to-orange-400/80 text-black rounded-lg hover:from-amber-400 hover:to-orange-300 transition-all duration-200 text-sm font-medium"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {t("common.save")}
                            </motion.button>
                            <motion.button
                              onClick={handleCancelEditUsername}
                              className="flex-1 px-3 py-2 border border-amber-500/30 text-[#f4e8c1] rounded-lg hover:bg-amber-500/10 transition-colors text-sm"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {t("common.cancel")}
                            </motion.button>
                          </div>
                        </div>
                      )}
                      
                      {usernameSuccess && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center space-x-2 text-green-400 text-sm mt-3"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>{t("profile.usernameUpdated")}</span>
                        </motion.div>
                      )}
                    </div>

                    {/* 积分管理 */}
                    <div className="bg-[#1c1c1c]/60 rounded-lg p-4 border border-[#333]/40">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-amber-400 mr-2"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 6v6l4 2"></path>
                          </svg>
                          <span className={`text-amber-400 font-medium ${fontClass}`}>
                            {t("profile.credits")}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <motion.button
                            onClick={handleOpenRedeemModal}
                            className={`text-xs px-2 py-1 text-[#c0a480] hover:text-amber-400 border border-[#534741] rounded hover:border-[#c0a480] transition-colors duration-200 ${fontClass}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {t("profile.redeemCredits")}
                          </motion.button>
                          <motion.button
                            onClick={handleBuyCredits}
                            className={`text-xs px-2 py-1 text-[#c0a480] hover:text-amber-400 border border-[#534741] rounded hover:border-[#c0a480] transition-colors duration-200 ${fontClass}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {t("profile.buyCredits")}
                          </motion.button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className={`text-[#c0a480] ${fontClass}`}>{t("profile.currentCredits")}</span>
                          <span className={`text-amber-400 text-xl font-bold ${fontClass}`}>{credits}</span>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className={`text-[#f4e8c1] font-medium ${fontClass}`}>{t("profile.creditHistory")}</h3>
                          </div>
                          <div className="bg-black/30 rounded-lg border border-[#333]/40 overflow-hidden">
                            {isLoadingCredits ? (
                              <div className={`py-8 text-center text-[#a18d6f] ${fontClass}`}>
                                <div className="flex justify-center items-center space-x-2">
                                  <svg className="animate-spin h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>加载中...</span>
                                </div>
                              </div>
                            ) : creditError ? (
                              <div className={`py-4 text-center text-red-400 ${fontClass}`}>
                                {creditError}
                              </div>
                            ) : creditHistory.length > 0 ? (
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-[#333]/40">
                                    <th className={`py-2 px-3 text-left text-[#c0a480] ${fontClass}`}>{t("profile.date")}</th>
                                    <th className={`py-2 px-3 text-left text-[#c0a480] ${fontClass}`}>{t("profile.description")}</th>
                                    <th className={`py-2 px-3 text-right text-[#c0a480] ${fontClass}`}>{t("profile.amount")}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {creditHistory.map((item) => (
                                    <tr key={item.id} className="border-b border-[#333]/20">
                                      <td className={`py-2 px-3 text-[#a18d6f] ${fontClass}`}>{item.date}</td>
                                      <td className={`py-2 px-3 text-[#f4e8c1] ${fontClass}`}>{item.description}</td>
                                      <td className={`py-2 px-3 text-right ${item.amount > 0 ? 'text-green-400' : 'text-red-400'} ${fontClass}`}>
                                        {item.amount > 0 ? '+' : ''}{item.amount}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div className={`py-4 text-center text-[#a18d6f] ${fontClass}`}>
                                {!user ? "登录后可查看积分记录" : t("profile.noCreditsHistory")}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 账户信息 */}
                    {user && (
                      <div className="bg-[#1c1c1c]/60 rounded-lg p-4 border border-[#333]/40">
                        <div className="flex items-center mb-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-amber-400 mr-2"
                          >
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                          </svg>
                          <span className={`text-amber-400 font-medium ${fontClass}`}>
                            {t("profile.accountInfo")}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className={`text-[#a18d6f] text-sm ${fontClass}`}>
                              {t("profile.email")}
                            </span>
                            <span className={`text-[#f4e8c1] text-sm ${fontClass} break-all`}>
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 积分兑换模态框 */}
      {isRedeemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md mx-4 bg-[#1c1c1c]/95 backdrop-blur-lg rounded-xl border border-amber-500/30 shadow-2xl shadow-amber-500/10 p-6"
          >
            <h2 className={`text-xl text-amber-400 font-medium mb-4 ${fontClass}`}>{t("profile.redeemCredits")}</h2>
            
            <p className={`text-sm text-[#c0a480] mb-4 ${fontClass}`}>
              {t("profile.redeemInstructions")}
            </p>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="redeemCode" className={`block text-sm text-[#c0a480] mb-2 ${fontClass}`}>
                  {t("profile.redeemCode")}
                </label>
                <input
                  id="redeemCode"
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  onKeyDown={handleRedeemKeyPress}
                  className="w-full px-4 py-3 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none placeholder-[#c0a480]/60 uppercase"
                  placeholder={t("profile.enterRedeemCode")}
                  autoFocus
                  disabled={isRedeeming}
                />
              </div>
              
              {redeemError && (
                <div className="text-red-400 text-sm px-2 py-1 rounded bg-red-500/10">
                  {redeemError}
                </div>
              )}
              
              {redeemSuccess && (
                <div className="text-green-400 text-sm px-2 py-1 rounded bg-green-500/10">
                  {redeemSuccess}
                </div>
              )}
              
              <div className="flex space-x-3">
                <motion.button
                  onClick={handleRedeemSubmit}
                  className={`flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-amber-500/80 to-orange-400/80 text-black rounded-lg hover:from-amber-400 hover:to-orange-300 transition-all duration-200 text-sm font-medium ${isRedeeming ? 'opacity-70 cursor-not-allowed' : ''}`}
                  whileHover={!isRedeeming ? { scale: 1.02 } : {}}
                  whileTap={!isRedeeming ? { scale: 0.98 } : {}}
                  disabled={isRedeeming}
                >
                  {isRedeeming ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("profile.redeemProcessing")}
                    </>
                  ) : t("profile.confirmRedeem")}
                </motion.button>
                <motion.button
                  onClick={handleCloseRedeemModal}
                  className="px-4 py-3 border border-amber-500/30 text-[#f4e8c1] rounded-lg hover:bg-amber-500/10 transition-colors text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t("common.cancel")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AuthGuard>
  );
} 