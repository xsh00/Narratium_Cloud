#!/usr/bin/env node

/**
 * 简单COS角色卡管理脚本
 *
 * 这个脚本用于管理COS角色卡文件列表
 * 由于COS公开访问的限制，采用手动维护文件列表的方式
 *
 * 使用方法：
 * node scripts/simple-cos-sync.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 腾讯云COS配置
const cosConfig = {
  Bucket: 'narratium-1329472700',
  Region: 'ap-shanghai',
  BaseUrl: 'https://narratium-1329472700.cos.ap-shanghai.myqcloud.com'
};

/**
 * 从文件名提取角色信息
 * 文件名格式：角色名--标签1，标签2，标签3.png
 */
function extractCharacterInfo(fileName) {
  // 移除.png扩展名
  const nameWithoutExt = fileName.replace(/\.png$/i, '');
  
  // 按--分割文件名
  const parts = nameWithoutExt.split(/--/);
  
  let displayName = nameWithoutExt;
  let tags = [];
  
  if (parts.length >= 1) {
    displayName = parts[0].trim();
    
    // 提取标签（如果有的话）
    if (parts.length > 1) {
      const tagPart = parts.slice(1).join('--');
      tags = tagPart
        .split(/[,，、]/)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }
  }
  
  return {
    name: fileName,
    displayName,
    tags
  };
}

/**
 * 更新COS配置文件
 */
function updateCOSConfig(characterFiles) {
  const configPath = path.join(__dirname, '../lib/config/cos-config.ts');
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  // 生成新的角色卡配置数组
  const characterConfigs = characterFiles.map(file => {
    const info = extractCharacterInfo(file.name);
    return `  {
    name: "${info.name}",
    displayName: "${info.displayName}",
    tags: [${info.tags.map(tag => `"${tag}"`).join(', ')}],
  }`;
  });
  
  const newArrayContent = `[\n${characterConfigs.join(',\n')}\n];`;
  
  // 替换现有的COS_CHARACTER_FILES数组
  configContent = configContent.replace(
    /export const COS_CHARACTER_FILES = (\[[\s\S]*?\]);/,
    `export const COS_CHARACTER_FILES = ${newArrayContent};`
  );
  
  // 写入更新后的配置
  fs.writeFileSync(configPath, configContent);
  
  return characterFiles.length;
}

/**
 * 创建交互式界面
 */
function createInterface() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return rl;
}

/**
 * 询问用户输入
 */
function question(rl, query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

/**
 * 手动添加角色卡
 */
async function addCharacterCard(rl) {
  console.log('\n📝 添加新角色卡');
  
  const fileName = await question(rl, '请输入文件名（包含.png扩展名）: ');
  if (!fileName.toLowerCase().endsWith('.png')) {
    console.log('❌ 文件名必须以.png结尾');
    return null;
  }
  
  const displayName = await question(rl, '请输入显示名称（回车使用文件名）: ') || fileName.replace(/\.png$/i, '');
  
  const tagsInput = await question(rl, '请输入标签（用逗号分隔，回车跳过）: ');
  const tags = tagsInput ? tagsInput.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
  
  return {
    name: fileName,
    displayName,
    tags
  };
}

/**
 * 显示当前角色卡列表
 */
function showCurrentCharacters() {
  const configPath = path.join(__dirname, '../lib/config/cos-config.ts');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // 提取当前的COS_CHARACTER_FILES数组
  const match = configContent.match(/export const COS_CHARACTER_FILES = (\[[\s\S]*?\]);/);
  if (match) {
    try {
      // 简单的解析，实际项目中可能需要更复杂的解析
      const arrayContent = match[1];
      const lines = arrayContent.split('\n').filter(line => line.includes('name:'));
      
      console.log('\n📋 当前角色卡列表：');
      lines.forEach((line, index) => {
        const nameMatch = line.match(/name: "([^"]+)"/);
        if (nameMatch) {
          console.log(`${index + 1}. ${nameMatch[1]}`);
        }
      });
    } catch (error) {
      console.log('⚠️  无法解析当前配置');
    }
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 COS角色卡管理工具\n');
  console.log('💡 由于COS公开访问限制，采用手动维护文件列表的方式');
  console.log(`📁 COS存储桶: ${cosConfig.BaseUrl}\n`);
  
  const rl = createInterface();
  
  try {
    while (true) {
      console.log('\n📋 请选择操作：');
      console.log('1. 查看当前角色卡列表');
      console.log('2. 添加新角色卡');
      console.log('3. 批量导入文件名');
      console.log('4. 退出');
      
      const choice = await question(rl, '\n请输入选择 (1-4): ');
      
      switch (choice) {
        case '1':
          showCurrentCharacters();
          break;
          
        case '2':
          const newCard = await addCharacterCard(rl);
          if (newCard) {
            // 读取当前配置
            const configPath = path.join(__dirname, '../lib/config/cos-config.ts');
            const configContent = fs.readFileSync(configPath, 'utf8');
            
            // 提取当前数组
            const match = configContent.match(/export const COS_CHARACTER_FILES = (\[[\s\S]*?\]);/);
            if (match) {
              // 添加新角色卡到数组
              const arrayContent = match[1];
              const newEntry = `  {
    name: "${newCard.name}",
    displayName: "${newCard.displayName}",
    tags: [${newCard.tags.map(tag => `"${tag}"`).join(', ')}],
  }`;
              
              // 在数组末尾添加新条目
              const newArrayContent = arrayContent.replace(/];$/, `,\n${newEntry}\n];`);
              
              // 更新配置文件
              const updatedContent = configContent.replace(
                /export const COS_CHARACTER_FILES = (\[[\s\S]*?\]);/,
                `export const COS_CHARACTER_FILES = ${newArrayContent};`
              );
              
              fs.writeFileSync(configPath, updatedContent);
              console.log('✅ 角色卡添加成功！');
            }
          }
          break;
          
        case '3':
          console.log('\n📝 批量导入文件名');
          console.log('💡 请将角色卡文件名列表粘贴到下面（每行一个文件名）');
          console.log('💡 输入空行结束');
          
          const fileNames = [];
          while (true) {
            const fileName = await question(rl, '文件名: ');
            if (!fileName.trim()) break;
            if (fileName.toLowerCase().endsWith('.png')) {
              fileNames.push(fileName.trim());
            } else {
              console.log('⚠️  跳过非PNG文件:', fileName);
            }
          }
          
          if (fileNames.length > 0) {
            const characterFiles = fileNames.map(fileName => extractCharacterInfo(fileName));
            updateCOSConfig(characterFiles);
            console.log(`✅ 成功导入 ${fileNames.length} 个角色卡文件`);
          }
          break;
          
        case '4':
          console.log('\n👋 退出管理工具');
          rl.close();
          return;
          
        default:
          console.log('❌ 无效选择，请重新输入');
      }
    }
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  } finally {
    rl.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  extractCharacterInfo,
  updateCOSConfig
}; 