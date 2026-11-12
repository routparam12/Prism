import { createDrawingScript } from './generate-sprite.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Sprite Generator</title></head>
<body>
<script>
window.generateSprite = () => {
  ${createDrawingScript()}
};
</script>
</body>
</html>`;

const tempHtml = path.join(rootDir, 'tools', 'temp-generator.html');
fs.writeFileSync(tempHtml, htmlContent, 'utf-8');
console.log('Temporary HTML generator created at:', tempHtml);
