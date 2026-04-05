const fs = require('fs');
const content = fs.readFileSync('D:/Ilham/Documents/Proyek/TOKO BERSAMA APP/mobile-admin-dist/assets/index-B_elhFAt.js', 'utf8');
const p = content.indexOf('window.initReports=');
console.log(content.substring(p, p + 5000));
