import { NextRequest, NextResponse } from 'next/server';
import { postRepository } from '@/lib/data/database';

// 审批帖子状态
export async function POST(request: NextRequest) {
  try {
    // 确认是管理员操作
    if (request.headers.get('x-admin-token') !== 'true') {
      return NextResponse.json(
        { error: '未授权的操作' },
        { status: 401 }
      );
    }

    // 从URL中获取帖子ID
    const pathParts = request.nextUrl.pathname.split('/');
    const postId = pathParts[pathParts.indexOf('posts') + 1];

    if (!postId) {
      return NextResponse.json(
        { error: '缺少帖子ID' },
        { status: 400 }
      );
    }

    // 批准帖子
    const success = await postRepository.approvePost(postId);

    if (!success) {
      return NextResponse.json(
        { error: '帖子审核失败' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: '帖子已成功审核通过' 
    });
  } catch (error) {
    console.error('审核帖子失败:', error);
    return NextResponse.json(
      { error: '审核帖子失败' },
      { status: 500 }
    );
  }
} 