# STC Font

The STC font is configured as the primary font for the entire application.

## Font Details

- **Name:** STC (Saudi Telecom Company Font)
- **Weights:** Regular (400), Bold (700)
- **Format:** TTF
- **Language Support:** Arabic and English

## Implementation

The font is loaded using Next.js `localFont` in `app/[locale]/layout.tsx` and applied globally to all pages.

### Usage in Components

The font is automatically applied to all text. You can also use it explicitly:

```tsx
<div className="font-sans">Text in STC</div>
<div className="font-bold">Bold text in STC</div>
<div style={{ fontFamily: 'var(--font-stc)' }}>Text in STC</div>
```

### CSS Variable

The font is available as a CSS variable:
- `--font-stc` - The STC font family

## Files

- `STC/STC-Regular.ttf` - TrueType Font Regular (400)
- `STC/STC-Bold.ttf` - TrueType Font Bold (700)
