/**
 * 测试MinIO XML解析逻辑
 */

const MINIO_CONFIG = {
  S3_API_URL: "https://characterapi.sillytarven.top",
  BUCKET_NAME: "narratium",
};

/**
 * 解析MinIO ListObjects API的XML响应
 */
function parseMinioXmlResponse(xmlText) {
  const files = [];
  
  // 简单的XML解析，提取Contents标签中的Key
  const keyRegex = /<Key>(.*?)<\/Key>/g;
  let match;
  
  while ((match = keyRegex.exec(xmlText)) !== null) {
    const fileName = match[1];
    // 跳过目录本身
    if (!fileName.endsWith('/')) {
      files.push(fileName);
    }
  }
  
  return files;
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

async function testMinioParser() {
  console.log("🔍 测试MinIO XML解析逻辑...\n");
  
  try {
    // 获取MinIO文件列表
    const listUrl = `${MINIO_CONFIG.S3_API_URL}/${MINIO_CONFIG.BUCKET_NAME}?list-type=2`;
    console.log("📋 获取MinIO文件列表...");
    console.log(`   URL: ${listUrl}\n`);
    
    const response = await fetch(listUrl);
    if (!response.ok) {
      throw new Error(`MinIO API returned ${response.status}: ${response.statusText}`);
    }

    const xmlText = await response.text();
    console.log("📄 XML响应（前500字符）:");
    console.log(xmlText.substring(0, 500));
    console.log("");

    // 解析XML响应
    const files = parseMinioXmlResponse(xmlText);
    console.log(`📁 解析到的文件列表 (${files.length} 个):`);
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    console.log("");

    // 过滤出PNG文件
    const pngFiles = files.filter(file => 
      file.toLowerCase().endsWith('.png')
    );
    console.log(`🖼️  PNG文件列表 (${pngFiles.length} 个):`);
    pngFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    console.log("");

    // 转换为应用需要的格式
    const characterFiles = pngFiles.map(fileName => {
      const { displayName, tags } = extractCharacterInfo(fileName);
      return {
        name: fileName,
        displayName,
        tags,
        download_url: `${MINIO_CONFIG.S3_API_URL}/${MINIO_CONFIG.BUCKET_NAME}/${fileName}`
      };
    });

    console.log("🎭 角色卡信息:");
    characterFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.name}`);
      console.log(`      显示名称: ${file.displayName}`);
      console.log(`      标签: ${file.tags.join(', ') || '无'}`);
      console.log(`      下载URL: ${file.download_url}`);
      console.log("");
    });

    // 测试文件访问
    console.log("🧪 测试文件访问...");
    for (const file of characterFiles) {
      try {
        const fileResponse = await fetch(file.download_url, { method: 'HEAD' });
        if (fileResponse.ok) {
          console.log(`   ✅ ${file.name} - 可访问`);
        } else {
          console.log(`   ❌ ${file.name} - HTTP ${fileResponse.status}`);
        }
      } catch (error) {
        console.log(`   ❌ ${file.name} - 错误: ${error.message}`);
      }
    }

    console.log("\n📊 测试完成！");
    console.log(`   总文件数: ${files.length}`);
    console.log(`   PNG文件数: ${pngFiles.length}`);
    console.log(`   可访问文件数: ${characterFiles.length}`);

  } catch (error) {
    console.error("❌ 测试失败:", error.message);
  }
}

// 运行测试
testMinioParser().catch(console.error); 