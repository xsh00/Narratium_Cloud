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
  {
    name: "《微笑的国度与闪耀的每日》——菲比--同人二创.png",
    displayName: "《微笑的国度与闪耀的每日》——菲比",
    tags: ["同人二创"],
  },
  {
    name: "《无星之海》——坎特蕾拉--同人二创.png",
    displayName: "《无星之海》——坎特蕾拉",
    tags: ["同人二创"],
  },
  {
    name: "Niya教授--同人二创.png",
    displayName: "Niya教授",
    tags: ["同人二创"],
  },
  {
    name: "东京喰种-喰种搜查官--同人二创.png",
    displayName: "东京喰种-喰种搜查官",
    tags: ["同人二创"],
  },
  {
    name: "仙剑奇侠传Ⅰ--同人二创.png",
    displayName: "仙剑奇侠传Ⅰ",
    tags: ["同人二创"],
  },
  {
    name: "全职法师--同人二创.png",
    displayName: "全职法师",
    tags: ["同人二创"],
  },
  {
    name: "刀剑神域--同人二创.png",
    displayName: "刀剑神域",
    tags: ["同人二创"],
  },
  {
    name: "吞噬星空--同人二创.png",
    displayName: "吞噬星空",
    tags: ["同人二创"],
  },
  {
    name: "命运之夜--同人二创.png",
    displayName: "命运之夜",
    tags: ["同人二创"],
  },
  {
    name: "哈利波特--同人二创.png",
    displayName: "哈利波特",
    tags: ["同人二创"],
  },
  {
    name: "完美世界--同人二创.png",
    displayName: "完美世界",
    tags: ["同人二创"],
  },
  {
    name: "小猪熊传奇--同人二创.png",
    displayName: "小猪熊传奇",
    tags: ["同人二创"],
  },
  {
    name: "崩坏星穹铁道同人卡--同人二创.png",
    displayName: "崩坏星穹铁道同人卡",
    tags: ["同人二创"],
  },
  {
    name: "开局即决斗！重返学院，你能否攻略双马尾傲娇巨乳皇女？--人妻.png",
    displayName: "开局即决斗！重返学院，你能否攻略双马尾傲娇巨乳皇女？",
    tags: ["人妻"],
  },
  {
    name: "文学部与JOJO的奇妙融合--同人二创.png",
    displayName: "文学部与JOJO的奇妙融合",
    tags: ["同人二创"],
  },
  {
    name: "斗破苍穹之红颜群堕--同人二创.png",
    displayName: "斗破苍穹之红颜群堕",
    tags: ["同人二创"],
  },
  {
    name: "武侠-天龙八部--同人二创.png",
    displayName: "武侠-天龙八部",
    tags: ["同人二创"],
  },
  {
    name: "海贼王--同人二创.png",
    displayName: "海贼王",
    tags: ["同人二创"],
  },
  {
    name: "火影卡--同人二创.png",
    displayName: "火影卡",
    tags: ["同人二创"],
  },
  {
    name: "狐妖小红娘（奇幻都市版）--同人二创.png",
    displayName: "狐妖小红娘（奇幻都市版）",
    tags: ["同人二创"],
  },
  {
    name: "神鬼剑士--同人二创.png",
    displayName: "神鬼剑士",
    tags: ["同人二创"],
  },
  {
    name: "秦时便器--同人二创.png",
    displayName: "秦时便器",
    tags: ["同人二创"],
  },
  {
    name: "综武大世界--同人二创.png",
    displayName: "综武大世界",
    tags: ["同人二创"],
  },
  {
    name: "英雄联盟--同人二创.png",
    displayName: "英雄联盟",
    tags: ["同人二创"],
  },
  {
    name: "英雄联盟：符文之地--同人二创.png",
    displayName: "英雄联盟：符文之地",
    tags: ["同人二创"],
  },
  {
    name: "葬送的芙莉莲--同人二创.png",
    displayName: "葬送的芙莉莲",
    tags: ["同人二创"],
  },
  {
    name: "蔚蓝档案--同人二创.png",
    displayName: "蔚蓝档案",
    tags: ["同人二创"],
  },
  {
    name: "赫敏·格兰杰--同人二创.png",
    displayName: "赫敏·格兰杰",
    tags: ["同人二创"],
  },
  {
    name: "转生成为纣王，逆转封神之战！--古风，前端美化.png",
    displayName: "转生成为纣王，逆转封神之战！",
    tags: ["古风", "前端美化"],
  },
  {
    name: "辉夜大小姐同人--同人二创.png",
    displayName: "辉夜大小姐同人",
    tags: ["同人二创"],
  },
  {
    name: "鬼吹灯世界--同人二创.png",
    displayName: "鬼吹灯世界",
    tags: ["同人二创"],
  },
  {
    name: "鲁鲁修的监禁生活！--同人二创.png",
    displayName: "鲁鲁修的监禁生活！",
    tags: ["同人二创"],
  },
  {
    name: "鸟白岛的夏日恋曲--前端美化.png",
    displayName: "鸟白岛的夏日恋曲",
    tags: ["前端美化"],
  },
  {
    name: "黑袍纠察队--同人二创.png",
    displayName: "黑袍纠察队",
    tags: ["同人二创"],
  },
  {
    name: "龙族：宿命回响--同人二创.png",
    displayName: "龙族：宿命回响",
    tags: ["同人二创"],
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