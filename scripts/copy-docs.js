const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "src", "docs");
const dest = path.join(__dirname, "..", "dist", "docs");

function copy(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  for (const file of fs.readdirSync(src)) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.lstatSync(srcPath).isDirectory()) {
      copy(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copy(src, dest);
console.log("✅ Docs copied to dist/docs");
