# VaultKeep - PWA Installation Guide

VaultKeep is now a Progressive Web App (PWA) that can be installed on your device for a native app-like experience!

## Features

### 📱 Install as Native App
- Install VaultKeep on your phone, tablet, or desktop
- Works offline with cached content
- Full-screen experience without browser UI
- Faster loading times

### 🔗 Native Share Integration
- Share documents directly via WhatsApp, Telegram, Facebook, etc.
- Use your device's native share menu
- Copy links with one tap
- Share to any app installed on your device

### 🚀 Progressive Enhancement
- Works on all devices and browsers
- Automatic updates when online
- Offline support for viewing cached content
- Responsive design for all screen sizes

## Installation Instructions

### On Android (Chrome/Edge)

1. Open VaultKeep in Chrome or Edge browser
2. Tap the three-dot menu (⋮) in the top-right corner
3. Select "Install app" or "Add to Home screen"
4. Follow the prompts to install
5. The app icon will appear on your home screen

Alternative Method:
- Look for the install banner at the bottom of the screen
- Tap "Install" when prompted

### On iOS (Safari)

1. Open VaultKeep in Safari browser
2. Tap the Share button (□ with arrow pointing up)
3. Scroll down and tap "Add to Home Screen"
4. Edit the name if desired
5. Tap "Add" in the top-right corner
6. The app icon will appear on your home screen

### On Desktop (Chrome/Edge)

1. Open VaultKeep in Chrome or Edge
2. Look for the install icon (⊕) in the address bar
3. Click the icon and select "Install"
4. The app will open in its own window
5. Pin to taskbar for quick access

Alternative Method:
- Click the three-dot menu (⋮)
- Select "Install VaultKeep" or "Create shortcut"
- Check "Open as window" for app-like experience

## Using Native Share

### Sharing Documents

1. Open any document in VaultKeep
2. Click the Share button (green icon)
3. Click "Share via Social Media" button
4. Choose your preferred app from the share menu:
   - WhatsApp
   - Telegram
   - Facebook Messenger
   - Email
   - SMS
   - And many more!

### What Happens When You Share

- Recipients receive a secure link to the document
- No login required for recipients
- Links expire after 30 days for security
- You can revoke access anytime

### Share Link Features

- Copy Link: Copy the share URL to clipboard
- Native Share: Share via any app on your device
- Revoke Access: Remove the share link immediately
- Expiration: Links auto-expire after 30 days

## Benefits of PWA

### For Users
- ✅ Install like a native app
- ✅ No app store required
- ✅ Instant updates without reinstalling
- ✅ Works offline (cached content)
- ✅ Smaller size than native apps
- ✅ Access from any device

### For Sharing
- ✅ Native share menu integration
- ✅ Share to any social media app
- ✅ One-tap sharing
- ✅ Cross-platform compatibility
- ✅ Secure, temporary links

## Technical Features

### Service Worker
- Caches app shell for offline access
- Background sync for uploads (when implemented)
- Push notifications support (future feature)

### Web Share API
- Native OS share dialog
- Access to all installed apps
- Automatic fallback to copy-to-clipboard
- Platform-specific optimizations

### Manifest Features
- Custom app icon and splash screen
- Theme color matching
- Standalone display mode
- Portrait orientation on mobile
- Quick actions from app icon (Dashboard shortcut)

## Troubleshooting

### App Won't Install
- Ensure you're using a supported browser (Chrome, Edge, Safari)
- Check that you have an internet connection
- Try clearing browser cache and reload
- Make sure you're accessing via HTTPS (required for PWA)

### Share Button Not Working
- Native share requires HTTPS
- Check browser permissions for clipboard access
- Some browsers may not support Web Share API (fallback to copy)
- Ensure you're not in incognito/private mode

### Offline Mode Not Working
- Visit the app at least once while online
- Ensure service worker is registered (check console)
- Clear cache and re-cache by visiting app online

## Browser Support

| Feature | Chrome | Edge | Safari | Firefox |
|---------|--------|------|--------|---------|
| Install | ✅ | ✅ | ✅ | ⚠️ |
| Web Share | ✅ | ✅ | ✅ | ❌ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Offline | ✅ | ✅ | ✅ | ✅ |

Note: Firefox supports PWAs on Android but has limited desktop support. Web Share falls back to copy-to-clipboard on unsupported browsers.

## Privacy & Security

- Share links expire after 30 days
- Links can be revoked anytime
- No tracking or analytics in PWA
- All data stored locally (service worker cache)
- Secure HTTPS required for all features

## Updates

VaultKeep automatically updates when you're online:
1. Service worker checks for updates on each visit
2. New version downloads in background
3. Updates apply on next app restart
4. No manual update needed!

---

Need Help? Contact support or file an issue on GitHub.

Pro Tip: For the best experience, install VaultKeep on all your devices and sync your folders across them!
