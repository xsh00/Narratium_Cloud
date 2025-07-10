import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { userRepository } from '@/lib/data/database';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '请填写邮箱和密码' }, { status: 400 });
    }

    // 查找用户
    const user = userRepository.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 400 });
    }

    // 验证密码
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 400 });
    }

    // 登录成功
    return NextResponse.json({
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 