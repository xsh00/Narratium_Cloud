import { NextRequest, NextResponse } from "next/server";
import { redeemCodeRepository, userRepository } from "@/lib/data/database";

/**
 * 兑换积分码API接口
 */
export async function POST(req: NextRequest) {
  try {
    const { code, userId } = await req.json();
    
    if (!code) {
      return NextResponse.json({ success: false, message: "兑换码不能为空" }, { status: 400 });
    }
    
    if (!userId) {
      return NextResponse.json({ success: false, message: "请先登录后再兑换" }, { status: 401 });
    }
    
    // 验证用户是否存在
    const user = await userRepository.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: "用户不存在" }, { status: 404 });
    }
    
    // 执行兑换
    const result = await redeemCodeRepository.redeemCode(code, userId);
    
    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: result.message,
      amount: result.amount
    });
  } catch (error) {
    console.error("兑换积分失败:", error);
    return NextResponse.json(
      { success: false, message: "兑换积分失败，请稍后再试" },
      { status: 500 }
    );
  }
} 