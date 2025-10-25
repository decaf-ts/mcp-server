/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
const fs = require('fs');
for(let i=0;i<50;i++){
  fs.writeFileSync(`file${i}.ts`, `export function f${i}(a: number){ return a + ${i}; }\n`);
}
console.log('generated 50 files');
