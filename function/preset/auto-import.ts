import { PresetInitializer } from "@/lib/core/preset-initializer";
import { DEFAULT_PRESET_CONFIGS } from "@/lib/config/preset-characters";

export async function autoImportPresets() {
  try {
    await PresetInitializer.initializePresets();
    return { success: true, message: "预设自动导入成功" };
  } catch (error) {
    console.error("预设自动导入失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

export async function getPresetStatus() {
  try {
    const status = PresetInitializer.getInitializationStatus();
    return { success: true, data: status };
  } catch (error) {
    console.error("获取预设状态失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

export async function resetPresetInitialization() {
  try {
    PresetInitializer.resetInitialization();
    return { success: true, message: "预设初始化状态已重置" };
  } catch (error) {
    console.error("重置预设初始化状态失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

export async function getDefaultPresetConfigs() {
  try {
    return {
      success: true,
      data: DEFAULT_PRESET_CONFIGS,
    };
  } catch (error) {
    console.error("获取默认预设配置失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}
