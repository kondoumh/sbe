const { _electron: electron } = require('playwright');
const { test, expect } = require('@playwright/test');

let electronApp;
let mainWindow;

test.beforeEach(async ({ page }, testInfo) => {
  console.log(`Running ${testInfo.title}`);
  electronApp = await electron.launch({ args: ['src/main.js'] });
  mainWindow = await electronApp.firstWindow();
  await mainWindow.waitForTimeout(2000);
});

test.afterEach(async ({ page }, testInfo) => {
  await electronApp.close();
});

test('launch app', async () => {
  const title = await mainWindow.title();
  expect(title).toBe('sbe - Scrapbox in Electron');
  await mainWindow.screenshot({ path: './screenshot/main.png' });

  const packaged = await isPackaged();
  expect(packaged).toBe(false);

  const windows = await electronApp.windows();
  expect(windows.length).toBe(3);
  expect(await windows[1].title()).toBe('Start page');
  await windows[1].screenshot({ path: './screenshot/child1.png' });
  await windows[2].screenshot({ path: './screenshot/child2.png' });
});

async function isPackaged () {
  const result = await electronApp.evaluate(async ({ app }) => { return app.isPackaged; });
  return result;
}
