import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

const MINIO_CONFIG = {
  S3_API_URL: "https://characterapi.sillytarven.top",
  BUCKET_NAME: "narratium",
  CHARACTER_CARDS_PATH: "",
};

interface MinioFile {
  name: string;
  displayName: string;
  tags: string[]; 
  download_url: string;
}

/**
 * 从MinIO存储桶获取所有PNG文件列表
 * 使用MinIO的ListObjects API
 */
async function getMinioFileList(): Promise<MinioFile[]> {
  try {
    // 构建MinIO ListObjects API URL
    const listUrl = `${MINIO_CONFIG.S3_API_URL}/${MINIO_CONFIG.BUCKET_NAME}?list-type=2&prefix=${MINIO_CONFIG.CHARACTER_CARDS_PATH}`;
    
    console.log('Fetching MinIO file list from:', listUrl);
    
    const xmlText = await new Promise<string>((resolve, reject) => {
      const url = new URL(listUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/xml, text/xml, */*',
          'Accept-Charset': 'utf-8'
        }
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        res.on('end', () => {
          if (res.statusCode === 200) {
            const buffer = Buffer.concat(chunks);
            const data = buffer.toString('utf8');
            resolve(data);
          } else {
            reject(new Error(`MinIO API returned ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
    console.log('MinIO API response:', xmlText.substring(0, 500));

    // 解析XML响应
    const files = parseMinioXmlResponse(xmlText);
    
    // 过滤出PNG文件
    const pngFiles = files.filter(file => 
      file.toLowerCase().endsWith('.png')
    );

    // 转换为应用需要的格式
    const characterFiles: MinioFile[] = pngFiles.map(fileName => {
      const { displayName, tags } = extractCharacterInfo(fileName);
      return {
        name: fileName,
        displayName,
        tags,
        download_url: `${MINIO_CONFIG.S3_API_URL}/${MINIO_CONFIG.BUCKET_NAME}/${encodeURIComponent(fileName)}`
      };
    });

    console.log(`Found ${characterFiles.length} PNG files in MinIO`);
    return characterFiles;

  } catch (error) {
    console.error('Error fetching MinIO file list:', error);
    throw error;
  }
}

/**
 * 解析MinIO ListObjects API的XML响应
 */
function parseMinioXmlResponse(xmlText: string): string[] {
  const files: string[] = [];
  
  // 使用更精确的XML解析，提取Contents标签中的Key
  // 使用非贪婪匹配，并确保正确处理中文字符
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
function extractCharacterInfo(fileName: string): { displayName: string; tags: string[] } {
  const nameWithoutExt = fileName.replace(/\.png$/, "");
  const parts = nameWithoutExt.split(/--/);

  let displayName = nameWithoutExt;
  let tags: string[] = [];

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

/**
 * GET /api/minio/list
 * 获取MinIO存储桶中的角色卡文件列表
 */
export async function GET(request: NextRequest) {
  try {
    console.log('MinIO list API called');
    
    const files = await getMinioFileList();
    
    return NextResponse.json({
      success: true,
      data: files,
      count: files.length
    });

  } catch (error) {
    console.error('MinIO list API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }, { status: 500 });
  }
} 