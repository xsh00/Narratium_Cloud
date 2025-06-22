import { BaseWorkflow, WorkflowConfig } from "@/lib/workflow/BaseWorkflow";
import { NodeCategory } from "@/lib/nodeflow/types";
import { UserInputNode } from "@/lib/nodeflow/UserInputNode/UserInputNode";
import { ContextNode } from "@/lib/nodeflow/ContextNode/ContextNode";
import { MemoryNode } from "@/lib/nodeflow/MemoryNode/MemoryNode";
import { WorldBookNode } from "@/lib/nodeflow/WorldBookNode/WorldBookNode";
import { PresetNode } from "@/lib/nodeflow/PresetNode/PresetNode";
import { LLMNode } from "@/lib/nodeflow/LLMNode/LLMNode";
import { RegexNode } from "@/lib/nodeflow/RegexNode/RegexNode";
import { OutputNode } from "@/lib/nodeflow/OutputNode/OutputNode";
import { PromptType } from "@/lib/models/character-prompts-model";

export interface RAGDialogueWorkflowParams {
  characterId: string;
  userInput: string;
  number?: number;
  promptType?: PromptType;
  language?: "zh" | "en";
  username?: string;
  modelName: string;
  apiKey: string;
  baseUrl?: string;
  llmType?: "openai" | "ollama";
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
  fastModel?: boolean;
  // Memory-specific parameters
  maxMemories?: number;
  autoExtractMemories?: boolean;
  memoryTypes?: string[];
  useSemanticSearch?: boolean;
}

export class RAGDialogueWorkflow extends BaseWorkflow {
  protected getNodeRegistry() {
    return {
      "userInput": {
        nodeClass: UserInputNode,
      },
      "context": {
        nodeClass: ContextNode,
      },
      "memory": {
        nodeClass: MemoryNode,
      },
      "worldBook": {
        nodeClass: WorldBookNode,
      },
      "preset": {
        nodeClass: PresetNode,
      },
      "llm": {
        nodeClass: LLMNode,
      },
      "regex": {
        nodeClass: RegexNode,
      },
      "output": {
        nodeClass: OutputNode,
      },
    };
  }

  protected getWorkflowConfig(): WorkflowConfig {
    return {
      id: "rag-dialogue-workflow",
      name: "RAG-Enhanced Dialogue Processing Workflow",
      nodes: [
        {
          id: "user-input-1",
          name: "userInput",
          category: NodeCategory.ENTRY,
          next: ["preset-1"],
          initParams: [
            "characterId", 
            "userInput", 
            "number", 
            "promptType", 
            "language", 
            "username", 
            "modelName", 
            "apiKey", 
            "baseUrl", 
            "llmType", 
            "temperature", 
            "fastModel",
            "maxMemories",
            "autoExtractMemories",
            "memoryTypes",
            "useSemanticSearch",
          ],
          inputFields: [],
          outputFields: [
            "characterId", 
            "userInput", 
            "number", 
            "promptType", 
            "language", 
            "username", 
            "modelName", 
            "apiKey", 
            "baseUrl", 
            "llmType", 
            "temperature", 
            "fastModel",
            "maxMemories",
            "autoExtractMemories",
            "memoryTypes",
            "useSemanticSearch",
          ],
        },
        {
          id: "preset-1",
          name: "preset",
          category: NodeCategory.MIDDLE,
          next: ["context-1"],
          initParams: [],
          inputFields: ["characterId", "language", "username", "number", "fastModel"],
          outputFields: ["systemMessage", "userMessage", "presetId", "characterId", "language", "username"],
        },
        {
          id: "context-1",
          name: "context",
          category: NodeCategory.MIDDLE,
          next: ["memory-1"],
          initParams: [],
          inputFields: ["userMessage", "characterId"],
          outputFields: ["userMessage", "characterId", "conversationContext"],
        },
        {
          id: "memory-1",
          name: "memory",
          category: NodeCategory.MIDDLE,
          next: ["world-book-1"],
          initParams: [],
          inputFields: [
            "characterId", 
            "systemMessage", 
            "userInput", 
            "conversationContext",
            "apiKey", 
            "baseUrl", 
            "language",
            "maxMemories",
            "autoExtractMemories",
          ],
          outputFields: [
            "systemMessage", 
            "memoryContext", 
            "extractedMemories", 
            "characterId", 
            "userInput",
            "apiKey",
            "baseUrl",
            "language",
          ],
          inputMapping: {
            "autoExtractMemories": "autoExtract",
          },
        },
        {
          id: "world-book-1",
          name: "worldBook",
          category: NodeCategory.MIDDLE,
          next: ["llm-1"],
          initParams: [],
          inputFields: ["systemMessage", "userMessage", "characterId", "language", "username", "userInput"],
          outputFields: ["systemMessage", "userMessage"],
          inputMapping: {
            "userInput": "currentUserInput",
          },
        },
        {
          id: "llm-1",
          name: "llm",
          category: NodeCategory.MIDDLE,
          next: ["regex-1"],
          initParams: [],
          inputFields: ["systemMessage", "userMessage", "modelName", "apiKey", "baseUrl", "llmType", "temperature", "language"],
          outputFields: ["llmResponse"],
        },
        {
          id: "regex-1",
          name: "regex",
          category: NodeCategory.MIDDLE,
          next: ["output-1"],
          initParams: [],
          inputFields: ["llmResponse", "characterId"],
          outputFields: ["replacedText", "screenContent", "fullResponse", "nextPrompts", "event"],
        },
        {
          id: "output-1",
          name: "output",
          category: NodeCategory.EXIT,
          next: [],
          initParams: [],
          inputFields: [
            "replacedText", 
            "screenContent", 
            "fullResponse", 
            "nextPrompts", 
            "event", 
            "presetId",
            "memoryContext",
            "extractedMemories",
          ],
          outputFields: [
            "replacedText", 
            "screenContent", 
            "fullResponse", 
            "nextPrompts", 
            "event", 
            "presetId",
            "memoryContext",
            "extractedMemories",
          ],
        },
      ],
    };
  }
} 
