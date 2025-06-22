import { NodeTool } from "@/lib/nodeflow/NodeTool";
import { MemoryManager, RAGGenerationOptions, MemoryExtractionResult } from "@/lib/core/memory-manager";
import { MemoryType, MemoryContext } from "@/lib/models/memory-model";
import { LocalMemoryOperations } from "@/lib/data/roleplay/memory-operation";

export class MemoryNodeTools extends NodeTool {
  protected static readonly toolType: string = "memory";
  protected static readonly version: string = "1.0.0";

  static getToolType(): string {
    return this.toolType;
  }

  static async executeMethod(methodName: string, ...params: any[]): Promise<any> {
    const method = (this as any)[methodName];
    
    if (typeof method !== "function") {
      console.error(`Method lookup failed: ${methodName} not found in MemoryNodeTools`);
      console.log("Available methods:", Object.getOwnPropertyNames(this).filter(name => 
        typeof (this as any)[name] === "function" && !name.startsWith("_"),
      ));
      throw new Error(`Method ${methodName} not found in ${this.getToolType()}Tool`);
    }

    try {
      this.logExecution(methodName, params);
      return await (method as Function).apply(this, params);
    } catch (error) {
      this.handleError(error as Error, methodName);
    }
  }

  /**
   * Process and retrieve relevant memories for the current context
   */
  static async processMemoryContext(
    characterId: string,
    currentUserInput: string,
    systemMessage: string,
    conversationContext: string = "",
    apiKey: string,
    baseUrl?: string,
    language: "zh" | "en" = "zh",
    maxMemories: number = 5,
    autoExtract: boolean = true,
  ): Promise<{
    memoryContext: MemoryContext;
    enhancedSystemMessage: string;
    extractedMemories?: MemoryExtractionResult;
  }> {
    try {
      const memoryManager = new MemoryManager(apiKey, baseUrl);

      // Auto-extract memories from previous conversation if enabled
      let extractedMemories: MemoryExtractionResult | undefined;
      if (autoExtract && conversationContext) {
        extractedMemories = await this.extractMemoriesFromContext(
          memoryManager,
          characterId,
          conversationContext,
        );
      }

      // Generate memory context for current input
      const ragOptions: RAGGenerationOptions = {
        characterId,
        currentUserInput,
        conversationContext,
        maxMemories,
        language,
      };

      const memoryContext = await memoryManager.generateMemoryContext(ragOptions);

      // Enhance system message with memory context
      const enhancedSystemMessage = this.enhanceSystemMessageWithMemory(
        systemMessage,
        memoryContext,
        language,
      );

      console.log(`Memory processing complete for character ${characterId}:`);
      console.log(`- Retrieved ${memoryContext.activeMemories.length} relevant memories`);
      console.log(`- Total memories: ${memoryContext.totalMemoryCount}`);
      if (extractedMemories) {
        console.log(`- Extracted ${extractedMemories.memories.length} new memories`);
      }

      return {
        memoryContext,
        enhancedSystemMessage,
        extractedMemories,
      };
    } catch (error) {
      this.handleError(error as Error, "processMemoryContext");
      
      // Return fallback result
      return {
        memoryContext: {
          activeMemories: [],
          memoryPrompt: language === "zh" ? "无相关记忆" : "No relevant memories",
          totalMemoryCount: 0,
          config: {
            embeddingModel: "text-embedding-3-small",
            chunkSize: 512,
            chunkOverlap: 50,
            topK: 5,
            similarityThreshold: 0.7,
            enableHybridSearch: true,
          },
        },
        enhancedSystemMessage: systemMessage,
      };
    }
  }

  /**
   * Search memories based on query
   */
  static async searchMemories(
    characterId: string,
    query: string,
    apiKey: string,
    baseUrl?: string,
    topK: number = 5,
    includeTypes?: MemoryType[],
    useSemanticSearch: boolean = true,
  ): Promise<any> {
    try {
      const memoryManager = new MemoryManager(apiKey, baseUrl);

      if (useSemanticSearch) {
        const results = await memoryManager.hybridSearch(characterId, query, {
          topK,
          includeTypes,
          similarityThreshold: 0.6,
        });

        return {
          success: true,
          results: results.map(r => ({
            id: r.entry.id,
            type: r.entry.type,
            content: r.entry.content,
            tags: r.entry.tags,
            importance: r.entry.importance,
            score: r.score,
            reasoning: r.reasoning,
          })),
          count: results.length,
        };
      } else {
        // Use basic text search
        const entries = await LocalMemoryOperations.searchMemoriesByText({
          query,
          characterId,
          types: includeTypes,
          maxResults: topK,
        });

        return {
          success: true,
          results: entries.map(entry => ({
            id: entry.id,
            type: entry.type,
            content: entry.content,
            tags: entry.tags,
            importance: entry.importance,
            score: 1.0, // No similarity score for text search
            reasoning: "Text search match",
          })),
          count: entries.length,
        };
      }
    } catch (error) {
      this.handleError(error as Error, "searchMemories");
      return {
        success: false,
        error: error instanceof Error ? (error as Error).message : "Unknown error",
        results: [],
        count: 0,
      };
    }
  }

