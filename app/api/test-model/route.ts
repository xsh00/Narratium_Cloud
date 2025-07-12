import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, apiKey, model } = await request.json();

    if (!baseUrl || !apiKey || !model) {
      return NextResponse.json(
        { error: "缺少必要参数: baseUrl, apiKey, model" },
        { status: 400 }
      );
    }

    // 简单的API连接测试
    const testResponse = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (testResponse.ok) {
      const models = await testResponse.json();
      return NextResponse.json({
        success: true,
        message: "API连接成功",
        models: models.data || models,
        modelCount: (models.data || models)?.length || 0,
      });
    } else {
      const errorData = await testResponse.text();
      return NextResponse.json(
        { 
          error: "API连接失败", 
          status: testResponse.status,
          statusText: testResponse.statusText,
          details: errorData
        },
        { status: testResponse.status }
      );
    }
  } catch (error) {
    console.error("API测试错误:", error);
    return NextResponse.json(
      { 
        error: "测试过程中发生错误", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 