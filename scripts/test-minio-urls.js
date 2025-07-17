/**
 * 测试不同的MinIO URL格式
 */

const https = require('https');
const http = require('http');

const S3_API_URL = "https://characterapi.sillytarven.top";
const BUCKET_NAME = "narratium";
const TEST_FILE = "1920年大英，工业时代与神秘侧的碰撞.png";

// 不同的URL格式
const urlFormats = [
  {
    name: "格式1: /bucket/file",
    url: `${S3_API_URL}/${BUCKET_NAME}/${TEST_FILE}`
  },
  {
    name: "格式2: /bucket-name/file",
    url: `${S3_API_URL}/${BUCKET_NAME}/${TEST_FILE}`
  },
  {
    name: "格式3: 直接域名",
    url: `${S3_API_URL}/${TEST_FILE}`
  },
  {
    name: "格式4: 带端口",
    url: `${S3_API_URL}:9000/${BUCKET_NAME}/${TEST_FILE}`
  },
  {
    name: "格式5: 带路径前缀",
    url: `${S3_API_URL}/minio/${BUCKET_NAME}/${TEST_FILE}`
  }
];

function makeRequest(url, method = 'HEAD') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      resolve({
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        headers: res.headers
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testUrlFormats() {
  console.log("🔍 测试不同的MinIO URL格式...\n");
  
  for (const format of urlFormats) {
    try {
      console.log(`📋 测试 ${format.name}:`);
      console.log(`   URL: ${format.url}`);
      
      const response = await makeRequest(format.url, 'HEAD');
      
      console.log(`   状态码: ${response.statusCode}`);
      console.log(`   状态文本: ${response.statusMessage}`);
      
      if (response.statusCode === 200) {
        console.log(`   ✅ 成功访问！`);
        console.log(`   Content-Type: ${response.headers['content-type']}`);
        console.log(`   Content-Length: ${response.headers['content-length']}`);
      } else {
        console.log(`   ❌ 访问失败`);
      }
      
      console.log("");
    } catch (error) {
      console.log(`   ❌ 错误: ${error.message}\n`);
    }
  }
  
  // 测试API端点
  console.log("🔍 测试API端点...");
  try {
    const apiUrl = `${S3_API_URL}/api/list/${BUCKET_NAME}`;
    console.log(`   API URL: ${apiUrl}`);
    
    const response = await makeRequest(apiUrl, 'GET');
    console.log(`   状态码: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log(`   ✅ API访问成功`);
    } else {
      console.log(`   ❌ API访问失败`);
    }
  } catch (error) {
    console.log(`   ❌ API错误: ${error.message}`);
  }
}

testUrlFormats().catch(console.error); 