async (page) => {
  // Synthetic artwork tests the Canvas compositor only, not model inference.
  await page.goto('http://127.0.0.1:4321/es/');
  return await page.evaluate(async () => {
    const { renderComposition } = await import('/src/lib/render.ts');
    const { DEFAULT_DESIGN } = await import('/src/lib/project.ts');
    const image = new Image(); image.src = '/demo-screen.svg'; await image.decode();
    const background = document.createElement('canvas'); background.width = background.height = 64;
    const ctx = background.getContext('2d');
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { ctx.fillStyle = (x + y) % 2 ? '#ff00ff' : '#00ffff'; ctx.fillRect(x * 8, y * 8, 8, 8); }
    const hashes = [];
    for (const style of ['clean', 'gradient', 'editorial']) {
      const canvas = await renderComposition({ image, sourceWidth: 390, sourceHeight: 844, caption: '', platform: 'Android', design: { ...DEFAULT_DESIGN, useAI: true, style, primary: '#244d42', secondary: '#d9c38b' }, background });
      const out = canvas.getContext('2d');
      for (const [x, y] of [[25, 400], [1000, 500], [25, 1500]]) {
        const rgb = [...out.getImageData(x, y, 1, 1).data.slice(0, 3)].join(',');
        if (!['255,0,255', '0,255,255'].includes(rgb)) throw new Error('Generated artwork was recolored or faded: ' + rgb);
      }
      hashes.push(canvas.toDataURL()); canvas.width = canvas.height = 0;
    }
    background.width = background.height = 0;
    if (new Set(hashes).size !== 1) throw new Error('Template style is affecting AI artwork');
    return { syntheticCompositor: true, unchangedGeneratedColors: true, fullOpacity: true, independentOfTemplate: true, actualInference: false };
  });
}