  /**
   * Create a new memory entry
   */
  static async createMemory(
    characterId: string,
    type: MemoryType,
    content: string,
    apiKey: string,
    baseUrl?: string,
    tags: string[] = [],
    importance: number = 0.5,
    metadata: any = {},
  ): Promise<any> {
    try {
      const memoryManager = new MemoryManager(apiKey, baseUrl);
      
      const memoryEntry = await memoryManager.createMemory(
        characterId,
        type,
        content,
        metadata,
        tags,
        importance,
      );

      return {
        success: true,
        memory: {
          id: memoryEntry.id,
          type: memoryEntry.type,
          content: memoryEntry.content,
          tags: memoryEntry.tags,
          importance: memoryEntry.importance,
          created_at: memoryEntry.created_at,
        },
      };
    } catch (error) {
      this.handleError(error as Error, "createMemory");
      return {
        success: false,
        error: error instanceof Error ? (error as Error).message : "Unknown error",
      };
    }
  }

  /**
   * Get memory analytics for a character
   */
  static async getMemoryAnalytics(characterId: string): Promise<any> {
    try {
      const analytics = await LocalMemoryOperations.getMemoryAnalytics(characterId);
      
      return {
        success: true,
        analytics: {
          totalEntries: analytics.totalEntries,
          entriesByType: analytics.entriesByType,
          averageImportance: analytics.averageImportance,
          memoryDensity: analytics.memoryDensity,
          mostAccessedCount: analytics.mostAccessedEntries.length,
          hasOldestEntry: !!analytics.oldestEntry,
          hasNewestEntry: !!analytics.newestEntry,
        },
      };
    } catch (error) {
      this.handleError(error as Error, "getMemoryAnalytics");
      return {
        success: false,
        error: error instanceof Error ? (error as Error).message : "Unknown error",
      };
    }
  }

  /**
   * Update RAG configuration for a character
   */
  static async updateRAGConfig(
    characterId: string,
    config: any,
  ): Promise<any> {
    try {
      const updatedConfig = await LocalMemoryOperations.updateRAGConfig(characterId, config);
      
      return {
        success: true,
        config: updatedConfig,
      };
    } catch (error) {
      this.handleError(error as Error, "updateRAGConfig");
      return {
        success: false,
        error: error instanceof Error ? (error as Error).message : "Unknown error",
      };
    }
  }

  /**
   * Clear all memories for a character
   */
  static async clearMemories(characterId: string): Promise<any> {
    try {
      await LocalMemoryOperations.clearCharacterMemories(characterId);
      
      return {
        success: true,
        message: `All memories cleared for character ${characterId}`,
      };
    } catch (error) {
      this.handleError(error as Error, "clearMemories");
      return {
        success: false,
        error: error instanceof Error ? (error as Error).message : "Unknown error",
      };
    }
  }

  /**
   * Private helper: Extract memories from conversation context
   */
  private static async extractMemoriesFromContext(
    memoryManager: MemoryManager,
    characterId: string,
    conversationContext: string,
  ): Promise<MemoryExtractionResult> {
    try {
      // Parse conversation context to extract user and assistant messages
      const lines = conversationContext.split("\n").filter(line => line.trim());
      let userMessage = "";
      let assistantMessage = "";
      
      for (const line of lines) {
        if (line.startsWith("User:") || line.startsWith("用户:")) {
          userMessage = line.substring(line.indexOf(":") + 1).trim();
        } else if (line.startsWith("Assistant:") || line.startsWith("助手:") || line.startsWith("Character:")) {
          assistantMessage = line.substring(line.indexOf(":") + 1).trim();
        }
      }

      if (userMessage && assistantMessage) {
        return await memoryManager.extractMemoriesFromDialogue(
          characterId,
          userMessage,
          assistantMessage,
          conversationContext,
        );
      }

      return { memories: [], confidence: 0, reasoning: "No valid conversation found" };
    } catch (error) {
      console.warn("Failed to extract memories from context:", error);
      return { memories: [], confidence: 0, reasoning: "Extraction failed" };
    }
  }

  /**
   * Private helper: Enhance system message with memory context
   */
  private static enhanceSystemMessageWithMemory(
    originalSystemMessage: string,
    memoryContext: MemoryContext,
    language: "zh" | "en",
  ): string {
    if (!memoryContext.memoryPrompt || memoryContext.activeMemories.length === 0) {
      return originalSystemMessage;
    }

    // Check if memory context already exists to avoid duplication
    const memoryKeywords = language === "zh" 
      ? ["记忆", "回忆", "相关记忆"] 
      : ["memory", "memories", "relevant memories"];
    
    const hasMemoryContext = memoryKeywords.some(keyword => 
      originalSystemMessage.toLowerCase().includes(keyword.toLowerCase()),
    );

    if (hasMemoryContext) {
      // Replace existing memory placeholder
      const memoryPlaceholders = language === "zh" 
        ? ["{{memories}}", "{{相关记忆}}", "{{记忆}}"]
        : ["{{memories}}", "{{relevant_memories}}", "{{memory}}"];
      
      let enhancedMessage = originalSystemMessage;
      for (const placeholder of memoryPlaceholders) {
        if (enhancedMessage.includes(placeholder)) {
          enhancedMessage = enhancedMessage.replace(placeholder, memoryContext.memoryPrompt);
          break;
        }
      }
      
      // If no placeholder found, append memory context
      if (enhancedMessage === originalSystemMessage) {
        const separator = language === "zh" ? "\n\n" : "\n\n";
        enhancedMessage = `${originalSystemMessage}${separator}${memoryContext.memoryPrompt}`;
      }
      
      return enhancedMessage;
    } else {
      // Add memory context to system message
      const separator = language === "zh" ? "\n\n" : "\n\n";
      return `${originalSystemMessage}${separator}${memoryContext.memoryPrompt}`;
    }
  }
} 
