import { LocalCharacterRecordOperations } from "@/lib/data/roleplay/character-record-operation";
import { adaptCharacterData } from "@/lib/adapter/tagReplacer";

export async function getAllCharacters(language: "en" | "zh", username?: string) {
  try {
    const characters = await LocalCharacterRecordOperations.getAllCharacters();

    const formattedCharacters = [...characters]
      .reverse()
      .map(character => {
        const characterData = {
          id: character.id,
          name: character.data.data?.name || character.data.name,
          description: character.data.data?.description || character.data.description,
          personality: character.data.data?.personality || character.data.personality,
          scenario: character.data.data?.scenario || character.data.scenario,
          first_mes: character.data.data?.first_mes || character.data.first_mes,
          mes_example: character.data.data?.mes_example || character.data.mes_example,
          creatorcomment: character.data.creatorcomment || character.data.data?.creator_notes,
          created_at: character.created_at,
          updated_at: character.updated_at,
          avatar_path: character.imagePath,
        };
        const processedData = adaptCharacterData(characterData, language, username);
        
        return processedData;
      });

    return formattedCharacters;
  } catch (error: any) {
    console.error("Failed to get characters:", error);
    
    // 处理版本冲突错误
    if (error.message && error.message.includes("version")) {
      console.warn("Database version conflict detected. Attempting to clear and reinitialize database...");
      
      // 清除数据库并重新初始化
      try {
        if (typeof window !== "undefined") {
          // 删除现有的IndexedDB数据库
          const deleteRequest = indexedDB.deleteDatabase("CharacterAppDB");
          deleteRequest.onsuccess = () => {
            console.log("Database deleted successfully. Please refresh the page.");
          };
          deleteRequest.onerror = () => {
            console.error("Failed to delete database:", deleteRequest.error);
          };
        }
        
        // 返回空数组，让用户刷新页面
        return [];
      } catch (clearError) {
        console.error("Failed to clear database:", clearError);
        throw new Error("Database version conflict. Please refresh the page to resolve this issue.");
      }
    }
    
    throw new Error(`Failed to get characters: ${error.message}`);
  }
}
