const nodemailer = require('nodemailer');

// 模拟邮箱池配置
const emailAccounts = [
  {
    user: process.env.EMAIL_USER_1 || process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS_1 || process.env.EMAIL_PASS,
    name: 'Account_1',
    dailyLimit: 500,
    currentCount: 0,
    lastResetDate: new Date().toDateString(),
    isActive: true
  }
];

// 如果没有配置多账户，尝试加载更多账户
let index = 2;
while (true) {
  const user = process.env[`EMAIL_USER_${index}`];
  const pass = process.env[`EMAIL_PASS_${index}`];
  
  if (!user || !pass) {
    break;
  }

  emailAccounts.push({
    user,
    pass,
    name: `Account_${index}`,
    dailyLimit: 500,
    currentCount: 0,
    lastResetDate: new Date().toDateString(),
    isActive: true
  });

  index++;
}

console.log(`邮箱池测试 - 共加载 ${emailAccounts.length} 个账户`);

// 测试邮件发送
async function testEmailSending() {
  for (let i = 0; i < emailAccounts.length; i++) {
    const account = emailAccounts[i];
    
    if (!account.user || !account.pass) {
      console.log(`账户 ${account.name}: 配置不完整，跳过测试`);
      continue;
    }

    console.log(`\n测试账户 ${account.name}: ${account.user}`);
    
    try {
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });

      // 发送测试邮件
      const result = await transporter.sendMail({
        from: account.user,
        to: account.user, // 发送给自己作为测试
        subject: 'Narratium 邮箱池测试',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f8d36a;">邮箱池测试</h2>
            <p>这是来自账户 <strong>${account.name}</strong> 的测试邮件。</p>
            <p>发送时间: ${new Date().toLocaleString()}</p>
            <p>如果您收到此邮件，说明邮箱池配置正确。</p>
          </div>
        `,
      });

      console.log(`✅ 账户 ${account.name} 测试成功`);
      console.log(`   消息ID: ${result.messageId}`);
      
    } catch (error) {
      console.log(`❌ 账户 ${account.name} 测试失败`);
      console.log(`   错误: ${error.message}`);
      
      if (error.response && error.response.includes('Daily user sending limit exceeded')) {
        console.log(`   原因: 已达到每日发送限制`);
      } else if (error.code === 'EAUTH') {
        console.log(`   原因: 认证失败，请检查应用专用密码`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   原因: 连接超时，请检查网络`);
      }
    }
  }
}

// 显示配置状态
function showConfigStatus() {
  console.log('\n=== 邮箱池配置状态 ===');
  
  if (emailAccounts.length === 0) {
    console.log('❌ 未配置任何邮箱账户');
    console.log('请在 .env.local 文件中配置 EMAIL_USER 和 EMAIL_PASS');
    return;
  }

  emailAccounts.forEach((account, index) => {
    console.log(`\n账户 ${index + 1}: ${account.name}`);
    console.log(`  邮箱: ${account.user || '未配置'}`);
    console.log(`  密码: ${account.pass ? '已配置' : '未配置'}`);
    console.log(`  状态: ${account.isActive ? '活跃' : '已禁用'}`);
    console.log(`  每日限制: ${account.dailyLimit} 封`);
  });
}

// 主函数
async function main() {
  console.log('=== Narratium 邮箱池测试 ===\n');
  
  showConfigStatus();
  
  if (emailAccounts.length > 0) {
    console.log('\n=== 开始邮件发送测试 ===');
    await testEmailSending();
  }
  
  console.log('\n=== 测试完成 ===');
  console.log('\n提示:');
  console.log('1. 如果测试成功，说明邮箱池配置正确');
  console.log('2. 如果测试失败，请检查应用专用密码和网络连接');
  console.log('3. 访问 http://localhost:3000/admin/email-pool 查看管理界面');
  console.log('4. 访问 http://localhost:3000/test-email 进行在线测试');
}

// 运行测试
main().catch(console.error); 