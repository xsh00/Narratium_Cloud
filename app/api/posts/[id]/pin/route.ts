import { NextRequest, NextResponse } from 'next/server';
import { postRepository } from '@/lib/data/database';

// 置顶或取消置顶帖子
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

    // 获取请求体数据
    const { isPinned } = await request.json();
    
    if (typeof isPinned !== 'boolean') {
      return NextResponse.json(
        { error: '无效的置顶状态' },
        { status: 400 }
      );
    }

    // 更新帖子置顶状态
    const success = await postRepository.togglePinned(postId, isPinned);

    if (!success) {
      return NextResponse.json(
        { error: '更新置顶状态失败' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      isPinned,
      message: isPinned ? '帖子已置顶' : '帖子已取消置顶' 
    });
  } catch (error) {
    console.error('更新帖子置顶状态失败:', error);
    return NextResponse.json(
      { error: '更新帖子置顶状态失败' },
      { status: 500 }
    );
  }
} 