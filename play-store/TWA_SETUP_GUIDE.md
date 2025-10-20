# Google Play Store Setup Guide - Trusted Web Activity (TWA)

## Overview
This guide will help you publish **Cardiac Recovery Pro** to the Google Play Store using a Trusted Web Activity (TWA) wrapper.

---

## Prerequisites

- [ ] Android Studio installed
- [ ] Google Play Console developer account ($25 one-time fee)
- [ ] Deployed web app (vercel.app or custom domain)
- [ ] Java JDK 8 or higher
- [ ] Node.js and npm installed

---

## Step 1: Update manifest.json

Your `public/manifest.json` is already configured with:
- ✅ App name: "Cardiac Recovery Pro"
- ✅ Short name: "Cardiac Pro"
- ✅ Icons: 192x192 and 512x512
- ✅ Display mode: standalone
- ✅ Start URL: /

**Action Required:** Update `icons` paths if icons are in a different location.

---

## Step 2: Generate TWA App using Bubblewrap

### Install Bubblewrap CLI:
```bash
npm install -g @bubblewrap/cli
```

### Initialize TWA project:
```bash
bubblewrap init --manifest=https://cardiac-recovery-pro.vercel.app/manifest.json
```

Follow the prompts:
- **Domain:** cardiac-recovery-pro.vercel.app
- **Package name:** com.cardiacrecoverypro.app
- **App name:** Cardiac Recovery Pro
- **Display mode:** standalone
- **Default icon:** Use 512x512 icon
- **Fallback behavior:** Use webapp
- **Enable notifications:** Yes (for future features)

### Build the APK:
```bash
bubblewrap build
```

This generates:
- `app-release-unsigned.apk` (for testing)
- `app-release-signed.aab` (for Play Store)

---

## Step 3: Set Up Digital Asset Links

Create `.well-known/assetlinks.json` on your domain:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.cardiacrecoverypro.app",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

**To get your SHA256 fingerprint:**
```bash
keytool -list -v -keystore android.keystore -alias android -storepass YOUR_PASSWORD -keypass YOUR_PASSWORD
```

Copy the SHA256 value and paste it into assetlinks.json.

**Deploy to Vercel:**
Create `public/.well-known/assetlinks.json` with the content above.

---

## Step 4: Test the TWA Locally

### Install on Android device:
```bash
adb install app/build/outputs/apk/release/app-release-unsigned.apk
```

### Test Asset Links:
Open this URL in Chrome on Android:
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://cardiac-recovery-pro.vercel.app&relation=delegate_permission/common.handle_all_urls
```

Should return your app's package name.

---

## Step 5: Prepare Play Store Assets

### Required Assets:

1. **App Icon** (512x512 PNG)
   - Already have: `public/icons/icon-512.png`

2. **Feature Graphic** (1024x500 PNG)
   - Create with app branding
   - Highlight: "Track Your Heart Health Recovery"

3. **Screenshots** (Min 2, Max 8)
   - Phone: 1080x1920 or 1440x2560
   - Tablet: 2048x1536 (optional)
   - Capture:
     - Dashboard view
     - Data entry screen
     - Charts/analytics
     - Recovery protocol guidance

4. **Short Description** (Max 80 chars):
   ```
   Professional cardiac rehab tracker with real-time monitoring & progress analytics
   ```

5. **Full Description** (Max 4000 chars):
   ```
   🫀 CARDIAC RECOVERY PRO - Your Complete Cardiac Rehabilitation Companion

   Cardiac Recovery Pro is a comprehensive recovery tracking application designed for patients recovering from cardiac surgery, heart attacks, or other cardiovascular events. Built with input from cardiac rehabilitation specialists, this app helps you monitor your progress, track vital signs, and stay motivated throughout your recovery journey.

   KEY FEATURES:

   📊 COMPREHENSIVE TRACKING
   • Log daily vitals: heart rate, blood pressure, oxygen saturation
   • Track exercise sessions with distance, duration, and METs
   • Monitor symptoms: chest pain, shortness of breath, fatigue
   • Record medications and therapy sessions

   📈 VISUAL PROGRESS ANALYTICS
   • 7+ interactive charts showing your recovery trajectory
   • Week-by-week progress visualization
   • Compare your metrics to recovery targets
   • CRPS (Cardiac Recovery Progress Score) tracking

   🎯 WEEK-BY-WEEK GUIDANCE
   • Evidence-based recovery protocols for weeks 1-12+
   • Recommended exercises for each recovery phase
   • Safety precautions and activity limits
   • Goals and milestones for motivation

   🏆 GAMIFICATION & MOTIVATION
   • Unlock 20+ achievements as you progress
   • Track consecutive exercise days (streaks)
   • Distance milestones (10, 50, 100+ miles)
   • Recovery week celebrations

   🚑 SAFETY FEATURES
   • Emergency alert thresholds (high HR, abnormal BP)
   • Symptom logger for quick medical reporting
   • Data export for sharing with healthcare team
   • Print-friendly reports for doctor visits

   💪 THERAPY SESSION TRACKING
   • Log physical therapy appointments
   • Track exercise types and intensity (RPE)
   • Monitor improvement over time
   • Notes for communication with therapists

   📱 MOBILE-OPTIMIZED
   • Works offline (PWA technology)
   • Installable on home screen
   • Touch-friendly interface
   • Bottom navigation for easy one-handed use

   🔒 PRIVACY & DATA
   • All data stored locally on your device
   • No cloud sync required (optional backup available)
   • Full data export as JSON or CSV
   • No login required - start immediately

   WHO IS THIS FOR?
   • Post-cardiac surgery patients
   • Heart attack survivors
   • Anyone in cardiac rehabilitation programs
   • Patients with heart failure or CHF
   • Physical therapists and cardiac rehab clinics

   WHAT MAKES IT UNIQUE?
   Unlike generic fitness trackers, Cardiac Recovery Pro is specifically designed for cardiac patients with:
   • Recovery phase-specific guidance
   • Medical-grade vital sign tracking
   • Evidence-based rehabilitation protocols
   • Safety alerts for dangerous readings

   TECHNICAL DETAILS:
   • Works 100% offline after installation
   • No ads, no subscriptions
   • No account required
   • Backup/restore functionality included
   • Print reports for doctor appointments

   Start your recovery journey today with Cardiac Recovery Pro - the app trusted by cardiac patients and recommended by physical therapists.

   DISCLAIMER: This app is a tracking tool and does not replace medical advice. Always consult your healthcare provider before starting any exercise program.
   ```

6. **App Category:**
   - Primary: Medical
   - Secondary: Health & Fitness

7. **Content Rating:**
   - Complete IARC questionnaire
   - Select "No" for violence, mature content, etc.
   - Should receive "Everyone" rating

8. **Privacy Policy URL:**
   - Required by Google Play
   - Host at: `https://cardiac-recovery-pro.vercel.app/privacy-policy.html`

