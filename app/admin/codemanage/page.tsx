"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/app/i18n";
import AdminLayout from "@/components/AdminLayout";
import { motion } from "framer-motion";

interface RedeemCode {
  id: number;
  code: string;
  amount: number;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  expires_at: string | null;
  created_by: string | null;
  batch_id: string | null;
  userInfo?: {
    username: string;
    email: string;
  };
}

interface PaginationData {
  total: number;
  pages: number;
  currentPage: number;
  pageSize: number;
  data: RedeemCode[];
}

/**
 * 兑换码管理页面
 */
export default function CodeManagePage() {
  const { fontClass, serifFontClass } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  // 兑换码列表
  const [codes, setCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 0,
    currentPage: 1,
    pageSize: 20,
    data: []
  });
  
  // 筛选选项
  const [isUsedFilter, setIsUsedFilter] = useState<string>("all");
  const [batchIdFilter, setBatchIdFilter] = useState("");
  const [batchList, setBatchList] = useState<string[]>([]);
  
  // 导入/生成兑换码
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<"generate" | "import">("generate");
  const [codeAmount, setCodeAmount] = useState(100);
  const [codeCount, setCodeCount] = useState(10);
  const [codesToImport, setCodesToImport] = useState("");
  const [expiresInDays, setExpiresInDays] = useState(0);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState("");
  const [importError, setImportError] = useState("");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  
  // 验证管理员身份
  const handleLogin = async () => {
    if (!username || !password) {
      setLoginError("请输入用户名和密码");
      return;
    }
    
    setAuthLoading(true);
    setLoginError("");
    
    try {
      // 使用硬编码的管理员凭据进行验证
      if (username === "admin" && password === "0107151457nk") {
        // 保存身份验证信息到 localStorage
        localStorage.setItem("adminAuthenticated", "true");
        localStorage.setItem("adminUsername", username);
        setIsAuthenticated(true);
      } else {
        setLoginError("用户名或密码不正确");
      }
    } catch (error) {
      console.error("验证失败:", error);
      setLoginError("验证失败，请重试");
    } finally {
      setAuthLoading(false);
    }
  };
  
  // 检查是否已登录
  useEffect(() => {
    const authenticated = localStorage.getItem("adminAuthenticated") === "true";
    setIsAuthenticated(authenticated);
  }, []);
  
  // 获取兑换码列表
  const fetchCodes = async (page: number = 1) => {
    setLoading(true);
    setError("");
    
    try {
      const authString = localStorage.getItem('adminUsername');
      if (!authString) {
        throw new Error("未授权");
      }
      
      let url = `/api/admin/codemanage?page=${page}&pageSize=${pagination.pageSize}`;
      
      if (isUsedFilter !== "all") {
        url += `&isUsed=${isUsedFilter === "used"}`;
      }
      
      if (batchIdFilter) {
        url += `&batchId=${encodeURIComponent(batchIdFilter)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${btoa('admin:0107151457nk')}`, // 使用硬编码的管理员凭据
          'x-admin-authenticated': 'true'
        }
      });
      
      if (!response.ok) {
        throw new Error("获取兑换码失败");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCodes(data.data);
        setPagination({
          total: data.total,
          pages: data.pages,
          currentPage: data.currentPage,
          pageSize: data.pageSize,
          data: data.data
        });
        
        // 提取批次ID列表
        const batches = new Set<string>();
        data.data.forEach((code: RedeemCode) => {
          if (code.batch_id) {
            batches.add(code.batch_id);
          }
        });
        setBatchList(Array.from(batches));
      } else {
        throw new Error(data.message || "获取兑换码失败");
      }
    } catch (error: any) {
      console.error("获取兑换码失败:", error);
      setError(error.message || "获取兑换码失败");
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    if (isAuthenticated) {
      fetchCodes();
    }
  }, [isAuthenticated]);
  
  // 处理筛选变化
  useEffect(() => {
    if (isAuthenticated) {
      fetchCodes(1); // 重置到第一页
    }
  }, [isUsedFilter, batchIdFilter]);
  
  // 处理页面变化
  const handlePageChange = (page: number) => {
    if (page !== pagination.currentPage) {
      fetchCodes(page);
    }
  };
  
  // 打开导入模态框
  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
    setImportMode("generate");
    setCodeAmount(100);
    setCodeCount(10);
    setCodesToImport("");
    setExpiresInDays(0);
    setImportSuccess("");
    setImportError("");
    setGeneratedCodes([]);
  };
  
  // 关闭导入模态框
  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };
  
  // 生成或导入兑换码
  const handleImportCodes = async () => {
    setImportLoading(true);
    setImportError("");
    setImportSuccess("");
    
    try {
      const authString = localStorage.getItem('adminUsername');
      if (!authString) {
        throw new Error("未授权");
      }
      
      let requestBody: any = {
        amount: codeAmount
      };
      
      if (expiresInDays > 0) {
        requestBody.expiresInDays = expiresInDays;
      }
      
      if (importMode === "generate") {
        requestBody.count = codeCount;
      } else {
        // 解析导入的兑换码
        const codes = codesToImport
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        if (codes.length === 0) {
          throw new Error("请输入至少一个兑换码");
        }
        
        requestBody.codes = codes;
      }
      
      const response = await fetch('/api/admin/codemanage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa('admin:0107151457nk')}`, // 使用硬编码的管理员凭据
          'x-admin-authenticated': 'true'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setImportSuccess(data.message || "兑换码操作成功");
        
        // 如果是生成模式并返回了生成的兑换码，显示它们
        if (importMode === "generate" && data.codes && data.codes.length) {
          setGeneratedCodes(data.codes);
        } else {
          // 如果是导入模式，3秒后关闭模态框
          setTimeout(() => {
            setIsImportModalOpen(false);
          }, 3000);
        }
        
        // 重新获取列表
        fetchCodes();
      } else {
        throw new Error(data.message || "操作失败");
      }
    } catch (error: any) {
      console.error("兑换码操作失败:", error);
      setImportError(error.message || "操作失败，请重试");
    } finally {
      setImportLoading(false);
    }
  };
  
  // 复制生成的兑换码到剪贴板
  const handleCopyGeneratedCodes = () => {
    navigator.clipboard.writeText(generatedCodes.join('\n'))
      .then(() => {
        alert("已复制到剪贴板");
      })
      .catch(err => {
        console.error("复制失败:", err);
        alert("复制失败，请手动复制");
      });
  };
  
  // 下载生成的兑换码
  const handleDownloadGeneratedCodes = () => {
    const blob = new Blob([generatedCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redeem_codes_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout title="积分兑换码管理">
      <div className="p-4 md:p-6">
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto bg-[#1c1c1c]/60 rounded-lg p-6 border border-[#333]/40">
            <h2 className={`text-xl text-amber-400 font-medium mb-6 ${serifFontClass}`}>
              管理员登录
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm text-[#c0a480] mb-2 ${fontClass}`}>
                  用户名
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none"
                  placeholder="输入用户名"
                />
              </div>
              
              <div>
                <label className={`block text-sm text-[#c0a480] mb-2 ${fontClass}`}>
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none"
                  placeholder="输入密码"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
              
              {loginError && (
                <div className="text-red-400 text-sm px-3 py-2 rounded bg-red-500/10">
                  {loginError}
                </div>
              )}
              
              <div>
                <button
                  onClick={handleLogin}
                  disabled={authLoading}
                  className={`w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-amber-500/80 to-orange-400/80 text-black rounded-lg hover:from-amber-400 hover:to-orange-300 transition-all duration-200 ${authLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {authLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      登录中...
                    </>
                  ) : "登录"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between mb-6">
              <h1 className={`text-xl text-amber-400 font-medium mb-2 md:mb-0 ${serifFontClass}`}>
                积分兑换码管理
              </h1>
              
              <motion.button
                onClick={handleOpenImportModal}
                className="px-4 py-2 bg-gradient-to-r from-amber-500/80 to-orange-400/80 text-black rounded-lg hover:from-amber-400 hover:to-orange-300 transition-all duration-200 text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                生成/导入兑换码
              </motion.button>
            </div>
            
            <div className="bg-[#1c1c1c]/60 rounded-lg p-4 border border-[#333]/40 mb-6">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className={`block text-sm text-[#c0a480] mb-2 ${fontClass}`}>
                    使用状态
                  </label>
                  <select
                    value={isUsedFilter}
                    onChange={(e) => setIsUsedFilter(e.target.value)}
                    className="px-3 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none"
                  >
                    <option value="all">全部</option>
                    <option value="used">已使用</option>
                    <option value="unused">未使用</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm text-[#c0a480] mb-2 ${fontClass}`}>
                    批次ID
                  </label>
                  <select
                    value={batchIdFilter}
                    onChange={(e) => setBatchIdFilter(e.target.value)}
                    className="px-3 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none"
                  >
                    <option value="">全部批次</option>
                    {batchList.map((batch) => (
                      <option key={batch} value={batch}>
                        {batch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1c1c1c]/60 rounded-lg border border-[#333]/40 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="flex justify-center items-center space-x-2 text-amber-400">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>加载中...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-400">
                  {error}
                </div>
              ) : codes.length === 0 ? (
                <div className="p-8 text-center text-[#a18d6f]">
                  暂无兑换码数据
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#333]/40">
                        <th className={`py-3 px-4 text-left text-[#c0a480] ${fontClass}`}>兑换码</th>
                        <th className={`py-3 px-4 text-left text-[#c0a480] ${fontClass}`}>积分</th>
                        <th className={`py-3 px-4 text-left text-[#c0a480] ${fontClass}`}>状态</th>
                        <th className={`py-3 px-4 text-left text-[#c0a480] ${fontClass}`}>使用者</th>
                        <th className={`py-3 px-4 text-left text-[#c0a480] ${fontClass}`}>创建时间</th>
                        <th className={`py-3 px-4 text-left text-[#c0a480] ${fontClass}`}>使用时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codes.map((code) => (
                        <tr key={code.id} className="border-b border-[#333]/20">
                          <td className={`py-3 px-4 text-[#f4e8c1] ${fontClass} font-mono`}>{code.code}</td>
                          <td className={`py-3 px-4 text-[#f4e8c1] ${fontClass}`}>{code.amount}</td>
                          <td className={`py-3 px-4 ${fontClass}`}>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              code.is_used 
                                ? 'bg-red-500/20 text-red-400' 
                                : 'bg-green-500/20 text-green-400'
                            }`}>
                              {code.is_used ? '已使用' : '未使用'}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-[#a18d6f] ${fontClass}`}>
                            {code.is_used && code.userInfo ? (
                              <div>
                                <div>{code.userInfo.username}</div>
                                <div className="text-xs text-[#8a7a60]">{code.userInfo.email}</div>
                              </div>
                            ) : code.is_used ? '未知用户' : '-'}
                          </td>
                          <td className={`py-3 px-4 text-[#a18d6f] ${fontClass}`}>
                            {new Date(code.created_at).toLocaleString('zh-CN')}
                          </td>
                          <td className={`py-3 px-4 text-[#a18d6f] ${fontClass}`}>
                            {code.used_at ? new Date(code.used_at).toLocaleString('zh-CN') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {pagination.pages > 1 && (
                    <div className="flex justify-center py-4 space-x-2">
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-8 h-8 rounded-md ${
                            page === pagination.currentPage
                              ? 'bg-amber-500 text-black'
                              : 'bg-[#333]/40 text-[#c0a480] hover:bg-amber-500/30'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 统计信息 */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="bg-[#1c1c1c]/60 rounded-lg p-4 border border-[#333]/40 flex-1">
                <div className="text-[#a18d6f] text-sm mb-1">兑换码总数</div>
                <div className="text-xl text-amber-400 font-bold">{pagination.total}</div>
              </div>
              
              <div className="bg-[#1c1c1c]/60 rounded-lg p-4 border border-[#333]/40 flex-1">
                <div className="text-[#a18d6f] text-sm mb-1">已使用</div>
                <div className="text-xl text-red-400 font-bold">
                  {codes.filter(c => c.is_used).length}
                </div>
              </div>
              
              <div className="bg-[#1c1c1c]/60 rounded-lg p-4 border border-[#333]/40 flex-1">
                <div className="text-[#a18d6f] text-sm mb-1">未使用</div>
                <div className="text-xl text-green-400 font-bold">
                  {codes.filter(c => !c.is_used).length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 生成/导入兑换码模态框 */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-2xl mx-4 bg-[#1c1c1c]/95 backdrop-blur-lg rounded-xl border border-amber-500/30 shadow-2xl shadow-amber-500/10 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className={`text-xl text-amber-400 font-medium mb-4 ${serifFontClass}`}>
              {importMode === "generate" ? "生成兑换码" : "导入兑换码"}
            </h2>
            
            <div className="space-y-6">
              {/* 切换模式 */}
              <div className="flex space-x-4">
                <button
                  onClick={() => setImportMode("generate")}
                  className={`flex-1 py-2 rounded-lg border ${
                    importMode === "generate"
                      ? "bg-amber-500/20 border-amber-500/60 text-amber-400"
                      : "border-[#333]/40 text-[#c0a480]"
                  }`}
                >
                  生成新兑换码
                </button>
                <button
                  onClick={() => setImportMode("import")}
                  className={`flex-1 py-2 rounded-lg border ${
                    importMode === "import"
                      ? "bg-amber-500/20 border-amber-500/60 text-amber-400"
                      : "border-[#333]/40 text-[#c0a480]"
                  }`}
                >
                  导入已有兑换码
                </button>
              </div>
              
              {importMode === "generate" ? (
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm text-[#c0a480] mb-2 ${fontClass}`}>
                      兑换码数量
                    </label>
                    <input
                      type="number"
                      value={codeCount}
                      onChange={(e) => setCodeCount(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      className="w-full px-4 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none"
                      placeholder="输入生成数量"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm text-[#c0a480] mb-2 ${fontClass}`}>
                      积分面值
                    </label>
                    <input
                      type="number"
                      value={codeAmount}
                      onChange={(e) => setCodeAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      className="w-full px-4 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none"
                      placeholder="输入积分面值"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className={`block text-sm text-[#c0a480] mb-2 ${fontClass}`}>
                    导入兑换码（每行一个）
                  </label>
                  <textarea
                    value={codesToImport}
                    onChange={(e) => setCodesToImport(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none font-mono"
                    placeholder="输入兑换码，每行一个"
                  />
                  
                  <div className="mt-4">
                    <label className={`block text-sm text-[#c0a480] mb-2 ${fontClass}`}>
                      积分面值（适用于所有导入的兑换码）
                    </label>
                    <input
                      type="number"
                      value={codeAmount}
                      onChange={(e) => setCodeAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      className="w-full px-4 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none"
                      placeholder="输入积分面值"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className={`block text-sm text-[#c0a480] mb-2 ${fontClass}`}>
                  有效期（可选，单位：天）
                </label>
                <input
                  type="number"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                  className="w-full px-4 py-2 bg-black/50 border border-amber-500/30 rounded-lg text-[#f4e8c1] focus:border-amber-500/60 focus:outline-none"
                  placeholder="不设置则永久有效"
                />
                <div className={`text-xs text-[#8a7a60] mt-1 ${fontClass}`}>
                  设置为0或留空表示永久有效
                </div>
              </div>
              
              {importError && (
                <div className="text-red-400 text-sm px-3 py-2 rounded bg-red-500/10">
                  {importError}
                </div>
              )}
              
              {importSuccess && (
                <div className="text-green-400 text-sm px-3 py-2 rounded bg-green-500/10">
                  {importSuccess}
                </div>
              )}
              
              {/* 已生成的兑换码 */}
              {generatedCodes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className={`text-amber-400 ${fontClass}`}>生成的兑换码</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCopyGeneratedCodes}
                        className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30"
                      >
                        复制全部
                      </button>
                      <button
                        onClick={handleDownloadGeneratedCodes}
                        className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30"
                      >
                        下载
                      </button>
                    </div>
                  </div>
                  <div className="h-48 overflow-y-auto bg-black/50 border border-amber-500/30 rounded-lg p-2 font-mono text-xs">
                    {generatedCodes.map((code, index) => (
                      <div key={index} className="py-1 px-2 border-b border-[#333]/20">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleImportCodes}
                  disabled={importLoading}
                  className={`flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-amber-500/80 to-orange-400/80 text-black rounded-lg hover:from-amber-400 hover:to-orange-300 transition-all duration-200 text-sm font-medium ${importLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {importLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      处理中...
                    </>
                  ) : importMode === "generate" ? "生成兑换码" : "导入兑换码"}
                </button>
                <button
                  onClick={handleCloseImportModal}
                  className="px-4 py-3 border border-amber-500/30 text-[#f4e8c1] rounded-lg hover:bg-amber-500/10 transition-colors text-sm"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 