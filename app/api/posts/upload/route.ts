import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { uploadFile, testS3Connection } from '@/lib/config/minio-posts-config';

/**
 * 处理图片上传到S3对象存储
 */
export async function POST(request: NextRequest) {
  try {
    // 检查用户权限
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // 先测试S3连接
    await testS3Connection();
    // 注意：即使测试失败，我们也会继续尝试上传，testS3Connection始终返回true

    // 解析FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      return NextResponse.json(
        { error: '只支持图片文件' },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const uniqueId = uuidv4();
    const fileExtension = fileType.split('/')[1];
    const fileName = `${uniqueId}.${fileExtension}`;

    // 读取文件内容
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);

    // 上传到S3
    const fileUrl = await uploadFile(fileBuffer, fileName, fileType);

    // 返回文件URL
    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('图片上传失败:', error);
    return NextResponse.json(
      { error: '图片上传失败' },
      { status: 500 }
    );
  }
} 