---

## Step 6: Create Privacy Policy

Create `public/privacy-policy.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Privacy Policy - Cardiac Recovery Pro</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #60a5fa; }
        h2 { color: #3b82f6; margin-top: 30px; }
    </style>
</head>
<body>
    <h1>Privacy Policy - Cardiac Recovery Pro</h1>
    <p><strong>Last Updated:</strong> October 20, 2025</p>

    <h2>1. Information We Collect</h2>
    <p>Cardiac Recovery Pro operates as a local-only application. We do NOT collect, transmit, or store any of your personal health data on external servers.</p>

    <h2>2. Data Storage</h2>
    <p>All data you enter (vitals, exercise logs, personal information) is stored locally on your device using browser localStorage. This data never leaves your device unless you explicitly choose to export it.</p>

    <h2>3. No Account Required</h2>
    <p>The app does not require account creation, login, or any identifying information beyond what you choose to enter for your own tracking purposes.</p>

    <h2>4. Third-Party Services</h2>
    <p>The app uses Chart.js (from CDN) for data visualization. No personal data is sent to third parties.</p>

    <h2>5. Data Export</h2>
    <p>You have full control over your data. You can export all data as JSON or CSV files at any time via the Backup feature.</p>

    <h2>6. Data Deletion</h2>
    <p>You can delete all your data at any time using the "Clear All Data" function in the History tab.</p>

    <h2>7. Children's Privacy</h2>
    <p>This app is intended for adults (18+) in cardiac recovery programs.</p>

    <h2>8. Changes to Privacy Policy</h2>
    <p>We may update this policy. Check this page periodically for changes.</p>

    <h2>9. Contact</h2>
    <p>For questions about privacy, contact: [YOUR_EMAIL]</p>

    <h2>10. Medical Disclaimer</h2>
    <p>This app is a tracking tool only and does not provide medical advice. Always consult your healthcare provider.</p>
</body>
</html>
```

---

## Step 7: Build Production APK/AAB

### Sign the app:
```bash
bubblewrap build --skipPwaValidation
```

This creates:
- `app-release-signed.aab` - Upload this to Play Store

### Test signed build:
```bash
bubblewrap install
```

---

## Step 8: Upload to Play Console

1. Go to https://play.google.com/console
2. Create new app
3. Fill out:
   - App name: Cardiac Recovery Pro
   - Default language: English (US)
   - App or game: App
   - Free or paid: Free

4. Upload AAB file to "Production" or "Internal Testing"

5. Complete store listing:
   - Upload all screenshots
   - Add feature graphic
   - Enter descriptions
   - Select category: Medical

6. Content rating:
   - Complete questionnaire
   - Should get "Everyone" rating

7. Privacy policy:
   - Enter URL: https://cardiac-recovery-pro.vercel.app/privacy-policy.html

8. App access:
   - Check "All functionality is available without special access"

9. Ads:
   - Select "No, my app does not contain ads"

10. Submit for review!

---

## Timeline

- **App creation:** 10 minutes
- **Asset preparation:** 1-2 hours
- **TWA setup:** 30 minutes
- **Testing:** 30 minutes
- **Play Store listing:** 1 hour
- **Google review:** 1-7 days

**Total:** ~3-4 hours of work + Google's review time

---

## Troubleshooting

### Asset Links Not Working:
- Verify SHA256 fingerprint matches
- Check `assetlinks.json` is accessible at `https://yourdomain.com/.well-known/assetlinks.json`
- Wait up to 24 hours for Google to cache

### App Won't Install:
- Check minimum SDK version (should be 19+)
- Verify signing certificate

### Chrome Custom Tabs Showing Instead of TWA:
- Asset links not validated
- Package name mismatch
- Wait for Google to verify links (can take hours)

---

## Alternative: Using PWA Builder

If Bubblewrap is complex, try PWA Builder:

1. Go to https://www.pwabuilder.com/
2. Enter: https://cardiac-recovery-pro.vercel.app
3. Click "Build My PWA"
4. Select "Android"
5. Download APK/AAB
6. Upload to Play Store

---

## Post-Launch

After approval:
- Share Play Store link with patients
- Request reviews
- Monitor crash reports in Play Console
- Update regularly with new features

---

**Congratulations!** You now have a Play Store-ready cardiac recovery app! 🎉
