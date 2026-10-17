# PIEDS Orientation Website • FOMO Countdown & Campus Quest

A sleek, ultra-minimalist marketing website built for the **PIEDS student team** at BITS Pilani.

Designed around a pitch-black aesthetic featuring a glowing red LED 7-segment digital countdown timer with a floor mirror reflection, alongside a scavenger hunt quest engine engineered for campus-wide FOMO marketing.

---

## ⚡ Features

1. **Digital 7-Segment Red LED Timer**:
   - Exact replica of the reference design with high-intensity glowing neon bloom.
   - Hardware-accelerated floor reflection fading into the darkness.
   - Logical countdown order: **`DAYS` : `HOURS` : `MINUTES` : `SECONDS`**.
   - Target countdown date: **20th October at 9:00 PM (IST)** (configured in [`config.js`](file:///Users/prathamjain/Desktop/pieds-orientation/config.js)).

2. **Campus Quest & FOMO Scavenger Engine**:
   - Built for 2 physical QR code posters placed across the BITS campus:
     - **Poster 1** opens `/?loc=1` → records **Location 1**
     - **Poster 2** opens `/?loc=4` → records **Location 4**
   - Displays:
     - First scan: **`1 out of 9 locations scanned`**
     - Second scan: **`2 out of 9 locations scanned`**
   - Tracks 9 discrete visual checkpoint slots: Checkpoints `01` and `04` illuminate with pulsating beacons upon discovery, leaving the remaining 7 dark to drive intense curiosity.
   - Dual-persistence storage in both **`document.cookie`** and **`localStorage`** (365-day expiry) so progress is preserved across in-app browsers (WhatsApp/Instagram/Camera webview) and mobile Safari/Chrome.
   - Automatic URL cleanup: `history.replaceState` removes `?loc=1` from the address bar after recording so users sharing the link don't spoil physical discovery for friends.

3. **Logo System**:
   - Default vector SVG logo for PIEDS BITS Pilani.
   - Simply drop your custom image at [`assets/images/logo.png`](file:///Users/prathamjain/Desktop/pieds-orientation/assets/images/) and it will automatically replace the default logo.

4. **Secret Dev / Test Helper**:
   - Tap the PIEDS logo **3 times rapidly** (or open with `?debug=1`) to toggle the test simulator bar (`Scan Loc #1`, `Scan Loc #4`, `Reset All`).

---

## 🚀 Quick Start (Local Preview)

Run a local server with either Python or Node:

```bash
# Using Python
python3 -m http.server 8080

# Using Node (npx)
npx serve .
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 📱 QR Codes for Posters

Ready-to-print high-resolution QR codes are available in [`assets/qr/`](file:///Users/prathamjain/Desktop/pieds-orientation/assets/qr/):
- `qr-location-1.png` & `qr-location-1.svg`
- `qr-location-4.png` & `qr-location-4.svg`

### Generating QR codes for your live domain:
When you deploy your site (e.g. to Vercel, Netlify, or your domain), generate updated QR codes in 1 step:

```bash
node scripts/generate_qr.js https://your-domain.com
```

Or open [`qr-generator.html`](file:///Users/prathamjain/Desktop/pieds-orientation/qr-generator.html) in any browser to preview and download printable QR PNGs interactively.

---

## 🛠 Configuration

Edit [`config.js`](file:///Users/prathamjain/Desktop/pieds-orientation/config.js) to adjust:
- `targetDate`: Target countdown timestamp (default: `2026-10-20T21:00:00+05:30`)
- `totalLocations`: Total locations shown on quest (default: `9`)
- `storageKey`: Cookie and LocalStorage identifier key
- `labels`: Custom wording for singular/plural/zero states
