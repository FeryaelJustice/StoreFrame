async (page) => {
  await page.goto('http://127.0.0.1:4322/es/');
  await page.getByRole('button', { name: 'Probar con un ejemplo', exact: true }).click();
  await page.locator('.shot-card').waitFor();
  await page.getByRole('textbox', { name: 'Nombre de la app opcional' }).fill('A little calm');
  await page.getByRole('textbox', { name: 'Texto de esta captura 1', exact: true }).fill('Un espacio para respirar.');
  await page.getByRole('textbox', { name: 'Primary hex', exact: true }).fill('#244d42');
  await page.getByRole('textbox', { name: 'Secondary hex', exact: true }).fill('#d9c38b');
  await page.getByRole('checkbox', { name: 'iOS / iPhone' }).check();
  await page.getByRole('checkbox', { name: 'Usar IA local' }).check();
  if (await page.locator('.style-options').count()) throw new Error('Template style choices should not control AI art');
  await page.getByRole('button', { name: 'Ondas y materiales', exact: true }).click();
  await page.getByRole('textbox', { name: 'Idea para el fondo opcional' }).fill('Sculptural folded paper ribbons, flowing botanical leaf-vein relief, deep emerald green and warm gold, dramatic soft light. Clearly visible layered shapes across the whole artwork.');
  await page.getByRole('button', { name: 'Generar capturas', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).waitFor();
  return { started: true, status: await page.locator('.generation-progress').innerText() };
}
