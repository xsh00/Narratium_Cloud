import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { hash, compare } from 'bcryptjs';
import { userRepository, verificationCodeRepository } from '@/lib/data/database';

// 邮件发送配置
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 验证邮件配置
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error('邮件配置错误: EMAIL_USER 或 EMAIL_PASS 未设置');
}

// 生成验证码
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送验证码邮件
async function sendVerificationEmail(email: string, code: string) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Narratium 注册验证码',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f8d36a;">欢迎注册 Narratium</h2>
        <p>您的验证码是：</p>
        <h1 style="color: #f8d36a; font-size: 32px; text-align: center; padding: 20px; background: #1a1714; border-radius: 8px;">${code}</h1>
        <p>验证码有效期为5分钟，请尽快使用。</p>
        <p>如果这不是您的操作，请忽略此邮件。</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, action, password } = body;

    if (action === 'sendCode') {
      // 发送验证码
      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
      }

      // 检查邮箱是否已注册
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
      }

      const verificationCode = generateVerificationCode();
      await verificationCodeRepository.set(email, verificationCode, 5 * 60 * 1000); // 5分钟过期

      try {
        await sendVerificationEmail(email, verificationCode);
        console.log(`验证码已发送到: ${email}`);
        return NextResponse.json({ message: '验证码已发送' });
      } catch (emailError: any) {
        console.error('邮件发送失败:', emailError);
        await verificationCodeRepository.delete(email);
        
        // 提供更详细的错误信息
        let errorMessage = '邮件发送失败，请检查邮箱配置';
        if (emailError.code === 'ETIMEDOUT') {
          errorMessage = '邮件发送超时，请检查网络连接';
        } else if (emailError.code === 'EAUTH') {
          errorMessage = '邮箱认证失败，请检查邮箱和密码配置';
        } else if (emailError.code === 'ESOCKET') {
          errorMessage = '邮件服务器连接失败，请稍后重试';
        }
        
        return NextResponse.json({ error: errorMessage }, { status: 500 });
      }
    }

    if (action === 'register') {
      // 注册用户
      if (!email || !code || !password) {
        return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
      }

      // 验证验证码
      const storedCode = await verificationCodeRepository.get(email);
      
      if (!storedCode || storedCode.code !== code) {
        return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });
      }

      // 检查邮箱是否已注册
      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
      }

      // 加密密码
      const hashedPassword = await hash(password, 12);

      // 创建用户
      const newUser = await userRepository.create({
        id: Date.now().toString(),
        email,
        password: hashedPassword,
      });

      await verificationCodeRepository.delete(email);

      return NextResponse.json({ 
        message: '注册成功',
        user: { id: newUser.id, email: newUser.email, username: newUser.username || 'user' }
      });
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 });
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 