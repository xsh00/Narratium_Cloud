import { NextResponse } from 'next/server';
import { customRequestRepository } from '@/lib/data/database';

// 获取用户的角色卡定制请求列表
export async function GET(request: Request) {
  try {
    // 从URL参数中获取用户ID
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: '未提供用户ID' }, { status: 400 });
    }

    // 获取用户的所有定制请求
    const requests = await customRequestRepository.getUserRequests(userId);

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('获取角色卡定制请求失败:', error);
    return NextResponse.json(
      { success: false, error: '获取角色卡定制请求失败' },
      { status: 500 }
    );
  }
}

// 提交角色卡定制请求
export async function POST(request: Request) {
  try {
    // 解析请求体
    const body = await request.json();
    const { id, userId, description } = body;

    // 验证必要参数
    if (!id || !userId || !description) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证描述长度
    if (description.length < 10) {
      return NextResponse.json(
        { success: false, error: '描述太短，请提供更详细的角色卡描述' },
        { status: 400 }
      );
    }

    // 创建定制请求
    const result = await customRequestRepository.create({
      id,
      userId,
      description,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('提交角色卡定制请求失败:', error);
    
    // 区分不同类型的错误
    let errorMessage = '提交请求失败，请稍后再试';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('积分不足')) {
        errorMessage = '积分不足，无法提交定制请求';
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
} 