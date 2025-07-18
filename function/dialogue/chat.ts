import { LocalCharacterDialogueOperations } from "@/lib/data/roleplay/character-dialogue-operation";
import { ParsedResponse } from "@/lib/models/parsed-response";
import {
  DialogueWorkflow,
  DialogueWorkflowParams,
} from "@/lib/workflow/examples/DialogueWorkflow";
import { getCurrentSystemPresetType } from "@/function/preset/download";

export async function handleCharacterChatRequest(payload: {
  username?: string;
  characterId: string;
  message: string;
  modelName: string;
  baseUrl: string;
  apiKey: string;
  llmType?: string;
  streaming?: boolean;
  language?: "zh" | "en";
  number?: number;
  nodeId: string;
  fastModel: boolean;
}): Promise<Response> {
  const startTime = Date.now();
  console.log(`🚀 [API性能监控] 开始处理角色聊天请求 - 时间: ${new Date().toISOString()}`);
  console.log(`📝 [API性能监控] 角色ID: ${payload.characterId}, 消息长度: ${payload.message.length} 字符`);

  try {
    const {
      username,
      characterId,
      message,
      modelName,
      baseUrl,
      apiKey,
      llmType = "openai",
      language = "zh",
      number = 200,
      nodeId,
      fastModel = true,
    } = payload;

    if (!characterId || !message) {
      console.error(`❌ [API性能监控] 参数验证失败 - 耗时: ${Date.now() - startTime}ms`);
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400 },
      );
    }

    try {
      // 阶段1: 创建工作流实例
      const stage1Start = Date.now();
      const workflow = new DialogueWorkflow();
      const stage1End = Date.now();
      console.log(`✅ [API性能监控] 阶段1 - 工作流实例创建完成 - 耗时: ${stage1End - stage1Start}ms`);

      // 阶段2: 准备工作流参数
      const stage2Start = Date.now();
      const workflowParams: DialogueWorkflowParams = {
        characterId,
        userInput: message,
        language,
        username,
        modelName,
        apiKey,
        baseUrl,
        llmType: llmType as "openai" | "ollama",
        temperature: 0.7,
        streaming: payload.streaming ?? true,
        number,
        fastModel,
        systemPresetType: getCurrentSystemPresetType(),
      };
      const stage2End = Date.now();
      console.log(`✅ [API性能监控] 阶段2 - 工作流参数准备完成 - 耗时: ${stage2End - stage2Start}ms`);
      console.log(`🔧 [API性能监控] 工作流参数:`, {
        characterId,
        language,
        modelName,
        llmType,
        temperature: 0.7,
        streaming: payload.streaming ?? true,
        number,
        fastModel,
        systemPresetType: getCurrentSystemPresetType(),
      });

      // 阶段3: 执行工作流
      const stage3Start = Date.now();
      console.log(`🔄 [API性能监控] 阶段3 - 开始执行DialogueWorkflow`);
      const workflowResult = await workflow.execute(workflowParams);
      const stage3End = Date.now();
      console.log(`✅ [API性能监控] 阶段3 - 工作流执行完成 - 耗时: ${stage3End - stage3Start}ms`);

      if (!workflowResult || !workflowResult.outputData) {
        console.error(`❌ [API性能监控] 工作流执行失败 - 耗时: ${Date.now() - startTime}ms`);
        throw new Error("No response returned from workflow");
      }

      // 阶段4: 提取工作流结果
      const stage4Start = Date.now();
      const {
        thinkingContent,
        screenContent,
        fullResponse,
        nextPrompts,
        event,
      } = workflowResult.outputData;
      const stage4End = Date.now();
      console.log(`✅ [API性能监控] 阶段4 - 结果提取完成 - 耗时: ${stage4End - stage4Start}ms`);
      console.log(`📊 [API性能监控] 工作流输出统计:`, {
        thinkingContentLength: thinkingContent?.length || 0,
        screenContentLength: screenContent?.length || 0,
        fullResponseLength: fullResponse?.length || 0,
        nextPromptsCount: nextPrompts?.length || 0,
        hasEvent: !!event,
      });

      // 阶段5: 后处理（异步）
      const stage5Start = Date.now();
      console.log(`🔄 [API性能监控] 阶段5 - 开始后处理`);
      await processPostResponseAsync({
        characterId,
        message,
        thinkingContent,
        fullResponse,
        screenContent,
        event,
        nextPrompts,
        nodeId,
      }).catch((e) => {
        console.error(`⚠️ [API性能监控] 后处理错误:`, e);
      });
      const stage5End = Date.now();
      console.log(`✅ [API性能监控] 阶段5 - 后处理完成 - 耗时: ${stage5End - stage5Start}ms`);

      // 阶段6: 构建响应
      const stage6Start = Date.now();
      const response = new Response(
        JSON.stringify({
          type: "complete",
          success: true,
          thinkingContent,
          content: screenContent,
          parsedContent: { nextPrompts },
          isRegexProcessed: true,
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const stage6End = Date.now();
      console.log(`✅ [API性能监控] 阶段6 - 响应构建完成 - 耗时: ${stage6End - stage6Start}ms`);

      const totalTime = Date.now() - startTime;
      console.log(`🎉 [API性能监控] 角色聊天请求处理完成 - 总耗时: ${totalTime}ms`);
      console.log(`📊 [API性能监控] 各阶段耗时统计:`);
      console.log(`   - 阶段1 (工作流创建): ${stage1End - stage1Start}ms`);
      console.log(`   - 阶段2 (参数准备): ${stage2End - stage2Start}ms`);
      console.log(`   - 阶段3 (工作流执行): ${stage3End - stage3Start}ms`);
      console.log(`   - 阶段4 (结果提取): ${stage4End - stage4Start}ms`);
      console.log(`   - 阶段5 (后处理): ${stage5End - stage5Start}ms`);
      console.log(`   - 阶段6 (响应构建): ${stage6End - stage6Start}ms`);
      console.log(`   - 总耗时: ${totalTime}ms`);

      return response;
    } catch (error: any) {
      const errorTime = Date.now() - startTime;
      console.error(`❌ [API性能监控] 处理错误 - 耗时: ${errorTime}ms:`, error);
      return new Response(
        JSON.stringify({
          type: "error",
          message: error.message || "Unknown error",
          success: false,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  } catch (error: any) {
    const errorTime = Date.now() - startTime;
    console.error(`❌ [API性能监控] 致命错误 - 耗时: ${errorTime}ms:`, error);
    return new Response(
      JSON.stringify({
        error: `Failed to process request: ${error.message}`,
        success: false,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

async function processPostResponseAsync({
  characterId,
  message,
  thinkingContent,
  fullResponse,
  screenContent,
  event,
  nextPrompts,
  nodeId,
}: {
  characterId: string;
  message: string;
  thinkingContent: string;
  fullResponse: string;
  screenContent: string;
  event: string;
  nextPrompts: string[];
  nodeId: string;
}) {
  try {
    console.log(`🔄 processPostResponseAsync started for character: ${characterId}, nodeId: ${nodeId}`);
    
    const parsed: ParsedResponse = {
      regexResult: screenContent,
      nextPrompts,
    };
    
    console.log(`📚 Getting dialogue tree for character: ${characterId}`);
    const dialogueTree =
      await LocalCharacterDialogueOperations.getDialogueTreeById(characterId);
    const parentNodeId = dialogueTree ? dialogueTree.current_nodeId : "root";
    
    console.log(`📝 Adding node to dialogue tree - parentNodeId: ${parentNodeId}, message: ${message.substring(0, 50)}...`);
    await LocalCharacterDialogueOperations.addNodeToDialogueTree(
      characterId,
      parentNodeId,
      message,
      screenContent,
      fullResponse,
      thinkingContent,
      parsed,
      nodeId,
    );
    
    console.log(`✅ Node successfully added to dialogue tree`);

    if (event) {
      console.log(`🎯 Processing event for nodeId: ${nodeId}`);
      const updatedDialogueTree =
        await LocalCharacterDialogueOperations.getDialogueTreeById(characterId);
      if (updatedDialogueTree) {
        await LocalCharacterDialogueOperations.updateNodeInDialogueTree(
          characterId,
          nodeId,
          {
            parsedContent: {
              ...parsed,
              compressedContent: event,
            },
          },
        );
        console.log(`✅ Event processed successfully`);
      }
    }
    
    console.log(`🎉 processPostResponseAsync completed successfully`);
  } catch (e) {
    console.error("❌ Error in processPostResponseAsync:", e);
  }
}
