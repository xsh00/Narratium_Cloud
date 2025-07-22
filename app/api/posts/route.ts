import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { postRepository, likeRepository } from '@/lib/data/database';

// 辅助函数：获取当前登录用户
async function getCurrentUser(request: NextRequest) {
  // 从请求头获取用户信息
  const userId = request.headers.get('x-user-id');
  const username = request.headers.get('x-username');
  
  // 检查用户ID
  if (!userId) {
    return null;
  }
  
  return {
    id: userId,
    username: username || '用户'
  };
}

// 获取帖子列表
export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const searchTerm = searchParams.get('search') || undefined;
    const userId = searchParams.get('userId') || undefined;

    // 获取帖子
    let posts;
    if (userId) {
      posts = await postRepository.findByUserId(userId, limit, offset);
    } else if (searchTerm) {
      posts = await postRepository.search(searchTerm, limit, offset);
    } else {
      posts = await postRepository.findAll(limit, offset, searchTerm);
    }

    // 获取当前用户
    const currentUser = await getCurrentUser(request);
    const currentUserId = currentUser?.id;

    // 处理帖子数据，添加是否点赞信息
    const postsWithLikeStatus = await Promise.all(
      posts.map(async (post: any) => {
        // 转换数据库字段为驼峰命名
        const formattedPost = {
          id: post.id,
          userId: post.user_id,
          userName: post.username,
          content: post.content,
          imageUrl: post.image_url,
          likesCount: post.likes_count,
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          liked: false
        };

        // 如果用户已登录，检查是否已点赞
        if (currentUserId) {
          const isLiked = await likeRepository.isLiked(post.id, currentUserId);
          formattedPost.liked = isLiked;
        }

        return formattedPost;
      })
    );

    return NextResponse.json(postsWithLikeStatus);
  } catch (error) {
    console.error('获取帖子失败:', error);
    return NextResponse.json(
      { error: '获取帖子失败' },
      { status: 500 }
    );
  }
}

// 创建帖子
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    const { content, imageUrl } = await request.json();

    // 验证内容
    if (!content && !imageUrl) {
      return NextResponse.json(
        { error: '内容或图片至少提供一项' },
        { status: 400 }
      );
    }

    // 创建帖子
    const postId = uuidv4();
    const post = await postRepository.create({
      id: postId,
      userId: currentUser.id,
      content,
      imageUrl
    });

    // 返回创建的帖子
    return NextResponse.json({
      id: post.id,
      userId: post.userId,
      userName: currentUser.username || '用户',
      content: post.content,
      imageUrl: post.imageUrl,
      likesCount: 0,
      createdAt: post.createdAt,
      liked: false
    }, { status: 201 });
  } catch (error) {
    console.error('创建帖子失败:', error);
    return NextResponse.json(
      { error: '创建帖子失败' },
      { status: 500 }
    );
  }
} 