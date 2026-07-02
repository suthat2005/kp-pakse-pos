const fs = require('fs');

let pos = fs.readFileSync('src/components/POS.jsx', 'utf8');

// Replace the current bcelone:// approach back to the jsQR decode approach that was working at 6:26
const oldBlock = `    // generateQr: always use bcelone://qr/transfer deep link with amount embedded.
    // This is the correct approach for BCEL One / OnePay Lao banking apps.
    // When scanned: app opens directly to transfer screen with amount pre-filled.
    const generateQr = async (template, amount, setter) => {
      if (!template) { setter(''); return; }
      try {
        let payload;
        // Priority 1: Extract bcelone:// deep link from qrserver.com URL (original default template)
        if (template.includes('api.qrserver.com/v1/create-qr-code/')) {
          const urlObj = new URL(template);
          const dataParam = urlObj.searchParams.get('data');
          if (dataParam) {
            // Append amount to the bcelone:// link (removes any existing &amount= suffix first)
            const base = dataParam.replace(/&amount=.*$/, '').replace(/\\?amount=.*$/, '');
            payload = base + (base.includes('?') ? '&' : '?') + 'amount=' + Math.round(Number(amount) || 0);
          } else {
            payload = template + amount;
          }
        }
        // Priority 2: template is already a bcelone:// or other deep link (not image)
        else if (!template.startsWith('data:image/') && !template.startsWith('000201')) {
          const base = template.replace(/&amount=.*$/, '').replace(/\\?amount=.*$/, '');
          payload = base + (base.includes('?') ? '&' : '?') + 'amount=' + Math.round(Number(amount) || 0);
        }
        // Priority 3: template is data:image or EMVCo — use bankAccountNumber to build bcelone:// link
        else if (settings.bankAccountNumber) {
          // Build bcelone:// deep link from stored account number (same format as default template)
          const acc = settings.bankAccountNumber.replace(/-/g, '');
          payload = \`bcelone://qr/transfer?acc=\${acc}&amount=\${Math.round(Number(amount) || 0)}\`;
        }
        // Fallback: show image as-is
        else {
          setter(template);
          return;
        }
        const dataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 1 });
        setter(dataUrl);
      } catch (err) {
        console.error('Error generating QR:', err);
        setter(template.startsWith('data:image/') ? template : '');
      }
    };`;

const newBlock = `    // Decode a data:image base64 QR using jsQR to get the EMVCo payload
    const decodeImageToPayload = (dataUrl) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width; canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const decoded = jsQR(imageData.data, imageData.width, imageData.height);
          resolve(decoded && decoded.data ? decoded.data : null);
        } catch (e) { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });

    const injectAmountAndGenerate = async (payload, amount, setter, fallbackUrl) => {
      try {
        let base = payload;
        base = base.replace(/54\\d{2}\\d+(?=6304)/, '');
        if (base.includes('6304')) base = base.substring(0, base.indexOf('6304'));
        const amountStr = String(Math.round(Number(amount) || 0));
        if (Number(amountStr) > 0) {
          const tag54 = '54' + String(amountStr.length).padStart(2, '0') + amountStr;
          base = base + tag54;
        }
        const rawQr = base + '6304';
        let crc = 0xFFFF;
        for (let c = 0; c < rawQr.length; c++) {
          crc ^= (rawQr.charCodeAt(c) << 8);
          for (let i = 0; i < 8; i++) {
            crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
          }
        }
        const finalPayload = rawQr + (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
        const dataUrl = await QRCode.toDataURL(finalPayload, { width: 300, margin: 1 });
        setter(dataUrl);
      } catch (err) {
        console.error('QR inject error:', err);
        setter(fallbackUrl || '');
      }
    };

    const generateQr = async (template, amount, setter) => {
      if (!template) { setter(''); return; }
      try {
        // Case 1: already an EMVCo text payload → inject amount directly
        if (template.startsWith('000201')) {
          await injectAmountAndGenerate(template, amount, setter, '');
          return;
        }
        // Case 2: data:image (uploaded QR photo) → try to decode with jsQR first
        if (template.startsWith('data:image/')) {
          const decoded = await decodeImageToPayload(template);
          if (decoded && decoded.startsWith('000201')) {
            await injectAmountAndGenerate(decoded, amount, setter, template);
          } else {
            setter(template);
          }
          return;
        }
        // Case 3: qrserver.com URL → extract data param, append amount, generate locally
        let payload = template;
        if (template.includes('api.qrserver.com/v1/create-qr-code/')) {
          const urlObj = new URL(template);
          const dataParam = urlObj.searchParams.get('data');
          if (dataParam) payload = dataParam + amount;
          else payload = template + amount;
        } else {
          payload = template + amount;
        }
        const dataUrl = await QRCode.toDataURL(payload, { width: 300, margin: 1 });
        setter(dataUrl);
      } catch (err) {
        console.error('Error generating QR:', err);
        setter('');
      }
    };`;

if (pos.includes(oldBlock)) {
  pos = pos.replace(oldBlock, newBlock);
  fs.writeFileSync('src/components/POS.jsx', pos);
  console.log('RESTORED: jsQR auto-decode approach (working at 6:26) OK');
} else {
  console.log('ERROR: block not found');
  process.exit(1);
}
