import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const commonOptions = {
  bundle: true,
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
  target: 'chrome120',
};

const entryPoints = [
  { in: 'src/background/service-worker.ts', out: 'dist/background/service-worker', format: 'esm' },
  { in: 'src/content/ezmig-bridge.ts', out: 'dist/content/ezmig-bridge', format: 'iife' },
  { in: 'src/content/uscis-filler.ts', out: 'dist/content/uscis-filler', format: 'iife' },
  { in: 'src/popup/popup.ts', out: 'dist/popup/popup', format: 'iife' },
];

async function build() {
  for (const entry of entryPoints) {
    const ctx = await esbuild.context({
      ...commonOptions,
      entryPoints: [entry.in],
      outfile: `${entry.out}.js`,
      format: entry.format,
    });

    if (isWatch) {
      await ctx.watch();
      console.log(`Watching ${entry.in}...`);
    } else {
      await ctx.rebuild();
      await ctx.dispose();
      console.log(`Built ${entry.out}.js`);
    }
  }

  // Copy CSS
  const fs = await import('fs');
  const path = await import('path');

  const overlayDir = 'dist/overlay';
  if (!fs.existsSync(overlayDir)) {
    fs.mkdirSync(overlayDir, { recursive: true });
  }

  if (fs.existsSync('src/overlay/overlay.css')) {
    fs.copyFileSync('src/overlay/overlay.css', path.join(overlayDir, 'overlay.css'));
    console.log('Copied overlay.css');
  }

  // Copy popup HTML
  const popupDir = 'dist/popup';
  if (!fs.existsSync(popupDir)) {
    fs.mkdirSync(popupDir, { recursive: true });
  }
  if (fs.existsSync('src/popup/popup.html')) {
    fs.copyFileSync('src/popup/popup.html', path.join(popupDir, 'popup.html'));
    console.log('Copied popup.html');
  }

  if (!isWatch) {
    console.log('Build complete!');
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
