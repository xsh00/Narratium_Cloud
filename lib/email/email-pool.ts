import nodemailer from 'nodemailer';

// 邮箱账户配置接口
interface EmailAccount {
  user: string;
  pass: string;
  name?: string;
  dailyLimit: number;
  currentCount: number;
  lastResetDate: string;
  isActive: boolean;
}

// 邮件发送结果接口
interface SendResult {
  success: boolean;
  message: string;
  usedAccount?: string;
  error?: any;
}

class EmailPool {
  private accounts: EmailAccount[] = [];
  private currentIndex = 0;

  constructor() {
    this.loadAccounts();
  }

  // 从环境变量加载邮箱账户
  private loadAccounts() {
    // 支持多个邮箱账户配置
    // 格式: EMAIL_USER_1, EMAIL_PASS_1, EMAIL_USER_2, EMAIL_PASS_2, ...
    let index = 1;
    while (true) {
      const user = process.env[`EMAIL_USER_${index}`];
      const pass = process.env[`EMAIL_PASS_${index}`];
      
      if (!user || !pass) {
        break;
      }

      this.accounts.push({
        user,
        pass,
        name: `Account_${index}`,
        dailyLimit: 500, // Gmail每日限制约500封
        currentCount: 0,
        lastResetDate: new Date().toDateString(),
        isActive: true
      });

      index++;
    }

    // 如果没有配置多账户，使用默认配置
    if (this.accounts.length === 0) {
      const defaultUser = process.env.EMAIL_USER;
      const defaultPass = process.env.EMAIL_PASS;
      
      if (defaultUser && defaultPass) {
        this.accounts.push({
          user: defaultUser,
          pass: defaultPass,
          name: 'Default_Account',
          dailyLimit: 500,
          currentCount: 0,
          lastResetDate: new Date().toDateString(),
          isActive: true
        });
      }
    }

    console.log(`邮箱池初始化完成，共加载 ${this.accounts.length} 个账户`);
  }

  // 获取可用的邮箱账户
  private getAvailableAccount(): EmailAccount | null {
    const today = new Date().toDateString();
    
    // 检查并重置每日计数
    this.accounts.forEach(account => {
      if (account.lastResetDate !== today) {
        account.currentCount = 0;
        account.lastResetDate = today;
      }
    });

    // 查找可用的账户
    for (let i = 0; i < this.accounts.length; i++) {
      const index = (this.currentIndex + i) % this.accounts.length;
      const account = this.accounts[index];
      
      if (account.isActive && account.currentCount < account.dailyLimit) {
        return account;
      }
    }

    return null;
  }

  // 发送邮件
  async sendMail(mailOptions: nodemailer.SendMailOptions): Promise<SendResult> {
    const account = this.getAvailableAccount();
    
    if (!account) {
      return {
        success: false,
        message: '所有邮箱账户都已达到每日发送限制，请稍后重试或添加更多邮箱账户'
      };
    }

    try {
      // 创建transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: account.user,
          pass: account.pass,
        },
      });

      // 发送邮件
      await transporter.sendMail({
        ...mailOptions,
        from: account.user // 确保发件人地址正确
      });

      // 更新计数
      account.currentCount++;
      this.currentIndex = (this.currentIndex + 1) % this.accounts.length;

      console.log(`邮件发送成功，使用账户: ${account.name} (${account.currentCount}/${account.dailyLimit})`);

      return {
        success: true,
        message: '邮件发送成功',
        usedAccount: account.name
      };

    } catch (error: any) {
      console.error(`邮件发送失败，账户: ${account.name}`, error);
      
      // 如果是发送限制错误，标记账户为不可用
      if (error.response && error.response.includes('Daily user sending limit exceeded')) {
        account.isActive = false;
        console.log(`账户 ${account.name} 已达到每日限制，已标记为不可用`);
      }

      return {
        success: false,
        message: this.getErrorMessage(error),
        usedAccount: account.name,
        error
      };
    }
  }

  // 获取错误信息
  private getErrorMessage(error: any): string {
    if (error.response && error.response.includes('Daily user sending limit exceeded')) {
      return '邮箱发送限制已满，请稍后重试';
    } else if (error.code === 'ETIMEDOUT') {
      return '邮件发送超时，请检查网络连接';
    } else if (error.code === 'EAUTH') {
      return '邮箱认证失败，请检查邮箱和密码配置';
    } else if (error.code === 'ESOCKET') {
      return '邮件服务器连接失败，请稍后重试';
    } else if (error.code === 'EENVELOPE') {
      return '邮件发送失败，请检查邮箱配置';
    }
    
    return '邮件发送失败，请稍后重试';
  }

  // 获取邮箱池状态
  getStatus() {
    const today = new Date().toDateString();
    
    return {
      totalAccounts: this.accounts.length,
      activeAccounts: this.accounts.filter(a => a.isActive).length,
      accounts: this.accounts.map(account => ({
        name: account.name,
        user: account.user,
        dailyLimit: account.dailyLimit,
        currentCount: account.lastResetDate === today ? account.currentCount : 0,
        isActive: account.isActive,
        lastResetDate: account.lastResetDate
      }))
    };
  }

  // 重置账户状态
  resetAccountStatus() {
    this.accounts.forEach(account => {
      account.isActive = true;
      account.currentCount = 0;
      account.lastResetDate = new Date().toDateString();
    });
    console.log('邮箱池状态已重置');
  }
}

// 创建全局邮箱池实例
export const emailPool = new EmailPool();

// 导出发送邮件的便捷函数
export async function sendEmail(mailOptions: nodemailer.SendMailOptions): Promise<SendResult> {
  return emailPool.sendMail(mailOptions);
}

// 导出获取状态的函数
export function getEmailPoolStatus() {
  return emailPool.getStatus();
}

// 导出重置状态的函数
export function resetEmailPoolStatus() {
  return emailPool.resetAccountStatus();
} 