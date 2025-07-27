import { NextResponse } from 'next/server';
import { customRequestRepository } from '@/lib/data/database';

// 获取所有自定义角色请求
export async function GET(request: Request) {
  try {
    // 从URL参数中获取过滤条件
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || '';
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // 获取定制请求
    const requests = await customRequestRepository.findAll(limit, offset, status || undefined);

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('获取角色卡定制请求列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取定制请求列表失败' },
      { status: 500 }
    );
  }
}

// 更新自定义角色请求状态
export async function PUT(request: Request) {
  try {
    // 解析请求体
    const body = await request.json();
    const { id, status } = body;

    // 验证必要参数
    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 验证状态值是否合法
    const validStatuses = ['pending', 'processing', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: '无效的状态值' },
        { status: 400 }
      );
    }

    // 更新请求状态
    const updatedRequest = await customRequestRepository.updateStatus(
      id,
      status as 'pending' | 'processing' | 'completed' | 'rejected'
    );

    return NextResponse.json({ success: true, data: updatedRequest });
  } catch (error) {
    console.error('更新角色卡定制请求状态失败:', error);
    return NextResponse.json(
      { success: false, error: '更新请求状态失败' },
      { status: 500 }
    );
  }
} 