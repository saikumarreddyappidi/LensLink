const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let count = 0;

// Remove FFFD replacement chars
const fffdBefore = (html.match(/\uFFFD/g) || []).length;
html = html.replace(/[\uFFFD]+/g, '');
count += fffdBefore;

// Fix oe ligature artifacts
const oeBefore = (html.match(/\u0153/g) || []).length;
html = html.replace(/\u0153/g, (m) => {
    // Only replace in plaintext/template contexts, not inside CSS
    return 'oe';
});
count += oeBefore;

// Fix U+0178 Ydiaeresis artifacts
const yBefore = (html.match(/\u0178/g) || []).length;
html = html.replace(/\u0178/g, '');
count += yBefore;

// Fix garbled emoji in static HTML - camera, phone, film, calendar, location etc.
// These are patterns like: U+00F0 + garbled bytes
html = html.replace(/\u00f0[\u0160\u017e]\u009f[\u0080-\u00bf][\u009c]\u00b8/g, '\uD83D\uDCF8'); // 📸
html = html.replace(/\u00f0[\u0160\u017e]\u009f[\u0080-\u00bf][\u009c]\u00b1/g, '\uD83D\uDCF1'); // 📱
html = html.replace(/\u00f0[\u0160\u017e]\u009f[\u0080-\u00bf][\u009c]\u00b7/g, '\uD83C\uDFAC'); // 🎬
html = html.replace(/\u00f0[\u0160\u017e]\u009f[\u0080-\u00bf][\u009c]\u00b0/g, '\uD83D\uDCCD'); // 📍
html = html.replace(/\u00f0[\u0160\u017e]\u009f[\u0080-\u00bf][\u009c]\u0085/g, '\uD83D\uDCC5'); // 📅

// Fix Key Advantages heading (may have garbled content inside)
html = html.replace(/<h4 class="font-semibold text-orange-800 mb-2">[^<]*Key Advantages<\/h4>/g,
    '<h4 class="font-semibold text-orange-800 mb-2">\u2605 Key Advantages</h4>');

// Fix Email Service heading
html = html.replace(/<h4 class="font-semibold text-slate-800 mb-2">[^<]{0,8}Email Service<\/h4>/g,
    '<h4 class="font-semibold text-slate-800 mb-2">\uD83D\uDCE7 Email Service</h4>');

// Fix MongoDB heading
html = html.replace(/<h4 class="font-semibold text-slate-800 mb-2">[^<]{0,8}MongoDB<\/h4>/g,
    '<h4 class="font-semibold text-slate-800 mb-2">\uD83D\uDDC4 MongoDB<\/h4>');

// Fix garbled list items - <li> with garbage before <strong>
html = html.replace(/<li>[^<&]{1,20}<strong>/g, '<li><strong>');

// Fix remaining â type characters from old CP1252 artifacts
html = html.replace(/\u00e2\u0082\u00ac/g, '\u20ac');
html = html.replace(/\u00e2\u0080\u0093/g, '\u2013'); // en-dash
html = html.replace(/\u00e2\u0080\u0094/g, '\u2014'); // em-dash
html = html.replace(/\u00e2\u0080\u00a2/g, '\u2022'); // bullet
// Catch-all leftover â with 2 continuation bytes
html = html.replace(/\u00e2[\u0080-\u00bf][\u0080-\u00bf]/g, '');

fs.writeFileSync('index.html', html, 'utf8');
console.log('Fixes applied:', count);
console.log('FFFD removed:', fffdBefore);
console.log('oe-ligature fixed:', oeBefore);
console.log('U+0178 removed:', yBefore);
console.log('Remaining FFFD:', (html.match(/\uFFFD/g) || []).length);
console.log('Remaining U+0153:', (html.match(/\u0153/g) || []).length);
console.log('Remaining U+0178:', (html.match(/\u0178/g) || []).length);

// Verify JS syntax
const s = html.lastIndexOf('<script>');
const e = html.lastIndexOf('</script>');
const js = html.substring(s + 8, e);
try { new Function(js); console.log('JS syntax: OK'); }
catch(err) { console.log('JS SYNTAX ERROR:', err.message); }
