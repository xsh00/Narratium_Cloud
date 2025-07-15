"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/app/i18n';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AuthPage() {
  const { user, isAuthenticated, login, register, sendVerificationCode, sendResetPasswordCode, resetPassword } = useAuth();
  const { t, fontClass, titleFontClass, serifFontClass } = useLanguage();
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailConfigStatus, setEmailConfigStatus] = useState<string>('');

  // 检查邮件配置状态
  useEffect(() => {
    const checkEmailConfig = async () => {
      try {
        const response = await fetch('/api/auth/check-email-config');
        const data = await response.json();
        if (data.success && !data.configStatus.isConfigured) {
          setEmailConfigStatus('邮件服务未配置，注册功能可能不可用');
        }
      } catch (error) {
        console.error('邮件配置检查失败:', error);
      }
    };

    checkEmailConfig();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = isForgotPassword 
      ? await sendResetPasswordCode(email)
      : await sendVerificationCode(email);
    
    if (result.success) {
      setSuccess(result.message);
      setCodeSent(true);
      setCountdown(60);
    } else {
      setError(result.message);
    }
    
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (isForgotPassword) {
      if (!verificationCode) {
        setError('请输入验证码');
        setIsLoading(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        setIsLoading(false);
        return;
      }
      
      const result = await resetPassword(email, verificationCode, password);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => {
          setIsForgotPassword(false);
          setPassword('');
          setConfirmPassword('');
          setVerificationCode('');
          setCodeSent(false);
        }, 2000);
      } else {
        setError(result.message);
      }
    } else if (isLogin) {
      const result = await login(email, password);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => router.push('/'), 1000);
      } else {
        setError(result.message);
      }
    } else {
      if (!verificationCode) {
        setError('请输入验证码');
        setIsLoading(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        setIsLoading(false);
        return;
      }
      
      const result = await register(email, password, verificationCode);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => router.push('/'), 1000);
      } else {
        setError(result.message);
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="h-screen fantasy-bg flex flex-col items-start justify-start p-0 sm:items-center sm:justify-center sm:p-4">
      <div className="w-full max-w-md mx-auto mt-6 sm:mt-0">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8 mt-6 sm:mt-0">
          <div className="flex items-center justify-center mb-3 sm:mb-4">
            <Image
              src="/logo.png"
              alt="Narratium"
              width={100}
              height={25}
              className="object-contain sm:w-[120px] sm:h-[30px]"
            />
          </div>
          <h1 className={`text-xl font-bold text-[#f8d36a] ${titleFontClass} sm:text-2xl`}>
            Narratium
          </h1>
          <p className="text-[#a18d6f] mt-1 text-sm sm:text-base sm:mt-2">AI 角色扮演平台</p>
        </div>

        {/* Auth Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1714] border border-[#534741] rounded-lg p-4 shadow-lg sm:p-6"
        >
          {/* Tabs */}
          {!isForgotPassword && (
            <div className="flex mb-4 sm:mb-6">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setIsForgotPassword(false);
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-2 px-3 rounded-l-lg transition-all duration-300 text-sm sm:text-base sm:px-4 ${
                  isLogin
                    ? 'bg-[#f8d36a] text-[#1a1714]'
                    : 'bg-[#2a231c] text-[#a18d6f] hover:text-[#f8d36a]'
                }`}
              >
                登录
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setIsForgotPassword(false);
                  setError('');
                  setSuccess('');
                }}
                className={`flex-1 py-2 px-3 rounded-r-lg transition-all duration-300 text-sm sm:text-base sm:px-4 ${
                  !isLogin
                    ? 'bg-[#f8d36a] text-[#1a1714]'
                    : 'bg-[#2a231c] text-[#a18d6f] hover:text-[#f8d36a]'
                }`}
              >
                注册
              </button>
            </div>
          )}
          
          {/* Forgot Password Header */}
          {isForgotPassword && (
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg font-semibold text-[#f4e8c1] text-center mb-2">重置密码</h2>
              <p className="text-[#a18d6f] text-sm text-center">请输入您的邮箱地址，我们将发送验证码</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[#f4e8c1] text-sm mb-1 sm:mb-2">邮箱地址</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#2a231c] border border-[#534741] rounded-lg text-[#f4e8c1] placeholder-[#a18d6f] focus:outline-none focus:border-[#f8d36a] transition-colors text-sm sm:text-base"
                placeholder="请输入邮箱地址"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[#f4e8c1] text-sm mb-1 sm:mb-2">
                {isForgotPassword ? '新密码' : '密码'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#2a231c] border border-[#534741] rounded-lg text-[#f4e8c1] placeholder-[#a18d6f] focus:outline-none focus:border-[#f8d36a] transition-colors text-sm sm:text-base"
                placeholder={isForgotPassword ? "请输入新密码" : "请输入密码"}
                required
              />
            </div>

            {/* Confirm Password (Register and Forgot Password) */}
            {(!isLogin || isForgotPassword) && (
              <div>
                <label className="block text-[#f4e8c1] text-sm mb-1 sm:mb-2">确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#2a231c] border border-[#534741] rounded-lg text-[#f4e8c1] placeholder-[#a18d6f] focus:outline-none focus:border-[#f8d36a] transition-colors text-sm sm:text-base"
                  placeholder="请再次输入密码"
                  required
                />
              </div>
            )}

            {/* Forgot Password Link (Login only) */}
            {isLogin && !isForgotPassword && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setError('');
                    setSuccess('');
                    setPassword('');
                    setConfirmPassword('');
                    setVerificationCode('');
                    setCodeSent(false);
                  }}
                  className="text-[#f8d36a] hover:text-[#e6c85a] text-sm transition-colors"
                >
                  忘记密码？
                </button>
              </div>
            )}

            {/* Verification Code (Register and Forgot Password) */}
            {(!isLogin || isForgotPassword) && (
              <div>
                <label className="block text-[#f4e8c1] text-sm mb-1 sm:mb-2">验证码</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#2a231c] border border-[#534741] rounded-lg text-[#f4e8c1] placeholder-[#a18d6f] focus:outline-none focus:border-[#f8d36a] transition-colors text-sm sm:text-base"
                    placeholder="请输入验证码"
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isLoading || countdown > 0 || !email}
                    className="px-3 py-2 bg-[#f8d36a] text-[#1a1714] rounded-lg hover:bg-[#e6c85a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm whitespace-nowrap sm:px-4"
                  >
                    {countdown > 0 ? `${countdown}s` : '发送验证码'}
                  </button>
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs sm:text-sm sm:p-3"
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-2 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-xs sm:text-sm sm:p-3"
                >
                  {success}
                </motion.div>
              )}
              {emailConfigStatus && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-xs sm:text-sm sm:p-3"
                >
                  ⚠️ {emailConfigStatus}
                  <br />
                  <a 
                    href="/docs/EMAIL_SETUP.md" 
                    target="_blank"
                    className="underline hover:text-yellow-300"
                  >
                    查看配置说明
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-[#f8d36a] text-[#1a1714] rounded-lg hover:bg-[#e6c85a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base sm:py-3"
            >
              {isLoading ? '处理中...' : (
                isForgotPassword ? '重置密码' : 
                isLogin ? '登录' : '注册'
              )}
            </button>

            {/* Back to Login (Forgot Password only) */}
            {isForgotPassword && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setIsLogin(true);
                    setError('');
                    setSuccess('');
                    setPassword('');
                    setConfirmPassword('');
                    setVerificationCode('');
                    setCodeSent(false);
                  }}
                  className="text-[#a18d6f] hover:text-[#f8d36a] text-sm transition-colors"
                >
                  ← 返回登录
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
} 