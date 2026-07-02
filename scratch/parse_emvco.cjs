const qr = '00020101021115312031041800520446mch64f01defcb3138590016A00526628466257701082771041802030020316mch64f01defcb3105204593253034185802LA5907 LEYUNG6002CH62200716stk6875cb2f6de946304B423';

function parseEMVCo(str) {
  let index = 0;
  const tags = {};
  while (index < str.length) {
    if (index + 4 > str.length) break;
    const tag = str.substring(index, index + 2);
    const len = parseInt(str.substring(index + 2, index + 4), 10);
    index += 4;
    if (index + len > str.length) break;
    const val = str.substring(index, index + len);
    index += len;
    tags[tag] = val;
  }
  return tags;
}

console.log(JSON.stringify(parseEMVCo(qr), null, 2));
