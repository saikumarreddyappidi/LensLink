const fs = require("fs");
const cp1252ToByte = new Map([[8364,128],[8218,130],[402,131],[8222,132],[8230,133],[8224,134],[8225,135],[710,136],[8240,137],[352,138],[8249,139],[338,140],[381,142],[8216,145],[8217,146],[8220,147],[8221,148],[8226,149],[8211,150],[8212,151],[732,152],[8482,153],[353,154],[8250,155],[339,156],[382,158],[376,159]]);
function toBytes(str){const b=[];for(const ch of str){const cp=ch.codePointAt(0);if(cp<=127||(cp>=160&&cp<=255))b.push(cp);else if(cp1252ToByte.has(cp))b.push(cp1252ToByte.get(cp));else if(cp>255)return null;else b.push(cp&255);}return b;}
function dec(str){const b=toBytes(str);if(!b)return null;try{return Buffer.from(b).toString("utf8");}catch(e){return null;}}
let c=fs.readFileSync("index.html","utf8");
const re=/[\xC0-\xFF][\x80-\xFF\u0100-\u02FF\u2000-\u22FF]{2,}/g;
const fixes=new Map();let m;
while((m=re.exec(c))!==null){const s=m[0];if(fixes.has(s))continue;const l1=dec(s);if(!l1||l1===s)continue;const l2=dec(l1);if(l2&&l2!==l1&&!/[\xC0-\xFF][\x80-\xFF]/.test(l2.slice(0,2))){fixes.set(s,l2);}else if(l1&&!/[\xC0-\xFF][\x80-\xFF]/.test(l1.slice(0,2))){fixes.set(s,l1);}}
console.log("Fixes:",fixes.size);
const sorted=[...fixes.entries()].sort((a,b)=>b[0].length-a[0].length);
let tot=0;for(const[f,t]of sorted){const n=c.split(f).length-1;if(n>0){c=c.split(f).join(t);tot+=n;}}
fs.writeFileSync("index.html",c,"utf8");
const rem=(c.match(/[\xC0-\xFF][\x80-\xFF\u0100-\u02FF\u2000-\u22FF]{2,}/g)||[]).length;
console.log("Replaced:",tot,"Remaining:",rem);
console.log("OK-emojis:", c.includes("\u{1F4F8}"), c.includes("\u2705"), c.includes("\u{1F4CB}"));