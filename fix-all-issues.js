// Comprehensive fix script for LensLink index.html
const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
const origLen = html.length;
let fixes = 0;

function replace(oldStr, newStr, desc) {
    if (html.includes(oldStr)) {
        html = html.split(oldStr).join(newStr);
        fixes++;
        console.log('✅ Fixed:', desc);
    } else {
        console.log('⚠️  Not found:', desc);
    }
}

// ─── 1. FIX portfolio display: use imageUrl key ───────────────────────────────
replace(
    `<img src="\${item.data || item}" `,
    `<img src="\${item.imageUrl || item.data || (typeof item === 'string' ? item : '')}" `,
    'Portfolio public display imageUrl key'
);

// ─── 2. FIX "no bookings" placeholder garbled emoji ─────────────────────────
// Find and replace the no-bookings innerHTML with garbled emoji
const noBookOrigPatterns = [
    `'<div class="text-center py-8"><div class="text-5xl mb-3">`,
    `'<div class="text-center py-8"><div class="text-5xl mb-3">`
];
// Use a regex replacement instead
html = html.replace(
    /<div class="text-center py-8"><div class="text-5xl mb-3">[^<]*<\/div><p class="text-slate-500">No bookings yet\. Clients will find you through your profile!<\/p><\/div>/,
    '<div class="text-center py-12 text-slate-400"><p class="text-4xl mb-4">📅</p><p class="text-base">No bookings yet. Clients will find you through your profile!</p></div>'
);
console.log('✅ Fixed: no-bookings placeholder');

// ─── 3. FIX booking card template - replace entire template ──────────────────
// Find markers
const CARD_START = `                        return \`
                            <div class="bg-white border`;
const CARD_END = `                        \`;\n                    }).join('');`;

const startIdx = html.lastIndexOf(CARD_START);
const endIdx = html.lastIndexOf(CARD_END);

if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const newCard = `                        return \`
                            <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                                <div class="flex items-start justify-between gap-3">
                                    <div class="flex items-start gap-3">
                                        <img src="\${clientImg}" alt="\${clientName}"
                                             class="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-slate-100">
                                        <div>
                                            <h4 class="font-semibold text-slate-800 text-base">\${clientName}</h4>
                                            <p class="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                                <svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                                \${clientEmail}
                                            </p>
                                            \${clientPhone ? \`<p class="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><svg class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>\${clientPhone}</p>\` : ''}
                                        </div>
                                    </div>
                                    <span class="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap \${statusColors[status] || statusColors.pending}">
                                        \${status.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
                                    </span>
                                </div>

                                <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 rounded-lg p-3 text-sm">
                                    <div>
                                        <p class="text-slate-400 text-xs uppercase tracking-wide font-medium">Date</p>
                                        <p class="text-slate-800 font-medium mt-0.5">\${formatDate(bookingDate)}</p>
                                    </div>
                                    <div>
                                        <p class="text-slate-400 text-xs uppercase tracking-wide font-medium">Time</p>
                                        <p class="text-slate-800 font-medium mt-0.5">\${formatTime(startTime)}\${endTime ? ' &ndash; ' + formatTime(endTime) : ''}</p>
                                    </div>
                                    <div>
                                        <p class="text-slate-400 text-xs uppercase tracking-wide font-medium">Type</p>
                                        <p class="text-slate-800 font-medium mt-0.5 capitalize">\${eventType || '&mdash;'}</p>
                                    </div>
                                    \${location ? \`<div><p class="text-slate-400 text-xs uppercase tracking-wide font-medium">Location</p><p class="text-slate-800 font-medium mt-0.5">\${location}</p></div>\` : ''}
                                </div>

                                \${notes ? \`<div class="mt-3 p-3 bg-orange-50 border border-orange-100 rounded-lg"><p class="text-xs text-orange-700 uppercase tracking-wide font-semibold mb-1">Notes</p><p class="text-slate-700 text-sm">\${notes}</p></div>\` : ''}

                                <div class="mt-4 flex justify-between items-center">
                                    <p class="font-bold text-orange-600 text-base">Total: $\${total}</p>
                                    <div class="flex gap-2">
                                        \${status === 'pending' ? \`
                                            <button onclick="updateBookingStatusAPI('\${bId}', 'confirmed')"
                                                    class="px-4 py-1.5 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors">Confirm</button>
                                            <button onclick="updateBookingStatusAPI('\${bId}', 'cancelled')"
                                                    class="px-4 py-1.5 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors">Decline</button>
                                        \` : status === 'confirmed' ? \`
                                            <button onclick="updateBookingStatusAPI('\${bId}', 'completed')"
                                                    class="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors">Mark Complete</button>
                                        \` : ''}
                                    </div>
                                </div>

                                <p class="mt-2 text-xs text-slate-400">Booking ID: \${bId}</p>
                            </div>
                        \`;
                    }).join('');`;

    html = html.substring(0, startIdx) + newCard + html.substring(endIdx + CARD_END.length);
    fixes++;
    console.log('✅ Fixed: Booking card template replaced with clean SVG-icon version');
} else {
    console.log('⚠️  Could not locate booking card template boundaries. startIdx:', startIdx, 'endIdx:', endIdx);
}

// ─── 4. FIX garbled text in booking card "no bookings" + console.log strings ─
// Replace garbled emoji sequences in console.log strings with plain text
html = html.replace(/ðŸ[\x00-\xff]\x9f\x80[\x00-\xff]/g, '');
html = html.replace(/â\uFFFD€[^\s<"'`]/g, '→');
html = html.replace(/â[\x00-\xff]\uFFFD[^\s<"'`]/g, '');

// ─── 5. FIX portfolio "View PDF" button garbled emoji ────────────────────────
replace(
    `ðŸ\x9f\x80\\x9c\x8c View Portfolio PDF`,
    '📄 View Portfolio PDF',
    'Portfolio PDF button emoji'
);

// ─── 6. VERIFY normalizePhotographer has experience ─────────────────────────
if (html.includes('experience: p.experience')) {
    console.log('✅ Verified: normalizePhotographer has experience field');
} else {
    console.log('⚠️  normalizePhotographer missing experience - adding...');
    replace(
        `                hourlyRate: p.pricing ? p.pricing.hourlyRate : 150,\n                portfolio: p.portfolio || [],`,
        `                hourlyRate: p.pricing ? p.pricing.hourlyRate : 150,\n                experience: p.experience ? (p.experience.years || p.experience.yearsOfExperience || 0) : 0,\n                phone: p.user ? (p.user.phone || '') : '',\n                portfolio: p.portfolio || [],`,
        'normalizePhotographer experience+phone'
    );
}

// ─── 7. FIX "Schedule Your Photography Session" heading emoji ───────────────
// Replace the garbled camera emoji in the heading
html = html.replace(
    /ðŸ[\x00-\xff]\x9f\x80[\x00-\xff]\x9c[\x00-\xff] Schedule Your Photography Session/g,
    '📸 Schedule Your Photography Session'
);

// Save
fs.writeFileSync('index.html', html, 'utf8');
console.log('\nTotal fixes applied:', fixes);
console.log('File size change:', html.length - origLen, 'bytes');

// Verify JS syntax
const s = html.lastIndexOf('<script>');
const e = html.lastIndexOf('</script>');
const js = html.substring(s + 8, e);
try { new Function(js); console.log('✅ JS syntax OK'); }
catch(err) { console.log('❌ JS SYNTAX ERROR:', err.message); }
