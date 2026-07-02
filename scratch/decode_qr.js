const fs = require('fs');
const jpeg = require('jpeg-js');
const jsQR = require('jsqr');

const imagePath = 'C:/Users/sutha/.gemini/antigravity/brain/668294e9-f07d-4cf3-842f-54716181ccff/media__1782933373671.jpg';
try {
  const jpegData = fs.readFileSync(imagePath);
  const rawImageData = jpeg.decode(jpegData, { useTArray: true });
  
  const code = jsQR(rawImageData.data, rawImageData.width, rawImageData.height);
  if (code) {
    console.log('SUCCESS_DECODE_QR:');
    console.log(code.data);
  } else {
    console.log('FAIL_DECODE_QR: No QR code found in image.');
  }
} catch (err) {
  console.error('ERROR_DECODE_QR:', err.message);
}
