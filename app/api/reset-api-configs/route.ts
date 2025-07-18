import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === "force-update") {
      // 强制创建新的三组配置
      const defaultConfigs = [
        {
          id: `api_${Date.now()}_1`,
          name: "【1】默认API配置",
          type: "openai",
          baseUrl: "https://api.sillytarven.top/v1",
          model: "gemini-2.5-flash",
          apiKey: "sk-5zi5ZuqP_GADx_IYQFhA3AMbFj2X3ucDOqLB01CLvyOpcCZh",
        },
        {
          id: `api_${Date.now()}_2`,
          name: "【2】备用API配置",
          type: "openai",
          baseUrl: "https://api.sillytarven.top/v1",
          model: "gemini-2.5-flash",
          apiKey: "sk-WanZhBPybGFKaA183aUtdqJzxXxt9X95UjUeN0XrTQReE8fS",
        },
        {
          id: `api_${Date.now()}_3`,
          name: "【3】备用API配置",
          type: "openai",
          baseUrl: "https://api.sillytarven.top/v1",
          model: "gemini-2.5-flash",
          apiKey: "sk-rbQFBU405CbCnJwniaMmr1FXEJjZpFl1gLuJbU7oMlAIEt6D",
        },
      ];

      return NextResponse.json({
        success: true,
        message: "已强制更新为三组新的API配置",
        configs: defaultConfigs,
        activeConfigId: defaultConfigs[0].id,
      });
    } else if (action === "clear") {
      // 清除所有配置
      return NextResponse.json({
        success: true,
        message: "已清除所有API配置",
      });
    } else {
      return NextResponse.json(
        { error: "无效的操作，支持的操作: force-update, clear" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("重置API配置错误:", error);
    return NextResponse.json(
      { 
        error: "重置配置过程中发生错误", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 