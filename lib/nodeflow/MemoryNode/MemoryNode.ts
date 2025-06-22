import { NodeBase } from "@/lib/nodeflow/NodeBase";
import { NodeConfig, NodeInput, NodeOutput, NodeCategory } from "@/lib/nodeflow/types";
import { MemoryNodeTools } from "./MemoryNodeTools";
import { NodeToolRegistry } from "../NodeTool";

export class MemoryNode extends NodeBase {
  static readonly nodeName = "memory";
  static readonly description = "Advanced memory management with RAG capabilities for character AI";
  static readonly version = "1.0.0";

  constructor(config: NodeConfig) {
    NodeToolRegistry.register(MemoryNodeTools);
    super(config);
    this.toolClass = MemoryNodeTools;
  }

  protected getDefaultCategory(): NodeCategory {
    return NodeCategory.MIDDLE;
  }

  protected async _call(input: NodeInput): Promise<NodeOutput> {
    const characterId = input.characterId;
    const systemMessage = input.systemMessage;
    const userInput = input.userInput || "";
    const conversationContext = input.conversationContext || "";
    const apiKey = input.apiKey;
    const baseUrl = input.baseUrl;
    const language = input.language || "zh";
    const maxMemories = input.maxMemories || 5;
    const autoExtract = input.autoExtract !== false; // Default to true

    if (!characterId) {
      throw new Error("Character ID is required for MemoryNode");
    }

    if (!systemMessage) {
      throw new Error("System message is required for MemoryNode");
    }

    if (!apiKey) {
      throw new Error("API key is required for MemoryNode");
    }

    // Process memory context using the tool
    const result = await this.executeTool(
      "processMemoryContext",
      characterId,
      userInput,
      systemMessage,
      conversationContext,
      apiKey,
      baseUrl,
      language,
      maxMemories,
      autoExtract,
    ) as {
      memoryContext: any;
      enhancedSystemMessage: string;
      extractedMemories?: any;
    };

    return {
      systemMessage: result.enhancedSystemMessage,
      memoryContext: result.memoryContext,
      extractedMemories: result.extractedMemories,
      characterId,
      userInput,
      apiKey,
      baseUrl,
      language,
      maxMemories,
    };
  }
} 
