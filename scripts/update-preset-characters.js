#!/usr/bin/env node

/**
 * 更新预设角色脚本
 *
 * 这个脚本会从您的GitHub仓库获取所有角色卡文件，
 * 并帮助您更新预设角色列表
 *
 * 使用方法：
 * node scripts/update-preset-characters.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

// 从配置文件读取GitHub配置
const configPath = path.join(__dirname, "../lib/config/github-config.ts");
const configContent = fs.readFileSync(configPath, "utf8");

// 提取用户名和仓库名
const usernameMatch = configContent.match(/USERNAME: "([^"]+)"/);
const repoNameMatch = configContent.match(/REPO_NAME: "([^"]+)"/);

if (!usernameMatch || !repoNameMatch) {
  console.error("❌ 无法从配置文件中读取GitHub信息");
  process.exit(1);
}

const username = usernameMatch[1];
const repoName = repoNameMatch[1];

console.log("🔍 正在获取GitHub仓库中的角色卡文件...");
console.log(`   仓库: ${username}/${repoName}\n`);

// 获取GitHub仓库内容
function getGitHubContents() {
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${username}/${repoName}/contents`;

    const options = {
      headers: {
        "User-Agent": "Narratium-Cloud-Setup-Script",
        Accept: "application/vnd.github.v3+json",
      },
    };

    https
      .get(url, options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`GitHub API 错误: ${res.statusCode} - ${data}`));
            return;
          }

          try {
            const files = JSON.parse(data);
            resolve(files);
          } catch (error) {
            reject(
              new Error(
                `JSON 解析错误: ${error.message}\n响应数据: ${data.substring(0, 200)}...`,
              ),
            );
          }
        });
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

async function updatePresetCharacters() {
  try {
    const files = await getGitHubContents();

    // 过滤PNG文件
    const pngFiles = files.filter((file) => file.name.endsWith(".png"));

    if (pngFiles.length === 0) {
      console.log("❌ 仓库中没有找到PNG角色卡文件");
      return;
    }

    console.log(`✅ 找到 ${pngFiles.length} 个角色卡文件：\n`);

    pngFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
    });

    console.log("\n📝 正在更新预设角色配置文件...");

    // 读取当前预设角色配置
    const presetConfigPath = path.join(
      __dirname,
      "../lib/config/preset-characters.ts",
    );
    let presetContent = fs.readFileSync(presetConfigPath, "utf8");

    // 生成新的预设角色数组
    const characterNames = pngFiles.map((file) => `"${file.name}"`);
    const newArrayContent = `[\n  ${characterNames.join(",\n  ")}\n];`;

    // 替换数组内容
    presetContent = presetContent.replace(
      /export const PRESET_CHARACTERS = \[[\s\S]*?\];/,
      `export const PRESET_CHARACTERS = ${newArrayContent}`,
    );

    // 写入更新后的配置
    fs.writeFileSync(presetConfigPath, presetContent);

    console.log("✅ 预设角色配置已更新！");
    console.log("\n📋 更新内容：");
    console.log(`   - 添加了 ${pngFiles.length} 个角色卡文件`);
    console.log(`   - 文件已保存到: lib/config/preset-characters.ts`);

    console.log("\n🔄 下次启动应用程序时，这些角色将作为预设角色自动下载。");
  } catch (error) {
    console.error("❌ 更新失败:", error.message);

    if (error.message.includes("Not Found")) {
      console.log("\n💡 可能的原因：");
      console.log("   - GitHub仓库不存在或不是公开的");
      console.log("   - 用户名或仓库名配置错误");
      console.log("   - 网络连接问题");
    }
  }
}

// 运行更新
updatePresetCharacters();
