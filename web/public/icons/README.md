# PWA Icons

This folder should contain the PWA icons for the application.

## Required Icon Sizes

Generate the following icon sizes from your logo:

- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## How to Generate Icons

### Option 1: Using Online Tools
1. Visit https://realfavicongenerator.net/
2. Upload your logo (512x512 PNG recommended)
3. Download the generated icons
4. Place them in this folder

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick first
# Then run these commands with your source logo:

convert logo.png -resize 72x72 icon-72x72.png
convert logo.png -resize 96x96 icon-96x96.png
convert logo.png -resize 128x128 icon-128x128.png
convert logo.png -resize 144x144 icon-144x144.png
convert logo.png -resize 152x152 icon-152x152.png
convert logo.png -resize 192x192 icon-192x192.png
convert logo.png -resize 384x384 icon-384x384.png
convert logo.png -resize 512x512 icon-512x512.png
```

### Option 3: Using PWA Asset Generator
```bash
npx pwa-asset-generator logo.png ./public/icons --icon-only --padding "10%"
```

## Notes
- Icons should have a transparent background or solid color
- Use PNG format for best compatibility
- Recommended: Use a square logo (1:1 aspect ratio)
- The manifest.json file references these icons
