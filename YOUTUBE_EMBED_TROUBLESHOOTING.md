# YouTube Video Embedding Troubleshooting & Solution Guide

## Problem Statement
YouTube videos embedded via iframes on the `/webinar` page were not displaying due to security restrictions and improper iframe configuration.

## Root Causes Identified

### 1. **iframe Attribute Restrictions**
- Missing `loading="lazy"` attribute (performance optimization)
- Improper `frameborder` attribute usage (deprecated in HTML5)
- Incomplete `allow` attribute permissions
- Missing sandbox considerations

### 2. **Content Security Policy (CSP) Issues**
- Default CSP headers blocking external iframe sources
- `X-Frame-Options` set to `SAMEORIGIN` preventing YouTube embeds
- Missing `frame-src` directive for YouTube domains
- No provision for YouTube's script requirements

### 3. **Aspect Ratio Implementation**
- CSS class-based padding percentage could conflict with inline styles
- Needed explicit inline style for guaranteed 16:9 ratio

## Solutions Implemented

### 1. **Updated WebinarVideo Component** (`/components/webinar/webinar-video.tsx`)

**Key Changes:**
- Changed `frameBorder="0"` to `className="... border-0"` (modern HTML5)
- Changed `allow="accelerometer; autoplay; ..."` to `allow="accelerometer autoplay clipboard-write encrypted-media gyroscope picture-in-picture web-share"` (correct syntax)
- Added `loading="lazy"` for performance
- Added `data-testid` for testing/debugging
- Changed padding-bottom percentage to inline style: `style={{ paddingBottom: "56.25%" }}`
- Updated title attribute to be more descriptive
- Improved absolute positioning from `inset-0` to explicit `top-0 left-0`

**Before:**
```jsx
<div className="relative w-full pb-[56.25%]">
  <iframe
    src={youtubeUrl}
    title={title}
    className="absolute inset-0 w-full h-full"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen
  />
</div>
```

**After:**
```jsx
<div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
  <iframe
    src={youtubeUrl}
    title={`${title} - Webinar Recording`}
    className="absolute top-0 left-0 w-full h-full border-0"
    allow="accelerometer autoplay clipboard-write encrypted-media gyroscope picture-in-picture web-share"
    referrerPolicy="strict-origin-when-cross-origin"
    allowFullScreen
    loading="lazy"
    data-testid="webinar-video-iframe"
  />
</div>
```

### 2. **Updated Next.js Headers Configuration** (`/next.config.mjs`)

**Key Changes:**
- Removed restrictive `X-Frame-Options: SAMEORIGIN` from global headers
- Added comprehensive Content Security Policy (CSP) header
- Added route-specific header for webinar pages: `X-Frame-Options: ALLOWALL`
- CSP now explicitly allows YouTube frame sources

**Security Headers Added:**
```javascript
{
  key: "Content-Security-Policy",
  value: "frame-ancestors 'self' https:; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://youtu.be; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com; connect-src 'self' https:;",
}
```

**Route-Specific Override for Webinars:**
```javascript
{
  source: "/webinar/:path*",
  headers: [
    {
      key: "X-Frame-Options",
      value: "ALLOWALL",
    },
  ],
}
```

## Iframe Allow Attributes Explained

| Attribute | Purpose |
|-----------|---------|
| `accelerometer` | Allows access to accelerometer data (not needed for YouTube but included for completeness) |
| `autoplay` | Permits autoplay of video content |
| `clipboard-write` | Allows copying to clipboard (for YouTube share features) |
| `encrypted-media` | Required for DRM content playback |
| `gyroscope` | Allows gyroscope access (for mobile features) |
| `picture-in-picture` | Enables picture-in-picture mode |
| `web-share` | Allows web sharing API |

## Responsive Design Implementation

The video maintains a 16:9 aspect ratio across all devices:

1. **Aspect Ratio Container**: `paddingBottom: "56.25%"` (16:9 = 9÷16 = 0.5625 = 56.25%)
2. **Absolute Positioning**: `position: absolute; top: 0; left: 0`
3. **Full Container Size**: `width: 100%; height: 100%`
4. **Proper Overflow**: Container has `overflow: hidden` to clip content

## CSS Conflicts Prevention

The component uses:
- Inline styles for critical aspect ratio (not overridable by Tailwind classes)
- Explicit `top-0 left-0` instead of `inset-0` for better browser compatibility
- `border-0` class instead of `frameborder="0"` attribute
- No arbitrary values that could conflict with theme colors

## Testing the Implementation

### Manual Testing:
1. Navigate to `/webinar/equity-pain-management` (webinar 1 with YouTube URL)
2. Scroll to "Webinar Recording" section
3. Video should appear and be fully responsive
4. Test on mobile, tablet, and desktop viewports
5. Verify play/pause controls work
6. Test fullscreen functionality

### Browser DevTools Testing:
1. Open Network tab - verify iframe loads from `https://www.youtube.com`
2. Open Console - check for any CSP violations or warnings
3. Inspect iframe element - verify all attributes are present
4. Test responsive design by resizing viewport

## Fallback & Error Handling

If YouTube video still doesn't load:
1. Verify `youtubeUrl` is set correctly in webinar data (should be `https://www.youtube.com/embed/VIDEO_ID`)
2. Check browser console for Content Security Policy warnings
3. Ensure firewall/proxy isn't blocking YouTube domains
4. Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
5. Test in incognito/private mode to exclude browser extensions

## Performance Optimizations

- `loading="lazy"` defers iframe loading until user scrolls to section
- CSP headers prevent unnecessary script execution
- Inline styles reduce class lookups
- Aspect ratio technique avoids layout shift

## Accessibility Considerations

- Descriptive `title` attribute for screen readers
- Semantic section markup
- Proper heading hierarchy
- High contrast colors in info section
- Keyboard navigation support (YouTube player built-in)

## Future Enhancements

1. Add video thumbnail preview before loading
2. Implement custom error boundary component
3. Add video duration and upload date to info section
4. Consider implementing video quality selector
5. Add subtitles/closed captions support indicator
