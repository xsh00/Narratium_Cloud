import { LocalCharacterDialogueOperations } from "@/lib/data/roleplay/character-dialogue-operation";
import { LocalCharacterRecordOperations } from "@/lib/data/roleplay/character-record-operation";
import { Character } from "@/lib/core/character";

export async function getCharacterDialogue(
  characterId: string,
  language: "en" | "zh" = "zh",
  username?: string,
) {
  if (!characterId) {
    throw new Error("Character ID is required");
  }

  try {
    console.log(`🔍 getCharacterDialogue called for: ${characterId}, language: ${language}, username: ${username}`);
    
    console.log(`🔍 正在获取角色信息: ${characterId}`);
    const characterRecord =
      await LocalCharacterRecordOperations.getCharacterById(characterId);

    // 检查角色记录是否存在
    if (!characterRecord) {
      console.warn(`❌ 角色不存在: ${characterId}`);
      throw new Error("Character not found");
    }

    console.log(`✅ 找到角色记录: ${characterId}`);
    const character = new Character(characterRecord);
    
    console.log(`📚 正在获取对话树: ${characterId}`);
    const dialogueTree =
      await LocalCharacterDialogueOperations.getDialogueTreeById(characterId);
    let processedDialogue = null;

    if (dialogueTree) {
      console.log(`📊 找到对话树，当前节点: ${dialogueTree.current_nodeId}, 总节点数: ${dialogueTree.nodes?.length || 0}`);
      
      const currentPath =
        dialogueTree.current_nodeId !== "root"
          ? await LocalCharacterDialogueOperations.getDialoguePathToNode(
              characterId,
              dialogueTree.current_nodeId,
            )
          : [];

      console.log(`🛤️ 对话路径长度: ${currentPath.length}`);

      const messages = [];

      for (const node of currentPath) {
        if (node.userInput) {
          messages.push({
            id: node.nodeId,
            role: "user",
            thinkingContent: node.thinkingContent || "",
            content: node.userInput,
            parsedContent: null,
          });
          console.log(`👤 用户消息: ${node.userInput.substring(0, 50)}...`);
        }

        if (node.assistantResponse) {
          if (node.parsedContent?.regexResult) {
            messages.push({
              id: node.nodeId,
              role: "assistant",
              thinkingContent: node.thinkingContent || "",
              content: node.parsedContent.regexResult,
              parsedContent: node.parsedContent,
            });
            console.log(`🤖 助手消息(regex): ${node.parsedContent.regexResult.substring(0, 50)}...`);
          } else {
            messages.push({
              id: node.nodeId,
              role: "assistant",
              thinkingContent: node.thinkingContent || "",
              content: node.assistantResponse,
              parsedContent: node.parsedContent,
            });
            console.log(`🤖 助手消息(raw): ${node.assistantResponse.substring(0, 50)}...`);
          }
        }
      }

      console.log(`📝 最终消息数量: ${messages.length}`);

      processedDialogue = {
        id: dialogueTree.id,
        character_id: dialogueTree.character_id,
        current_nodeId: dialogueTree.current_nodeId,
        messages,
        tree: {
          nodes: dialogueTree.nodes,
          currentNodeId: dialogueTree.current_nodeId,
        },
      };
    } else {
      console.log(`❌ 未找到对话树: ${characterId}`);
    }

    console.log(`🎉 getCharacterDialogue 完成，有对话数据: ${!!processedDialogue}`);

    return {
      success: true,
      character: {
        id: character.id,
        data: character.getData(language, username),
        imagePath: character.imagePath,
      },
      dialogue: processedDialogue,
    };
  } catch (error: any) {
    console.error("❌ Failed to get character information:", error);
    throw new Error(`Failed to get character information: ${error.message}`);
  }
}
