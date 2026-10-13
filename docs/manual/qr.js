// Prints a QR code as inline SVG for the manual's cover. Usage: node qr.js "<text>" [size]
// qrcode.min.js is qrcode-generator 1.4.4 by Kazuhiko Arase (MIT licence), unchanged.
const qrcode = require('./qrcode.min.js');
qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
const [text, size = '96'] = process.argv.slice(2);
const q = qrcode(0, 'M'); q.addData(text, 'Byte'); q.make();
const n = q.getModuleCount(), m = 4, t = n + 2 * m; let d = '';
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#1E2A4A"/></svg>`);
