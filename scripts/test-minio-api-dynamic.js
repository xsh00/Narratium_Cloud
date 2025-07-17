/**
 * 测试动态MinIO API
 * 
 * 这个脚本用于测试新的MinIO API端点
 * 验证是否能动态获取文件列表
 */

const API_URL = "http://localhost:3000/api/minio/list";

async function testMinioAPI() {
  console.log("🔍 正在测试MinIO动态API...\n");
  
  console.log("📋 API信息：");
  console.log(`   API地址: ${API_URL}\n`);
  
  try {
    console.log("🧪 测试API调用...");
    
    const response = await fetch(API_URL);
    console.log(`   状态码: ${response.status}`);
    console.log(`   状态文本: ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   ✅ API调用成功！`);
      console.log(`   成功状态: ${result.success}`);
      console.log(`   文件数量: ${result.count}`);
      
      if (result.data && result.data.length > 0) {
        console.log("\n📁 文件列表（前5个）:");
        result.data.slice(0, 5).forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.name}`);
          console.log(`      显示名称: ${file.displayName}`);
          console.log(`      标签: ${file.tags.join(', ') || '无'}`);
          console.log(`      下载URL: ${file.download_url}`);
          console.log("");
        });
        
        if (result.data.length > 5) {
          console.log(`   ... 还有 ${result.data.length - 5} 个文件`);
        }
      } else {
        console.log("   ⚠️  没有找到PNG文件");
      }
      
      // 测试文件访问
      if (result.data && result.data.length > 0) {
        console.log("\n🧪 测试文件访问...");
        const testFile = result.data[0];
        
        try {
          const fileResponse = await fetch(testFile.download_url, { method: 'HEAD' });
          if (fileResponse.ok) {
            console.log(`   ✅ ${testFile.name} - 可访问`);
            console.log(`   Content-Type: ${fileResponse.headers.get('content-type')}`);
            console.log(`   Content-Length: ${fileResponse.headers.get('content-length')}`);
          } else {
            console.log(`   ❌ ${testFile.name} - HTTP ${fileResponse.status}`);
          }
        } catch (error) {
          console.log(`   ❌ ${testFile.name} - 错误: ${error.message}`);
        }
      }
      
    } else {
      console.log(`   ❌ API调用失败`);
      const errorText = await response.text();
      console.log(`   错误信息: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ 网络错误: ${error.message}`);
  }
  
  console.log("\n📊 测试完成");
}

// 运行测试
testMinioAPI().catch(console.error); 