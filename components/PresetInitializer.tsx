"use client";

import React, { useEffect } from "react";
import { PresetInitializer } from "@/lib/core/preset-initializer";

/**
 * 预设初始化组件
 * 在客户端自动初始化预设JSON文件
 */
export default function PresetInitializerComponent() {
  useEffect(() => {
    // 在客户端初始化预设
    PresetInitializer.initializePresets().catch(console.error);
  }, []);

  return null;
}
