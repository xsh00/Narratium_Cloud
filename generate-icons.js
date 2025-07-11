const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 定义不同分辨率的尺寸
const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

// 源图标文件
const sourceIcon = 'public/logo_circle.png';
const androidResPath = 'android/app/src/main/res';

async function generateIcons() {
  try {
    console.log('开始生成 Android 图标...');
    
    // 检查源文件是否存在
    if (!fs.existsSync(sourceIcon)) {
      console.error(`源图标文件不存在: ${sourceIcon}`);
      return;
    }

    // 为每个分辨率生成图标
    for (const [folder, size] of Object.entries(sizes)) {
      const folderPath = path.join(androidResPath, folder);
      
      // 确保目录存在
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // 生成 ic_launcher.png
      await sharp(sourceIcon)
        .resize(size, size)
        .png()
        .toFile(path.join(folderPath, 'ic_launcher.png'));

      // 生成 ic_launcher_round.png (圆形图标)
      await sharp(sourceIcon)
        .resize(size, size)
        .png()
        .toFile(path.join(folderPath, 'ic_launcher_round.png'));

      console.log(`✓ 生成 ${folder} 图标 (${size}x${size})`);
    }

    console.log('✅ 所有图标生成完成！');
    console.log('现在可以重新构建 APK 来应用新图标。');
    
  } catch (error) {
    console.error('生成图标时出错:', error);
  }
}

generateIcons(); 