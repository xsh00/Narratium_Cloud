#!/usr/bin/env node

/**
 * GitHub API测试脚本
 *
 * 这个脚本测试GitHub API是否可以正常访问
 *
 * 使用方法：
 * node scripts/test-github-api.js
 */

const https = require('https');

// GitHub配置
const githubConfig = {
  username: 'xsh00',
  repoName: 'Narratium_CharacterCards',
  apiUrl: 'https://api.github.com/repos/xsh00/Narratium_CharacterCards/contents'
};

/**
 * 测试GitHub API访问
 */
function testGitHubAPI() {
  return new Promise((resolve, reject) => {
    console.log(`🔍 测试GitHub API: ${githubConfig.apiUrl}`);
    
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${githubConfig.username}/${githubConfig.repoName}/contents`,
      method: 'GET',
      headers: {
        'User-Agent': 'Narratium-Cloud-Test',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    
    const req = https.request(options, (res) => {
      console.log(`📊 响应状态: HTTP ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const files = JSON.parse(data);
            const pngFiles = files.filter(file => 
              file.type === 'file' && file.name.toLowerCase().endsWith('.png')
            );
            
            console.log(`✅ GitHub API访问成功`);
            console.log(`📁 找到 ${pngFiles.length} 个PNG文件`);
            
            if (pngFiles.length > 0) {
              console.log('\n📋 PNG文件列表：');
              pngFiles.slice(0, 5).forEach((file, index) => {
                console.log(`   ${index + 1}. ${file.name}`);
              });
              if (pngFiles.length > 5) {
                console.log(`   ... 还有 ${pngFiles.length - 5} 个文件`);
              }
            }
            
            resolve(true);
          } catch (error) {
            console.log('❌ 解析响应数据失败:', error.message);
            resolve(false);
          }
        } else if (res.statusCode === 404) {
          console.log('❌ 仓库不存在或无法访问');
          console.log('💡 请检查仓库名称和权限设置');
          resolve(false);
        } else if (res.statusCode === 403) {
          console.log('❌ API访问被限制');
          console.log('💡 可能需要配置GitHub Token或等待API限制重置');
          resolve(false);
        } else {
          console.log(`❌ API访问失败: HTTP ${res.statusCode}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ 请求错误: ${err.message}`);
      reject(err);
    });
    
    req.end();
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 GitHub API测试\n');
  
  try {
    // 1. 测试API访问
    const apiSuccess = await testGitHubAPI();
    
    if (apiSuccess) {
      console.log('\n✅ GitHub集成可以正常工作');
      console.log('💡 可以在角色卡下载页面使用"海外版（需VPN）"模式');
    } else {
      console.log('\n❌ GitHub API访问失败');
      console.log('💡 建议使用"国内版"模式（COS存储）');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testGitHubAPI
}; 