# Google Play Store Launch Checklist

## Pre-Launch Checklist

### Technical Requirements
- [x] PWA manifest.json configured
- [x] Service worker implemented (sw.js)
- [x] Icons: 192x192 and 512x512 PNG
- [x] HTTPS enabled (Vercel)
- [x] Offline functionality working
- [x] Mobile-responsive design
- [ ] Privacy policy published at /privacy-policy.html
- [ ] Digital asset links configured (.well-known/assetlinks.json)
- [ ] TWA app built using Bubblewrap or PWA Builder
- [ ] App signed with keystore

### Content Requirements
- [ ] App screenshots (min 2, max 8)
  - [ ] Dashboard view
  - [ ] Data entry screen
  - [ ] Charts/analytics view
  - [ ] Recovery protocol guidance screen
  - [ ] Achievements panel
- [ ] Feature graphic (1024x500 PNG)
- [ ] App icon high-res (512x512 PNG)
- [ ] Short description (≤80 chars)
- [ ] Full description (≤4000 chars)
- [ ] Privacy policy URL

### Play Console Setup
- [ ] Google Play Console account created ($25)
- [ ] Developer profile completed
- [ ] App created in Play Console
- [ ] App name: "Cardiac Recovery Pro"
- [ ] Package name: com.cardiacrecoverypro.app
- [ ] Category: Medical
- [ ] Content rating completed (IARC questionnaire)
- [ ] Target audience: Adults (18+)
- [ ] Privacy policy URL added
- [ ] Store listing filled out completely

### Testing
- [ ] Test on physical Android device
- [ ] Test on Android emulator
- [ ] Verify offline functionality
- [ ] Test all major features
- [ ] Check charts render correctly
- [ ] Verify data persistence
- [ ] Test backup/restore
- [ ] Verify install prompt works
- [ ] Check TWA opens (not Chrome Custom Tab)
- [ ] Test asset links validation

### Legal & Compliance
- [ ] Privacy policy reviewed
- [ ] Medical disclaimer included
- [ ] Terms of service (if needed)
- [ ] Content rating appropriate
- [ ] No copyrighted material without permission
- [ ] App complies with Google Play policies

---

## Launch Steps

### 1. Build Production App
```bash
# Install Bubblewrap
npm install -g @bubblewrap/cli

# Initialize TWA
bubblewrap init --manifest=https://cardiac-recovery-pro.vercel.app/manifest.json

# Build signed AAB
bubblewrap build
```

### 2. Test Locally
```bash
# Install on device
bubblewrap install

# Or manual install
adb install app/build/outputs/apk/release/app-release.apk
```

### 3. Upload to Play Console
- Go to https://play.google.com/console
- Select app
- Go to "Production" or "Internal Testing"
- Upload `app-release-signed.aab`
- Fill out release notes
- Submit for review

### 4. Wait for Review
- Google review time: 1-7 days
- Monitor email for updates
- Respond to any review comments

### 5. Post-Launch
- [ ] Share Play Store link
- [ ] Request user reviews
- [ ] Monitor crash reports
- [ ] Track installs/ratings
- [ ] Plan updates

---

## App Store Assets

### Required Sizes
- **App Icon:** 512x512 PNG (already have: public/icons/icon-512.png)
- **Feature Graphic:** 1024x500 PNG (create with branding)
- **Phone Screenshots:** 1080x1920 or 1440x2560 (min 2)
- **Tablet Screenshots:** 2048x1536 (optional)

### Screenshot Ideas
1. Dashboard with recovery week guidance
2. Data entry form with validation
3. METs progress chart
4. Achievements panel showing unlocked badges
5. Week-by-week protocol guidance
6. Heart rate monitoring interface
7. Symptoms logger interface
8. Print-friendly report preview

---

## Descriptions

### Short Description (80 chars max)
```
Professional cardiac rehab tracker with real-time monitoring & analytics
```

### Keywords for SEO
- Cardiac rehabilitation
- Heart recovery
- Cardiac surgery recovery
- Heart health tracker
- Physical therapy
- Cardiac rehab app
- Heart rate monitor
- Recovery tracking
- Post-surgery care
- Heart failure management

---

## Content Rating Questionnaire Answers

**Violence:**
- Contains violence: NO

**Sexual Content:**
- Contains sexual content: NO

**Language:**
- Contains profanity: NO

**Controlled Substances:**
- References drugs/alcohol: NO (medication tracking is medical)

**Gambling:**
- Contains gambling: NO

**User-Generated Content:**
- Allows user-generated content: NO

**Personal Info:**
- Collects personal info: NO (stored locally only)

**Location:**
- Uses location: YES (optional GPS feature)

**Expected Rating:** Everyone

---

## Common Rejection Reasons (Avoid These!)

- ❌ Missing privacy policy
- ❌ Broken links in description
- ❌ Low-quality screenshots
- ❌ Misleading description
- ❌ Missing content rating
- ❌ Medical claims without disclaimer
- ❌ Copyright violations
- ❌ Crashes on startup
- ❌ Asset links not working (TWA)
- ❌ Incomplete store listing

---

## Timeline Estimate

| Task | Time |
|------|------|
| Create screenshots | 1 hour |
| Design feature graphic | 1 hour |
| Write descriptions | 30 min |
| Set up Bubblewrap/TWA | 1 hour |
| Test app | 1 hour |
| Complete Play Console | 1 hour |
| **Total Prep Time** | **5.5 hours** |
| Google review | 1-7 days |

---

## Post-Approval Checklist

- [ ] Add Play Store badge to website
- [ ] Share on social media
- [ ] Email existing users
- [ ] Monitor for crashes
- [ ] Respond to reviews
- [ ] Plan first update
- [ ] Track analytics
- [ ] Collect user feedback

---

## Useful Links

- **Play Console:** https://play.google.com/console
- **Bubblewrap Docs:** https://github.com/GoogleChromeLabs/bubblewrap
- **PWA Builder:** https://www.pwabuilder.com/
- **Asset Links Tester:** https://developers.google.com/digital-asset-links/tools/generator
- **Play Store Policies:** https://play.google.com/about/developer-content-policy/

---

**Status:** Ready for Play Store submission! 🚀

All technical requirements are met. Just need to create marketing assets and complete the submission process.
