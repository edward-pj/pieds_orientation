/**
 * Script to generate high-resolution QR codes for physical posters on campus
 * Usage: node scripts/generate_qr.js [baseUrl]
 * Example: node scripts/generate_qr.js https://pieds-orientation.vercel.app
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const baseUrl = process.argv[2] || 'https://pieds-orientation.bits-pilani.ac.in';
const outputDir = path.join(__dirname, '..', 'assets', 'qr');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const locations = [
  { id: 1, label: 'Location 1 (Checkpoint 01)' },
  { id: 4, label: 'Location 4 (Checkpoint 04)' }
];

async function generate() {
  console.log(`Generating QR Codes using base URL: ${baseUrl}\n`);

  for (const loc of locations) {
    const targetUrl = `${baseUrl.replace(/\/$/, '')}/?loc=${loc.id}`;
    
    // 1. Generate High-Res PNG (1024x1024, crisp print quality)
    const pngPath = path.join(outputDir, `qr-location-${loc.id}.png`);
    await QRCode.toFile(pngPath, targetUrl, {
      width: 1024,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });

    // 2. Generate Infinite-Resolution Vector SVG
    const svgPath = path.join(outputDir, `qr-location-${loc.id}.svg`);
    const svgString = await QRCode.toString(targetUrl, {
      type: 'svg',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });
    fs.writeFileSync(svgPath, svgString);

    console.log(`✔ [${loc.label}]`);
    console.log(`   URL: ${targetUrl}`);
    console.log(`   PNG: assets/qr/qr-location-${loc.id}.png`);
    console.log(`   SVG: assets/qr/qr-location-${loc.id}.svg\n`);
  }

  console.log('Done! All QR code assets are ready to print for campus placement.');
}

generate().catch(console.error);
