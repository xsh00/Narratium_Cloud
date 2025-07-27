/**
 * VIP角色专区MinIO配置
 *
 * 配置VIP角色专区的MinIO存储信息
 * 用于存储和访问VIP角色卡PNG文件
 */

export const MINIO_VIP_CONFIG = {
  // MinIO S3 API地址
  S3_API_URL: "https://characterapi.sillytarven.top",
  
  // 存储桶名称
  BUCKET_NAME: "narratium-vip",
  
  // 角色卡文件目录（可选，如果文件直接存储在根目录则设为空字符串）
  CHARACTER_CARDS_PATH: "",
  
  // 获取完整的角色卡文件URL
  getCharacterCardUrl(fileName: string): string {
    const path = this.CHARACTER_CARDS_PATH ? `${this.CHARACTER_CARDS_PATH}/` : "";
    return `${this.S3_API_URL}/${this.BUCKET_NAME}/${path}${fileName}`;
  },
  
  // 获取VIP角色卡列表的API端点
  get LIST_API_URL() {
    return `/api/minio/vip-list`;
  },
};

/**
 * VIP角色专区配置
 * 
 * 这是VIP角色卡下载源配置
 * 系统会自动从MinIO存储桶获取所有PNG文件
 * VIP用户可下载，非VIP用户需要订阅后才能下载
 */

/**
 * 使用说明：
 *
 * 1. 将VIP角色卡PNG文件上传到MinIO存储桶
 * 2. 系统会自动通过API获取文件列表，无需手动维护
 * 3. 文件名格式建议：角色名--标签1,标签2.png
 * 4. 标签会自动从文件名中提取
 */ 