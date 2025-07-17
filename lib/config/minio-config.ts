/**
 * MinIO配置
 *
 * 配置您的MinIO存储信息
 * 用于存储和访问角色卡PNG文件
 */

export const MINIO_CONFIG = {
  // MinIO S3 API地址
  S3_API_URL: "https://characterapi.sillytarven.top",
  
  // 存储桶名称
  BUCKET_NAME: "narratium",
  
  // 角色卡文件目录（可选，如果文件直接存储在根目录则设为空字符串）
  CHARACTER_CARDS_PATH: "",
  
  // 获取完整的角色卡文件URL
  getCharacterCardUrl(fileName: string): string {
    const path = this.CHARACTER_CARDS_PATH ? `${this.CHARACTER_CARDS_PATH}/` : "";
    return `${this.S3_API_URL}/${this.BUCKET_NAME}/${path}${fileName}`;
  },
  
  // 获取角色卡列表的API端点
  get LIST_API_URL() {
    return `/api/minio/list`;
  },
};

/**
 * MinIO角色卡配置
 * 
 * 这是唯一的角色卡下载源配置
 * 系统会自动从MinIO存储桶获取所有PNG文件
 */

/**
 * 使用说明：
 *
 * 1. 将您的角色卡PNG文件上传到MinIO存储桶
 * 2. 系统会自动通过API获取文件列表，无需手动维护
 * 3. 文件名格式建议：角色名--标签1,标签2.png
 * 4. 标签会自动从文件名中提取
 *
 * 优势：
 * - 无需手动维护文件列表
 * - 上传新文件后立即可用
 * - 支持自动标签提取
 * - 动态获取最新文件列表
 * - 统一的下载源，简化管理
 */ 