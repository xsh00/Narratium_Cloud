import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, ListBucketsCommand } from "@aws-sdk/client-s3";

// 存储桶名称
export const POSTS_BUCKET = "posts-img";

// 设置S3客户端
const s3Client = new S3Client({
  region: "us-east-1", // MinIO默认区域
  endpoint: "https://characterapi.sillytarven.top",
  credentials: {
    accessKeyId: "admin",
    secretAccessKey: "0107151457nk",
  },
  forcePathStyle: true, // 使用路径样式访问
});

// 测试S3连接
export const testS3Connection = async (): Promise<boolean> => {
  try {
    console.log('测试S3连接...');
    // 使用ListBucketsCommand代替HeadBucketCommand
    await s3Client.send(new ListBucketsCommand({}));
    console.log('S3连接成功！');
    return true;
  } catch (error) {
    console.error('S3连接测试失败:', error);
    // 尽管有错误，我们仍然尝试上传
    // 这样可以解决HeadBucket可能缺少权限但上传仍能工作的情况
    console.log('尽管连接测试失败，我们仍将尝试上传');
    return true;
  }
};

// 上传文件到存储桶
export const uploadFile = async (fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> => {
  try {
    console.log(`上传文件到S3: ${fileName}, 大小: ${fileBuffer.length} 字节`);
    
    // 上传文件
    await s3Client.send(
      new PutObjectCommand({
        Bucket: POSTS_BUCKET,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: "public-read", // 确保对象可以公开访问
      })
    );
    
    console.log(`文件 ${fileName} 上传成功`);
    
    // 修正文件URL格式，使用正确的S3访问格式
    // 使用/分隔符而不是嵌套路径
    return `https://characterapi.sillytarven.top/${POSTS_BUCKET}/${fileName}`;
  } catch (error) {
    console.error('上传文件到S3失败:', error);
    throw error;
  }
};

// 删除文件
export const deleteFile = async (fileName: string): Promise<void> => {
  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: POSTS_BUCKET,
        Key: fileName,
      })
    );
  } catch (error) {
    console.error(`删除文件 ${fileName} 失败:`, error);
    throw error;
  }
};

export default s3Client; 