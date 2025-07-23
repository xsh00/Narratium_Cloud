"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/app/i18n";
import { parseCharacterCard } from "@/utils/character-parser";
import { toast } from "react-hot-toast";

interface WorldBookEntry {
  entry_id?: string;
  content: string;
  keys: string[];
  secondary_keys?: string[];
  selective: boolean;
  constant: boolean;
  position: string | number;
  enabled?: boolean;
  comment?: string;
}

// 添加从角色卡导入时的世界书条目格式接口
interface ImportedWorldBookEntry {
  content?: string;
  keys?: string[];
  key?: string[];
  secondary_keys?: string[];
  keysecondary?: string[];
  selective?: boolean;
  constant?: boolean;
  position?: string | number;
  enabled?: boolean;
  disable?: boolean;
  comment?: string;
  [key: string]: any;
}

interface CharacterData {
  name: string;
  description: string;
  personality: string;
  first_mes: string;
  scenario: string;
  mes_example: string;
  creatorcomment: string;
  data?: {
    name?: string;
    description?: string;
    personality?: string;
    first_mes?: string;
    scenario?: string;
    mes_example?: string;
    creator_notes?: string;
    character_book?: {
      entries: ImportedWorldBookEntry[] | Record<string, ImportedWorldBookEntry>;
    };
    alternate_greetings?: string[];
  };
}

