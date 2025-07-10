import { PresetOperations } from "@/lib/data/roleplay/preset-operation";

export async function deletePromptFromPreset(
  presetId: string,
  promptIdentifier: string,
) {
  try {
    const preset = await PresetOperations.getPreset(presetId);
    if (!preset) {
      return { success: false, error: "Preset not found" };
    }

    const updatedPrompts = preset.prompts.filter(
      (p) => p.identifier !== promptIdentifier,
    );

    const success = await PresetOperations.updatePreset(presetId, {
      prompts: updatedPrompts,
    });
    if (!success) {
      return { success: false, error: "Failed to delete prompt" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting prompt:", error);
    return { success: false, error: "Failed to delete prompt" };
  }
}

export async function togglePromptEnabled(
  presetId: string,
  promptIdentifier: string,
  enabled: boolean,
) {
  try {
    const preset = await PresetOperations.getPreset(presetId);
    if (!preset) {
      return { success: false, error: "Preset not found" };
    }

    const promptIndex = preset.prompts.findIndex(
      (p) => p.identifier === promptIdentifier,
    );
    if (promptIndex === -1) {
      return { success: false, error: "Prompt not found" };
    }

    const updatedPrompts = [...preset.prompts];
    updatedPrompts[promptIndex] = {
      ...updatedPrompts[promptIndex],
      enabled: enabled,
    };

    const success = await PresetOperations.updatePreset(presetId, {
      prompts: updatedPrompts,
    });
    if (!success) {
      return { success: false, error: "Failed to toggle prompt" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error toggling prompt:", error);
    return { success: false, error: "Failed to toggle prompt" };
  }
}

export async function updatePromptInPreset(
  presetId: string,
  promptIdentifier: string,
  updates: { content?: string; enabled?: boolean; position?: number },
) {
  try {
    const preset = await PresetOperations.getPreset(presetId);
    if (!preset) {
      return { success: false, error: "Preset not found" };
    }

    const originalPrompt = preset.prompts.find(
      (p) => p.identifier === promptIdentifier,
    );
    if (!originalPrompt) {
      return { success: false, error: "Prompt not found in preset" };
    }

    const promptData = {
      identifier: promptIdentifier,
      name: originalPrompt.name || promptIdentifier,
      position:
        updates.position !== undefined
          ? updates.position
          : originalPrompt.position,
      ...updates,
    };

    const success = await PresetOperations.updateCharacterPrompt(
      presetId,
      originalPrompt.group_id || 2,
      promptData,
    );

    if (!success) {
      return { success: false, error: "Failed to update prompt" };
    }
    return { success: true };
  } catch (error) {
    console.error("Error updating prompt in preset:", error);
    return { success: false, error: "Failed to update prompt" };
  }
}

export async function addPromptToPreset(
  presetId: string,
  promptData: {
    identifier: string;
    name: string;
    content?: string;
    enabled?: boolean;
    role?: string;
    system_prompt?: boolean;
    marker?: boolean;
    forbid_overrides?: boolean;
  },
) {
  try {
    const preset = await PresetOperations.getPreset(presetId);
    if (!preset) {
      return { success: false, error: "Preset not found" };
    }

    // 检查是否已存在相同identifier的prompt
    const existingPrompt = preset.prompts.find(
      (p) => p.identifier === promptData.identifier,
    );
    if (existingPrompt) {
      return { success: false, error: "Prompt with this identifier already exists" };
    }

    const newPrompt = {
      ...promptData,
      group_id: 2, // 默认使用group_id 2
      position: preset.prompts.length, // 添加到末尾
      enabled: promptData.enabled !== false,
    };

    const success = await PresetOperations.updateCharacterPrompt(
      presetId,
      2, // group_id
      newPrompt,
    );

    if (!success) {
      return { success: false, error: "Failed to add prompt" };
    }
    return { success: true };
  } catch (error) {
    console.error("Error adding prompt to preset:", error);
    return { success: false, error: "Failed to add prompt" };
  }
}
