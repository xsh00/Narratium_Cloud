import { NodeTool } from "@/lib/nodeflow/NodeTool";
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnablePassthrough } from "@langchain/core/runnables";

export interface LLMConfig {
  modelName: string;
  apiKey: string;
  baseUrl?: string;
  llmType: "openai" | "ollama";
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  topK?: number;
  repeatPenalty?: number;
  streaming?: boolean;
  streamUsage?: boolean;
  language?: "zh" | "en";
}
export class LLMNodeTools extends NodeTool {
  protected static readonly toolType: string = "llm";
  protected static readonly version: string = "1.0.0";

  static getToolType(): string {
    return this.toolType;
  }

  static async executeMethod(
    methodName: string,
    ...params: any[]
  ): Promise<any> {
    const method = (this as any)[methodName];

    if (typeof method !== "function") {
      console.error(
        `Method lookup failed: ${methodName} not found in LLMNodeTools`,
      );
      console.log(
        "Available methods:",
        Object.getOwnPropertyNames(this).filter(
          (name) =>
            typeof (this as any)[name] === "function" && !name.startsWith("_"),
        ),
      );
      throw new Error(
        `Method ${methodName} not found in ${this.getToolType()}Tool`,
      );
    }

    try {
      this.logExecution(methodName, params);
      return await (method as Function).apply(this, params);
    } catch (error) {
      console.error(`Method execution failed: ${methodName}`, error);
      throw error;
    }
  }

  static async invokeLLM(
    systemMessage: string,
    userMessage: string,
    config: LLMConfig,
  ): Promise<string> {
    const startTime = Date.now();
    console.log(`🚀 [LLM性能监控] 开始LLM调用 - 时间: ${new Date().toISOString()}`);
    console.log(`📝 [LLM性能监控] 模型: ${config.modelName}, 类型: ${config.llmType}`);
    console.log(`📝 [LLM性能监控] 系统消息长度: ${systemMessage.length} 字符`);
    console.log(`📝 [LLM性能监控] 用户消息长度: ${userMessage.length} 字符`);
    
    try {
      // 阶段1: 创建LLM实例
      const stage1Start = Date.now();
      console.log(`🔄 [LLM性能监控] 阶段1 - 开始创建LLM实例`);
      const llm = this.createLLM(config);
      const stage1End = Date.now();
      console.log(`✅ [LLM性能监控] 阶段1 - LLM实例创建完成 - 耗时: ${stage1End - stage1Start}ms`);

      // 阶段2: 创建对话链
      const stage2Start = Date.now();
      console.log(`🔄 [LLM性能监控] 阶段2 - 开始创建对话链`);
      const dialogueChain = this.createDialogueChain(llm);
      const stage2End = Date.now();
      console.log(`✅ [LLM性能监控] 阶段2 - 对话链创建完成 - 耗时: ${stage2End - stage2Start}ms`);

      // 阶段3: 执行LLM调用
      const stage3Start = Date.now();
      console.log(`🔄 [LLM性能监控] 阶段3 - 开始执行LLM调用`);
      const response = await dialogueChain.invoke({
        system_message: systemMessage,
        user_message: userMessage,
      });
      const stage3End = Date.now();
      console.log(`✅ [LLM性能监控] 阶段3 - LLM调用完成 - 耗时: ${stage3End - stage3Start}ms`);

      if (!response || typeof response !== "string") {
        throw new Error("Invalid response from LLM");
      }

      const totalTime = Date.now() - startTime;
      console.log(`🎉 [LLM性能监控] LLM调用完成 - 总耗时: ${totalTime}ms`);
      console.log(`📊 [LLM性能监控] 各阶段耗时统计:`);
      console.log(`   - 阶段1 (LLM创建): ${stage1End - stage1Start}ms`);
      console.log(`   - 阶段2 (对话链创建): ${stage2End - stage2Start}ms`);
      console.log(`   - 阶段3 (LLM调用): ${stage3End - stage3Start}ms`);
      console.log(`   - 总耗时: ${totalTime}ms`);
      console.log(`📝 [LLM性能监控] 响应长度: ${response.length} 字符`);

      return response;
    } catch (error) {
      const errorTime = Date.now() - startTime;
      console.error(`❌ [LLM性能监控] LLM调用失败 - 耗时: ${errorTime}ms:`, error);
      this.handleError(error as Error, "invokeLLM");
    }
  }

  private static createLLM(config: LLMConfig): ChatOpenAI | ChatOllama {
    const safeModel = config.modelName?.trim() || "";
    const defaultSettings = {
      temperature: 0.7,
      maxTokens: undefined,
      timeout: 1000000000,
      maxRetries: 0,
      topP: 0.7,
      frequencyPenalty: 0,
      presencePenalty: 0,
      topK: 40,
      repeatPenalty: 1.1,
      streaming: true,
      streamUsage: false,
    };

    if (config.llmType === "openai") {
      return new ChatOpenAI({
        modelName: safeModel,
        openAIApiKey: config.apiKey,
        configuration: {
          baseURL: config.baseUrl?.trim() || undefined,
        },
        temperature: config.temperature ?? defaultSettings.temperature,
        maxRetries: config.maxRetries ?? defaultSettings.maxRetries,
        topP: config.topP ?? defaultSettings.topP,
        frequencyPenalty:
          config.frequencyPenalty ?? defaultSettings.frequencyPenalty,
        presencePenalty:
          config.presencePenalty ?? defaultSettings.presencePenalty,
        streaming: config.streaming ?? defaultSettings.streaming,
        streamUsage: config.streamUsage ?? defaultSettings.streamUsage,
      });
    } else if (config.llmType === "ollama") {
      return new ChatOllama({
        model: safeModel,
        baseUrl: config.baseUrl?.trim() || "http://localhost:11434",
        temperature: config.temperature ?? defaultSettings.temperature,
        topK: config.topK ?? defaultSettings.topK,
        topP: config.topP ?? defaultSettings.topP,
        frequencyPenalty:
          config.frequencyPenalty ?? defaultSettings.frequencyPenalty,
        presencePenalty:
          config.presencePenalty ?? defaultSettings.presencePenalty,
        repeatPenalty: config.repeatPenalty ?? defaultSettings.repeatPenalty,
        streaming: config.streaming ?? defaultSettings.streaming,
      });
    } else {
      throw new Error(`Unsupported LLM type: ${config.llmType}`);
    }
  }

  private static createDialogueChain(llm: ChatOpenAI | ChatOllama): any {
    const dialoguePrompt = ChatPromptTemplate.fromMessages([
      ["system", "{system_message}"],
      ["human", "{user_message}"],
    ]);

    return RunnablePassthrough.assign({
      system_message: (input: any) => input.system_message,
      user_message: (input: any) => input.user_message,
    })
      .pipe(dialoguePrompt)
      .pipe(llm)
      .pipe(new StringOutputParser());
  }
}
