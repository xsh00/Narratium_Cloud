/**
 * 腾讯云COS配置
 *
 * 配置您的腾讯云COS存储桶信息
 * 用于存储和访问角色卡PNG文件
 */

export const COS_CONFIG = {
  // 腾讯云COS存储桶地址
  BUCKET_URL: "https://narratium-1329472700.cos.ap-shanghai.myqcloud.com",
  
  // 角色卡文件目录（可选，如果文件直接存储在根目录则设为空字符串）
  CHARACTER_CARDS_PATH: "",
  
  // 获取完整的角色卡文件URL
  getCharacterCardUrl(fileName: string): string {
    const path = this.CHARACTER_CARDS_PATH ? `${this.CHARACTER_CARDS_PATH}/` : "";
    return `${this.BUCKET_URL}/${path}${fileName}`;
  },
  
  // 获取角色卡列表的API端点（如果需要的话）
  // 注意：腾讯云COS没有直接的API来列出文件，需要其他方式获取文件列表
  LIST_API_URL: "", // 如果有自定义API来获取文件列表，可以在这里配置
};

/**
 * 预设角色卡文件列表
 * 由于腾讯云COS没有直接的API来列出文件，我们需要手动维护文件列表
 */
export const COS_CHARACTER_FILES = [
  {
    name: "斗罗大陆1.png",
    displayName: "斗罗大陆1",
    tags: ["小说", "玄幻"],
  },
  {
    name: "星辰为冢.png",
    displayName: "星辰为冢",
    tags: ["原创"],
  },
  {
    name: "古墓丽影—邪马台传说--同人二创.png",
    displayName: "古墓丽影—邪马台传说",
    tags: ["同人二创", "游戏"],
  },
  {
    name: "刀剑神域：IF线：Betrayal and Lust--前端美化，同人二创，NTL.png",
    displayName: "刀剑神域：IF线：Betrayal and Lust",
    tags: ["前端美化", "同人二创", "NTL"],
  },
];

/**
 * 使用说明：
 * 
 * 1. 将您的角色卡PNG文件上传到腾讯云COS存储桶
 * 2. 更新上面的 COS_CHARACTER_FILES 数组，添加您的文件名和标签信息
 * 3. 确保文件名与COS存储桶中的文件名完全匹配
 * 
 * 优势：
 * - 国内访问速度更快
 * - 无需GitHub API限制
 * - 更稳定的服务
 * 
 * 注意事项：
 * - 需要手动维护文件列表
 * - 确保COS存储桶的访问权限设置正确
 * - 建议启用CDN加速以获得更好的访问体验
 */ 