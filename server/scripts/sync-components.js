const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../../assets/scripts/ecs/networkcomponents');
const targetDir = path.join(__dirname, '../networkcomponents');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`源目录不存在: ${src}`);
    return;
  }

  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  
  fs.mkdirSync(dest, { recursive: true });
  
  const items = fs.readdirSync(src);
  
  for (const item of items) {
    if (item.endsWith('.meta')) continue;
    
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    
    const stat = fs.statSync(srcPath);
    
    if (stat.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('同步networkcomponents...');
copyRecursive(sourceDir, targetDir);
console.log('同步完成!');