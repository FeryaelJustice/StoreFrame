async (page) => {
  // Run after a successful real generation in this same persistent browser profile.
  const requests = [];
  const observe = request => requests.push({ method: request.method(), url: request.url() });
  page.on('request', observe);
  try {
    await page.goto('http://127.0.0.1:4322/es/');
    await page.getByRole('textbox', { name: 'Nombre de la app opcional' }).fill('StoreFrame AI');
    await page.locator('input[type=file]').setInputFiles('output/playwright/fixtures/screen-1.png');
    const caption = page.getByRole('textbox', { name: 'Texto de esta captura 1', exact: true });
    await caption.fill('Tu app, en su mejor escenario.');
    await page.getByRole('checkbox', { name: 'iOS / iPhone' }).check();
    await page.getByRole('checkbox', { name: 'Usar IA local' }).check();
    const started = Date.now();
    await page.getByRole('button', { name: 'Generar capturas', exact: true }).click();
    await page.getByRole('button', { name: 'Descargar ZIP', exact: true }).waitFor({ timeout: 180000 });
    if (await page.locator('.result-grid figure').count() !== 2) throw new Error('Expected two AI outputs');
    if (!(await page.locator('.result-mode').innerText()).includes('IA local')) throw new Error('Expected actual AI result');
    if (await caption.inputValue() !== 'Tu app, en su mejor escenario.') throw new Error('Caption lost');
    if (await page.getByRole('textbox', { name: 'Nombre de la app opcional' }).inputValue() !== 'StoreFrame AI') throw new Error('App name lost');
    if (requests.some(request => !['GET', 'HEAD'].includes(request.method))) throw new Error('Unexpected upload');
    const transfers = requests.filter(request => /\.(bin|onnx\.data)(\?|$)/.test(request.url));
    if (transfers.length) throw new Error(`Cached run transferred weights: ${transfers.length}`);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar ZIP', exact: true }).click();
    await (await download).saveAs('output/playwright/ai-streamed-cached.zip');
    return { actualAIOutputs: 2, retainedForm: true, weightTransfers: 0, uploadRequests: 0, elapsedMs: Date.now() - started };
  } finally { page.off('request', observe); }
}
