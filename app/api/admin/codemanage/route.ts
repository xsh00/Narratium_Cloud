import { NextRequest, NextResponse } from "next/server";
import { redeemCodeRepository } from "@/lib/data/database";
import { randomBytes } from 'crypto';
import { withAdminAuth } from "@/lib/data/auth/admin-auth";

// 生成随机兑换码
function generateRedeemCode(length: number = 10) {
  // 生成随机字节
  const bytes = randomBytes(Math.ceil(length / 2));
  // 转换为十六进制字符串
  return bytes.toString('hex').slice(0, length).toUpperCase();
}

// 获取兑换码列表
export async function GET(req: NextRequest) {
  return withAdminAuth(req, async (req) => {
    try {
      // 获取查询参数
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
      const isUsed = searchParams.get('isUsed');
      const batchId = searchParams.get('batchId') || undefined;
      
      const filters: { isUsed?: boolean; batchId?: string } = {};
      
      if (isUsed !== null) {
        filters.isUsed = isUsed === 'true';
      }
      
      if (batchId) {
        filters.batchId = batchId;
      }
      
      // 获取兑换码列表
      const result = await redeemCodeRepository.getCodesList(page, pageSize, filters);
      
      return NextResponse.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error("获取兑换码列表失败:", error);
      return NextResponse.json(
        { success: false, message: "获取兑换码列表失败" },
        { status: 500 }
      );
    }
  });
}

// 生成并导入兑换码
export async function POST(req: NextRequest) {
  return withAdminAuth(req, async (req) => {
    try {
      const body = await req.json();
      const { count = 10, amount = 100, expiresInDays, codes } = body;
      
      // 设置过期日期（如果提供）
      let expiresAt = null;
      if (expiresInDays && !isNaN(expiresInDays) && expiresInDays > 0) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + parseInt(String(expiresInDays), 10));
      }
      
      // 创建管理员标识
      const adminId = 'admin';
      
      // 检查是导入现有兑换码还是生成新的
      if (Array.isArray(codes) && codes.length > 0) {
        // 导入现有兑换码
        const formattedCodes = codes.map(c => ({
          code: typeof c === 'string' ? c : String(c),
          amount: amount
        }));
        
        const result = await redeemCodeRepository.createCodesBatch(formattedCodes, expiresAt, adminId);
        
        return NextResponse.json({
          success: true,
          message: `成功导入 ${result.count} 个兑换码`,
          batchId: result.batchId,
          count: result.count
        });
      } else {
        // 生成新的兑换码
        const newCodes = [];
        for (let i = 0; i < count; i++) {
          const code = generateRedeemCode(16); // 生成16位兑换码
          newCodes.push({ code, amount });
        }
        
        const result = await redeemCodeRepository.createCodesBatch(newCodes, expiresAt, adminId);
        
        return NextResponse.json({
          success: true,
          message: `成功生成 ${result.count} 个兑换码`,
          batchId: result.batchId,
          count: result.count,
          codes: newCodes.map(c => c.code) // 返回生成的兑换码列表
        });
      }
    } catch (error) {
      console.error("创建兑换码失败:", error);
      return NextResponse.json(
        { success: false, message: "创建兑换码失败" },
        { status: 500 }
      );
    }
  });
} 