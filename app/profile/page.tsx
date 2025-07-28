"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/app/i18n";
import { motion } from "framer-motion";
import AuthGuard from "@/components/AuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { nanoid } from "nanoid";

// 定义积分历史记录类型
interface CreditHistory {
  id: number;
  date: string;
  amount: number;
  description: string;
}

// 定义分页相关常量和类型
const ITEMS_PER_PAGE = 5; // 每页显示5条记录

/**
 * 个人中心页面组件
 * 包含用户名修改、账户管理和积分管理功能
 */
export default function ProfilePage() {
  const { t, fontClass, serifFontClass } = useLanguage();
  const { user, updateUsername } = useAuth();
  // 用户相关状态
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
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(creditHistory.length / ITEMS_PER_PAGE);
  
  // 获取当前页显示的记录
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return creditHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  };
  
  // 积分兑换相关状态
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemError, setRedeemError] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  // VIP订阅相关状态
  const [vipStatus, setVipStatus] = useState<{ isVIP: boolean; vipExpiry: string | null }>({ 
    isVIP: false, 
    vipExpiry: null 
  });
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [subscribeSuccess, setSubscribeSuccess] = useState("");

  // 角色卡定制相关状态
  const [customCharacterDesc, setCustomCharacterDesc] = useState("");
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [customError, setCustomError] = useState("");
  const [customSuccess, setCustomSuccess] = useState("");
  const [customRequests, setCustomRequests] = useState<any[]>([]);
  const [isLoadingCustomRequests, setIsLoadingCustomRequests] = useState(false);
  const [customCurrentPage, setCustomCurrentPage] = useState(1);
  const [customTotalPages, setCustomTotalPages] = useState(1);
  const CUSTOM_ITEMS_PER_PAGE = 5;
  
  // 获取当前页的定制请求
  const getCurrentPageCustomRequests = () => {
    const startIndex = (customCurrentPage - 1) * CUSTOM_ITEMS_PER_PAGE;
    return customRequests.slice(startIndex, startIndex + CUSTOM_ITEMS_PER_PAGE);
  };
  
  // 生成状态进度条
  const getStatusProgressBar = (status: string) => {
    const steps = [
      { key: 'pending', label: '已提交', color: 'bg-yellow-500' },
      { key: 'processing', label: '处理中', color: 'bg-blue-500' },
      { key: 'completed', label: '已完成', color: 'bg-green-500' }
    ];
    
    // 如果是被拒绝的请求，显示特殊样式
    if (status === 'rejected') {
      return (
        <div className="flex items-center w-full">
          <div className="w-full h-2 bg-red-500/30 rounded-full">
            <div className="h-full bg-red-500 rounded-full w-full"></div>
          </div>
          <span className="ml-2 text-xs text-red-400">已拒绝</span>
        </div>
      );
    }
    
    // 找出当前状态的索引
    let currentStepIndex = steps.findIndex(step => step.key === status);
    if (currentStepIndex === -1) currentStepIndex = 0; // 默认为第一步
    
    // 计算进度条宽度
    const progress = (currentStepIndex + 1) / steps.length * 100;
    
    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs text-[#a18d6f]">
          {steps.map((step, idx) => (
            <div 
              key={step.key} 
              className={`${idx <= currentStepIndex ? 'text-amber-400' : 'text-[#666]'}`}
            >
              {step.label}
            </div>
          ))}
        </div>
        <div className="w-full h-1.5 bg-[#333]/50 rounded-full overflow-hidden">
          <div 
            className={`h-full ${steps[currentStepIndex].color} rounded-full transition-all duration-500 ease-in-out`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    );
  };

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
  
  // 获取VIP状态
  const fetchVIPStatus = async () => {
    try {
      if (!user?.email) {
        setVipStatus({ isVIP: false, vipExpiry: null });
        return;
      }
      
      const response = await fetch(`/api/user/vip-status?email=${encodeURIComponent(user.email)}`);
      if (!response.ok) {
        throw new Error('获取VIP状态失败');
      }
      
      const result = await response.json();
      if (result.success) {
        setVipStatus({
          isVIP: result.data.isVIP,
          vipExpiry: result.data.vipExpiry
        });
      } else {
        console.error('获取VIP状态失败:', result.error);
        setVipStatus({ isVIP: false, vipExpiry: null });
      }
    } catch (error) {
      console.error('获取VIP状态错误:', error);
      setVipStatus({ isVIP: false, vipExpiry: null });
    }
  };
  
  // 获取用户的角色卡定制请求历史
  const fetchCustomRequests = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingCustomRequests(true);
      const response = await fetch(`/api/user/custom-character?userId=${user.id}`);
      
      if (!response.ok) {
        throw new Error('获取定制请求失败');
      }
      
      const data = await response.json();
      if (data.success) {
        setCustomRequests(data.requests || []);
        // 计算总页数
        setCustomTotalPages(Math.max(1, Math.ceil((data.requests?.length || 0) / CUSTOM_ITEMS_PER_PAGE)));
      } else {
        console.error('获取定制请求失败:', data.error);
      }
    } catch (error) {
      console.error('获取定制请求错误:', error);
    } finally {
      setIsLoadingCustomRequests(false);
    }
  };
  
  // 提交角色卡定制请求
  const handleSubmitCustomRequest = async () => {
    if (!customCharacterDesc.trim()) {
      setCustomError("请输入角色卡描述");
      return;
    }
    
    if (customCharacterDesc.length < 10) {
      setCustomError("描述太短，请详细描述您想要的角色卡");
      return;
    }
    
    if (!user?.id) {
      setCustomError("请先登录后再提交");
      return;
    }
    
    // 检查用户积分是否足够
    if (credits < 10) {
      setCustomError("积分不足，定制一个角色卡需要10积分");
      return;
    }
    
    try {
      setIsSubmittingCustom(true);
      setCustomError("");
      setCustomSuccess("");
      
      const requestId = nanoid();
      
      const response = await fetch('/api/user/custom-character', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: requestId,
          userId: user.id,
          description: customCharacterDesc
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCustomSuccess("角色卡定制请求提交成功！我们会尽快处理");
        setCustomCharacterDesc("");
        // 更新积分和请求历史
        setCredits(prev => prev - 10);
        fetchCreditsData();
        fetchCustomRequests();
        
        // 3秒后清除成功消息
        setTimeout(() => setCustomSuccess(''), 5000);
      } else {
        setCustomError(result.error || "提交失败，请稍后再试");
      }
    } catch (error) {
      console.error('提交定制请求失败:', error);
      setCustomError("提交过程中出错，请稍后再试");
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  // 从API获取数据
  useEffect(() => {
    if (user) {
      fetchCreditsData();
      fetchVIPStatus();
      fetchCustomRequests(); // 获取定制请求历史
    } else {
      // 未登录用户，设置积分为0并清空历史记录
      setCredits(0);
      setCreditHistory([]);
      setIsLoadingCredits(false);
      setCreditError("");
      setVipStatus({ isVIP: false, vipExpiry: null });
      setCustomRequests([]);
    }
  }, [user]);

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
  
  // 处理VIP订阅
  const handleSubscribe = async (plan: string) => {
    if (!user?.email) {
      alert('请先登录后再订阅');
      return;
    }
    
    // 验证积分是否足够
    let requiredCredits = 10;
    if (plan === '30days') {
      requiredCredits = 30;
    } else if (plan === 'permanent') {
      requiredCredits = 199;
    }
    
    if (credits < requiredCredits) {
      let planName = '7天VIP';
      if (plan === '30days') planName = '30天VIP';
      else if (plan === 'permanent') planName = '永久VIP';
      
      setSubscribeError(`积分不足，${planName}需要${requiredCredits}积分，您当前有${credits}积分`);
      return;
    }
    
    try {
      setIsSubscribing(true);
      setSubscribeError('');
      setSubscribeSuccess('');
      
      const response = await fetch('/api/user/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          plan
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        let successMsg = '';
        if (plan === '7days') successMsg = '已成功订阅7天VIP！';
        else if (plan === '30days') successMsg = '已成功订阅30天VIP！';
        else if (plan === 'permanent') successMsg = '已成功订阅永久VIP！';
        
        setSubscribeSuccess(successMsg);
        // 更新积分和VIP状态
        setCredits(result.data.credits);
        setVipStatus({
          isVIP: true,
          vipExpiry: result.data.vipExpiry
        });
        // 刷新积分历史
        fetchCreditsData();
        
        // 3秒后清除成功消息
        setTimeout(() => setSubscribeSuccess(''), 3000);
      } else {
        setSubscribeError(result.error || '订阅失败，请稍后再试');
      }
    } catch (error) {
      console.error('订阅失败:', error);
      setSubscribeError('订阅过程中出错，请稍后再试');
    } finally {
      setIsSubscribing(false);
    }
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

  // 判断是否为永久VIP（VIP有效期接近数据库支持的最大日期）
  const isVeryFarFutureDate = (dateString: string) => {
    const date = new Date(dateString);
    // 判断日期是否接近2038年，表示永久VIP
    return date.getFullYear() >= 2037;
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
                              <>
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-[#333]/40">
                                      <th className={`py-2 px-3 text-left text-[#c0a480] ${fontClass}`}>{t("profile.date")}</th>
                                      <th className={`py-2 px-3 text-left text-[#c0a480] ${fontClass}`}>{t("profile.description")}</th>
                                      <th className={`py-2 px-3 text-right text-[#c0a480] ${fontClass}`}>{t("profile.amount")}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {getCurrentPageItems().map((item) => (
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
                                
                                {/* 分页控件 */}
                                {totalPages > 1 && (
                                  <div className="flex justify-center items-center space-x-2 py-2 px-3 border-t border-[#333]/20">
                                    <button
                                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                      disabled={currentPage === 1}
                                      className={`p-1 rounded ${currentPage === 1 ? 'text-[#534741] cursor-not-allowed' : 'text-[#c0a480] hover:text-[#ffd475]'} transition-colors`}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                    
                                    <div className={`text-xs text-[#c0a480] ${fontClass}`}>
                                      第 {currentPage} 页，共 {totalPages} 页
                                    </div>
                                    
                                    <button
                                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                      disabled={currentPage === totalPages}
                                      className={`p-1 rounded ${currentPage === totalPages ? 'text-[#534741] cursor-not-allowed' : 'text-[#c0a480] hover:text-[#ffd475]'} transition-colors`}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className={`py-4 text-center text-[#a18d6f] ${fontClass}`}>
                                {!user ? "登录后可查看积分记录" : t("profile.noCreditsHistory")}
                              </div>
                            )
                          }
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* VIP订阅管理 */}
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
                            <path d="M20 6L9 17l-5-5"></path>
                            <path d="M19 10a9 9 0 1 1-7-9"></path>
                          </svg>
                          <span className={`text-amber-400 font-medium ${fontClass}`}>
                            VIP角色专区订阅
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* VIP状态显示 */}
                        <div className="flex justify-between items-center">
                          <span className={`text-[#c0a480] ${fontClass}`}>当前VIP状态</span>
                          {vipStatus.isVIP ? (
                            <span className={`text-green-400 ${fontClass}`}>
                              {isVeryFarFutureDate(vipStatus.vipExpiry!) ? "永久VIP" : `有效期至: ${new Date(vipStatus.vipExpiry!).toLocaleDateString()}`}
                            </span>
                          ) : (
                            <span className={`text-[#c0a480] ${fontClass}`}>未订阅</span>
                          )}
                        </div>
                        
                        {/* 订阅计划 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          {/* 7天VIP */}
                          <div className="bg-black/30 rounded-lg border border-[#534741] p-4 hover:border-amber-500/30 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className={`text-[#f4e8c1] font-medium ${fontClass}`}>7天VIP</h3>
                              <span className={`text-amber-400 font-bold ${fontClass}`}>10积分</span>
                            </div>
                            <p className={`text-xs text-[#a18d6f] mb-3 ${fontClass}`}>
                              订阅7天VIP角色专区访问权限
                            </p>
                            <button
                              onClick={() => handleSubscribe('7days')}
                              disabled={isSubscribing || credits < 10}
                              className={`w-full px-3 py-2 rounded-lg text-sm ${
                                isSubscribing
                                  ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                                  : credits < 10
                                  ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                                  : 'bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:from-amber-400 hover:to-amber-300'
                              } transition-colors ${fontClass}`}
                            >
                              {isSubscribing ? '订阅中...' : credits < 10 ? '积分不足' : '立即订阅'}
                            </button>
                          </div>
                          
                          {/* 30天VIP */}
                          <div className="bg-black/30 rounded-lg border border-[#534741] p-4 hover:border-amber-500/30 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className={`text-[#f4e8c1] font-medium ${fontClass}`}>30天VIP</h3>
                              <span className={`text-amber-400 font-bold ${fontClass}`}>30积分</span>
                            </div>
                            <p className={`text-xs text-[#a18d6f] mb-3 ${fontClass}`}>
                              订阅30天VIP角色专区访问权限（更划算）
                            </p>
                            <button
                              onClick={() => handleSubscribe('30days')}
                              disabled={isSubscribing || credits < 30}
                              className={`w-full px-3 py-2 rounded-lg text-sm ${
                                isSubscribing
                                  ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                                  : credits < 30
                                  ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                                  : 'bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:from-amber-400 hover:to-amber-300'
                              } transition-colors ${fontClass}`}
                            >
                              {isSubscribing ? '订阅中...' : credits < 30 ? '积分不足' : '立即订阅'}
                            </button>
                          </div>
                          
                          {/* 永久VIP */}
                          <div className="bg-black/30 rounded-lg border border-[#534741] col-span-1 sm:col-span-2 p-4 hover:border-amber-500/30 transition-colors mt-2">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className={`text-[#f4e8c1] font-medium ${fontClass}`}>永久VIP</h3>
                              <span className={`text-amber-400 font-bold ${fontClass}`}>199积分</span>
                            </div>
                            <p className={`text-xs text-[#a18d6f] mb-3 ${fontClass}`}>
                              一次订阅，永久享有VIP角色专区访问权限（超值优惠）
                            </p>
                            <button
                              onClick={() => handleSubscribe('permanent')}
                              disabled={isSubscribing || credits < 199}
                              className={`w-full px-3 py-2 rounded-lg text-sm ${
                                isSubscribing
                                  ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                                  : credits < 199
                                  ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                                  : 'bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:from-amber-400 hover:to-amber-300'
                              } transition-colors ${fontClass}`}
                            >
                              {isSubscribing ? '订阅中...' : credits < 199 ? '积分不足' : '立即订阅'}
                            </button>
                          </div>
                        </div>
                        
                        {/* 订阅消息 */}
                        {subscribeError && (
                          <div className="mt-3 text-red-400 text-sm px-3 py-2 rounded bg-red-500/10">
                            {subscribeError}
                          </div>
                        )}
                        
                        {subscribeSuccess && (
                          <div className="mt-3 text-green-400 text-sm px-3 py-2 rounded bg-green-500/10">
                            {subscribeSuccess}
                          </div>
                        )}
                        
                        <div className={`text-xs text-[#a18d6f] mt-3 ${fontClass}`}>
                          VIP会员可以下载并导入VIP角色专区中的所有角色卡
                        </div>
                      </div>
                    </div>

                    {/* 角色卡定制区域 */}
                    <div id="custom-character" className="bg-[#1c1c1c]/60 rounded-lg p-4 border border-[#333]/40 mb-6">
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
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          </svg>
                          <span className={`text-amber-400 font-medium ${fontClass}`}>
                            角色卡定制
                          </span>
                        </div>
                        <div className="text-amber-400 font-bold">
                          10 积分/次
                        </div>
                      </div>

                      <div className="space-y-4">
                        <p className={`text-sm text-[#c0a480] ${fontClass}`}>
                          找不到心仪的角色？告诉我们您想要的角色卡描述，我们会为您定制！
                        </p>
                        
                        <div>
                          <label className={`block text-sm text-[#c0a480] mb-2 ${fontClass}`}>
                            角色卡描述
                          </label>
                          <textarea 
                            value={customCharacterDesc}
                            onChange={(e) => setCustomCharacterDesc(e.target.value)}
                            placeholder="请详细描述您想要的角色卡，包括性格、外貌、背景故事等..."
                            className="w-full px-3 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none placeholder-[#c0a480]/60 min-h-[120px]"
                          ></textarea>
                        </div>
                        
                        {customError && (
                          <div className="text-red-400 text-sm px-3 py-2 rounded bg-red-500/10">
                            {customError}
                          </div>
                        )}
                        
                        {customSuccess && (
                          <div className="text-green-400 text-sm px-3 py-2 rounded bg-green-500/10">
                            {customSuccess}
                          </div>
                        )}
                        
                        <motion.button
                          onClick={handleSubmitCustomRequest}
                          disabled={isSubmittingCustom || !customCharacterDesc.trim() || credits < 10}
                          className={`w-full px-4 py-3 rounded-lg text-sm ${
                            isSubmittingCustom
                              ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                              : credits < 10 || !customCharacterDesc.trim()
                              ? 'bg-gray-700 cursor-not-allowed text-gray-400'
                              : 'bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:from-amber-400 hover:to-amber-300'
                          } transition-colors ${fontClass}`}
                          whileHover={!isSubmittingCustom && credits >= 10 && customCharacterDesc.trim() ? { scale: 1.01 } : {}}
                          whileTap={!isSubmittingCustom && credits >= 10 && customCharacterDesc.trim() ? { scale: 0.98 } : {}}
                        >
                          {isSubmittingCustom ? '提交中...' : credits < 10 ? '积分不足' : '提交定制请求'}
                        </motion.button>
                        
                        <div className={`text-xs text-[#a18d6f] ${fontClass}`}>
                          每次提交定制请求需要消耗10积分，我们会尽快处理您的请求。
                        </div>
                        
                        {/* 定制请求历史 */}
                        {user && (
                          <div className="mt-4">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className={`text-[#f4e8c1] font-medium ${fontClass}`}>定制请求历史</h3>
                            </div>
                            
                            <div className="bg-black/30 rounded-lg border border-[#333]/40 overflow-hidden">
                              {isLoadingCustomRequests ? (
                                <div className={`py-6 text-center text-[#a18d6f] ${fontClass}`}>
                                  <div className="flex justify-center items-center space-x-2">
                                    <svg className="animate-spin h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>加载中...</span>
                                  </div>
                                </div>
                              ) : customRequests.length === 0 ? (
                                <div className={`py-6 text-center text-[#a18d6f] ${fontClass}`}>
                                  暂无定制请求记录
                                </div>
                              ) : (
                                <div className="divide-y divide-[#333]/40">
                                  {getCurrentPageCustomRequests().map((request) => (
                                    <div key={request.id} className="p-3">
                                      <div className="flex justify-between items-start mb-2">
                                        <span className={`text-xs text-[#a18d6f] ${fontClass}`}>
                                          {new Date(request.created_at).toLocaleString()}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                          request.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                          request.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                                          request.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                          'bg-yellow-500/20 text-yellow-400'
                                        } ${fontClass}`}>
                                          {
                                            request.status === 'completed' ? '已完成' :
                                            request.status === 'processing' ? '处理中' :
                                            request.status === 'rejected' ? '已拒绝' :
                                            '待处理'
                                          }
                                        </span>
                                      </div>
                                      <div className={`text-[#f4e8c1] text-sm mb-3 ${fontClass}`}>
                                        <div className="line-clamp-2">{request.description}</div>
                                      </div>
                                      
                                      {/* 状态进度条 */}
                                      <div className="mb-1">
                                        {getStatusProgressBar(request.status)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* 分页控件 */}
                            {customTotalPages > 1 && (
                              <div className="flex justify-center items-center space-x-2 py-2 px-3 border-t border-[#333]/20">
                                <button
                                  onClick={() => setCustomCurrentPage(p => Math.max(1, p - 1))}
                                  disabled={customCurrentPage === 1}
                                  className={`p-1 rounded ${customCurrentPage === 1 ? 'text-[#534741] cursor-not-allowed' : 'text-[#c0a480] hover:text-[#ffd475]'} transition-colors`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                
                                <div className={`text-xs text-[#c0a480] ${fontClass}`}>
                                  第 {customCurrentPage} 页，共 {customTotalPages} 页
                                </div>
                                
                                <button
                                  onClick={() => setCustomCurrentPage(p => Math.min(customTotalPages, p + 1))}
                                  disabled={customCurrentPage === customTotalPages}
                                  className={`p-1 rounded ${customCurrentPage === customTotalPages ? 'text-[#534741] cursor-not-allowed' : 'text-[#c0a480] hover:text-[#ffd475]'} transition-colors`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
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