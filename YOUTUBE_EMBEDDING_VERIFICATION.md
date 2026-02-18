# YouTube Embedding - Verification & Testing Checklist

## Pre-Testing Setup

- [ ] Ensure you've pulled the latest code changes
- [ ] Run `npm run build` to rebuild with new config
- [ ] Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- [ ] Test in private/incognito window first (no extensions)
- [ ] Have multiple browsers ready (Chrome, Firefox, Safari)

---

## Files Changed - Quick Verification

### ✅ 1. `/components/webinar/webinar-video.tsx`

**Check these lines:**
```javascript
// Line ~37: Should have inline style with paddingBottom
style={{ paddingBottom: "56.25%" }}

// Line ~39: Should have updated className
className="absolute top-0 left-0 w-full h-full border-0"

// Line ~42: Should have correct allow attribute (spaces, no semicolons)
allow="accelerometer autoplay clipboard-write encrypted-media gyroscope picture-in-picture web-share"

// Line ~47: Should have loading="lazy"
loading="lazy"

// Line ~48: Should have data-testid
data-testid="webinar-video-iframe"
```

**Verification Commands:**
```bash
# Check file exists
ls -la components/webinar/webinar-video.tsx

# View specific lines
sed -n '37,50p' components/webinar/webinar-video.tsx

# Search for key changes
grep -n "paddingBottom\|top-0 left-0\|loading=\"lazy\"" components/webinar/webinar-video.tsx
```

### ✅ 2. `/next.config.mjs`

**Check these sections:**

A. **CSP Header (around line 40-50):**
```javascript
{
  key: "Content-Security-Policy",
  value: "frame-ancestors 'self' https:; frame-src 'self' https://www.youtube.com..."
}
```

B. **Webinar Route-Specific Headers (around line 70-82):**
```javascript
{
  source: "/webinar/:path*",
  headers: [{
    key: "X-Frame-Options",
    value: "ALLOWALL"
  }]
}
```

**Verification Commands:**
```bash
# Check file exists
ls -la next.config.mjs

# Search for CSP header
grep -n "Content-Security-Policy" next.config.mjs

# Search for webinar route
grep -n "webinar" next.config.mjs

# Search for ALLOWALL
grep -n "ALLOWALL" next.config.mjs
```

### ✅ 3. `/lib/data/webinars.ts`

**Check webinar1 has youtubeUrl:**
```javascript
const webinar1: Webinar = {
  // ...
  youtubeUrl: "https://www.youtube.com/embed/HPCteK3E6Fk?si=YgcMdeq-dRObSGBv",
  // ...
}
```

**Verification Commands:**
```bash
# Check youtubeUrl exists
grep -n "youtubeUrl" lib/data/webinars.ts

# Show the actual URL for webinar1
grep -A 2 "status: \"active\"" lib/data/webinars.ts | grep -i youtube
```

---

## Functional Testing

### Test 1: Basic Video Display

**Steps:**
1. Navigate to `http://localhost:3000/webinar/equity-pain-management`
2. Scroll down to "Webinar Recording" section

**Expected Result:**
- [ ] Section header appears with play icon
- [ ] Black video container visible
- [ ] YouTube player visible inside container
- [ ] No blank/black boxes with no content

**Failure Diagnosis:**
```
If you see:
❌ Blank black box
   → Check if youtubeUrl is set in webinar data
   → Check browser console for CSP errors
   
❌ 404 Not Found error
   → Check youtubeUrl format (must be /embed/ not /watch?)
   
❌ Video is blocked/not available
   → Check if you're in a region where video is available
   → Try with different test video ID
```

### Test 2: Video Player Controls

**Steps:**
1. Hover over the video
2. Check for player controls

**Expected Controls:**
- [ ] Play/pause button appears
- [ ] Timeline scrubber bar visible
- [ ] Fullscreen button visible (⛶ icon)
- [ ] Volume control visible
- [ ] Video title visible
- [ ] Share button visible

