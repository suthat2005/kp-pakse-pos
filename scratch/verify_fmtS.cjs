const fmtS = n => {
  n = n || 0;
  return (n / 1000).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).replace(/,/g, '.') + 'k ₭';
};

console.log("80000   =>", fmtS(80000));
console.log("63000   =>", fmtS(63000));
console.log("4600000 =>", fmtS(4600000));
console.log("0       =>", fmtS(0));
console.log("4200000 =>", fmtS(4200000));
