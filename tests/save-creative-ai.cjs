async (page) => {
  const prefix = (await page.locator('.ai-art-option[aria-pressed=true]').innerText()).includes('Inspirarse') ? 'ai-auto' : 'ai-creative';
  await page.getByRole('button', { name: 'Descargar ZIP', exact: true }).waitFor({ timeout: 60000 });
  if (await page.locator('.result-grid figure').count() !== 2) throw new Error('Expected two actual AI compositions');
  if (!(await page.locator('.result-mode').innerText()).includes('IA local')) throw new Error('Missing explicit AI result label');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar ZIP', exact: true }).click();
  await (await pending).saveAs(`output/playwright/${prefix}.zip`);
  await page.getByText('Ver el fondo que imaginó la IA', { exact: true }).click();
  const raw = page.locator('.ai-background-result img'); await raw.evaluate(image => image.decode());
  const background = await raw.getAttribute('src');
  const rawDownload = page.waitForEvent('download');
  await page.evaluate(url => { const a = document.createElement('a'); a.href = url; a.download = 'background.png'; a.click(); }, background);
  await (await rawDownload).saveAs(`output/playwright/${prefix}-background.png`);
  await page.setViewportSize({ width: 1360, height: 1100 });
  await page.locator('.results').screenshot({ path: `output/playwright/${prefix}-results.png` });
  return { actualAI: true, compositions: 2, originalGeneratedBackground: true };
}
