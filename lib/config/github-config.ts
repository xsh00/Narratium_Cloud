/**
 * GitHub Configuration
 * 
 * 配置您的GitHub仓库信息
 * 请将 YOUR_USERNAME 和 YOUR_REPO_NAME 替换为您的实际GitHub用户名和仓库名
 */

export const GITHUB_CONFIG = {
  // 您的GitHub用户名
  USERNAME: "xsh00",
  
  // 您的角色卡仓库名
  REPO_NAME: "Narratium_CharacterCards",
  
  // GitHub API URL
  get API_URL() {
    return `https://api.github.com/repos/${this.USERNAME}/${this.REPO_NAME}/contents`;
  },
  
  // 原始文件URL
  get RAW_BASE_URL() {
    return `https://raw.githubusercontent.com/${this.USERNAME}/${this.REPO_NAME}/main/`;
  }
};

/**
 * 使用示例：
 * 
 * 1. 将 YOUR_USERNAME 替换为您的GitHub用户名
 * 2. 将 YOUR_REPO_NAME 替换为您的仓库名
 * 
 * 例如：
 * USERNAME: "john-doe"
 * REPO_NAME: "my-character-cards"
 * 
 * 这样会生成：
 * API_URL: "https://api.github.com/repos/john-doe/my-character-cards/contents"
 * RAW_BASE_URL: "https://raw.githubusercontent.com/john-doe/my-character-cards/main/"
 */ 