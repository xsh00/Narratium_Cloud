import { NextRequest, NextResponse } from 'next/server';
import { userRepository, creditRepository } from '@/lib/data/database';

// VIP订阅计划和价格
const SUBSCRIPTION_PLANS = {
  "7days": { days: 7, credits: 10 },
  "30days": { days: 30, credits: 30 },
  "permanent": { days: 0, credits: 199 } // 永久VIP不使用天数计算
};

// TIMESTAMP类型支持的最大日期 (接近2038年1月19日)
const MAX_TIMESTAMP_DATE = '2038-01-01 00:00:00';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, plan } = body;
    
    if (!email || !plan) {
      return NextResponse.json({
        success: false,
        error: "缺少必要参数"
      }, { status: 400 });
    }
    
    // 验证订阅计划是否有效
    if (!SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
      return NextResponse.json({
        success: false,
        error: "无效的订阅计划"
      }, { status: 400 });
    }
    
    // 获取订阅计划的详细信息
    const planDetails = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];
    
    // 获取用户信息
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: "用户不存在"
      }, { status: 404 });
    }
    
    // 检查用户积分是否足够
    if (user.credits < planDetails.credits) {
      return NextResponse.json({
        success: false,
        error: "积分不足"
      }, { status: 400 });
    }
    
    // 计算VIP过期时间
    let formattedDate = '';
    
    if (plan === 'permanent') {
      // 永久VIP使用TIMESTAMP支持的最大日期
      formattedDate = MAX_TIMESTAMP_DATE;
    } else {
      let vipExpiry = new Date();
      // 如果用户已经有VIP且未过期，在现有基础上增加时间
      if (user.vipExpiry && new Date(user.vipExpiry) > new Date()) {
        vipExpiry = new Date(user.vipExpiry);
      }
      
      // 增加订阅天数
      vipExpiry.setDate(vipExpiry.getDate() + planDetails.days);
      
      // 将日期格式化为MySQL兼容格式：YYYY-MM-DD HH:MM:SS
      formattedDate = vipExpiry.toISOString().slice(0, 19).replace('T', ' ');
    }
    
    try {
      // 开始数据库操作
      console.log(`用户 ${user.id} 开始订阅 ${plan} VIP，价格：${planDetails.credits} 积分`);
      
      // 添加积分历史记录并扣除积分
      let description = '';
      if (plan === "7days") {
        description = "订阅7天VIP角色专区";
      } else if (plan === "30days") {
        description = "订阅30天VIP角色专区";
      } else if (plan === "permanent") {
        description = "订阅永久VIP角色专区";
      }
      
      await creditRepository.addCreditRecord(user.id, -planDetails.credits, description);
      console.log(`用户 ${user.id} 积分扣除成功，描述：${description}`);
      
      // 单独更新VIP过期时间，不影响积分
      const updatedUser = await userRepository.update(user.id, {
        vipExpiry: formattedDate
      });
      console.log(`用户 ${user.id} VIP过期时间更新为: ${formattedDate}`);
      
      // 获取最新的用户信息
      const refreshedUser = await userRepository.findById(user.id);
      
      console.log(`用户 ${user.id} 成功订阅 ${plan}，当前积分：${refreshedUser.credits}，VIP过期时间：${refreshedUser.vipExpiry}`);
      
      return NextResponse.json({
        success: true,
        data: {
          vipExpiry: refreshedUser.vipExpiry,
          credits: refreshedUser.credits
        }
      });
    } catch (error) {
      console.error("VIP订阅过程出错:", error);
      throw error;
    }
    
  } catch (error) {
    console.error('订阅API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 