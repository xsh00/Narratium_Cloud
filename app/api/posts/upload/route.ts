import { NextResponse } from "next/server";
import { Buffer } from "buffer";
import extract from "png-chunks-extract";
import PNGtext from "png-chunk-text";
import encode from "png-chunks-encode";

const encodeBase64 = (str: string): string => {
  const utf8Bytes = new TextEncoder().encode(str);
  const binary = String.fromCharCode(...utf8Bytes);
  return btoa(binary);
};

// PNG文件头魔数验证
const PNG_SIGNATURE = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

// 验证文件是否为有效的PNG格式
function isPngBuffer(buffer: Buffer): boolean {
  if (buffer.length < PNG_SIGNATURE.length) {
    return false;
  }
  
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (buffer[i] !== PNG_SIGNATURE[i]) {
      return false;
    }
  }
  
  return true;
}

// 生成CRC32表
const generateCrc32Table = (): number[] => {
  const table: number[] = [];
  for(let n = 0; n < 256; n++) {
    let c = n;
    for(let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }
  return table;
};

// CRC32表
const CRC32_TABLE = generateCrc32Table();

// 实现CRC32算法
function calculateCRC32(data: Buffer): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ data[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// 手动创建PNG数据块
function createChunk(type: string, data: Buffer): Buffer {
  // 创建块长度 (4字节)
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  
  // 创建类型字段 (4字节)
  const typeBuffer = Buffer.from(type, 'ascii');
  
  // 计算CRC值 (4字节) - CRC包括类型和数据
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = calculateCRC32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);
  
  // 组装块: 长度 + 类型 + 数据 + CRC
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

// 直接创建角色卡
function createCharacterCard(imageBuffer: Buffer, characterJson: string): Buffer {
  try {
    // 确保图像是PNG格式
    if (!isPngBuffer(imageBuffer)) {
      throw new Error("无效的PNG文件格式");
    }
    
    // PNG签名
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // 提取现有块
    const chunks = extract(imageBuffer);
    
    // 创建输出缓冲区，首先添加PNG签名
    let output = Buffer.from(signature);
    
    // 添加IHDR和其他所有非IEND和非角色卡tEXt块
    for (const chunk of chunks) {
      if (chunk.name !== 'IEND' && !(chunk.name === 'tEXt' && 
          (chunk.data.toString().startsWith('chara\0') || chunk.data.toString().startsWith('ccv3\0')))) {
        // 重新构建此块为原始格式
        const chunkData = Buffer.from(chunk.data);
        const chunkType = chunk.name;
        const chunkLength = Buffer.alloc(4);
        chunkLength.writeUInt32BE(chunkData.length, 0);
        
        const chunkTypeBuffer = Buffer.from(chunkType, 'ascii');
        
        // 计算CRC
        const crcData = Buffer.concat([chunkTypeBuffer, chunkData]);
        const crc = calculateCRC32(crcData);
        const crcBuffer = Buffer.alloc(4);
        crcBuffer.writeUInt32BE(crc, 0);
        
        // 拼接到输出中
        output = Buffer.concat([
          output,
          chunkLength,
          chunkTypeBuffer,
          chunkData,
          crcBuffer
        ]);
      }
    }
    
    // 添加角色卡数据 - V2格式
    const textKeyword = Buffer.from('chara\0', 'binary');
    const textContent = Buffer.from(encodeBase64(characterJson), 'binary');
    const textData = Buffer.concat([textKeyword, textContent]);
    const textChunk = createChunk('tEXt', textData);
    output = Buffer.concat([output, textChunk]);
    
    // 添加V3格式数据
    try {
      const charData = JSON.parse(characterJson);
      const v3Data = { ...charData, spec: 'chara_card_v3', spec_version: '3.0' };
      const v3Json = JSON.stringify(v3Data);
      
      const textKeywordV3 = Buffer.from('ccv3\0', 'binary');
      const textContentV3 = Buffer.from(encodeBase64(v3Json), 'binary');
      const textDataV3 = Buffer.concat([textKeywordV3, textContentV3]);
      const textChunkV3 = createChunk('tEXt', textDataV3);
      
      output = Buffer.concat([output, textChunkV3]);
    } catch (err) {
      console.warn("Failed to add ccv3 chunk:", err);
    }
    
    // 添加IEND块
    const iendChunk = createChunk('IEND', Buffer.alloc(0));
    output = Buffer.concat([output, iendChunk]);
    
    return output;
  } catch (error) {
    console.error("创建角色卡失败:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;
    const characterDataStr = formData.get("characterData") as string;

    if (!image || !characterDataStr) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    if (!image.type.includes("image/")) {
      return NextResponse.json(
        { error: "请提供有效的图片" },
        { status: 400 }
      );
    }

    try {
      // 解析角色数据
      const characterData = JSON.parse(characterDataStr);
      const characterName = characterData.name || "character";

      // 读取图片数据
      const imageData = await image.arrayBuffer();
      const imageBuffer = Buffer.from(imageData);
      
      // 验证PNG文件格式
      if (!isPngBuffer(imageBuffer)) {
        return NextResponse.json(
          { error: "无效的PNG文件格式，请确保上传的是PNG图像" },
          { status: 400 }
        );
      }
      
      // 直接创建角色卡
      let cardBuffer: Buffer;
      try {
        cardBuffer = createCharacterCard(imageBuffer, characterDataStr);
      } catch (err) {
        console.error("创建角色卡失败:", err);
        return NextResponse.json(
          { error: "创建角色卡失败: " + (err instanceof Error ? err.message : String(err)) },
          { status: 500 }
        );
      }
      
      // 直接返回PNG数据
      const response = new NextResponse(cardBuffer);
      response.headers.set('Content-Type', 'image/png');
      response.headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(characterName)}.png"`);
      response.headers.set('Cache-Control', 'no-cache, no-store');
      
      return response;
      
    } catch (error) {
      console.error("处理角色卡数据失败:", error);
      return NextResponse.json(
        { error: "处理角色卡数据失败: " + (error instanceof Error ? error.message : String(error)) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("角色卡生成错误:", error);
    return NextResponse.json(
      { error: "角色卡生成失败: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 