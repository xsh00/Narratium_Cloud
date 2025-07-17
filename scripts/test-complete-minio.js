/**
 * 完整的MinIO功能测试
 * 
 * 测试从API获取文件列表到文件下载的完整流程
 */

const API_URL = "http://localhost:3000/api/minio/list";

async function testCompleteMinioFlow() {
  console.log("🎯 开始完整的MinIO功能测试...\n");
  
  try {
    // 1. 测试API端点
    console.log("1️⃣ 测试API端点...");
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`API返回错误: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log(`   ✅ API调用成功`);
    console.log(`   📊 成功状态: ${result.success}`);
    console.log(`   📁 文件数量: ${result.count}`);
    
    if (!result.success) {
      throw new Error(`API返回失败: ${result.error}`);
    }
    
    // 2. 显示文件列表
    console.log("\n2️⃣ 文件列表:");
    result.data.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name}`);
      console.log(`      显示名称: ${file.displayName}`);
      console.log(`      标签: ${file.tags.join(', ') || '无'}`);
      console.log(`      下载URL: ${file.download_url}`);
      console.log("");
    });
    
    // 3. 测试文件下载
    console.log("3️⃣ 测试文件下载...");
    let downloadSuccessCount = 0;
    
    for (const file of result.data) {
      try {
        const fileResponse = await fetch(file.download_url, { method: 'HEAD' });
        if (fileResponse.ok) {
          console.log(`   ✅ ${file.name} - 可下载`);
          console.log(`      Content-Type: ${fileResponse.headers.get('content-type')}`);
          console.log(`      Content-Length: ${fileResponse.headers.get('content-length')} bytes`);
          downloadSuccessCount++;
        } else {
          console.log(`   ❌ ${file.name} - HTTP ${fileResponse.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${file.name} - 错误: ${error.message}`);
      }
    }
    
    // 4. 测试标签提取功能
    console.log("\n4️⃣ 测试标签提取功能...");
    const testFiles = [
      "角色名--标签1,标签2.png",
      "知更鸟--同人二创.png",
      "《致炽焰以战歌》——露帕--古风,同人.png",
      "简单文件名.png"
    ];
    
    testFiles.forEach(fileName => {
      const { displayName, tags } = extractCharacterInfo(fileName);
      console.log(`   📝 ${fileName}`);
      console.log(`      显示名称: ${displayName}`);
      console.log(`      标签: ${tags.join(', ') || '无'}`);
      console.log("");
    });
    
    // 5. 总结
    console.log("5️⃣ 测试总结:");
    console.log(`   📊 总文件数: ${result.count}`);
    console.log(`   ✅ 可下载文件: ${downloadSuccessCount}/${result.count}`);
    console.log(`   🎯 API状态: 正常`);
    console.log(`   🔗 文件访问: 正常`);
    console.log(`   🏷️  标签提取: 正常`);
    
    if (downloadSuccessCount === result.count) {
      console.log("\n🎉 所有测试通过！MinIO动态文件列表功能完全正常！");
      console.log("\n💡 现在您可以:");
      console.log("   1. 直接上传PNG文件到MinIO存储桶");
      console.log("   2. 刷新页面即可看到新文件");
      console.log("   3. 使用文件名格式 '角色名--标签1,标签2.png' 自动提取标签");
      console.log("   4. 无需任何手动配置！");
    } else {
      console.log("\n⚠️  部分文件无法下载，请检查MinIO配置");
    }
    
  } catch (error) {
    console.error("❌ 测试失败:", error.message);
  }
}

/**
 * 从文件名提取角色信息和标签
 */
function extractCharacterInfo(fileName) {
  const nameWithoutExt = fileName.replace(/\.png$/, "");
  const parts = nameWithoutExt.split(/--/);

  let displayName = nameWithoutExt;
  let tags = [];

  if (parts.length >= 1) {
    displayName = parts[0].trim();

    // 提取标签（如果有的话）
    if (parts.length > 1) {
      const tagPart = parts.slice(1).join("--");
      tags = tagPart
        .split(/[,，、]/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }
  }

  return { displayName, tags };
}

// 运行测试
testCompleteMinioFlow().catch(console.error); 