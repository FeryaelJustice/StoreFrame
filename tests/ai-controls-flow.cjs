async (page) => {
  for (const lang of ['es', 'en']) {
    const es = lang === 'es';
    await page.goto(`http://127.0.0.1:4322/${lang}/`);
    await page.getByRole('button', { name: /^Editorial/ }).click();
    await page.getByRole('checkbox', { name: es ? 'Usar IA local' : 'Use local AI' }).check();
    if (await page.locator('.style-options').count()) throw new Error('Template choices must not control AI');
    if (await page.locator('.ai-art-option').count() !== 4) throw new Error('Expected four independent art directions');
    await page.getByRole('button', { name: es ? 'Patrones geométricos' : 'Geometric patterns', exact: true }).click();
    await page.getByRole('textbox', { name: es ? 'Idea para el fondo opcional' : 'Background idea optional' }).fill('Faceted glass and botanical contours.');
    await page.setViewportSize({ width: 390, height: 844 });
    if (!await page.locator('.ai-art-controls').evaluate(el => el.scrollWidth <= el.clientWidth)) throw new Error('Creative controls overflow');
    await page.locator('.ai-panel').screenshot({ path: `output/playwright/ai-controls-${lang}.png` });
    await page.getByRole('checkbox', { name: es ? 'Usar IA local' : 'Use local AI' }).uncheck();
    if (await page.getByRole('button', { name: /^Editorial/ }).getAttribute('aria-pressed') !== 'true') throw new Error('Template selection should be retained');
  }
  return { independentCreativeControls: true, retainedTemplate: true, bilingual: true, mobileControls: true };
}