export default function CreatorAreaPage() {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"import" | "create" | "edit">("import");
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [worldBookEntries, setWorldBookEntries] = useState<WorldBookEntry[]>([]);
  const [currentImage, setCurrentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");
  const [characterPersonality, setCharacterPersonality] = useState("");
  const [characterFirstMessage, setCharacterFirstMessage] = useState("");
  const [characterScenario, setCharacterScenario] = useState("");
  const [characterMesExample, setCharacterMesExample] = useState("");
  const [characterCreatorComment, setCharacterCreatorComment] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const yellowImg = new Image();
    const redImg = new Image();

    yellowImg.src = "/background_yellow.png";
    redImg.src = "/background_red.png";

    Promise.all([
      new Promise((resolve) => (yellowImg.onload = resolve)),
      new Promise((resolve) => (redImg.onload = resolve)),
    ]).then(() => {
      setImagesLoaded(true);
    });
  }, []);

  // 处理导入PNG角色卡
  const handleImportCharacter = async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith(".png")) {
      toast.error(t("importCharacterModal.pngOnly") || "请上传PNG格式的角色卡");
      return;
    }

    setIsProcessing(true);
    try {
      // 解析角色卡
      const characterData = await parseCharacterCard(file);
      const characterJson = JSON.parse(characterData);
      
      // 更新状态
      setCharacterData(characterJson);
      setCharacterName(characterJson.name || "");
      setCharacterDescription(characterJson.description || "");
      setCharacterPersonality(characterJson.personality || "");
      setCharacterFirstMessage(characterJson.first_mes || "");
      setCharacterScenario(characterJson.scenario || "");
      setCharacterMesExample(characterJson.mes_example || "");
      setCharacterCreatorComment(characterJson.creatorcomment || characterJson.data?.creator_notes || "");

      // 设置世界书条目
      let entries: WorldBookEntry[] = [];
      if (characterJson.data?.character_book?.entries) {
        const entriesData = characterJson.data.character_book.entries;
        if (Array.isArray(entriesData)) {
          entries = entriesData.map((entry: any) => ({
            content: entry.content || "",
            keys: entry.key || entry.keys || [],
            secondary_keys: entry.keysecondary || entry.secondary_keys || [],
            selective: entry.selective !== undefined ? entry.selective : false,
            constant: entry.constant !== undefined ? entry.constant : false,
            position: entry.position !== undefined ? entry.position : 4,
            enabled: entry.disable !== undefined ? !entry.disable : true,
            comment: entry.comment || ""
          }));
        } else if (typeof entriesData === 'object') {
          entries = Object.entries(entriesData).map(([_, entry]: [string, any]) => ({
            content: entry.content || "",
            keys: entry.keys || [],
            secondary_keys: entry.secondary_keys || [],
            selective: entry.selective !== undefined ? entry.selective : false,
            constant: entry.constant !== undefined ? entry.constant : false,
            position: entry.position !== undefined ? entry.position : 4,
            enabled: entry.enabled !== undefined ? entry.enabled : true,
            comment: entry.comment || ""
          }));
        }
      }
      setWorldBookEntries(entries);

      // 设置图像预览
      setCurrentImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // 切换到编辑标签页
      setActiveTab("edit");
      toast.success(t("importCharacterModal.importSuccess") || "角色卡导入成功");
    } catch (error) {
      console.error("导入角色卡失败:", error);
      toast.error(t("importCharacterModal.importFailed") || "角色卡导入失败");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImportCharacter(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImportCharacter(e.dataTransfer.files[0]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // 验证文件是否为图像
      if (!file.type.startsWith('image/')) {
        toast.error(t("characterCreator.invalidFileType") || "请上传有效的图片文件");
        return;
      }
      
      // 读取图像并显示预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        
        // 如果不是PNG，则显示转换提示
        if (file.type !== 'image/png') {
          toast(t("characterCreator.notPngWarning") || "注意：角色卡最终会被转换为PNG格式");
          // 但仍然先使用原始文件，只在导出时转换
          setCurrentImage(file);
        } else {
          // PNG格式直接设置
          setCurrentImage(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 将图像转换为PNG格式
  const convertToPNG = (imageFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // 创建Canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制图像到Canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        // 从Canvas获取PNG数据
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('无法转换为PNG'));
            return;
          }
          
          // 创建新的文件
          const newFileName = imageFile.name.replace(/\.[^.]+$/, '.png') || 'character.png';
          const newFile = new File([blob], newFileName, { type: 'image/png' });
          resolve(newFile);
        }, 'image/png');
      };
      
      img.onerror = () => {
        reject(new Error('加载图像失败'));
      };
      
      // 从文件中加载图像
      img.src = URL.createObjectURL(imageFile);
    });
  };

  // 添加世界书条目
  const addWorldBookEntry = () => {
    const newEntry: WorldBookEntry = {
      content: "",
      keys: [],
      secondary_keys: [],
      selective: false,
      constant: false,
      position: 4,
      enabled: true,
      comment: ""
    };
    setWorldBookEntries([...worldBookEntries, newEntry]);
  };

  // 更新世界书条目
  const updateWorldBookEntry = (index: number, field: keyof WorldBookEntry, value: any) => {
    const updatedEntries = [...worldBookEntries];
    updatedEntries[index] = { ...updatedEntries[index], [field]: value };
    setWorldBookEntries(updatedEntries);
  };

  // 删除世界书条目
  const deleteWorldBookEntry = (index: number) => {
    const updatedEntries = [...worldBookEntries];
    updatedEntries.splice(index, 1);
    setWorldBookEntries(updatedEntries);
  };

  // 导出角色卡
  const exportCharacterCard = async () => {
    if (!currentImage) {
      toast.error(t("characterCreator.noImage") || "请上传角色卡图片");
      return;
    }

    if (!characterName) {
      toast.error(t("characterCreator.noName") || "请输入角色名称");
      return;
    }

    setIsProcessing(true);
    try {
      // 构建角色数据
      const characterDataToExport: CharacterData = {
        name: characterName,
        description: characterDescription,
        personality: characterPersonality,
        first_mes: characterFirstMessage,
        scenario: characterScenario,
        mes_example: characterMesExample,
        creatorcomment: characterCreatorComment,
        data: {
          name: characterName,
          description: characterDescription,
          personality: characterPersonality,
          first_mes: characterFirstMessage,
          scenario: characterScenario,
          mes_example: characterMesExample,
          creator_notes: characterCreatorComment,
          character_book: {
            entries: worldBookEntries.reduce((acc, entry, index) => {
              acc[`entry_${index}`] = {
                ...entry,
                disable: entry.enabled === false,
                key: entry.keys
              };
              return acc;
            }, {} as Record<string, any>)
          }
        }
      };

      // 创建FormData
      const formData = new FormData();
      
      // 确保图像是PNG格式
      let pngImage = currentImage;
      if (currentImage.type !== 'image/png') {
        try {
          // 显示转换提示
          toast(t("characterCreator.convertingImage") || "正在转换图像格式...");
          // 转换图像格式
          pngImage = await convertToPNG(currentImage);
        } catch (error) {
          console.error("图像转换失败:", error);
          toast.error(t("characterCreator.conversionFailed") || "图像格式转换失败");
          setIsProcessing(false);
          return;
        }
      }
      
      // 添加图像和角色数据
      formData.append("image", pngImage, pngImage.name);
      formData.append("characterData", JSON.stringify(characterDataToExport));

      // 发送请求到服务器端
      const response = await fetch("/api/posts/upload", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || "导出失败");
      }

      // 直接获取二进制数据
      const blob = await response.blob();
      
      // 创建临时URL并触发下载
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `${characterName}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(t("characterCreator.exportSuccess") || "角色卡导出成功");
    } catch (error: any) {
      console.error("导出角色卡失败:", error);
      toast.error(error.message || t("characterCreator.exportFailed") || "角色卡导出失败");
    } finally {
      setIsProcessing(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setCharacterData(null);
    setWorldBookEntries([]);
    setCurrentImage(null);
    setImagePreview(null);
    setCharacterName("");
    setCharacterDescription("");
    setCharacterPersonality("");
    setCharacterFirstMessage("");
    setCharacterScenario("");
    setCharacterMesExample("");
    setCharacterCreatorComment("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const createNewCharacter = () => {
    resetForm();
    setActiveTab("create");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full pb-20 overflow-y-auto login-fantasy-bg relative">
      <div
        className={`fixed inset-0 z-0 opacity-35 transition-opacity duration-500 ${
          imagesLoaded ? "opacity-35" : "opacity-0"
        }`}
        style={{
          backgroundImage: "url('/background_yellow.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div
        className={`fixed inset-0 z-1 opacity-45 transition-opacity duration-500 ${
          imagesLoaded ? "opacity-45" : "opacity-0"
        }`}
        style={{
          backgroundImage: "url('/background_red.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          mixBlendMode: "multiply",
        }}
      />

      <div className="relative z-10 w-full max-w-5xl px-4 py-8 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-5xl font-bold mb-6 font-cinzel bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)] text-center"
        >
          {t("sidebar.creatorStudio") || "角色创作室"}
        </motion.div>

        <div className="bg-[#1a1714]/80 border border-[#3a3632] rounded-lg shadow-lg p-6">
          {/* 标签页选择 */}
          <div className="flex border-b border-[#3a3632] mb-6 overflow-x-auto">
            <button
              className={`px-4 py-2 font-medium ${activeTab === "import" ? "text-amber-400 border-b-2 border-amber-400" : "text-[#a18d6f] hover:text-amber-300"}`}
              onClick={() => setActiveTab("import")}
            >
              {t("characterCreator.import") || "导入角色"}
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === "create" ? "text-amber-400 border-b-2 border-amber-400" : "text-[#a18d6f] hover:text-amber-300"}`}
              onClick={createNewCharacter}
            >
              {t("characterCreator.create") || "创建角色"}
            </button>
            {characterData && (
              <button
                className={`px-4 py-2 font-medium ${activeTab === "edit" ? "text-amber-400 border-b-2 border-amber-400" : "text-[#a18d6f] hover:text-amber-300"}`}
                onClick={() => setActiveTab("edit")}
              >
                {t("characterCreator.edit") || "编辑角色"}
              </button>
            )}
          </div>

          {/* 导入标签页 */}
          {activeTab === "import" && (
            <div className="text-center">
              <p className={`text-[#c0a480] mb-6 ${fontClass}`}>
                {t("importCharacterModal.description") || "上传SillyTavern格式的PNG角色卡进行编辑"}
              </p>
              
              <div
                className={`border-2 border-dashed rounded-lg p-4 sm:p-8 mb-4 text-center transition-colors duration-300 border-[#534741] hover:border-[#a18d6f]`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/png"
                  onChange={handleFileUpload}
                />

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 sm:w-12 sm:h-12 mb-3 mx-auto text-[#a18d6f]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>

                <div className={`text-[#a18d6f] ${fontClass}`}>
                  <p>{t("importCharacterModal.dragOrClick") || "拖放或点击上传PNG角色卡"}</p>
                  <p className="text-xs mt-1">
                    {t("importCharacterModal.pngFormat") || "仅支持PNG格式的SillyTavern角色卡"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 创建或编辑标签页 */}
          {(activeTab === "create" || activeTab === "edit") && (
            <div>
              {/* 角色基本信息 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-1">
                  <div className="mb-4">
                    <p className={`text-[#c0a480] mb-2 ${fontClass}`}>
                      {t("characterCreator.characterImage") || "角色图片"}
                    </p>
                    <div 
                      className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-[#a18d6f] transition-colors duration-300 max-h-[300px] sm:max-h-none overflow-hidden"
                      onClick={() => document.getElementById("character-image-upload")?.click()}
                    >
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="角色预览" 
                          className="max-h-60 mx-auto rounded object-contain"
                        />
                      ) : (
                        <div className="h-40 md:h-60 flex flex-col items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-12 h-12 text-[#a18d6f]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="mt-2 text-[#a18d6f] text-center">{t("characterCreator.clickToUpload") || "点击上传图片"}</span>
                        </div>
                      )}
                      <input
                        id="character-image-upload"
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  {/* 角色名称 */}
                  <div className="mb-4">
                    <label className={`block text-[#c0a480] mb-2 ${fontClass}`}>
                      {t("characterCreator.name") || "角色名称"} *
                    </label>
                    <input
                      type="text"
                      value={characterName}
                      onChange={(e) => setCharacterName(e.target.value)}
                      className="w-full p-2 bg-[#1c1c1c] border border-[#333333] rounded-md text-[#eae6db] focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* 角色描述 */}
                  <div className="mb-4">
                    <label className={`block text-[#c0a480] mb-2 ${fontClass}`}>
                      {t("characterCreator.description") || "角色描述"} *
                    </label>
                    <textarea
                      value={characterDescription}
                      onChange={(e) => setCharacterDescription(e.target.value)}
                      className="w-full p-2 bg-[#1c1c1c] border border-[#333333] rounded-md text-[#eae6db] focus:border-amber-500 focus:outline-none"
                      rows={3}
                      required
                    />
                  </div>

                  {/* 角色性格 */}
                  <div className="mb-4">
                    <label className={`block text-[#c0a480] mb-2 ${fontClass}`}>
                      {t("characterCreator.personality") || "角色性格"} *
                    </label>
                    <textarea
                      value={characterPersonality}
                      onChange={(e) => setCharacterPersonality(e.target.value)}
                      className="w-full p-2 bg-[#1c1c1c] border border-[#333333] rounded-md text-[#eae6db] focus:border-amber-500 focus:outline-none"
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 角色场景 */}
              <div className="mb-4">
                <label className={`block text-[#c0a480] mb-2 ${fontClass}`}>
                  {t("characterCreator.scenario") || "角色场景"} *
                </label>
                <textarea
                  value={characterScenario}
                  onChange={(e) => setCharacterScenario(e.target.value)}
                  className="w-full p-2 bg-[#1c1c1c] border border-[#333333] rounded-md text-[#eae6db] focus:border-amber-500 focus:outline-none"
                  rows={3}
                  required
                />
              </div>

              {/* 第一条消息 */}
              <div className="mb-4">
                <label className={`block text-[#c0a480] mb-2 ${fontClass}`}>
                  {t("characterCreator.firstMessage") || "第一条消息"} *
                </label>
                <textarea
                  value={characterFirstMessage}
                  onChange={(e) => setCharacterFirstMessage(e.target.value)}
                  className="w-full p-2 bg-[#1c1c1c] border border-[#333333] rounded-md text-[#eae6db] focus:border-amber-500 focus:outline-none"
                  rows={3}
                  required
                />
              </div>

              {/* 示例消息 */}
              <div className="mb-4">
                <label className={`block text-[#c0a480] mb-2 ${fontClass}`}>
                  {t("characterCreator.exampleMessage") || "示例消息"} *
                </label>
                <textarea
                  value={characterMesExample}
                  onChange={(e) => setCharacterMesExample(e.target.value)}
                  className="w-full p-2 bg-[#1c1c1c] border border-[#333333] rounded-md text-[#eae6db] focus:border-amber-500 focus:outline-none"
                  rows={3}
                  required
                />
              </div>

              {/* 创作者备注 */}
              <div className="mb-6">
                <label className={`block text-[#c0a480] mb-2 ${fontClass}`}>
                  {t("characterCreator.creatorComment") || "创作者备注"}
                </label>
                <textarea
                  value={characterCreatorComment}
                  onChange={(e) => setCharacterCreatorComment(e.target.value)}
                  className="w-full p-2 bg-[#1c1c1c] border border-[#333333] rounded-md text-[#eae6db] focus:border-amber-500 focus:outline-none"
                  rows={2}
                />
              </div>

              {/* 世界书条目 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4 flex-wrap">
                  <h3 className={`text-[#c0a480] text-lg font-medium ${serifFontClass} mb-2 md:mb-0`}>
                    {t("characterCreator.worldBookEntries") || "世界书条目"}
                  </h3>
                  <button
                    type="button"
                    onClick={addWorldBookEntry}
                    className="text-sm px-3 py-1 bg-[#2a231c] text-amber-400 rounded-md border border-amber-600 hover:bg-[#3a2e24] transition-colors"
                  >
                    {t("characterCreator.addEntry") || "添加条目"}
                  </button>
                </div>

                {worldBookEntries.length === 0 ? (
                  <p className="text-[#a18d6f] text-center py-4">
                    {t("characterCreator.noEntries") || "没有世界书条目"}
                  </p>
                ) : (
                  <div className="space-y-6">
                    {worldBookEntries.map((entry, index) => (
                      <div key={index} className="border border-[#333333] rounded-md p-4 bg-[#1c1c1c]">
                        <div className="flex justify-between items-center mb-3 flex-wrap">
                          <h4 className={`text-[#eae6db] ${fontClass}`}>
                            {t("characterCreator.entry") || "条目"} #{index + 1}
                          </h4>
                          <button
                            type="button"
                            onClick={() => deleteWorldBookEntry(index)}
                            className="text-sm px-2 py-1 text-red-400 hover:text-red-300"
                          >
                            {t("characterCreator.delete") || "删除"}
                          </button>
                        </div>

                        {/* 条目内容 */}
                        <div className="mb-3">
                          <label className={`block text-[#c0a480] mb-1 text-sm ${fontClass}`}>
                            {t("characterCreator.content") || "内容"} *
                          </label>
                          <textarea
                            value={entry.content}
                            onChange={(e) => updateWorldBookEntry(index, "content", e.target.value)}
                            className="w-full p-2 bg-[#1c1c1c] border border-[#333333] rounded-md text-[#eae6db] focus:border-amber-500 focus:outline-none"
                            rows={3}
                          />
                        </div>

                        {/* 关键词 */}
                        <div className="mb-3">
                          <label className={`block text-[#c0a480] mb-1 text-sm ${fontClass}`}>
                            {t("characterCreator.keywords") || "关键词"} 
                            <span className="text-xs text-[#a18d6f] ml-1">
                              ({t("characterCreator.commaSeparated") || "用逗号分隔"})
                            </span>
                          </label>
                          <input
                            type="text"
                            value={entry.keys.join(", ")}
                            onChange={(e) => updateWorldBookEntry(index, "keys", e.target.value.split(",").map(k => k.trim()))}
                            className="w-full p-2 bg-[#1c1c1c] border border-[#333333] rounded-md text-[#eae6db] focus:border-amber-500 focus:outline-none"
                          />
                        </div>

                        {/* 次要关键词 */}
                        <div className="mb-3">
                          <label className={`block text-[#c0a480] mb-1 text-sm ${fontClass}`}>
                            {t("characterCreator.secondaryKeywords") || "次要关键词"} 
                            <span className="text-xs text-[#a18d6f] ml-1">
                              ({t("characterCreator.commaSeparated") || "用逗号分隔"})
                            </span>
                          </label>
                          <input
                            type="text"
                            value={(entry.secondary_keys || []).join(", ")}
                            onChange={(e) => updateWorldBookEntry(index, "secondary_keys", e.target.value.split(",").map(k => k.trim()))}
                            className="w-full p-2 bg-[#1c1c1c] border border-[#333333] rounded-md text-[#eae6db] focus:border-amber-500 focus:outline-none"
                          />
                        </div>
                        
                        {/* 附加属性 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-[#c0a480] mb-1 text-sm ${fontClass}`}>
                              {t("characterCreator.comment") || "注释"}
                            </label>
                            <input
                              type="text"
                              value={entry.comment || ""}
                              onChange={(e) => updateWorldBookEntry(index, "comment", e.target.value)}
                              className="w-full p-2 bg-[#1c1c1c] border border-[#333333] rounded-md text-[#eae6db] focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className={`block text-[#c0a480] mb-1 text-sm ${fontClass}`}>
                              {t("characterCreator.position") || "位置"} (0-4)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="4"
                              value={Number(entry.position)}
                              onChange={(e) => updateWorldBookEntry(index, "position", Number(e.target.value))}
                              className="w-full p-2 bg-[#1c1c1c] border border-[#333333] rounded-md text-[#eae6db] focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* 复选框属性 */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`selective-${index}`}
                              checked={entry.selective}
                              onChange={(e) => updateWorldBookEntry(index, "selective", e.target.checked)}
                              className="mr-2"
                            />
                            <label htmlFor={`selective-${index}`} className="text-[#eae6db] text-sm">
                              {t("characterCreator.selective") || "选择性"}
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`constant-${index}`}
                              checked={entry.constant}
                              onChange={(e) => updateWorldBookEntry(index, "constant", e.target.checked)}
                              className="mr-2"
                            />
                            <label htmlFor={`constant-${index}`} className="text-[#eae6db] text-sm">
                              {t("characterCreator.constant") || "常驻"}
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`enabled-${index}`}
                              checked={entry.enabled !== false}
                              onChange={(e) => updateWorldBookEntry(index, "enabled", e.target.checked)}
                              className="mr-2"
                            />
                            <label htmlFor={`enabled-${index}`} className="text-[#eae6db] text-sm">
                              {t("characterCreator.enabled") || "启用"}
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end space-x-4 mt-8 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-md border border-[#534741] text-[#a18d6f] hover:text-[#eae6db] hover:border-[#a18d6f] transition-colors"
                  disabled={isProcessing}
                >
                  {t("characterCreator.reset") || "重置"}
                </button>
                <button
                  type="button"
                  onClick={exportCharacterCard}
                  className="px-4 py-2 rounded-md bg-gradient-to-r from-amber-600 to-amber-500 text-white hover:from-amber-500 hover:to-amber-400 transition-colors"
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? t("characterCreator.processing") || "处理中..."
                    : t("characterCreator.exportCharacter") || "导出角色卡"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
