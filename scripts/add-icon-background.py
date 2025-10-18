#!/usr/bin/env python3
"""
為透明背景的 PWA 圖標添加品牌色背景
避免在深色模式下顯示黑色背景
"""

from PIL import Image
import os

# 背景色選項
BRAND_COLOR = '#2a96d1'  # 主藍色（原始）
WHITE_BG = '#ffffff'     # 白色背景（高對比度）
DARK_BG = '#1a3a5c'      # 深藍背景（品牌深色）

# 使用白色背景以提高對比度
BACKGROUND_COLOR = WHITE_BG

def hex_to_rgb(hex_color):
    """轉換 hex 顏色為 RGB"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def add_background(input_path, output_path):
    """為圖片添加背景色"""
    # 打開原始圖片
    img = Image.open(input_path)
    
    # 如果圖片沒有透明通道，直接返回
    if img.mode != 'RGBA':
        print(f"  ⚠️  {input_path} 不是 RGBA 模式，跳過")
        return
    
    # 創建背景圖層
    bg = Image.new('RGB', img.size, hex_to_rgb(BACKGROUND_COLOR))
    
    # 將原圖貼到背景上（保留透明度作為遮罩）
    bg.paste(img, mask=img.split()[3])  # 使用 alpha 通道作為遮罩
    
    # 保存為 RGB 格式（無透明通道）
    bg.save(output_path, 'PNG')
    print(f"  ✅ {os.path.basename(output_path)} - 已添加背景")

def main():
    print("🎨 開始為 PWA 圖標添加背景...\n")
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(base_dir, 'public')
    
    # 需要處理的圖標（PWA 相關）
    icons = [
        'android-chrome-192x192.png',
        'android-chrome-512x512.png',
        'apple-touch-icon.png',
    ]
    
    for icon in icons:
        input_path = os.path.join(public_dir, icon)
        if os.path.exists(input_path):
            print(f"處理: {icon}")
            add_background(input_path, input_path)
        else:
            print(f"  ⚠️  文件不存在: {icon}")
    
    print("\n🎉 完成！所有 PWA 圖標現在都有高對比度背景了")
    print(f"   背景色: {BACKGROUND_COLOR}")
    if BACKGROUND_COLOR == WHITE_BG:
        print("   風格: 白色背景（高對比度，適合所有模式）")
    elif BACKGROUND_COLOR == DARK_BG:
        print("   風格: 深藍背景（品牌深色）")
    else:
        print("   風格: 品牌主藍色")

if __name__ == '__main__':
    main()

