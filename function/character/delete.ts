import { LocalCharacterDialogueOperations } from "@/lib/data/roleplay/character-dialogue-operation";
import { LocalCharacterRecordOperations } from "@/lib/data/roleplay/character-record-operation";
import { RegexScriptOperations } from "@/lib/data/roleplay/regex-script-operation";
import { WorldBookOperations } from "@/lib/data/roleplay/world-book-operation";
import { deleteBlob } from "@/lib/data/local-storage";

export async function deleteCharacter(
  character_id: string,
): Promise<{ success?: boolean; error?: string }> {
  try {
    if (!character_id) {
      return { error: "Character ID is required" };
    }

    console.log(`开始删除角色: ${character_id}`);

    const character =
      await LocalCharacterRecordOperations.getCharacterById(character_id);
    if (!character) {
      console.warn(`角色不存在: ${character_id}`);
      return { error: "Character not found" };
    }

    console.log(`找到角色: ${character_id}, 开始删除操作`);

    const deleted =
      await LocalCharacterRecordOperations.deleteCharacter(character_id);
    if (!deleted) {
      console.error(`删除角色记录失败: ${character_id}`);
      return { error: "Failed to delete character" };
    }

    console.log(`角色记录删除成功: ${character_id}`);

    // 删除对话树
    try {
      await LocalCharacterDialogueOperations.deleteDialogueTree(character_id);
      console.log(`对话树删除成功: ${character_id}`);
    } catch (dialogueErr) {
      console.warn(`删除对话树失败: ${character_id}`, dialogueErr);
    }

    try {
      const worldBooks = await WorldBookOperations["getWorldBooks"]();

      if (worldBooks[character_id]) {
        delete worldBooks[character_id];
      }

      if (worldBooks[`${character_id}_settings`]) {
        delete worldBooks[`${character_id}_settings`];
      }

      await WorldBookOperations["saveWorldBooks"](worldBooks);
    } catch (worldBookErr) {
      console.warn("Failed to delete world book:", worldBookErr);
    }
    try {
      const scriptStore = await RegexScriptOperations["getRegexScriptStore"]();

      if (scriptStore[character_id]) {
        delete scriptStore[character_id];
      }

      if (scriptStore[`${character_id}_settings`]) {
        delete scriptStore[`${character_id}_settings`];
      }

      await RegexScriptOperations["saveRegexScriptStore"](scriptStore);
    } catch (regexErr) {
      console.warn("Failed to delete regex scripts:", regexErr);
    }

    const avatarPath = character.imagePath;
    if (avatarPath) {
      try {
        await deleteBlob(avatarPath);
      } catch (blobErr) {
        console.warn("Failed to delete avatar blob:", blobErr);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error("Failed to delete character:", err);
    return { error: `Failed to delete character: ${err.message}` };
  }
}
