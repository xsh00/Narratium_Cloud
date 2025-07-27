import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/data/database';

// 设置响应头，确保不缓存
function setNoCacheHeaders(headers: Headers) {
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  headers.set('Surrogate-Control', 'no-store');
}

export async function GET(request: NextRequest) {
  try {
    // 从查询参数中获取email
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({
        success: false,
        error: "缺少email参数"
      }, { status: 400 });
    }
    
    // 获取用户信息（直接从数据库获取最新数据）
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "用户不存在"
      }, { status: 404 });
    }
    
    // 检查用户VIP状态
    const now = new Date();
    let vipExpiry = null;
    let isVIP = false;
    
    if (user.vipExpiry) {
      try {
        // 解析日期
        vipExpiry = new Date(user.vipExpiry);
        isVIP = !isNaN(vipExpiry.getTime()) && vipExpiry > now;
      } catch (dateError) {
        console.error('日期解析错误:', dateError);
        isVIP = false;
      }
    }
    
    const credits = user.credits || 0;
    
    // 创建响应对象
    const response = NextResponse.json({
      success: true,
      data: {
        isVIP,
        vipExpiry: user.vipExpiry,
        credits
      }
    });
    
    // 添加缓存控制头
    setNoCacheHeaders(response.headers);
    
    return response;
    
  } catch (error) {
    console.error('VIP状态API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 