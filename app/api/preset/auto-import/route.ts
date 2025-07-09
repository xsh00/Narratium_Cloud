import { NextRequest, NextResponse } from "next/server";
import {
  autoImportPresets,
  getPresetStatus,
  resetPresetInitialization,
  getDefaultPresetConfigs,
} from "@/function/preset/auto-import";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const result = await autoImportPresets();

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error("API错误:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    let result;

    switch (action) {
      case "status":
        result = await getPresetStatus();
        break;
      case "reset":
        result = await resetPresetInitialization();
        break;
      case "configs":
        result = await getDefaultPresetConfigs();
        break;
      default:
        result = await getPresetStatus();
    }

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error("API错误:", error);
    return NextResponse.json(
      { success: false, error: "服务器内部错误" },
      { status: 500 },
    );
  }
}