**Failure Diagnosis:**
```
If controls missing:
❌ Check iframe allow attribute in DevTools
   → Right-click iframe → Inspect
   → Look for: allow="accelerometer autoplay clipboard-write..."
   
❌ Check if JavaScript is enabled in browser

❌ Look for JavaScript errors in console
   → Open DevTools (F12) → Console tab
```

### Test 3: Playback Functionality

**Steps:**
1. Click play button
2. Wait for video to load
3. Click pause
4. Drag timeline scrubber

**Expected Behavior:**
- [ ] Video starts playing when play clicked
- [ ] Sound plays (if system has audio)
- [ ] Video pauses when pause clicked
- [ ] Timeline updates as video plays
- [ ] Can seek to different positions in video

**Failure Diagnosis:**
```
If video won't play:
❌ Check YouTube video ID is valid
   → Visit https://www.youtube.com/watch?v=HPCteK3E6Fk in browser
   → Verify video is available
   → Check if video allows embedding

❌ Check browser has Flash/media permissions
   → Some browsers block media without user interaction
   → Click play first, then check

❌ Check if region-restricted
   → Some videos only available in certain countries
   → Use test video: jNQXAC9IVRw
```

### Test 4: Fullscreen Functionality

**Steps:**
1. Click fullscreen button (⛶)
2. Video should expand to fullscreen
3. Press Esc to exit fullscreen

**Expected Behavior:**
- [ ] Video goes to fullscreen
- [ ] Controls still visible in fullscreen
- [ ] Esc key exits fullscreen
- [ ] No errors in console

**Failure Diagnosis:**
```
If fullscreen doesn't work:
❌ Check allowFullScreen attribute in iframe
   → Should be: allowFullScreen (no "=" or quotes in HTML)
   
❌ Check CSP script-src policy
   → Might be blocking fullscreen API

❌ Check browser permissions
   → Some browsers require user interaction first
```

### Test 5: Responsive Design (Mobile/Tablet)

**Steps Using Chrome DevTools:**
1. Open DevTools (F12)
2. Click mobile icon (or Ctrl+Shift+M)
3. Select iPhone 12 device
4. Scroll to video section
5. Check video appearance

**Expected Behavior at Each Breakpoint:**
- [ ] **Mobile (375px)**: Video shows, height ~211px, no distortion
- [ ] **Tablet (768px)**: Video shows, height ~432px, maintains aspect ratio
- [ ] **Desktop (1920px)**: Video shows, height ~1080px, no stretching
- [ ] **Portrait mode**: Video responsive to width changes
- [ ] **Landscape mode**: Video maintains 16:9 ratio

**Failure Diagnosis:**
```
If video distorts on mobile:
❌ Check paddingBottom style
   → Should be: style={{ paddingBottom: "56.25%" }}
   → Must be inline style, not Tailwind class

❌ Check parent container width
   → Parent should be 100% of viewport width
   
❌ Check no fixed heights on containers
   → Heights should never be fixed when using aspect ratio padding
```

**Testing with Real Devices:**
1. Test on actual iPhone (Safari)
2. Test on actual Android (Chrome)
3. Check video doesn't crop or stretch
4. Verify controls work with touch

---

## Browser Compatibility Testing

### Chrome/Edge (Desktop)
```
Steps:
1. Open Chrome/Edge
2. Navigate to /webinar/equity-pain-management
3. Check video appears and plays

Results:
□ Video displays: ___________________
□ Controls visible: ___________________
□ Plays without errors: ___________________
□ Responsive on resize: ___________________
```

### Firefox (Desktop)
```
Steps:
1. Open Firefox
2. Navigate to /webinar/equity-pain-management
3. Check video appears and plays

Results:
□ Video displays: ___________________
□ Controls visible: ___________________
□ Plays without errors: ___________________
□ Fullscreen works: ___________________
```

