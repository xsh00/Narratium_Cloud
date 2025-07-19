import { NextRequest, NextResponse } from 'next/server';
import { getEmailPoolStatus, resetEmailPoolStatus } from '@/lib/email/email-pool';

export async function GET() {
  try {
    const status = getEmailPoolStatus();
    
    return NextResponse.json({
      success: true,
      status,
      message: '邮箱池状态获取成功'
    });
  } catch (error) {
    console.error('获取邮箱池状态失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取邮箱池状态失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'reset') {
      resetEmailPoolStatus();
      return NextResponse.json({
        success: true,
        message: '邮箱池状态已重置'
      });
    }

    return NextResponse.json({
      success: false,
      error: '无效的操作',
      message: '不支持的操作类型'
    }, { status: 400 });
  } catch (error) {
    console.error('邮箱池操作失败:', error);
    return NextResponse.json({
      success: false,
      error: '邮箱池操作失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 