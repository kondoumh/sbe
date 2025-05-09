// this test requires the following environment variables
// - RUN_MODE: test
import { _electron, test, expect } from '@playwright/test';

let electronApp;
let mainWindow;

test.beforeEach(async ({ page }, testInfo) => {
  console.log(`Running ${testInfo.title}`);
  electronApp = await _electron.launch({ args: ['src/main.mjs'] });
  mainWindow = await electronApp.firstWindow();
  await mainWindow.waitForTimeout(3000);
});

test.afterEach(async ({ page }, testInfo) => {
  await electronApp.close();
});

test('launch app', async () => {
  const title = await mainWindow.title();
  expect(title).toBe('sbe - Scrapbox in Electron');
  await mainWindow.screenshot({ path: './test-results/main.png' });

  const packaged = await isPackaged();
  expect(packaged).toBe(false);

  const windows = await electronApp.windows();
  expect(windows.length).toBe(3);

  const titles = await Promise.all(windows.map(async (window) => await window.title()));
  expect(titles).toContain('Start page');
  expect(titles).toContain('Fav list');

  await windows[1].screenshot({ path: './test-results/child1.png' });
  await windows[2].screenshot({ path: './test-results/child2.png' });
});

async function isPackaged () {
  const result = await electronApp.evaluate(async ({ app }) => { return app.isPackaged; });
  return result;
}
