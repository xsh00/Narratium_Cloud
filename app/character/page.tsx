/**
 * Character Page Component
 *
 * This is the main character interaction page that provides:
 * - Real-time chat interface with character
 * - World book editing capabilities
 * - Regex script management
 * - Preset management
 * - Message history and regeneration
 * - Branch switching in conversations
 * - User tour functionality
 *
 * The page handles all character interactions and provides a rich
 * set of features for managing character dialogues and settings.
 *
 * Dependencies:
 * - CharacterSidebar: For character navigation
 * - CharacterChatPanel: For chat interface
 * - WorldBookEditor: For world book management
 * - RegexScriptEditor: For regex script editing
 * - PresetEditor: For preset management
 * - UserTour: For user onboarding
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { useLanguage } from "@/app/i18n";
import AuthGuard from "@/components/AuthGuard";
import CharacterSidebar from "@/components/CharacterSidebar";
import { v4 as uuidv4 } from "uuid";
import { initCharacterDialogue } from "@/function/dialogue/init";
import { getCharacterDialogue } from "@/function/dialogue/info";
import { handleCharacterChatRequest } from "@/function/dialogue/chat";
import { switchDialogueBranch } from "@/function/dialogue/truncate";
import { deleteDialogueNode } from "@/function/dialogue/delete";
import CharacterChatPanel from "@/components/CharacterChatPanel";
import WorldBookEditor from "@/components/WorldBookEditor";
import RegexScriptEditor from "@/components/RegexScriptEditor";
import PresetEditor from "@/components/PresetEditor";
import CharacterChatHeader from "@/components/CharacterChatHeader";
import UserTour from "@/components/UserTour";
import { useTour } from "@/hooks/useTour";
import ErrorToast from "@/components/ErrorToast";
import { loadConfigFromLocalStorage } from "@/lib/core/config-manager";
import { LocalCharacterRecordOperations } from "@/lib/data/roleplay/character-record-operation";

/**
 * Interface definitions for the component's data structures
 */
interface Character {
  id: string;
  name: string;
  personality?: string;
  avatar_path?: string;
}

interface Message {
  id: string;
  role: string;
  thinkingContent?: string;
  content: string;
}

/**
 * Main character interaction page component
 *
 * Manages all character interactions and provides a comprehensive interface for:
 * - Chat functionality with message history
 * - World book editing
 * - Regex script management
 * - Preset configuration
 * - Message regeneration and branch switching
 * - User tour and onboarding
 *
 * @returns {JSX.Element} The complete character interaction interface
 */
