import React from 'react';
import { useLanguage } from "@/app/i18n";

const ModelPricingTable: React.FC = () => {
  const { fontClass } = useLanguage();

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h3 className={`text-xl font-semibold text-[#f8d36a] mb-2 ${fontClass}`}>
        模型计费规则
      </h3>
      <p className={`text-[#e0d0b0] mb-4 text-sm ${fontClass}`}>
        购买高级API后以下高级模型均可使用
      </p>
      
      <div className="overflow-x-auto rounded-lg border border-[#3a3530]">
        <table className="min-w-full bg-[#1c1c1c] table-auto">
          <thead className="bg-gradient-to-r from-[#3a3530] to-[#433e39] text-[#f8d36a]">
            <tr>
              <th className="py-2.5 px-2 md:px-3 text-left text-xs md:text-sm font-medium">系列</th>
              <th className="py-2.5 px-2 md:px-3 text-left text-xs md:text-sm font-medium">模型</th>
              <th className="py-2.5 px-2 md:px-3 text-left text-xs md:text-sm font-medium">价格计算</th>
              <th className="py-2.5 px-2 md:px-3 text-left text-xs md:text-sm font-medium">单次预估</th>
              <th className="py-2.5 px-2 md:px-3 text-left text-xs md:text-sm font-medium hidden md:table-cell">适用场景</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3a3530]/50">
            {/* Grok 系列 */}
            <tr className="bg-[#2a2520]/80">
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0] font-medium" rowSpan={2}>
                Grok系列
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">grok-3</td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">
                <p>固定价格：¥0.03 / 次</p>
                <p className="text-xs text-[#a09080] mt-1 hidden md:block">无论token数量多少，单次请求固定收费</p>
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">
                <p className="text-green-400 font-medium">¥0.03</p>
                <p className="text-xs text-[#a09080] mt-1 hidden md:block">固定价格</p>
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0] hidden md:table-cell">
                适合简短对话和基础问答，成本可控
              </td>
            </tr>
            <tr className="bg-[#332e29]/80">
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">grok-4</td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">
                <p>固定价格：¥0.045 / 次</p>
                <p className="text-xs text-[#a09080] mt-1 hidden md:block">无论token数量多少，单次请求固定收费</p>
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">
                <p className="text-green-400 font-medium">¥0.045</p>
                <p className="text-xs text-[#a09080] mt-1 hidden md:block">固定价格</p>
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0] hidden md:table-cell">
                适合需要更强能力的问答和创意生成
              </td>
            </tr>

            {/* Gemini 系列 */}
            <tr className="bg-[#2a2520]/80">
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0] font-medium" rowSpan={2}>
                Gemini系列
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">gemini-2.5-pro</td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">
                <p>输入：¥1.86 / 百万tokens</p>
                <p>输出：¥24.00 / 百万tokens</p>
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">
                <p className="text-green-400 font-medium">约¥0.13</p>
                <p className="text-xs text-[#a09080] mt-1 hidden md:block">提示2万 + 补全4千tokens</p>
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0] hidden md:table-cell">
                适合复杂推理和高质量内容生成
              </td>
            </tr>
            <tr className="bg-[#332e29]/80">
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">gemini-2.5-pro-preview</td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">
                <p>输入：¥1.86 / 百万tokens</p>
                <p>输出：¥24.00 / 百万tokens</p>
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">
                <p className="text-green-400 font-medium">约¥0.13</p>
                <p className="text-xs text-[#a09080] mt-1 hidden md:block">提示2万 + 补全4千tokens</p>
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0] hidden md:table-cell">
                适合需要最新模型能力的应用场景
              </td>
            </tr>

            {/* Claude 系列 */}
            <tr className="bg-[#2a2520]/80">
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0] font-medium" rowSpan={2}>
                Claude系列
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">claude-sonnet-4</td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">
                <p>输入：¥4.50 / 百万tokens</p>
                <p>输出：¥15.00 / 百万tokens</p>
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">
                <p className="text-green-400 font-medium">约¥0.15</p>
                <p className="text-xs text-[#a09080] mt-1 hidden md:block">提示2万 + 补全4千tokens</p>
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0] hidden md:table-cell">
                适合高质量内容生成和复杂对话
              </td>
            </tr>
            <tr className="bg-[#332e29]/80">
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">claude-opus-4</td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">
                <p>输入：¥22.50 / 百万tokens</p>
                <p>输出：¥15.00 / 百万tokens</p>
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0]">
                <p className="text-green-400 font-medium">约¥0.51</p>
                <p className="text-xs text-[#a09080] mt-1 hidden md:block">提示2万 + 补全4千tokens</p>
              </td>
              <td className="py-2.5 px-2 md:px-3 text-xs md:text-sm text-[#e0d0b0] hidden md:table-cell">
                适合企业级应用和需要最强分析能力的场景
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 bg-[#2a2520]/50 border border-[#3a3530] rounded-lg p-3 text-xs md:text-sm text-[#c0a480]">
        <h4 className={`font-semibold mb-2 ${fontClass}`}>计费说明：</h4>
        <ul className="list-disc pl-4 md:pl-5 space-y-1">
          <li>所有价格均以人民币计算</li>
          <li>Token数量根据实际文本长度自动计算，汉字通常为1-2个tokens</li>
          <li>系统会在每次请求前估算可能消耗的token数量，确保余额充足</li>
          <li>实际计费以系统记录为准，可通过"查询余额"功能查看明细</li>
        </ul>
      </div>
    </div>
  );
};

export default ModelPricingTable; 