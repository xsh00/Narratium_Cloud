"use client";

import { useState } from "react";
import { useLanguage } from "@/app/i18n";
import { createPreset } from "@/function/preset/global";
import { toast } from "react-hot-toast";

interface CreatePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePresetModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePresetModalProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [presetName, setPresetName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!presetName.trim()) {
      toast.error(t("preset.presetNameRequired"));
      return;
    }

    setIsCreating(true);

    try {
      const newPreset = {
        name: presetName.trim(),
        enabled: true,
        prompts: [],
      };

      const result = await createPreset(newPreset);
      if (result.success) {
        toast.success(t("preset.createSuccess"));
        onSuccess();
        handleClose();
      } else {
        toast.error(t("preset.createFailed"));
      }
    } catch (error) {
      console.error("Create preset failed:", error);
      toast.error(t("preset.createFailed"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setPresetName("");
    setIsCreating(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-br from-[#1a1816] via-[#252220] to-[#1a1816] rounded-lg border border-[#534741] shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-[#534741] bg-gradient-to-r from-amber-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <h3
              className={`text-lg font-medium text-[#eae6db] ${serifFontClass}`}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300">
                {t("preset.createPreset")}
              </span>
            </h3>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center text-[#a18d6f] hover:text-[#eae6db] transition-colors duration-300 rounded-md hover:bg-[#333] group"
              disabled={isCreating}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:scale-110"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label
              className={`block text-sm font-medium text-[#a18d6f] mb-2 ${fontClass}`}
            >
              {t("preset.presetName")}
            </label>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={t("preset.presetNamePlaceholder")}
              disabled={isCreating}
              className={`w-full px-3 py-2 bg-gradient-to-br from-[#1a1816] via-[#252220] to-[#1a1816] 
                text-[#eae6db] rounded-md border border-[#534741] 
                focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 
                transition-all duration-300 hover:border-[#534741] backdrop-blur-sm
                shadow-inner ${fontClass}
                disabled:opacity-50 disabled:cursor-not-allowed`}
              autoFocus
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className={`px-4 py-2 text-sm font-medium text-[#a18d6f] hover:text-[#eae6db] 
                bg-gradient-to-br from-[#1a1816] via-[#252220] to-[#1a1816] 
                border border-[#534741] rounded-md 
                hover:border-[#534741] transition-all duration-300 backdrop-blur-sm
                disabled:opacity-50 disabled:cursor-not-allowed ${fontClass}`}
            >
              {t("preset.cancel")}
            </button>
            <button
              type="submit"
              disabled={isCreating || !presetName.trim()}
              className={`px-4 py-2 text-sm font-medium 
                bg-gradient-to-r from-[#1f1c1a] to-[#13100e] 
                hover:from-[#282521] hover:to-[#1a1613] 
                text-[#e9c08d] hover:text-[#f6daae] 
                rounded-md transition-all duration-300 
                shadow-lg hover:shadow-[#f8b758]/20 
                border border-[#403a33]
                disabled:opacity-50 disabled:cursor-not-allowed ${fontClass}
                flex items-center`}
            >
              {isCreating && (
                <div className="w-4 h-4 mr-2 border-2 border-[#e9c08d] border-t-transparent rounded-full animate-spin"></div>
              )}
              {isCreating ? t("preset.creating") : t("preset.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
