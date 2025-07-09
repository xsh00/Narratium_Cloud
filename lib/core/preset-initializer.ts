import { DEFAULT_PRESET_CONFIGS } from "@/lib/config/preset-characters";
import { PresetOperations } from "@/lib/data/roleplay/preset-operation";
import { importPresetFromJson } from "@/function/preset/import";

/**
 * 预设初始化器
 * 负责在用户首次访问时自动导入预设JSON文件
 */
export class PresetInitializer {
  private static readonly INITIALIZATION_KEY = "preset_initialized";

  /**
   * 检查是否已经初始化过预设
   */
  static isInitialized(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(this.INITIALIZATION_KEY) === "true";
  }

  /**
   * 标记预设已初始化
   */
  static markAsInitialized(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.INITIALIZATION_KEY, "true");
  }

  /**
   * 初始化预设
   * 在用户首次访问时自动导入预设JSON文件
   */
  static async initializePresets(): Promise<void> {
    if (this.isInitialized()) {
      console.log("Presets already initialized, skipping...");
      return;
    }

    try {
      console.log("Initializing presets...");
      
      // 获取现有的预设列表
      const existingPresets = await PresetOperations.getAllPresets();
      
      // 导入默认预设
      for (const config of DEFAULT_PRESET_CONFIGS) {
        if (!config.autoImport) continue;
        
        try {
          // 检查是否已存在同名预设
          const existingPreset = existingPresets.find(p => p.name === config.name);
          if (existingPreset) {
            console.log(`Preset ${config.name} already exists, skipping...`);
            continue;
          }

          // 尝试加载预设JSON文件
          const presetData = await this.loadPresetFile(config.filename);
          if (presetData) {
            const result = await importPresetFromJson(
              JSON.stringify(presetData),
              config.displayName.zh
            );
            
            if (result.success) {
              console.log(`Successfully imported preset: ${config.name}`);
              
              // 如果配置为启用状态，则启用该预设
              if (config.enabled && result.presetId) {
                await PresetOperations.updatePreset(result.presetId, { enabled: true });
              }
            } else {
              console.error(`Failed to import preset ${config.name}:`, result.error);
            }
          }
        } catch (error) {
          console.error(`Error importing preset ${config.name}:`, error);
        }
      }

      // 标记为已初始化
      this.markAsInitialized();
      console.log("Preset initialization completed");
      
    } catch (error) {
      console.error("Error during preset initialization:", error);
    }
  }

  /**
   * 加载预设JSON文件
   */
  private static async loadPresetFile(filename: string): Promise<any> {
    try {
      // 尝试从public目录加载预设文件
      const response = await fetch(`/presets/${filename}`);
      if (response.ok) {
        return await response.json();
      }
      
      // 如果文件不存在，尝试从其他位置加载
      console.warn(`Preset file ${filename} not found in /presets/`);
      return null;
    } catch (error) {
      console.error(`Error loading preset file ${filename}:`, error);
      return null;
    }
  }

  /**
   * 重置预设初始化状态
   * 用于开发测试或重新初始化
   */
  static resetInitialization(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.INITIALIZATION_KEY);
  }

  /**
   * 获取预设初始化状态
   */
  static getInitializationStatus(): {
    initialized: boolean;
    configs: typeof DEFAULT_PRESET_CONFIGS;
  } {
    return {
      initialized: this.isInitialized(),
      configs: DEFAULT_PRESET_CONFIGS,
    };
  }
} 