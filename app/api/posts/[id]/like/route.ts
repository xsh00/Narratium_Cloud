import { NextRequest, NextResponse } from 'next/server';
import { likeRepository } from '@/lib/data/database';

// 辅助函数：获取当前登录用户ID
async function getCurrentUserId(request: NextRequest) {
  // 从请求头获取用户ID
  const userId = request.headers.get('x-user-id');
  return userId;
}

// 点赞帖子
export async function POST(request: NextRequest) {
  try {
    // 从URL中获取postId
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const postId = pathSegments[pathSegments.length - 2]; // 获取[id]部分
    
    // 验证用户身份
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // 点赞
    const result = await likeRepository.like(postId, userId);
    
    // 返回点赞结果
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('点赞失败:', error);
    return NextResponse.json(
      { error: '点赞失败' },
      { status: 500 }
    );
  }
}

// 取消点赞
export async function DELETE(request: NextRequest) {
  try {
    // 从URL中获取postId
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const postId = pathSegments[pathSegments.length - 2]; // 获取[id]部分
    
    // 验证用户身份
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // 取消点赞
    const result = await likeRepository.unlike(postId, userId);
    
    // 返回取消点赞结果
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('取消点赞失败:', error);
    return NextResponse.json(
      { error: '取消点赞失败' },
      { status: 500 }
    );
  }
} 