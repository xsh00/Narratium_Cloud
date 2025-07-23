import { NextRequest, NextResponse } from 'next/server';
import { postRepository } from '@/lib/data/database';

// 拒绝帖子
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

    // 拒绝帖子
    const success = await postRepository.rejectPost(postId);

    if (!success) {
      return NextResponse.json(
        { error: '帖子拒绝失败' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: '帖子已被拒绝' 
    });
  } catch (error) {
    console.error('拒绝帖子失败:', error);
    return NextResponse.json(
      { error: '拒绝帖子失败' },
      { status: 500 }
    );
  }
} 