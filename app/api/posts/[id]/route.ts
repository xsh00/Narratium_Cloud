import { NextRequest, NextResponse } from 'next/server';
import { postRepository } from '@/lib/data/database';

// 获取单个帖子
export async function GET(request: NextRequest) {
  try {
    // 从URL中获取postId
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const postId = pathSegments[pathSegments.length - 1]; // 获取[id]部分
    
    const post = await postRepository.findById(postId);
    
    if (!post) {
      return NextResponse.json(
        { error: '帖子不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      id: post.id,
      userId: post.user_id,
      userName: post.username,
      content: post.content,
      imageUrl: post.image_url,
      likesCount: post.likes_count,
      createdAt: post.created_at,
      updatedAt: post.updated_at
    });
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    return NextResponse.json(
      { error: '获取帖子详情失败' },
      { status: 500 }
    );
  }
}

// 删除帖子
export async function DELETE(request: NextRequest) {
  try {
    // 从URL中获取postId
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const postId = pathSegments[pathSegments.length - 1]; // 获取[id]部分
    
    // 验证管理员权限 - 简单实现，实际应使用更安全的验证方式
    const isAdmin = request.headers.get('x-admin-token') === 'true';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }
    
    // 删除帖子
    const success = await postRepository.delete(postId);
    
    if (!success) {
      return NextResponse.json(
        { error: '帖子不存在或已被删除' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除帖子失败:', error);
    return NextResponse.json(
      { error: '删除帖子失败' },
      { status: 500 }
    );
  }
} 