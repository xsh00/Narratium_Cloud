import { NextRequest, NextResponse } from 'next/server';

/**
 * 简单的管理员身份验证中间件
 * 检查请求的Authorization头是否包含有效的管理员凭据
 */
export const validateAdmin = async (req: NextRequest) => {
  // 1. 检查Authorization头
  const authHeader = req.headers.get('Authorization');
  console.log('Auth Header:', authHeader?.substring(0, 10) + '...');
  
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const [username, password] = credentials.split(':');
      
      console.log(`验证管理员凭据: 用户名=${username}`);
      
      // 验证硬编码的凭据
      return username === 'admin' && password === '0107151457nk';
    } catch (error) {
      console.error('解析管理员凭据失败:', error);
      return false;
    }
  }
  
  // 2. 如果没有有效的Authorization头，检查Cookie中的会话信息
  const cookies = req.cookies;
  const adminToken = cookies.get('adminToken')?.value;
  
  if (adminToken === 'admin-authenticated') {
    console.log('使用Cookie验证管理员');
    return true;
  }
  
  // 3. 检查localStorage状态（仅适用于服务器端渲染的情况）
  if (req.headers.get('x-admin-authenticated') === 'true') {
    console.log('使用自定义头验证管理员');
    return true;
  }
  
  console.log('管理员验证失败');
  return false;
};

/**
 * 管理员鉴权中间件
 * 用于在API路由中验证是否为管理员访问
 */
export const withAdminAuth = async (
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
) => {
  const isAdmin = await validateAdmin(req);
  
  if (!isAdmin) {
    console.error('管理员身份验证失败', { 
      url: req.url,
      hasAuthHeader: !!req.headers.get('Authorization'),
      hasXAdminHeader: !!req.headers.get('x-admin-authenticated'),
      hasCookies: req.cookies.size > 0
    });
    return NextResponse.json(
      { success: false, message: "未授权访问" },
      { status: 401 }
    );
  }
  
  return handler(req);
}; 