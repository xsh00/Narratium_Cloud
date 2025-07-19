import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // 检查多邮箱配置
    const accounts = [];
    let index = 1;
    
    while (true) {
      const user = process.env[`EMAIL_USER_${index}`];
      const pass = process.env[`EMAIL_PASS_${index}`];
      
      if (!user || !pass) {
        break;
      }
      
      accounts.push({
        index,
        user,
        pass: pass ? '已配置' : '未配置',
        status: pass ? '已配置' : '未配置'
      });
      
      index++;
    }
    
    // 如果没有多账户配置，检查默认配置
    if (accounts.length === 0) {
      const defaultUser = process.env.EMAIL_USER;
      const defaultPass = process.env.EMAIL_PASS;
      
      if (defaultUser && defaultPass) {
        accounts.push({
          index: 0,
          user: defaultUser,
          pass: '已配置',
          status: '已配置'
        });
      }
    }

    const configStatus = {
      totalAccounts: accounts.length,
      accounts,
      isConfigured: accounts.length > 0,
    };

    return NextResponse.json({
      success: true,
      configStatus,
      message: configStatus.isConfigured 
        ? `邮件服务已配置，共 ${accounts.length} 个账户` 
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