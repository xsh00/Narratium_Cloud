import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/data/database';

export async function PUT(request: NextRequest) {
  try {
    const { userId, username } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: '用户ID不能为空' }, { status: 400 });
    }

    if (!username || username.trim() === '') {
      return NextResponse.json({ error: '用户名不能为空' }, { status: 400 });
    }

    // 验证用户名长度
    if (username.length > 50) {
      return NextResponse.json({ error: '用户名不能超过50个字符' }, { status: 400 });
    }

    // 更新用户信息
    const success = await userRepository.update(userId, { username: username.trim() });
    
    if (!success) {
      return NextResponse.json({ error: '用户不存在或更新失败' }, { status: 404 });
    }

    return NextResponse.json({
      message: '用户信息更新成功',
      username: username.trim()
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '用户ID不能为空' }, { status: 400 });
    }

    // 获取用户信息
    const user = await userRepository.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username || 'user'
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 