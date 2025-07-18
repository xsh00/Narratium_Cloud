import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseStats, userRepository, verificationCodeRepository } from '@/lib/data/database';

export async function GET() {
  try {
    const stats = await getDatabaseStats();
    const users = await userRepository.getAll();
    
    return NextResponse.json({
      success: true,
      stats,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      }))
    });
  } catch (error) {
    console.error('数据库统计错误:', error);
    return NextResponse.json({
      success: false,
      error: '获取数据库信息失败'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: '请提供邮箱地址' }, { status: 400 });
    }

    const user = await userRepository.findByEmail(email);
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const deleted = await userRepository.delete(user.id);
    if (deleted) {
      return NextResponse.json({ message: '用户删除成功' });
    } else {
      return NextResponse.json({ error: '用户删除失败' }, { status: 500 });
    }
  } catch (error) {
    console.error('删除用户错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 