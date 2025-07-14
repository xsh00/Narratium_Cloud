#!/usr/bin/env node

/**
 * COS配置测试脚本
 *
 * 这个脚本测试COS配置是否正确
 *
 * 使用方法：
 * node scripts/test-cos-config.js
 */

const fs = require('fs');
const path = require('path');

/**
 * 读取COS配置
 */
function readCOSConfig() {
  const configPath = path.join(__dirname, '../lib/config/cos-config.ts');
  
  if (!fs.existsSync(configPath)) {
    console.log('❌ COS配置文件不存在');
    return null;
  }
  
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // 提取BUCKET_URL
  const bucketMatch = configContent.match(/BUCKET_URL:\s*"([^"]+)"/);
  const bucketUrl = bucketMatch ? bucketMatch[1] : null;
  
  // 提取角色卡文件列表
  const filesMatch = configContent.match(/export const COS_CHARACTER_FILES = (\[[\s\S]*?\]);/);
  let characterFiles = [];
  
  if (filesMatch) {
    try {
      // 简单的解析
      const arrayContent = filesMatch[1];
      const lines = arrayContent.split('\n').filter(line => line.includes('name:'));
      
      lines.forEach(line => {
        const nameMatch = line.match(/name:\s*"([^"]+)"/);
        if (nameMatch) {
          characterFiles.push(nameMatch[1]);
        }
      });
    } catch (error) {
      console.log('⚠️  无法解析角色卡文件列表');
    }
  }
  
  return {
    bucketUrl,
    characterFiles
  };
}

/**
 * 测试配置
 */
function testConfig() {
  console.log('🔍 测试COS配置...\n');
  
  const config = readCOSConfig();
  
  if (!config) {
    console.log('❌ 无法读取COS配置');
    return false;
  }
  
  console.log('📋 配置信息：');
  console.log(`   存储桶地址: ${config.bucketUrl || '未配置'}`);
  console.log(`   角色卡数量: ${config.characterFiles.length}`);
  
  if (config.characterFiles.length > 0) {
    console.log('\n📁 角色卡文件：');
    config.characterFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
  }
  
  // 验证配置
  let isValid = true;
  
  if (!config.bucketUrl) {
    console.log('\n❌ 存储桶地址未配置');
    isValid = false;
  }
  
  if (config.characterFiles.length === 0) {
    console.log('\n⚠️  没有配置角色卡文件');
    console.log('💡 运行 node scripts/simple-cos-sync.js 添加角色卡');
  }
  
  if (isValid) {
    console.log('\n✅ COS配置正确');
    console.log('💡 可以正常使用角色卡功能');
  } else {
    console.log('\n❌ COS配置有问题');
    console.log('💡 请检查配置文件');
  }
  
  return isValid;
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 COS配置测试\n');
  
  try {
    testConfig();
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  readCOSConfig,
  testConfig
}; 