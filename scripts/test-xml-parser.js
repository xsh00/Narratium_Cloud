/**
 * 测试XML解析器是否正确处理中文字符
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
  
  // 使用更精确的XML解析，提取Contents标签中的Key
  const keyRegex = /<Key>([^<]+)<\/Key>/g;
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

async function testXmlParser() {
  console.log("🔍 测试XML解析器...\n");
  
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
    console.log("📄 XML响应长度:", xmlText.length);
    console.log("");

    // 解析XML响应
    const files = parseMinioXmlResponse(xmlText);
    console.log(`📁 解析到的文件列表 (${files.length} 个):`);
    
    // 查找包含"斗破苍穹"的文件
    const targetFile = files.find(file => file.includes('斗破苍穹'));
    if (targetFile) {
      console.log(`🎯 找到目标文件: ${targetFile}`);
      
      const { displayName, tags } = extractCharacterInfo(targetFile);
      console.log(`   显示名称: ${displayName}`);
      console.log(`   标签: ${tags.join(', ') || '无'}`);
      console.log(`   编码后的URL: ${MINIO_CONFIG.S3_API_URL}/${MINIO_CONFIG.BUCKET_NAME}/${encodeURIComponent(targetFile)}`);
    } else {
      console.log("❌ 未找到包含'斗破苍穹'的文件");
    }
    
    console.log("");
    
    // 查找包含"同人二创"的文件
    const filesWithTag = files.filter(file => file.includes('同人二创'));
    console.log(`🏷️  包含"同人二创"的文件 (${filesWithTag.length} 个):`);
    filesWithTag.slice(0, 5).forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    
    if (filesWithTag.length > 5) {
      console.log(`   ... 还有 ${filesWithTag.length - 5} 个文件`);
    }

  } catch (error) {
    console.error("❌ 测试失败:", error.message);
  }
}

// 运行测试
testXmlParser(); 