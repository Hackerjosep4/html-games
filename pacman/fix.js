const fs = require('fs');
let content = fs.readFileSync('pacman10-hp.12.js', 'utf8');

// The JS file references:
// /logos/2010/ (for audio) -> replace with ./
// /logos/pacman10-hp-sprite-3.png -> replace with ./pacman10-hp-sprite-3.png

content = content.replace(/\/logos\/2010\//g, './');
content = content.replace(/\/logos\/pacman10-hp-sprite-3\.png/g, './pacman10-hp-sprite-3.png');
// There might be a sprite 2 or 1 referenced in js but CSS uses pacman10-hp.2.png
content = content.replace(/\/logos\/pacman10-hp\.2\.png/g, './pacman10-hp.2.png');

fs.writeFileSync('pacman10-hp.12.js', content, 'utf8');
console.log('Done replacing paths in JS');
