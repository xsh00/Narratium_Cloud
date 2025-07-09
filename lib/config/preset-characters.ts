/**
 * 预设角色配置
 *
 * 这个文件定义了首次访问时自动下载的预设角色
 * 请根据您的GitHub仓库中的实际文件名进行配置
 */

export const PRESET_CHARACTERS = [
  "仙子母猪检疫站.png",
  "孕仙春楼.png",
  "星辰为冢.png",
  "校园-傲娇-猫系-双性可选-gb-bl主攻.png",
  "英国人妻弟媳.png",
  "长离.png",
];

/**
 * 默认预设JSON配置
 * 这些预设将在用户首次访问时自动导入
 */
export const DEFAULT_PRESET_CONFIGS = [
  {
    name: "Dreammini-1.4-ultra",
    displayName: {
      zh: "梦境系统 1.4 超强版",
      en: "Dreammini 1.4 Ultra",
    },
    description: {
      zh: "虚拟梦境开放世界系统，支持NSFW内容，情感互动专家",
      en: "Virtual dream open world system with NSFW support and emotional interaction expertise",
    },
    filename: "【Dreammini】1.4-ultra-0627.json",
    enabled: true,
    autoImport: true,
  },
  {
    name: "mirror_realm",
    displayName: {
      zh: "灵镜之境",
      en: "Mirror Realm",
    },
    description: {
      zh: "多面灵魂角色协议，情感互动专家",
      en: "Multi-faceted soul character protocol, emotional interaction expert",
    },
    filename: "mirror_realm_preset.json",
    enabled: false,
    autoImport: true,
  },
  {
    name: "novel_king",
    displayName: {
      zh: "小说之王",
      en: "Novel King",
    },
    description: {
      zh: "史诗织梦叙事大师，故事推进专家",
      en: "Epic narrative master, story progression expert",
    },
    filename: "novel_king_preset.json",
    enabled: false,
    autoImport: true,
  },
];

/**
 * 如何更新预设角色列表：
 *
 * 1. 检查您的GitHub仓库中的角色卡文件名
 * 2. 将文件名添加到上面的数组中
 * 3. 确保文件名完全匹配（包括大小写）
 *
 * 示例：
 * 如果您的仓库中有 "我的角色.png"，则添加：
 * "我的角色.png"
 *
 * 注意：
 * - 文件名必须完全匹配
 * - 支持中文文件名
 * - 必须是PNG格式
 */