export default function CharacterPage() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("id");
  const { t, fontClass, serifFontClass } = useLanguage();
  const {
    isTourVisible,
    currentTourSteps,
    startCharacterTour,
    completeTour,
    skipTour,
  } = useTour();

  const [character, setCharacter] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [userInput, setUserInput] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [suggestedInputs, setSuggestedInputs] = useState<string[]>([]);
  const initializationRef = useRef(false);
  const [activeView, setActiveView] = useState<
    "chat" | "worldbook" | "regex" | "preset"
  >("chat");
  const [activeModes, setActiveModes] = useState<Record<string, any>>({
    "story-progress": false,
    perspective: {
      active: false,
      mode: "novel",
    },
    "scene-setting": false,
  });

  // Add loading phase tracking for better user feedback
  const [loadingPhase, setLoadingPhase] = useState<string>("");

  // Add error toast state
  const [errorToast, setErrorToast] = useState({
    isVisible: false,
    message: "",
  });

  const showErrorToast = useCallback((message: string) => {
    setErrorToast({
      isVisible: true,
      message,
    });
  }, []);

  const hideErrorToast = useCallback(() => {
    setErrorToast({
      isVisible: false,
      message: "",
    });
  }, []);

  const switchToView = (
    targetView: "chat" | "worldbook" | "regex" | "preset",
  ) => {
    setActiveView(targetView);
  };

  const toggleView = () => {
    setActiveView((prev) => (prev === "chat" ? "worldbook" : "chat"));
  };

  const toggleRegexEditor = () => {
    setActiveView((prev) => (prev === "regex" ? "chat" : "regex"));
  };

  const truncateMessagesAfter = async (nodeId: string) => {
    if (!characterId) return;

    try {
      const messageIndex = messages.findIndex((msg) => msg.id == nodeId);
      if (messageIndex === -1) {
        console.warn(`Dialogue branch not found: ${nodeId}`);
        return;
      }

      const response = await switchDialogueBranch({
        characterId,
        nodeId,
      });

      if (!response.success) {
        console.error("Failed to truncate messages", response);
        return;
      }

      const dialogue = response.dialogue;

      if (dialogue) {
        setTimeout(() => {
          const formattedMessages = dialogue.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role == "system" ? "assistant" : msg.role,
            thinkingContent: msg.thinkingContent ?? "",
            content: msg.content,
          }));

          setMessages(formattedMessages);

          const lastMessage = dialogue.messages[dialogue.messages.length - 1];
          if (lastMessage && lastMessage.parsedContent?.nextPrompts) {
            setSuggestedInputs(lastMessage.parsedContent.nextPrompts);
          } else {
            setSuggestedInputs([]);
          }
        }, 100);
      } else {
      }
    } catch (error) {
      console.error("Error truncating messages:", error);
    }
  };

  const handleRegenerate = async (nodeId: string) => {
    if (!characterId) return;

    try {
      const messageIndex = messages.findIndex(
        (msg) => msg.id === nodeId && msg.role === "assistant",
      );

      if (messageIndex === -1) {
        console.warn(`Message not found for regeneration: ${nodeId}`);
        return;
      }

      // Remove the message to regenerate and all subsequent messages
      const updatedMessages = messages.slice(0, messageIndex);
      setMessages(updatedMessages);

      // Get the last user message before the message to regenerate
      const lastUserMessage = updatedMessages
        .slice()
        .reverse()
        .find((msg) => msg.role === "user");

      if (lastUserMessage) {
        await handleSendMessage(lastUserMessage.content);
      }
    } catch (error) {
      console.error("Error regenerating message:", error);
    }
  };

  const fetchLatestDialogue = async () => {
    if (!characterId) return;

    try {
      console.log(`🔄 fetchLatestDialogue started for character: ${characterId}`);
      setLoadingPhase("加载对话历史...");
      const username = localStorage.getItem("username");
      console.log(`👤 Using username: ${username}`);
      
      const response = await getCharacterDialogue(characterId, "zh", username || undefined);

      console.log(`📥 getCharacterDialogue response:`, response);

      if (!response.success) {
        console.error("❌ Failed to fetch dialogue", response);
        setError("无法加载对话历史");
        return;
      }

      const dialogue = response.dialogue;
      console.log(`📚 Dialogue data:`, dialogue);
      console.log(`📝 Messages count: ${dialogue?.messages?.length || 0}`);

      if (dialogue && dialogue.messages && dialogue.messages.length > 0) {
        console.log(`✅ Found ${dialogue.messages.length} messages, formatting...`);
        
        const formattedMessages = dialogue.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role == "system" ? "assistant" : msg.role,
          thinkingContent: msg.thinkingContent ?? "",
          content: msg.content,
        }));

        console.log(`📝 Formatted messages:`, formattedMessages);
        setMessages(formattedMessages);

        const lastMessage = dialogue.messages[dialogue.messages.length - 1];
        if (lastMessage && lastMessage.parsedContent?.nextPrompts) {
          setSuggestedInputs(lastMessage.parsedContent.nextPrompts);
          console.log(`💡 Set suggested inputs:`, lastMessage.parsedContent.nextPrompts);
        } else {
          setSuggestedInputs([]);
          console.log(`💡 No suggested inputs available`);
        }
      } else {
        console.log(`❌ No messages found, clearing message list. Dialogue:`, dialogue);
        setMessages([]);
        setSuggestedInputs([]);
      }
      
      console.log(`🎉 fetchLatestDialogue completed successfully`);
    } catch (error) {
      console.error("❌ Error fetching dialogue:", error);
      setError("加载对话历史时出错");
    }
  };

  useEffect(() => {
    if (!characterId) {
      setError("未找到角色ID");
      setIsLoading(false);
      return;
    }

    const loadCharacterAndDialogue = async () => {
      try {
        setLoadingPhase("正在加载角色信息...");
        setIsInitializing(true);

        // Fetch character data first
        console.log(`🔍 Loading character data for: ${characterId}`);
        const characterRecord = await LocalCharacterRecordOperations.getCharacterById(characterId);
        if (characterRecord) {
          setCharacter({
            id: characterId,
            name: characterRecord.data.name,
            personality: characterRecord.data.personality,
            avatar_path: characterRecord.imagePath,
          });
          console.log(`✅ Character data loaded: ${characterRecord.data.name}`);
        } else {
          setError("未找到角色信息");
          setIsLoading(false);
          setIsInitializing(false);
          return;
        }

        setLoadingPhase("检查现有对话...");
        console.log(`🔍 Checking for existing dialogue for character: ${characterId}`);
        
        // Check if dialogue exists and has messages
        const username = localStorage.getItem("username");
        const dialogueResponse = await getCharacterDialogue(characterId, "zh", username || undefined);
        
        if (dialogueResponse.success && dialogueResponse.dialogue && 
            dialogueResponse.dialogue.messages && dialogueResponse.dialogue.messages.length > 0) {
          console.log(`✅ Found existing dialogue with ${dialogueResponse.dialogue.messages.length} messages, loading...`);
          
          setLoadingPhase("加载现有对话...");
          
          // Load existing dialogue
          const dialogue = dialogueResponse.dialogue;
          const formattedMessages = dialogue.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role == "system" ? "assistant" : msg.role,
            thinkingContent: msg.thinkingContent ?? "",
            content: msg.content,
          }));

          setMessages(formattedMessages);

          const lastMessage = dialogue.messages[dialogue.messages.length - 1];
          if (lastMessage && lastMessage.parsedContent?.nextPrompts) {
            setSuggestedInputs(lastMessage.parsedContent.nextPrompts);
          } else {
            setSuggestedInputs([]);
          }
          
          console.log(`📚 Successfully loaded ${formattedMessages.length} existing messages`);
          
          setLoadingPhase("准备对话界面...");
          // Add a brief delay to ensure UI is ready
          await new Promise(resolve => setTimeout(resolve, 300));
        } else {
          console.log(`🆕 No existing dialogue found, initializing new one`);
          setLoadingPhase("创建新对话...");
          await initializeNewDialogue(characterId);
        }

        setIsLoading(false);
        setIsInitializing(false);
        initializationRef.current = true;
      } catch (error) {
        console.error("❌ Error loading character:", error);
        setError("加载角色时出错");
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    loadCharacterAndDialogue();
  }, [characterId]);

  const initializeNewDialogue = async (charId: string) => {
    try {
      setLoadingPhase("初始化对话配置...");
      
      // Load configuration from localStorage
      const config = loadConfigFromLocalStorage();
      
      console.log(`🆕 Initializing new dialogue for character: ${charId}`);
      
      setLoadingPhase("生成角色开场白...");
      
      const response = await initCharacterDialogue({
         username: localStorage.getItem("username") || undefined,
         characterId: charId,
        modelName: config.defaultModel || "gemini-2.5-pro",
        baseUrl: config.defaultBaseUrl || "https://api.sillytarven.top/v1",
        apiKey: config.defaultApiKey || "sk-terxMbHAT7lEAKZIs7UDFp_FvScR_3p9hzwJREjgbWM9IgeN",
        llmType: config.defaultType || "openai",
        language: "zh",
      });

      if (!response.success) {
        console.error("Failed to initialize dialogue", response);
        setError("创建新对话失败");
        setIsLoading(false);
        return;
      }

      console.log(`✅ Dialogue initialized successfully, loading opening message...`);
      
      setLoadingPhase("加载角色开场白...");
      
      // Wait a bit for the dialogue to be properly saved, then fetch it
      await new Promise(resolve => setTimeout(resolve, 800)); // Increased wait time
      
      // Fetch the newly created dialogue to get the opening message
      const username = localStorage.getItem("username");
      
      // Try multiple times to get the dialogue if needed
      let dialogueResponse;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        dialogueResponse = await getCharacterDialogue(charId, "zh", username || undefined);
        
        if (dialogueResponse.success && dialogueResponse.dialogue && 
            dialogueResponse.dialogue.messages && dialogueResponse.dialogue.messages.length > 0) {
          break;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`🔄 Attempt ${attempts} failed, retrying...`);
          setLoadingPhase(`正在重试加载开场白... (${attempts}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (dialogueResponse && dialogueResponse.success && dialogueResponse.dialogue && 
          dialogueResponse.dialogue.messages && dialogueResponse.dialogue.messages.length > 0) {
        console.log(`📚 Successfully loaded ${dialogueResponse.dialogue.messages.length} messages including opening message`);
        
        setLoadingPhase("处理开场白内容...");
        
        const dialogue = dialogueResponse.dialogue;
        const formattedMessages = dialogue.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role == "system" ? "assistant" : msg.role,
          thinkingContent: msg.thinkingContent ?? "",
          content: msg.content,
        }));

        setMessages(formattedMessages);

        const lastMessage = dialogue.messages[dialogue.messages.length - 1];
        if (lastMessage && lastMessage.parsedContent?.nextPrompts) {
          setSuggestedInputs(lastMessage.parsedContent.nextPrompts);
        } else {
          setSuggestedInputs([]);
        }
        
        setLoadingPhase("准备对话界面...");
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        console.log(`⚠️ No messages found after initialization, setting empty state`);
        setMessages([]);
        setSuggestedInputs([]);
        showErrorToast("角色开场白生成失败，请刷新页面重试");
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error initializing new dialogue:", error);
      setError("创建新对话时出错");
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!characterId || isSending) return;

    setIsSending(true);
    const messageId = uuidv4();

    try {
      // Add user message to the list
      const userMessage: Message = {
        id: messageId,
        role: "user",
        content: message,
      };

      setMessages((prev) => [...prev, userMessage]);
      setUserInput("");

      // Load configuration from localStorage
      const config = loadConfigFromLocalStorage();

      // Send message to API
              const response = await handleCharacterChatRequest({
         username: localStorage.getItem("username") || undefined,
         characterId,
        message,
        modelName: config.defaultModel || "gemini-2.5-pro",
        baseUrl: config.defaultBaseUrl || "https://api.sillytarven.top/v1",
        apiKey: config.defaultApiKey || "sk-terxMbHAT7lEAKZIs7UDFp_FvScR_3p9hzwJREjgbWM9IgeN",
        llmType: config.defaultType || "openai",
        language: "zh",
        nodeId: messageId,
        fastModel: false,
      });

      if (!response.ok) {
        console.error("Failed to send message", response);
        showErrorToast("发送消息失败");
        return;
      }

      const responseData = await response.json();

      if (!responseData.success) {
        console.error("Failed to send message", responseData);
        showErrorToast("发送消息失败");
        return;
      }

      const assistantMessage: Message = {
        id: responseData.messageId || messageId,
        role: "assistant",
        thinkingContent: responseData.thinkingContent || "",
        content: responseData.content,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update suggested inputs
      if (responseData.parsedContent?.nextPrompts) {
        setSuggestedInputs(responseData.parsedContent.nextPrompts);
      } else {
        setSuggestedInputs([]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showErrorToast("发送消息时出错");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    const handleSwitchToPresetView = (event: any) => {
      setActiveView("preset");
    };

    window.addEventListener("switchToPresetView", handleSwitchToPresetView);

    return () => {
      window.removeEventListener(
        "switchToPresetView",
        handleSwitchToPresetView,
      );
    };
  }, []);

  // Show loading animation during any loading phase
  if (isLoading || isInitializing) {
    return (
      <div className="flex flex-col justify-center items-center h-full fantasy-bg">
        <div className="relative w-12 h-12 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-t-[#f9c86d] border-r-[#c0a480] border-b-[#a18d6f] border-l-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-2 border-t-[#a18d6f] border-r-[#f9c86d] border-b-[#c0a480] border-l-transparent animate-spin-slow"></div>
        </div>
        <p className={`text-[#f4e8c1] ${serifFontClass} text-center mb-2`}>
          {loadingPhase}
        </p>
        {isInitializing && (
          <p
            className={`text-[#a18d6f] text-xs mt-4 max-w-xs text-center ${fontClass}`}
          >
            {t("characterChat.loadingTimeHint")}
          </p>
        )}
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="flex flex-col items-center justify-center h-full fantasy-bg">
        <h1 className="text-2xl text-[#f4e8c1] mb-4">
          {t("characterChat.error")}
        </h1>
        <p className="text-[#c0a480] mb-6">
          {error || t("characterChat.characterNotFound")}
        </p>
        <a
          href="/character-cards"
          className="bg-[#252220] hover:bg-[#342f25] text-[#f4e8c1] font-medium py-2 px-4 rounded border border-[#534741]"
        >
          {t("characterChat.backToCharacters")}
        </a>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isSending) return;

    let message = userInput;
    let hints: string[] = [];

    if (activeModes["story-progress"]) {
      const progressHint = t("characterChat.storyProgressHint");
      hints.push(progressHint);
    }

    if (activeModes["perspective"].active) {
      if (activeModes["perspective"].mode === "novel") {
        const novelHint = t("characterChat.novelPerspectiveHint");
        hints.push(novelHint);
      } else if (activeModes["perspective"].mode === "protagonist") {
        const protagonistHint = t("characterChat.protagonistPerspectiveHint");
        hints.push(protagonistHint);
      }
    }

    if (activeModes["scene-setting"]) {
      const sceneSettingHint = t("characterChat.sceneTransitionHint");
      hints.push(sceneSettingHint);
    }

    if (hints.length > 0) {
      message = `
      <input_message>
      ${t("characterChat.playerInput")}：${userInput}
      </input_message>
      <response_instructions>
      ${t("characterChat.responseInstructions")}：${hints.join(" ")}
      </response_instructions>
          `.trim();
    } else {
      message = `
      <input_message>
      ${t("characterChat.playerInput")}：${userInput}
      </input_message>
          `.trim();
    }

    setUserInput("");
    await handleSendMessage(message);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSuggestedInput = (input: string) => {
    setUserInput(input);
  };

  return (
    <AuthGuard>
      <div
        className="flex h-full relative fantasy-bg overflow-hidden "
        style={{
          left: "var(--app-sidebar-width, 0)",
        }}
      >
        <CharacterSidebar
          character={character}
          isCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          onDialogueEdit={() => fetchLatestDialogue()}
          onViewSwitch={() => {
            switchToView("worldbook");
            setTimeout(() => {
              switchToView("chat");
            }, 1000);
          }}
        />

        <div
          className={`${sidebarCollapsed ? "w-full" : "hidden md:block md:w-3/4"} fantasy-bg h-full transition-all duration-300 ease-in-out flex flex-col`}
        >
          <CharacterChatHeader
            character={character}
            serifFontClass={serifFontClass}
            sidebarCollapsed={sidebarCollapsed}
            activeView={activeView}
            toggleSidebar={toggleSidebar}
            onSwitchToView={switchToView}
            onToggleView={toggleView}
            onToggleRegexEditor={toggleRegexEditor}
          />

          {activeView === "chat" ? (
            <CharacterChatPanel
              character={character}
              messages={messages}
              userInput={userInput}
              setUserInput={setUserInput}
              isSending={isSending}
              suggestedInputs={suggestedInputs}
              onSubmit={handleSubmit}
              onSuggestedInput={handleSuggestedInput}
              onTruncate={truncateMessagesAfter}
              onRegenerate={handleRegenerate}
              fontClass={fontClass}
              serifFontClass={serifFontClass}
              t={t}
              activeModes={activeModes}
              setActiveModes={setActiveModes}
            />
          ) : activeView === "worldbook" ? (
            <WorldBookEditor
              onClose={() => setActiveView("chat")}
              characterName={character?.name || ""}
              characterId={characterId || ""}
            />
          ) : activeView === "preset" ? (
            <PresetEditor
              onClose={() => setActiveView("chat")}
              characterName={character?.name || ""}
              characterId={characterId || ""}
            />
          ) : (
            <RegexScriptEditor
              onClose={() => setActiveView("chat")}
              characterName={character?.name || ""}
              characterId={characterId || ""}
            />
          )}
        </div>
        <UserTour
          steps={currentTourSteps}
          isVisible={isTourVisible}
          onComplete={() => {
            completeTour();
            localStorage.setItem("narratium_character_tour_completed", "true");
          }}
          onSkip={() => {
            skipTour();
            localStorage.setItem("narratium_character_tour_completed", "true");
          }}
        />
        <ErrorToast
          message={errorToast.message}
          isVisible={errorToast.isVisible}
          onClose={hideErrorToast}
        />
      </div>
    </AuthGuard>
  );
} 