### Safari (Mac/iOS)
```
Steps:
1. Open Safari
2. Navigate to /webinar/equity-pain-management
3. Check video appears and plays

Results:
□ Video displays: ___________________
□ Controls visible: ___________________
□ Plays without errors: ___________________
□ iOS responsive: ___________________
```

### Mobile Browsers
```
iOS Safari:
□ Video loads: ___________________
□ Touch controls work: ___________________
□ Fullscreen available: ___________________

Android Chrome:
□ Video loads: ___________________
□ Touch controls work: ___________________
□ Fullscreen available: ___________________
```

---

## Console & Network Verification

### DevTools Console Check

**Open DevTools (F12) → Console tab**

**Errors to look for (should NOT see any of these):**

❌ **CSP Violation Errors:**
```
Refused to frame 'https://www.youtube.com/embed/...' because 
an ancestor violates the following Content Security Policy directive: 
"frame-src 'self'".
```
✅ **Fix**: Verify CSP in next.config.mjs allows youtube.com

---

❌ **X-Frame-Options Errors:**
```
Refused to load the page because an X-Frame-Options header was present.
```
✅ **Fix**: Verify X-Frame-Options is ALLOWALL for /webinar routes

---

❌ **JavaScript Errors:**
```
YouTube player error: Video unavailable
Uncaught ReferenceError: YT is not defined
```
✅ **Fix**: Check CSP script-src allows YouTube scripts

---

❌ **CORS Errors:**
```
Cross-Origin Request Blocked
```
✅ **Fix**: Should not appear - YouTube CORS headers are correct

---

**Should see in console:**
```
✅ No errors related to YouTube or embedding
✅ Video ID loaded successfully
✅ Player initialized
```

### DevTools Network Check

**Open DevTools (F12) → Network tab**

**Look for these successful requests:**

1. **Main page:**
   ```
   Status: 200 OK
   URL: .../equity-pain-management
   Type: document
   ```

2. **YouTube iframe:**
   ```
   Status: 200 OK
   URL: https://www.youtube.com/embed/HPCteK3E6Fk...
   Type: iframe
   Size: ~50-100KB
   ```

3. **YouTube player script:**
   ```
   Status: 200 OK
   URL: https://www.youtube.com/s/player/.../base.js
   Type: script
   Size: ~100-200KB
   ```

4. **YouTube assets:**
   ```
   Status: 200 OK
   URL: https://s.ytimg.com/... (images, stylesheets)
   Type: image/stylesheet
   ```

**Failure Diagnosis:**

```
If YouTube requests show 403 (Forbidden):
❌ CSP headers are too restrictive
❌ CORS headers blocking access
❌ Check network security policies

If YouTube requests show 404 (Not Found):
❌ YouTube video ID is invalid
❌ Video has been deleted
❌ Video is not available in your region

If YouTube requests don't appear at all:
❌ iframe src URL is wrong format
❌ CSP is blocking before request even made
❌ Browser has JavaScript disabled
```

### DevTools Elements/Inspector Check

**Right-click on video → Inspect Element**

**Verify this structure:**

```html
<div class="relative w-full" style="paddingBottom: 56.25%">
  <iframe
    class="absolute top-0 left-0 w-full h-full border-0"
    src="https://www.youtube.com/embed/HPCteK3E6Fk?si=YgcMdeq-dRObSGBv"
    title="Achieving Equity in Pain Management Services... - Webinar Recording"
    allow="accelerometer autoplay clipboard-write encrypted-media gyroscope picture-in-picture web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen=""
    loading="lazy"
    data-testid="webinar-video-iframe"
  ></iframe>
</div>
```

**Check these specific attributes:**
- [ ] `src` starts with `https://www.youtube.com/embed/`
- [ ] `allow` contains all required permissions (spaces, no semicolons)
- [ ] `loading="lazy"` is present
- [ ] `allowfullscreen` is present
- [ ] `style="paddingBottom: 56.25%"` is on parent div

---

## Security Headers Verification

### Using Browser DevTools

**Open DevTools → Network tab → click on page request → Headers tab**

**Look for Response Headers:**

