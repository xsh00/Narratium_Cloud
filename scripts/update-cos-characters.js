#!/usr/bin/env node

/**
 * 更新COS角色卡配置脚本
 *
 * 这个脚本帮助您更新腾讯云COS中的角色卡配置
 * 由于COS没有直接的API来列出文件，这个脚本提供手动更新功能
 *
 * 使用方法：
 * node scripts/update-cos-characters.js
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 读取COS配置文件
const cosConfigPath = path.join(__dirname, "../lib/config/cos-config.ts");
let cosConfigContent = fs.readFileSync(cosConfigPath, "utf8");

console.log("🔧 COS角色卡配置更新工具\n");

// 显示当前配置的角色卡
function showCurrentCharacters() {
  const match = cosConfigContent.match(/export const COS_CHARACTER_FILES = (\[[\s\S]*?\]);/);
  if (match) {
    try {
      // 移除注释和格式化，提取数组内容
      let arrayContent = match[1];
      // 简单的解析来显示当前文件
      const files = arrayContent.match(/\{[^}]+\}/g);
      if (files) {
        console.log("📋 当前配置的角色卡文件：");
        files.forEach((file, index) => {
          const nameMatch = file.match(/name: "([^"]+)"/);
          const displayMatch = file.match(/displayName: "([^"]+)"/);
          const tagsMatch = file.match(/tags: \[([^\]]+)\]/);
          
          if (nameMatch) {
            console.log(`${index + 1}. ${nameMatch[1]}`);
            if (displayMatch) {
              console.log(`   显示名称: ${displayMatch[1]}`);
            }
            if (tagsMatch) {
              console.log(`   标签: ${tagsMatch[1]}`);
            }
          }
        });
        console.log("");
      }
    } catch (error) {
      console.log("⚠️  无法解析当前配置");
    }
  }
}

// 添加新的角色卡
function addNewCharacter() {
  return new Promise((resolve) => {
    console.log("➕ 添加新角色卡\n");
    
    rl.question("请输入文件名（包含.png扩展名）: ", (fileName) => {
      if (!fileName.endsWith('.png')) {
        console.log("❌ 文件名必须以.png结尾");
        resolve();
        return;
      }
      
      rl.question("请输入显示名称: ", (displayName) => {
        rl.question("请输入标签（用逗号分隔，如：小说，玄幻）: ", (tagsInput) => {
          const tags = tagsInput.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag);
          
          // 生成新的角色卡配置
          const newCharacter = `  {
    name: "${fileName}",
    displayName: "${displayName}",
    tags: [${tags.map(tag => `"${tag}"`).join(", ")}],
  }`;
          
          // 在数组末尾添加新角色卡
          cosConfigContent = cosConfigContent.replace(
            /export const COS_CHARACTER_FILES = (\[[\s\S]*?\]);/,
            (match, arrayContent) => {
              // 在最后一个元素后添加新元素
              const newArrayContent = arrayContent.replace(
                /(\s*);$/,
                `,\n${newCharacter}\n];`
              );
              return `export const COS_CHARACTER_FILES = ${newArrayContent}`;
            }
          );
          
          // 保存配置
          fs.writeFileSync(cosConfigPath, cosConfigContent);
          
          console.log(`✅ 已添加角色卡: ${fileName}`);
          console.log(`   显示名称: ${displayName}`);
          console.log(`   标签: ${tags.join(", ")}\n`);
          
          resolve();
        });
      });
    });
  });
}

// 删除角色卡
function removeCharacter() {
  return new Promise((resolve) => {
    console.log("🗑️  删除角色卡\n");
    
    rl.question("请输入要删除的文件名: ", (fileName) => {
      // 查找并删除指定的角色卡配置
      const regex = new RegExp(`\\s*\\{[^}]*name: "${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*\\},?\\s*`, 'g');
      
      if (cosConfigContent.match(regex)) {
        cosConfigContent = cosConfigContent.replace(regex, '');
        
        // 清理多余的逗号
        cosConfigContent = cosConfigContent.replace(/,\s*,/g, ',');
        cosConfigContent = cosConfigContent.replace(/,\s*];/g, '\n];');
        
        // 保存配置
        fs.writeFileSync(cosConfigPath, cosConfigContent);
        
        console.log(`✅ 已删除角色卡: ${fileName}\n`);
      } else {
        console.log(`❌ 未找到角色卡: ${fileName}\n`);
      }
      
      resolve();
    });
  });
}

// 显示菜单
function showMenu() {
  console.log("请选择操作：");
  console.log("1. 查看当前配置的角色卡");
  console.log("2. 添加新角色卡");
  console.log("3. 删除角色卡");
  console.log("4. 退出");
  console.log("");
}

// 主菜单循环
async function mainMenu() {
  while (true) {
    showMenu();
    
    const choice = await new Promise((resolve) => {
      rl.question("请输入选项 (1-4): ", resolve);
    });
    
    switch (choice.trim()) {
      case '1':
        showCurrentCharacters();
        break;
      case '2':
        await addNewCharacter();
        break;
      case '3':
        await removeCharacter();
        break;
      case '4':
        console.log("👋 再见！");
        rl.close();
        return;
      default:
        console.log("❌ 无效选项，请重新选择\n");
    }
  }
}

// 运行主程序
async function main() {
  try {
    await mainMenu();
  } catch (error) {
    console.error("❌ 程序出错:", error.message);
    rl.close();
  }
}

main(); 