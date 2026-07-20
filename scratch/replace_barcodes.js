const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/components/Inventory.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const startKeyword = '  const handlePrintBarcode = async () => {';
const endKeyword = '  const lowStockProducts = products.filter(';

const startIndex = content.indexOf(startKeyword);
if (startIndex === -1) {
  console.error('Error: Start keyword not found!');
  process.exit(1);
}

const endIndex = content.indexOf(endKeyword);
if (endIndex === -1) {
  console.error('Error: End keyword not found!');
  process.exit(1);
}

const originalPart = content.substring(startIndex, endIndex);

const replacementPart = `  const handlePrintBarcode = async () => {
    const settings = db.getSettings();
    const format = barcodeFormat || settings.barcodeFormat || 'CODE128';
    const name = selectedBarcodeProd ? selectedBarcodeProd.name : 'ສິນຄ້າທົ່ວໄປ';
    const priceVal = selectedBarcodeProd ? selectedBarcodeProd.price.toLocaleString() + ' ກີບ' : '';
    const text = customBarcodeText;

    if (settings.barcodeDirectPrint) {
      try {
        const dataUrl = await renderStickerToCanvas(name, priceVal, text, format, settings);
        const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
          ? ''
          : (settings.printServerUrl || 'http://localhost:5173');
        const response = await fetch(\`\${baseUrl}/api/print-barcode\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            printer: settings.windowsBarcodePrinterName || 'Barcode Printer',
            image: dataUrl,
            qty: barcodePrintQty
          })
        });
        const result = await response.json();
        if (!result.success) {
          alert('ຜິດພາດໃນການປຣິນ: ' + result.error);
        } else {
          setShowBarcodeModal(false);
        }
      } catch (e) {
        alert('ຜິດພາດໃນການເຊື່ອມຕໍ່: ' + e.message);
      }
      return;
    }

    const canvas = barcodeCanvasRef.current;
    if (!canvas) {
      alert("ຜິດພາດ: ບໍ່ພົບພື້ນທີ່ວາດບາໂຄ້ດ / Error: Barcode canvas not found.");
      return;
    }
    const dataUrl = canvas.toDataURL();
    
    const paperWidth = ensureUnit(settings.barcodePaperWidth || settings.barcodeStickerWidth || '40mm', 'mm');
    const stickerWidth = ensureUnit(settings.barcodeStickerWidth || '40mm', 'mm');
    const stickerHeight = ensureUnit(settings.barcodeStickerHeight || '25mm', 'mm');
    const gapX = ensureUnit(settings.barcodeGapX || '2mm', 'mm');
    const gapY = ensureUnit(settings.barcodeGapY || '2mm', 'mm');
    const columns = settings.barcodeColumns || 1;
    const marginLeft = ensureUnit(settings.barcodeMarginLeft || '0mm', 'mm');
    const marginTop = ensureUnit(settings.barcodeMarginTop || '0mm', 'mm');

    const showName = settings.barcodeShowName !== false;
    const showPrice = settings.barcodeShowPrice !== false;
    
    const textAlign = settings.barcodeTextAlign || 'center';
    const textBold = settings.barcodeTextBold === true;
    const textItalic = settings.barcodeTextItalic === true;
    
    const nameSize = ensureUnit(settings.barcodeNameSize || 10, 'px');
    const priceSize = ensureUnit(settings.barcodePriceSize || 12, 'px');
    const textSpacing = ensureUnit(settings.barcodeTextSpacing || 5, 'px');
    const stickerMargin = settings.barcodeMargin || 10;

    let stickersHtml = '';
    const totalStickers = barcodePrintQty;
    const numRows = Math.ceil(totalStickers / columns);
    for (let r = 0; r < numRows; r++) {
      stickersHtml += \`<div class="row-container">\`;
      for (let c = 0; c < columns; c++) {
        const idx = r * columns + c;
        if (idx < totalStickers) {
          stickersHtml += \`
            <div class="sticker">
              \${showName ? \`<p class="name">\${name}</p>\` : ''}
              <img src="\${dataUrl}" />
              \${showPrice ? \`<p class="price">\${priceVal}</p>\` : ''}
            </div>
          \`;
        } else {
          stickersHtml += \`<div class="sticker placeholder"></div>\`;
        }
      }
      stickersHtml += \`</div>\`;
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document || printFrame.contentDocument;
    frameDoc.write(\`
      <html>
        <head>
          <title>ປຣິນບາໂຄ້ດ - ຂອບພຣະຣັທເກຊ</title>
          <link href="https://fonts.googleapis.com/css2?family=Phetsarath&display=swap" rel="stylesheet">
          <style>
            @page {
              size: \${paperWidth} \${stickerHeight};
              margin: 0;
            }
            html, body {
              width: \${paperWidth};
              height: \${stickerHeight};
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            body {
              font-family: 'Phetsarath', 'Phetsarath OT', Arial, sans-serif;
              background: white;
              color: black;
              margin: 0;
              padding: 0;
            }
            .row-container {
              display: flex;
              flex-direction: row;
              width: 100%;
              height: \${stickerHeight};
              page-break-after: always;
              break-after: always;
              box-sizing: border-box;
              padding-left: \${marginLeft};
              padding-top: \${marginTop};
              gap: \${gapX};
            }
            .row-container:last-child {
              page-break-after: avoid;
              break-after: avoid;
            }
            .sticker {
              display: flex;
              flex-direction: column;
              align-items: \${textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'};
              justify-content: center;
              width: \${stickerWidth};
              height: 100%;
              padding: \${stickerMargin}px;
              box-sizing: border-box;
              overflow: hidden;
            }
            .sticker.placeholder {
              visibility: hidden;
            }
            p.name {
              margin: 0;
              font-size: \${nameSize};
              font-weight: \${textBold ? 'bold' : 'normal'};
              font-style: \${textItalic ? 'italic' : 'normal'};
              text-align: \${textAlign};
              width: 100%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              flex: 0 0 auto;
            }
            p.price {
              margin: 0;
              font-size: \${priceSize};
              font-weight: \${textBold ? 'bold' : 'normal'};
              font-style: \${textItalic ? 'italic' : 'normal'};
              text-align: \${textAlign};
              width: 100%;
              flex: 0 0 auto;
            }
            img {
              flex: 1 1 auto;
              min-height: 0;
              max-width: 100%;
              object-fit: contain;
              margin-top: \${textSpacing};
              margin-bottom: \${textSpacing};
            }
            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body onload="window.print();">
          \${stickersHtml}
        </body>
      </html>
    \`);
    frameDoc.close();

    printFrame.contentWindow.focus();
    setTimeout(() => {
      document.body.removeChild(printFrame);
      setShowBarcodeModal(false);
    }, 1000);
  };

  const handlePrintBulkBarcodes = async () => {
    const itemsToPrint = products.filter(p => !db.isServiceCategory(p.category) && (bulkPrintQtys[p.id] || 0) > 0);
    if (itemsToPrint.length === 0) {
      alert('ກະລຸນາເລືອກຈຳນວນປຣິນບາໂຄ້ດຢ່າງໜ້ອຍ 1 ລາຍການ');
      return;
    }

    const settings = db.getSettings();
    const format = barcodeFormat || settings.barcodeFormat || 'CODE128';

    if (settings.barcodeDirectPrint) {
      try {
        for (const p of itemsToPrint) {
          const qty = bulkPrintQtys[p.id] || 0;
          const name = p.name;
          const priceVal = p.price.toLocaleString() + ' ກີບ';
          const text = p.barcode;
          const dataUrl = await renderStickerToCanvas(name, priceVal, text, format, settings);

          const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? ''
            : (settings.printServerUrl || 'http://localhost:5173');
          const response = await fetch(\`\${baseUrl}/api/print-barcode\`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              printer: settings.windowsBarcodePrinterName || 'Barcode Printer',
              image: dataUrl,
              qty: qty
            })
          });
          const result = await response.json();
          if (!result.success) {
            alert(\`ຜິດພາດໃນການປຣິນ \${p.name}: \${result.error}\`);
            return;
          }
        }
        setShowBulkBarcodeModal(false);
        setBulkPrintQtys({});
      } catch (e) {
        alert('ຜິດພາດໃນການເຊື່ອມຕໍ່: ' + e.message);
      }
      return;
    }

    const paperWidth = ensureUnit(settings.barcodePaperWidth || settings.barcodeStickerWidth || '40mm', 'mm');
    const stickerWidth = ensureUnit(settings.barcodeStickerWidth || '40mm', 'mm');
    const stickerHeight = ensureUnit(settings.barcodeStickerHeight || '25mm', 'mm');
    const gapX = ensureUnit(settings.barcodeGapX || '2mm', 'mm');
    const gapY = ensureUnit(settings.barcodeGapY || '2mm', 'mm');
    const columns = settings.barcodeColumns || 1;
    const marginLeft = ensureUnit(settings.barcodeMarginLeft || '0mm', 'mm');
    const marginTop = ensureUnit(settings.barcodeMarginTop || '0mm', 'mm');

    const showName = settings.barcodeShowName !== false;
    const showPrice = settings.barcodeShowPrice !== false;
    
    const textAlign = settings.barcodeTextAlign || 'center';
    const textBold = settings.barcodeTextBold === true;
    const textItalic = settings.barcodeTextItalic === true;
    
    const nameSize = ensureUnit(settings.barcodeNameSize || 10, 'px');
    const priceSize = ensureUnit(settings.barcodePriceSize || 12, 'px');
    const textSpacing = ensureUnit(settings.barcodeTextSpacing || 5, 'px');
    const stickerMargin = settings.barcodeMargin || 10;

    const stickersList = [];
    for (const p of itemsToPrint) {
      const qty = bulkPrintQtys[p.id] || 0;
      const dataUrl = await generateBarcodeDataUrl(p.barcode, format);
      const name = p.name;
      const priceVal = p.price.toLocaleString() + ' ກີບ';
      for (let i = 0; i < qty; i++) {
        stickersList.push({ name, dataUrl, priceVal });
      }
    }

    let stickersHtml = '';
    const totalStickers = stickersList.length;
    const numRows = Math.ceil(totalStickers / columns);
    for (let r = 0; r < numRows; r++) {
      stickersHtml += \`<div class="row-container">\`;
      for (let c = 0; c < columns; c++) {
        const idx = r * columns + c;
        if (idx < totalStickers) {
          const s = stickersList[idx];
          stickersHtml += \`
            <div class="sticker">
              \${showName ? \`<p class="name">\${s.name}</p>\` : ''}
              <img src="\${s.dataUrl}" />
              \${showPrice ? \`<p class="price">\${s.priceVal}</p>\` : ''}
            </div>
          \`;
        } else {
          stickersHtml += \`<div class="sticker placeholder"></div>\`;
        }
      }
      stickersHtml += \`</div>\`;
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document || printFrame.contentDocument;
    frameDoc.write(\`
      <html>
        <head>
          <title>ປຣິນບາໂຄ້ດຫຼາຍລາຍການ - ຂອບພຣະຣັທເກຊ</title>
          <link href="https://fonts.googleapis.com/css2?family=Phetsarath&display=swap" rel="stylesheet">
          <style>
            @page {
              size: \${paperWidth} \${stickerHeight};
              margin: 0;
            }
            html, body {
              width: \${paperWidth};
              height: \${stickerHeight};
              margin: 0;
              padding: 0;
              overflow: hidden;
            }
            body {
              font-family: 'Phetsarath', 'Phetsarath OT', Arial, sans-serif;
              background: white;
              color: black;
              margin: 0;
              padding: 0;
            }
            .row-container {
              display: flex;
              flex-direction: row;
              width: 100%;
              height: \${stickerHeight};
              page-break-after: always;
              break-after: always;
              box-sizing: border-box;
              padding-left: \${marginLeft};
              padding-top: \${marginTop};
              gap: \${gapX};
            }
            .row-container:last-child {
              page-break-after: avoid;
              break-after: avoid;
            }
            .sticker {
              display: flex;
              flex-direction: column;
              align-items: \${textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center'};
              justify-content: center;
              width: \${stickerWidth};
              height: 100%;
              padding: \${stickerMargin}px;
              box-sizing: border-box;
              overflow: hidden;
            }
            .sticker.placeholder {
              visibility: hidden;
            }
            p.name {
              margin: 0;
              font-size: \${nameSize};
              font-weight: \${textBold ? 'bold' : 'normal'};
              font-style: \${textItalic ? 'italic' : 'normal'};
              text-align: \${textAlign};
              width: 100%;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              flex: 0 0 auto;
            }
            p.price {
              margin: 0;
              font-size: \${priceSize};
              font-weight: \${textBold ? 'bold' : 'normal'};
              font-style: \${textItalic ? 'italic' : 'normal'};
              text-align: \${textAlign};
              width: 100%;
              flex: 0 0 auto;
            }
            img {
              flex: 1 1 auto;
              min-height: 0;
              max-width: 100%;
              object-fit: contain;
              margin-top: \${textSpacing};
              margin-bottom: \${textSpacing};
            }
            @media print {
              body {
                margin: 0;
              }
            }
          </style>
        </head>
        <body onload="window.print();">
          \${stickersHtml}
        </body>
      </html>
    \`);
    frameDoc.close();

    printFrame.contentWindow.focus();
    setTimeout(() => {
      document.body.removeChild(printFrame);
      setShowBulkBarcodeModal(false);
      setBulkPrintQtys({});
    }, 1000);
  };

  const generateBarcodeDataUrl = async (text, format) => {
    const settings = db.getSettings();
    const canvas = document.createElement('canvas');
    try {
      if (format === 'QRCODE') {
        const qrSize = settings.barcodeHeight || 50;
        canvas.width = qrSize + 20;
        canvas.height = qrSize + (settings.barcodeShowCode !== false ? 30 : 10);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, text, {
          margin: 1,
          scale: 3,
          errorCorrectionLevel: 'M',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        ctx.drawImage(qrCanvas, (canvas.width - qrSize) / 2, 5, qrSize, qrSize);
        if (settings.barcodeShowCode !== false) {
          ctx.fillStyle = '#000000';
          ctx.font = \`bold \${settings.barcodeCodeSize || 10}px Courier New\`;
          ctx.textAlign = 'center';
          ctx.fillText(text, canvas.width / 2, qrSize + 15);
        }
      } else {
        JsBarcode(canvas, text, {
          format: format,
          width: settings.barcodeWidth || 2,
          height: settings.barcodeHeight || 50,
          displayValue: settings.barcodeShowCode !== false,
          fontSize: settings.barcodeCodeSize || 10,
          font: 'Courier New',
          background: '#FFFFFF',
          lineColor: '#000000',
          margin: 4
        });
      }
      return canvas.toDataURL();
    } catch (e) {
      return '';
    }
  };

`;

content = content.replace(originalPart, replacementPart);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully refactored barcodes!');
