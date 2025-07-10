import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    const configStatus = {
      emailUser: emailUser ? '已配置' : '未配置',
      emailPass: emailPass ? '已配置' : '未配置',
      isConfigured: !!(emailUser && emailPass),
    };

    return NextResponse.json({
      success: true,
      configStatus,
      message: configStatus.isConfigured 
        ? '邮件服务已配置' 
        : '邮件服务未配置，请检查 .env.local 文件'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '配置检查失败',
      message: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 