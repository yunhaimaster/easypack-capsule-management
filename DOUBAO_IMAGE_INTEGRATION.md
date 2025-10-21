# Doubao SeeDream Image Generation Integration

## Overview

The marketing assistant's image generation feature has been migrated from Google Gemini 2.5 Flash to **ByteDance Doubao SeeDream 4.0** model for enhanced image quality and capabilities.

## Changes Made

### 1. API Endpoint Updated
- **File**: `src/app/api/ai/packaging-image/route.ts`
- **Previous Model**: `google/gemini-2.5-flash-image` (via OpenRouter)
- **New Model**: `doubao-seedream-4-0-250828` (via Doubao API)

### 2. API Configuration
- **API URL**: `https://ark.cn-beijing.volces.com/api/v3/images/generations`
- **API Key**: `469fb1c5-8cd2-4c80-8375-e5f8ca3d91aa`
- **Key Name**: `api-key-20251021104228`

### 3. New Features
- **Size Mapping**: Automatically maps requested dimensions to Doubao formats (1K, 2K, 4K)
- **Watermark Control**: Disabled by default for professional packaging images
- **Enhanced Logging**: Better error tracking and debug information

## Environment Variables

Add to your `.env.local` file (optional, has fallback):

```bash
# Doubao SeeDream API Key (for image generation)
DOUBAO_API_KEY="469fb1c5-8cd2-4c80-8375-e5f8ca3d91aa"
```

**Note**: If not set, the system will use the hardcoded fallback key.

## API Request Format

Based on [SeeDream 4.0 official documentation](https://www.volcengine.com/docs/82379/1541523):

```json
{
  "model": "doubao-seedream-4-0-250828",
  "prompt": "Generate a professional packaging render...",
  "aspect_ratio": "1:1",
  "size": "2K",
  "response_format": "url",
  "seed": 123456,
  "num_inference_steps": 50,
  "guidance_scale": 7.5,
  "watermark": false,
  "stream": false
}
```

### Parameter Explanation

- **aspect_ratio**: `"1:1"` - Forces square images for packaging (1024x1024, 2048x2048, etc.)
- **size**: `"1K"`, `"2K"`, or `"4K"` - Quality level
- **num_inference_steps**: `50` - Higher = better quality (default: 20-50)
- **guidance_scale**: `7.5` - Balance between creativity and accuracy (default: 7-8)
- **seed**: Random number for variation between generations
- **watermark**: `false` - Professional output without watermark

## Supported Configurations

### Aspect Ratios (SeeDream 4.0)
- **1:1** - Square (recommended for packaging)
- **2:3** - Portrait
- **3:2** - Landscape
- **9:16** - Vertical
- **16:9** - Horizontal

**Current Setting**: All images forced to **1:1** for consistent packaging design.

### Quality Levels

| Requested Size | Output Format | Resolution |
|----------------|---------------|------------|
| ≤ 1024px       | 1K            | 1024x1024  |
| ≤ 2048px       | 2K            | 2048x2048  |
| > 2048px       | 4K            | 4096x4096  |

**Current Default**: 1K (1024x1024) for fast generation

## Usage in Marketing Assistant

The image generation is automatically triggered after marketing analysis completes:

1. User inputs ingredients
2. AI analyzes and generates marketing content
3. System extracts 4 image prompts from analysis:
   - 實拍瓶身 (Product Bottle)
   - 生活情境 (Lifestyle Scene)
   - 平鋪俯拍 (Flat Lay)
   - 香港製造 (Made in Hong Kong)
4. Each prompt is sent to Doubao API sequentially
5. Generated images are displayed in gallery

## Error Handling

The implementation includes robust error handling:

- API key validation
- Request timeout handling
- Response format validation
- Detailed error logging
- User-friendly error messages

## Testing

To test the integration:

1. Navigate to Marketing Assistant page
2. Input ingredient formula
3. Click "開始行銷分析"
4. Wait for analysis to complete
5. Images will auto-generate and display in gallery

## Rollback Plan

If you need to revert to the previous Gemini model:

1. Restore the previous version of `src/app/api/ai/packaging-image/route.ts`
2. Remove `DOUBAO_API_KEY` from environment variables
3. Rebuild the application

## Additional Notes

- The API key has a fallback mechanism for backwards compatibility
- The system automatically handles rate limiting and retries
- Images are generated sequentially with 1-second delays to avoid overwhelming the API
- Watermarks are disabled for professional-looking packaging renders

## References

- Doubao API Documentation: https://ark.cn-beijing.volces.com/
- Marketing Assistant Page: `src/app/marketing-assistant/page.tsx`
- Image Gallery Component: `src/components/marketing/auto-image-gallery.tsx`

---

**Last Updated**: 2025-10-21  
**Integration Status**: ✅ Complete and tested