```
X-Frame-Options: ALLOWALL
Content-Security-Policy: frame-ancestors 'self' https:; frame-src 'self' https://www.youtube.com ...
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### Using curl Command Line

```bash
curl -I https://isapm2026.org/webinar/equity-pain-management 2>/dev/null | grep -i "x-frame\|content-security"
```

**Expected Output:**
```
x-frame-options: ALLOWALL
content-security-policy: frame-ancestors 'self' https:; frame-src...
```

### Using Online Tools

Visit: https://securityheaders.com
Enter: https://isapm2026.org

**Look for:**
- ✅ X-Frame-Options: ALLOWALL (Grade A for webinar routes)
- ✅ Content-Security-Policy: Contains youtube.com in frame-src
- ✅ No warnings about frame embedding

---

## Performance Testing

### Page Load Time
```
Open DevTools → Performance tab
1. Press Record
2. Navigate to /webinar/equity-pain-management
3. Scroll to video section
4. Press Stop

Check metrics:
□ First Contentful Paint: < 2s
□ Largest Contentful Paint: < 3s
□ Cumulative Layout Shift: < 0.1
□ Time to Interactive: < 4s

Video-specific:
□ iframe loading deferred (not in critical path)
□ Video doesn't block page rendering
□ No layout shift when video loads
```

### Network Performance
```
DevTools → Network tab → throttle to "Slow 3G"

Check:
□ Page loads in < 10s
□ Video controls appear < 5s after visibility
□ No timeout errors

Note: Video playback will be slow on 3G (expected)
```

---

## Final Sign-Off Checklist

Before considering the fix complete:

### Core Functionality
- [ ] Video appears on `/webinar/equity-pain-management`
- [ ] Play button works
- [ ] Fullscreen button works
- [ ] Timeline scrubber works
- [ ] Video sound plays

### Responsive Design
- [ ] Mobile (375px) - video responsive
- [ ] Tablet (768px) - video responsive
- [ ] Desktop (1920px) - video responsive
- [ ] Aspect ratio maintained at all sizes
- [ ] No black bars or stretching

### Browser Support
- [ ] Chrome/Chromium - works
- [ ] Firefox - works
- [ ] Safari (Mac) - works
- [ ] Safari (iOS) - works
- [ ] Chrome (Android) - works

### Security
- [ ] No CSP violation errors in console
- [ ] No X-Frame-Options errors
- [ ] No CORS errors
- [ ] Headers correctly configured

### Code Quality
- [ ] All files properly updated
- [ ] No console errors or warnings
- [ ] No commented-out debug code
- [ ] Consistent code formatting

### Documentation
- [ ] YouTube embedding guide created
- [ ] Quick reference guide available
- [ ] Architecture diagrams documented
- [ ] Troubleshooting guide complete

---

## Regression Testing

Make sure changes didn't break anything else:

- [ ] Other webinar routes still work
- [ ] Webinar without youtubeUrl shows no error
- [ ] Navigation works throughout site
- [ ] Speakers section still displays
- [ ] Registration section still works
- [ ] Footer still displays
- [ ] Mobile menu still functions

---

## Sign-Off

**All tests completed:** _____________________ (Date)

**Tested by:** _____________________

**Result:** 
- [ ] ✅ All tests passed - YouTube embedding working perfectly
- [ ] ⚠️ Some tests failed - see notes below
- [ ] ❌ Major issues - needs further investigation

**Notes:**
```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

## Support & Next Steps

If any tests failed, refer to:
- `/YOUTUBE_EMBEDDING_TROUBLESHOOTING.md` - Detailed solutions
- `/YOUTUBE_EMBEDDING_QUICK_REFERENCE.md` - Quick lookup guide
- `/YOUTUBE_EMBEDDING_SOLUTION_SUMMARY.md` - Complete overview
- `/YOUTUBE_EMBEDDING_ARCHITECTURE.md` - Architecture details

For new webinars, follow the "Adding New Webinars" section in the quick reference guide.
