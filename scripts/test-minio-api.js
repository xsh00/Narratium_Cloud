/**
 * 测试MinIO API配置
 * 
 * 这个脚本用于测试MinIO存储桶配置是否正确
 * 显示当前配置的角色卡列表
 */

const MINIO_CONFIG = {
  // MinIO S3 API地址
  S3_API_URL: "https://characterapi.sillytarven.top",
  
  // 存储桶名称
  BUCKET_NAME: "narratium",
  
  // 角色卡文件目录（可选，如果文件直接存储在根目录则设为空字符串）
  CHARACTER_CARDS_PATH: "",
  
  // 获取完整的角色卡文件URL
  getCharacterCardUrl(fileName) {
    const path = this.CHARACTER_CARDS_PATH ? `${this.CHARACTER_CARDS_PATH}/` : "";
    return `${this.S3_API_URL}/${this.BUCKET_NAME}/${path}${fileName}`;
  },
  
  // 获取角色卡列表的API端点
  get LIST_API_URL() {
    return `${this.S3_API_URL}/api/list/${this.BUCKET_NAME}`;
  },
};

// 预设角色卡文件列表（从minio-config.ts复制）
const MINIO_CHARACTER_FILES = [
  {
    name: "1920年大英，工业时代与神秘侧的碰撞.png",
    displayName: "1920年大英，工业时代与神秘侧的碰撞",
    tags: [],
  },
  {
    name: "《致炽焰以战歌》——露帕.png",
    displayName: "《致炽焰以战歌》——露帕",
    tags: [],
  },
  {
    name: "刀剑神域：IF线：Betrayal and Lust.png",
    displayName: "刀剑神域：IF线：Betrayal and Lust",
    tags: [],
  },
  {
    name: "古墓丽影—邪马台传说.png",
    displayName: "古墓丽影—邪马台传说",
    tags: [],
  },
  {
    name: "古风女尊大世界.png",
    displayName: "古风女尊大世界",
    tags: ['同人'],
  },
  {
    name: "成为幸运观众，抽到知更鸟.png",
    displayName: "成为幸运观众，抽到知更鸟",
    tags: [],
  },
  {
    name: "斗罗大陆1.png",
    displayName: "斗罗大陆1",
    tags: [],
  },
  {
    name: "斗罗大陆2.png",
    displayName: "斗罗大陆2",
    tags: [],
  },
  {
    name: "星穹铁道.png",
    displayName: "星穹铁道",
    tags: [],
  },
  {
    name: "星辰为冢.png",
    displayName: "星辰为冢",
    tags: [],
  },
  {
    name: "更新第三部-剧情向《龙族》同人卡.png",
    displayName: "更新第三部-剧情向《龙族》同人卡",
    tags: [],
  },
  {
    name: "知更鸟.png",
    displayName: "知更鸟",
    tags: [],
  },
  {
    name: "精灵宝可梦-旅途.png",
    displayName: "精灵宝可梦-旅途",
    tags: [],
  },
  {
    name: "金庸群侠传之武林高手.png",
    displayName: "金庸群侠传之武林高手",
    tags: [],
  },
];

async function testMinIOConfig() {
  console.log("🔍 正在测试MinIO配置...\n");
  
  console.log("📋 配置信息：");
  console.log(`   S3 API地址: ${MINIO_CONFIG.S3_API_URL}`);
  console.log(`   存储桶名称: ${MINIO_CONFIG.BUCKET_NAME}`);
  console.log(`   文件目录: ${MINIO_CONFIG.CHARACTER_CARDS_PATH || "根目录"}`);
  console.log(`   列表API: ${MINIO_CONFIG.LIST_API_URL}\n`);
  
  // 测试几个角色卡文件的URL
  console.log("🔗 角色卡文件URL示例：");
  const testFiles = MINIO_CHARACTER_FILES.slice(0, 3);
  for (const file of testFiles) {
    const url = MINIO_CONFIG.getCharacterCardUrl(file.name);
    console.log(`   ${file.name}: ${url}`);
  }
  console.log();
  
  // 测试文件访问
  console.log("🧪 测试文件访问...");
  let successCount = 0;
  let totalCount = 0;
  
  for (const file of testFiles) {
    totalCount++;
    try {
      const url = MINIO_CONFIG.getCharacterCardUrl(file.name);
      const response = await fetch(url, { method: 'HEAD' });
      
      if (response.ok) {
        console.log(`   ✅ ${file.name} - 可访问`);
        successCount++;
      } else {
        console.log(`   ❌ ${file.name} - HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${file.name} - 错误: ${error.message}`);
    }
  }
  
  console.log(`\n📊 测试结果: ${successCount}/${totalCount} 个文件可访问`);
  
  if (successCount === totalCount) {
    console.log("🎉 MinIO配置测试通过！");
    console.log("💡 可以在角色卡下载页面使用MinIO模式");
  } else {
    console.log("⚠️  部分文件无法访问，请检查：");
    console.log("   1. MinIO服务是否正常运行");
    console.log("   2. 存储桶名称是否正确");
    console.log("   3. 文件是否已上传到存储桶");
    console.log("   4. 网络连接是否正常");
  }
}

// 运行测试
testMinIOConfig().catch(console.error); 