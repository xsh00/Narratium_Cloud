import { NextRequest, NextResponse } from "next/server";
import { creditRepository, userRepository } from "@/lib/data/database";

// 获取用户积分信息
export async function GET(req: NextRequest) {
  try {
    // 从查询参数获取用户ID
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      // 返回空数据而不是错误，以避免前端显示错误信息
      return NextResponse.json({ 
        success: true, 
        credits: 0,
        history: [],
        message: "未登录用户" 
      });
    }
    
    // 验证用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      return NextResponse.json({ 
        success: true, 
        credits: 0,
        history: [],
        message: "用户不存在" 
      });
    }
    
    // 从数据库获取用户积分总额
    const credits = await creditRepository.getUserCredits(userId);
    
    // 从数据库获取积分历史记录
    const history = await creditRepository.getCreditHistory(userId, 50, 0);
    
    return NextResponse.json({ 
      success: true, 
      credits,
      history: history || []
    });
  } catch (error) {
    console.error("获取积分信息失败:", error);
    return NextResponse.json(
      { success: false, message: "获取积分信息失败" },
      { status: 500 }
    );
  }
} 