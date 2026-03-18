import sharp from 'sharp';

async function generateIcons() {
  try {
    const bg = '#0f172a'; // slate-900
    const input = 'public/logo-do-meio.png.PNG';

    // 180x180 for iOS apple-touch-icon
    await sharp(input)
      .resize(140, 140, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 20, bottom: 20, left: 20, right: 20,
        background: bg
      })
      .flatten({ background: bg })
      .toFile('public/apple-touch-icon.png');

    // 512x512 for PWA manifest
    await sharp(input)
      .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 56, bottom: 56, left: 56, right: 56,
        background: bg
      })
      .flatten({ background: bg })
      .toFile('public/icon-512.png');

    // 192x192 for PWA manifest
    await sharp(input)
      .resize(150, 150, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 21, bottom: 21, left: 21, right: 21,
        background: bg
      })
      .flatten({ background: bg })
      .toFile('public/icon-192.png');

    console.log('Icons generated successfully');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
