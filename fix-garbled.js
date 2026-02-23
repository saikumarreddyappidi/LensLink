// Fix all remaining garbled unicode sequences in index.html
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
const orig = html.length;
let count = 0;

function rep(from, to, desc) {
    const c = html.split(from).length - 1;
    if (c > 0) {
        html = html.split(from).join(to);
        count += c;
        console.log(`  ✅ [${c}x] ${desc}`);
    }
}

// ── Garbled arrows/dashes used as bullet connectors ────────────────────────────
// â€" (U+2013 en-dash) - appears as â€" in garbled form
rep('â\x80\x93', '–', 'en-dash');
rep('â€"', '&ndash;', 'en-dash entity');
rep('â€"', '—', 'em-dash');

// ── Garbled bullet points ──────────────────────────────────────────────────────
rep('â€¢', '•', 'bullet');
rep('â€¢\u00c2', '•', 'bullet+c2');

// ── Garbled Key Advantages section (lines ~254-263) bullets: â\x82¬Â¢ ─────────
// These are the visible garbled bullets in the info page
html = html.replace(/â\uFFFD€Â¢/g, () => { count++; return '•'; });
html = html.replace(/â\uFFFD€â€"/g, () => { count++; return '→'; });
html = html.replace(/â\uFFFD€[—–]/g, () => { count++; return '→'; });

// The "Key Advantages" heading has garbled emoji: ──────────────────────────────
// Replace the entire garbled heading 
html = html.replace(/\uFFFD\uFFFD‚¬ Key Advantages/g, () => { count++; return '★ Key Advantages'; });
html = html.replace(/[\uFFFD]+[‚€¬]+\s*Key Advantages/g, () => { count++; return '★ Key Advantages'; });
html = html.replace(/<h4[^>]*>[\uFFFD\x00-\x1f€‚¬Â°·¸]*\s*Key Advantages<\/h4>/g, () => { 
    count++;
    return '<h4 class="font-semibold text-orange-800 mb-2">★ Key Advantages</h4>'; 
});

// ── Garbled list bullets: â\uFFFDâ€¢ → bullet + text ─────────────────────────
html = html.replace(/â\uFFFD€Â¢\s*<strong>/g, () => { count++; return '<strong>'; });
html = html.replace(/<li>â\uFFFD€Â¢\s*/g, () => { count++; return '<li>'; });
html = html.replace(/<li>â[^\s<]+ /g, () => { count++; return '<li>'; });

// ── Garbled Right arrows in list items: â\uFFFD€— → → ─────────────────────────
html = html.replace(/â\uFFFD€[—–→]/g, () => { count++; return '→'; });
// Generic: any remaining â+FFFD sequence
html = html.replace(/â\uFFFD[^\s<"'`\\n]{1,4}/g, () => { count++; return ''; });

// ── Garbled emoji in static HTML ──────────────────────────────────────────────
// Camera 📸
html = html.replace(/ð[Ÿ\x9f][€\x80][œ\x9c][¸\xb8]/g, () => { count++; return '📸'; });
// Calendar 📅
html = html.replace(/ð[Ÿ\x9f][€\x80][œ\x9c][…\x85]/g, () => { count++; return '📅'; });
// Phone 📱
html = html.replace(/ð[Ÿ\x9f][€\x80][œ\x9c][±\xb1]/g, () => { count++; return '📱'; });
// Film 🎬
html = html.replace(/ð[Ÿ\x9f][€\x80][œ\x9c][·\xb7]/g, () => { count++; return '🎬'; });
// Map pin 📍
html = html.replace(/ð[Ÿ\x9f][€\x80][œ\x9c][°\xb0]/g, () => { count++; return '📍'; });
// Wrench 🔧
html = html.replace(/ð[Ÿ\x9f][€\x80][œ\x9c][\x94›]/g, () => { count++; return '🔧'; });
// Sparkles ✨
html = html.replace(/â[œŒ]¨/g, () => { count++; return '✨'; });

// ── Garbled → in time range display â€" ────────────────────────────────────────
// These are in JS template strings inside booking cards
rep("' â\u201A¬\x85 '", "' &ndash; '", 'time separator in template');
rep("' â€" '", "' – '", 'time separator dash');

// ── Fix "Email Service" heading missing emoji ──────────────────────────────────
html = html.replace(/<h4 class="font-semibold text-slate-800 mb-2">\s*Email Service<\/h4>/, 
    () => { count++; return '<h4 class="font-semibold text-slate-800 mb-2">📧 Email Service</h4>'; });

// ── Fix "Key Advantages" list items (li bullets) ─────────────────────────────
// Lines like: <li>â\uFFFD€Â¢ <strong>Full-Stack:</strong>...
html = html.replace(/<li>â[^<]*<strong>/g, () => { count++; return '<li><strong>'; });

// ── Replace remaining FFFD runs ────────────────────────────────────────────────
const fffdBefore = (html.match(/\uFFFD/g) || []).length;
html = html.replace(/[\uFFFD]+/g, '');
const fffdAfter = (html.match(/\uFFFD/g) || []).length;
if (fffdBefore > 0) {
    count += fffdBefore;
    console.log(`  ✅ [${fffdBefore}x] removed FFFD replacement chars`);
}

// ── Replace remaining U+0178 (Ÿ) artifacts ───────────────────────────────────
const yBefore = (html.match(/\u0178/g) || []).length;
html = html.replace(/ðŸ[\x00-\xff]/g, () => { count++; return ''; }); // leftover garbled emoji starts
const oe = (html.match(/\u0153/g) || []).length;
html = html.replace(/\u0153/g, () => { count++; return 'oe'; }); // oe ligature artifact

fs.writeFileSync('index.html', html, 'utf8');

console.log('\nReplacement summary:');
console.log('  Total changes:', count);
console.log('  FFFD removed:', fffdBefore - fffdAfter);
console.log('  oe-ligatures remaining:', (html.match(/\u0153/g)||[]).length);
console.log('  U+0178 remaining:', (html.match(/\u0178/g)||[]).length);
console.log('  FFFD remaining:', (html.match(/\uFFFD/g)||[]).length);
console.log('  File size change:', html.length - orig, 'bytes');

// Verify JS syntax
const s = html.lastIndexOf('<script>');
const e = html.lastIndexOf('</script>');
const js = html.substring(s + 8, e);
try { new Function(js); console.log('  ✅ JS syntax OK'); }
catch(err) { console.log('  ❌ JS SYNTAX ERROR:', err.message); }
