import { NextRequest, NextResponse } from 'next/server';
import { Buffer } from 'buffer';

// 注意: 此API端点已不再使用，已被直接从upload API返回二进制数据的方式代替
// 保留此文件仅用于兼容性，可以在将来的版本中移除

export const config = {
  api: {
    responseLimit: '8mb',
    bodyParser: {
      sizeLimit: '8mb'
    }
  }
};

export async function GET(request: NextRequest) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const data = searchParams.get('data');
    const fileName = searchParams.get('name') || 'character.png';

    if (!data) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    try {
      // 解码base64数据
      let buffer: Buffer;
      try {
        buffer = Buffer.from(decodeURIComponent(data), 'base64');
      } catch (error) {
        console.error('Base64解码失败:', error);
        return NextResponse.json(
          { error: 'Base64解码失败' },
          { status: 400 }
        );
      }

      // 验证数据是否为有效的PNG格式
      const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      
      let isValidPng = buffer.length >= PNG_SIGNATURE.length;
      if (isValidPng) {
        for (let i = 0; i < PNG_SIGNATURE.length; i++) {
          if (buffer[i] !== PNG_SIGNATURE[i]) {
            isValidPng = false;
            break;
          }
        }
      }

      if (!isValidPng) {
        return NextResponse.json(
          { error: '无效的PNG格式数据' },
          { status: 400 }
        );
      }
      
      // 返回二进制数据
      const response = new NextResponse(buffer);
      
      // 设置正确的MIME类型和Content-Disposition
      response.headers.set('Content-Type', 'image/png');
      response.headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
      response.headers.set('Cache-Control', 'no-cache, no-store');
      
      return response;
    } catch (error) {
      console.error('解析图像数据失败:', error);
      return NextResponse.json(
        { error: '解析图像数据失败: ' + (error instanceof Error ? error.message : String(error)) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('图像代理错误:', error);
    return NextResponse.json(
      { error: '图像代理失败: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 