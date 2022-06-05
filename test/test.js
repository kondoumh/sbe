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
  expect(title).toBe('sbe');
  await mainWindow.screenshot({ path: './screenshot/main.png' });

  const packaged = await isPackaged();
  expect(packaged).toBe(false);

  const windows = await electronApp.windows();
  expect(windows.length).toBe(2);
  console.log(await windows[1].title());
  await windows[1].screenshot({ path: './screenshot/child.png' });
});

test('open fav page', async() => {
  await mainWindow.click('#inspire > div.v-application--wrap > header > div.v-toolbar__content > header > div > button:nth-child(11)');
  await mainWindow.waitForTimeout(2000);
  const windows = await electronApp.windows();
  expect(windows.length).toBe(3);
  await windows[2].screenshot({ path: './screenshot/favs.png' });
});

async function isPackaged () {
  const result = await electronApp.evaluate(async ({ app }) => { return app.isPackaged; });
  return result;
}
