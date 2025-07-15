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