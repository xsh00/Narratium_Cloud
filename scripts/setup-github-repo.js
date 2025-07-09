#!/usr/bin/env node

/**
 * GitHub仓库快速设置脚本
 * 
 * 使用方法：
 * node scripts/setup-github-repo.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 GitHub仓库设置向导');
console.log('========================\n');

// 读取用户输入
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function setupGitHubRepo() {
  try {
    console.log('请提供以下信息来配置您的GitHub仓库：\n');
    
    const username = await askQuestion('您的GitHub用户名: ');
    const repoName = await askQuestion('您的角色卡仓库名: ');
    
    console.log('\n📝 正在更新配置文件...');
    
    // 读取配置文件
    const configPath = path.join(__dirname, '../lib/config/github-config.ts');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // 替换占位符
    configContent = configContent.replace(/USERNAME: "YOUR_USERNAME"/, `USERNAME: "${username}"`);
    configContent = configContent.replace(/REPO_NAME: "YOUR_REPO_NAME"/, `REPO_NAME: "${repoName}"`);
    
    // 写入更新后的配置
    fs.writeFileSync(configPath, configContent);
    
    console.log('✅ 配置文件已更新！');
    console.log(`\n📋 配置信息：`);
    console.log(`   用户名: ${username}`);
    console.log(`   仓库名: ${repoName}`);
    console.log(`   API URL: https://api.github.com/repos/${username}/${repoName}/contents`);
    console.log(`   文件URL: https://raw.githubusercontent.com/${username}/${repoName}/main/`);
    
    console.log('\n📖 接下来的步骤：');
    console.log('1. 在GitHub上创建仓库：' + repoName);
    console.log('2. 上传您的角色卡PNG文件');
    console.log('3. 确保文件名格式为：角色名--作者名.png');
    console.log('4. 启动应用程序测试功能');
    
    console.log('\n📚 详细指南请查看：docs/GITHUB_REPOSITORY_SETUP.md');
    
  } catch (error) {
    console.error('❌ 设置失败:', error.message);
  } finally {
    rl.close();
  }
}

// 运行设置
setupGitHubRepo(); 