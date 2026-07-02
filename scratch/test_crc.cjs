function crc16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    const charCode = str.charCodeAt(c);
    crc ^= (charCode << 8);
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function generateLaoQR(amount) {
  const basePrefix = '00020101021115312031041800520446mch64f01defcb3138590016A00526628466257701082771041802030020316mch64f01defcb310520459325303418';
  const baseSuffix = '5802LA5907 LEYUNG6002CH62200716stk6875cb2f6de946304';
  
  const amountStr = String(Math.round(amount));
  const tag54 = '54' + String(amountStr.length).padStart(2, '0') + amountStr;
  
  const rawQr = basePrefix + tag54 + baseSuffix;
  const checksum = crc16(rawQr);
  return rawQr + checksum;
}

console.log('Dynamic LAK QR for 150,000:', generateLaoQR(150000));
