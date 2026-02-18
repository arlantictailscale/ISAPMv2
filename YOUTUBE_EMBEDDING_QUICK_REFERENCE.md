# YouTube Embedding - Quick Reference Guide

## Is Your YouTube Video Not Showing? Follow This Checklist

### ✅ Step 1: Verify YouTube URL Format
```javascript
// ✅ CORRECT - YouTube embed URL
youtubeUrl: "https://www.youtube.com/embed/HPCteK3E6Fk?si=YgcMdeq-dRObSGBv"

// ❌ WRONG - Regular YouTube URL (won't work in iframe)
youtubeUrl: "https://www.youtube.com/watch?v=HPCteK3E6Fk"

// ❌ WRONG - Short URL
youtubeUrl: "https://youtu.be/HPCteK3E6Fk"

// How to convert:
// 1. Find video ID from any YouTube URL (the "v=" parameter or last part of short URL)
// 2. Use embed format: https://www.youtube.com/embed/VIDEO_ID
```

### ✅ Step 2: Check WebinarVideo Component Is Integrated
```typescript
// In /app/webinar/[slug]/page.tsx
import { WebinarVideo } from "@/components/webinar/webinar-video"

// Then in the JSX:
<WebinarVideo youtubeUrl={webinar.youtubeUrl} title={webinar.title} />
```

### ✅ Step 3: Verify Webinar Data Has YouTube URL
```typescript
// In /lib/data/webinars.ts
const webinar1: Webinar = {
  // ... other properties
  youtubeUrl: "https://www.youtube.com/embed/HPCteK3E6Fk?si=YgcMdeq-dRObSGBv",
  // ... rest of properties
}
```

### ✅ Step 4: Ensure WebinarVideo Component Has Correct Structure

**Critical Attributes:**
```jsx
<iframe
  src={youtubeUrl}                                    // ✅ Required: embed URL
  title={`${title} - Webinar Recording`}             // ✅ Required: descriptive title
  className="absolute top-0 left-0 w-full h-full border-0"  // ✅ Required: positioning
  allow="accelerometer autoplay clipboard-write encrypted-media gyroscope picture-in-picture web-share"  // ✅ Required: permissions
  referrerPolicy="strict-origin-when-cross-origin"   // ✅ Required: privacy policy
  allowFullScreen                                      // ✅ Required: fullscreen support
  loading="lazy"                                       // ✅ Recommended: performance
  data-testid="webinar-video-iframe"                 // ✅ Optional: testing
/>
```

### ✅ Step 5: Check Security Headers Configuration
```javascript
// In /next.config.mjs
// Verify these headers exist:

// Global CSP should allow YouTube:
"Content-Security-Policy": "... frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com ..."

// Webinar routes should allow iframes:
{
  source: "/webinar/:path*",
  headers: [{
    key: "X-Frame-Options",
    value: "ALLOWALL",
  }]
}
```

### ✅ Step 6: Browser Debugging Checklist

**Open DevTools Console (F12):**
- [ ] No CSP violations related to YouTube
- [ ] No "Refused to frame" errors
- [ ] No JavaScript errors on page

**Open DevTools Network tab:**
- [ ] Request to `www.youtube.com/embed/...` shows status 200
- [ ] YouTube's JavaScript files are loading

**Open DevTools Elements tab:**
- [ ] Find the iframe element
- [ ] Verify `src` attribute has correct URL
- [ ] Verify `allow` attribute is present

## Common Issues & Solutions

### Issue: Video Appears But Won't Play
**Solution:** Check if YouTube allows embedding
- Visit the YouTube video page directly
- Look for "Share" > "Embed" option
- Some videos have embedding disabled by uploader

### Issue: "Refused to frame" Error in Console
**Solution:** Headers are blocking YouTube
- Verify CSP headers in `next.config.mjs`
- Check `X-Frame-Options` header
- Clear browser cache and hard refresh

### Issue: Video Loads But No Controls
**Solution:** `allow` attribute missing or incomplete
- Verify `allow="accelerometer autoplay clipboard-write..."` is present
- Remove semicolons (use spaces instead)
- Add all required permissions listed above

### Issue: Black Box Where Video Should Be
**Solution:** 
1. Check if `youtubeUrl` is undefined in webinar data
2. Verify padding-bottom style is present: `style={{ paddingBottom: "56.25%" }}`
3. Check if parent container has `overflow: hidden`
4. Verify iframe has `position: absolute` positioning

### Issue: Mobile Responsive Not Working
**Solution:**
- Ensure parent div has: `position: relative`
- Ensure padding div has: `position: relative; paddingBottom: "56.25%"`
- Ensure iframe has: `position: absolute; top: 0; left: 0; width: 100%; height: 100%`

## URL Conversion Tool

```javascript
// Function to convert watch URLs to embed URLs
function convertYouTubeUrlToEmbed(url) {
  // Extract video ID from various URL formats
  let videoId;
  
  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  if (url.includes('watch?v=')) {
    videoId = url.split('watch?v=')[1].split('&')[0];
  }
  // Format: https://youtu.be/VIDEO_ID
  else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split('?')[0];
  }
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  return null;
}

// Usage:
const embedUrl = convertYouTubeUrlToEmbed("https://www.youtube.com/watch?v=HPCteK3E6Fk");
// Returns: "https://www.youtube.com/embed/HPCteK3E6Fk"
```

## Adding New Webinars with Videos

When creating a new webinar with YouTube video:

```typescript
const webinarNew: Webinar = {
  id: "webinar_new",
  slug: "my-webinar-slug",
  title: "My Webinar Title",
  shortTitle: "Short Title",
  description: "Description of webinar",
  date: "2026-02-20",
  time: "13:30",
  timezone: "WIB",
  duration: "1 hour",
  price: 100000,
  currency: "IDR",
  status: "active",  // Must be "active" to display with video
  
  // ✅ Add YouTube embed URL here
  youtubeUrl: "https://www.youtube.com/embed/VIDEO_ID",
  
  tags: ["tag1", "tag2"],
  speakers: [/* ... */],
  benefits: [/* ... */],
}

// Don't forget to add to WEBINARS array export
export const WEBINARS = [webinar1, webinar2, webinar3, webinarNew]
```

## Testing Without Real YouTube Video

To test the component without needing a real video:

```typescript
// Create a test embed URL (Public domain video)
const testYoutubeUrl = "https://www.youtube.com/embed/jNQXAC9IVRw"
// This is YouTube's own "Me at the zoo" video - always available

// Then pass to WebinarVideo:
<WebinarVideo youtubeUrl={testYoutubeUrl} title="Test Video" />
```

## Performance Tips

1. **Use `loading="lazy"`** - Defers iframe loading until user scrolls to it
2. **Optimize thumbnail images** - Use next/image for other images on page
3. **Cache headers** - Videos are cached by YouTube CDN
4. **Preload on hover** - Optional: add `onMouseEnter` to start loading early
5. **Consider playlist** - Use `?list=PLAYLIST_ID` to link related videos

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Latest versions fully support |
| Firefox | ✅ Full | Latest versions fully support |
| Safari | ✅ Full | iOS 15+ required for some features |
| Edge | ✅ Full | Chromium-based, full support |
| Internet Explorer | ❌ None | Not supported, no fixes available |
| Mobile Browsers | ✅ Full | Works on iOS and Android |

## Getting Help

If video still doesn't display after checking all steps:

1. **Check the Console** - Copy any error messages
2. **Clear Cache** - Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
3. **Test in Different Browser** - Isolate if it's browser-specific
4. **Check Network Tab** - See if YouTube requests are being blocked
5. **Review CSP Headers** - Look for security policy violations
