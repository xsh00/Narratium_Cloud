import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { userRepository, verificationCodeRepository } from '@/lib/data/database';
import { sendEmail } from '@/lib/email/email-pool';

// 生成验证码
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 发送重置密码邮件
async function sendResetPasswordEmail(email: string, code: string) {
  const mailOptions = {
    to: email,
    subject: 'Narratium - 重置密码验证码',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: #1a1714; color: #f4e8c1; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="color: #f8d36a; margin-bottom: 20px;">Narratium</h1>
          <h2 style="color: #f4e8c1; margin-bottom: 20px;">重置密码验证码</h2>
          <p style="color: #a18d6f; margin-bottom: 30px;">您正在重置 Narratium 账户的密码，请使用以下验证码：</p>
          <div style="background-color: #2a231c; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #f8d36a; letter-spacing: 8px;">${code}</span>
          </div>
          <p style="color: #a18d6f; font-size: 14px; margin-top: 20px;">
            验证码有效期为 5 分钟，请尽快使用。<br>
            如果您没有请求重置密码，请忽略此邮件。
          </p>
        </div>
      </div>
    `,
  };

  return sendEmail(mailOptions);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, action, newPassword } = body;

    if (action === 'sendCode') {
      // 发送重置密码验证码
      if (!email || !email.includes('@')) {
        return NextResponse.json({ error: '请输入有效的邮箱地址' }, { status: 400 });
      }

      // 检查邮箱是否存在
      const existingUser = await userRepository.findByEmail(email);
      if (!existingUser) {
        return NextResponse.json({ error: '该邮箱未注册' }, { status: 400 });
      }

      const verificationCode = generateVerificationCode();
      await verificationCodeRepository.set(email, verificationCode, 5 * 60 * 1000); // 5分钟过期

      const result = await sendResetPasswordEmail(email, verificationCode);
      
      if (result.success) {
        console.log(`重置密码验证码已发送到: ${email}，使用账户: ${result.usedAccount}`);
        return NextResponse.json({ 
          message: '重置密码验证码已发送',
          usedAccount: result.usedAccount 
        });
      } else {
        console.error('邮件发送失败:', result.error);
        await verificationCodeRepository.delete(email);
        return NextResponse.json({ error: result.message }, { status: 500 });
      }
    }

    if (action === 'resetPassword') {
      // 重置密码
      if (!email || !code || !newPassword) {
        return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 });
      }

      // 验证验证码
      const storedCode = await verificationCodeRepository.get(email);
      
      if (!storedCode || storedCode.code !== code) {
        return NextResponse.json({ error: '验证码无效或已过期' }, { status: 400 });
      }

      // 检查邮箱是否存在
      const existingUser = await userRepository.findByEmail(email);
      if (!existingUser) {
        return NextResponse.json({ error: '该邮箱未注册' }, { status: 400 });
      }

      // 加密新密码
      const hashedPassword = await hash(newPassword, 12);

      // 更新用户密码
      await userRepository.update(existingUser.id, { password: hashedPassword });

      await verificationCodeRepository.delete(email);

      return NextResponse.json({ 
        message: '密码重置成功，请使用新密码登录'
      });
    }

    return NextResponse.json({ error: '无效的操作' }, { status: 400 });
  } catch (error) {
    console.error('重置密码错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
} 