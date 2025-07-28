import { NextRequest, NextResponse } from 'next/server';
import https from 'https';
import { MINIO_VIP_CONFIG } from '@/lib/config/minio-vip-config';

interface MinioFile {
  name: string;
  displayName: string;
  tags: string[]; 
  download_url: string;
  lastModified: string; // 添加lastModified字段
}

/**
 * 从MinIO存储桶获取所有VIP PNG文件列表
 * 使用MinIO的ListObjects API
 */
async function getMinioVIPFileList(): Promise<MinioFile[]> {
  try {
    // 构建MinIO ListObjects API URL
    const listUrl = `${MINIO_VIP_CONFIG.S3_API_URL}/${MINIO_VIP_CONFIG.BUCKET_NAME}?list-type=2&prefix=${MINIO_VIP_CONFIG.CHARACTER_CARDS_PATH}`;
    
    console.log('Fetching MinIO VIP file list from:', listUrl);
    console.log('MinIO VIP config:', { 
      api_url: MINIO_VIP_CONFIG.S3_API_URL, 
      bucket: MINIO_VIP_CONFIG.BUCKET_NAME 
    });
    
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

      console.log('HTTP Request options:', {
        hostname: options.hostname,
        path: options.path,
        method: options.method
      });

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => {
          chunks.push(chunk);
        });
        res.on('end', () => {
          if (res.statusCode === 200) {
            const buffer = Buffer.concat(chunks);
            const data = buffer.toString('utf8');
            
            // 检查返回的是否是XML，而不是HTML
            if (data.trim().startsWith('<!DOCTYPE html>') || data.trim().startsWith('<html>') || data.trim().startsWith('<!doctype html>')) {
              reject(new Error('MinIO API returned HTML instead of XML. This usually means the API endpoint is incorrect.'));
              return;
            }
            
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
    
    // 检查返回内容的开头，避免日志过大
    const responsePreview = xmlText.substring(0, 500) + (xmlText.length > 500 ? '...' : '');
    console.log('MinIO VIP API response preview:', responsePreview);
    
    // 确认XML是否包含正确的响应格式
    if (!xmlText.includes('ListBucketResult') && !xmlText.includes('<Key>')) {
      console.error('MinIO API response does not contain expected XML structure');
      console.error('Response preview:', responsePreview);
      throw new Error('Invalid XML response from MinIO API');
    }

    // 解析XML响应
    const fileEntries = parseMinioXmlResponseWithDates(xmlText);
    console.log(`Parsed ${fileEntries.length} files from MinIO XML response`);
    
    // 过滤出PNG文件
    const pngFiles = fileEntries.filter(fileEntry => 
      fileEntry.key.toLowerCase().endsWith('.png')
    );
    console.log(`Filtered ${pngFiles.length} PNG files`);

    // 转换为应用需要的格式
    const characterFiles: MinioFile[] = pngFiles.map(fileEntry => {
      const { displayName, tags } = extractCharacterInfo(fileEntry.key);
      return {
        name: fileEntry.key,
        displayName,
        tags,
        download_url: `${MINIO_VIP_CONFIG.S3_API_URL}/${MINIO_VIP_CONFIG.BUCKET_NAME}/${encodeURIComponent(fileEntry.key)}`,
        lastModified: fileEntry.lastModified
      };
    });

    // 按上传时间倒序排序（最新的排在前面）
    characterFiles.sort((a, b) => {
      return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
    });

    console.log(`Found ${characterFiles.length} VIP PNG files in MinIO`);
    return characterFiles;

  } catch (error) {
    console.error('Error fetching MinIO VIP file list:', error);
    throw error;
  }
}

/**
 * 解析MinIO ListObjects API的XML响应，包括LastModified信息
 */
function parseMinioXmlResponseWithDates(xmlText: string): { key: string, lastModified: string }[] {
  const fileEntries: { key: string, lastModified: string }[] = [];
  
  // 查找所有的Contents标签内容
  const contentsRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
  let contentsMatch;
  
  while ((contentsMatch = contentsRegex.exec(xmlText)) !== null) {
    const contentText = contentsMatch[1];
    
    // 提取Key
    const keyMatch = /<Key>([^<]+)<\/Key>/g.exec(contentText);
    // 提取LastModified
    const lastModifiedMatch = /<LastModified>([^<]+)<\/LastModified>/g.exec(contentText);
    
    if (keyMatch && lastModifiedMatch) {
      const key = keyMatch[1];
      const lastModified = lastModifiedMatch[1];
      
      // 跳过目录本身
      if (!key.endsWith('/')) {
        fileEntries.push({
          key,
          lastModified
        });
      }
    }
  }
  
  return fileEntries;
}

/**
 * 解析MinIO ListObjects API的XML响应
 * 保留旧函数，以便在新方法失败时可以回退
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
 * GET /api/minio/vip-list
 * 获取MinIO存储桶中的VIP角色卡文件列表
 */
export async function GET(request: NextRequest) {
  try {
    console.log('MinIO VIP list API called');
    
    const files = await getMinioVIPFileList();
    
    return NextResponse.json({
      success: true,
      data: files,
      count: files.length
    });

  } catch (error) {
    console.error('MinIO VIP list API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: []
    }, { status: 500 });
  }
} 