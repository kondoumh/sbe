const { _electron: electron } = require('playwright');
const { test, expect } = require('@playwright/test');

test('launch app', async () => {
  const electronApp = await electron.launch({ args: ['src/main.js'] });
  const mainWindow = await electronApp.firstWindow();
  await mainWindow.waitForTimeout(2000);
  const title = await mainWindow.title();
  expect(title).toBe('sbe');
  await mainWindow.screenshot({ path: './screenshot/main.png' });

  const packaged = await isPackaged(electronApp);
  expect(packaged).toBe(false);

  let windows = await electronApp.windows();
  expect(windows.length).toBe(2);
  console.log(await windows[1].title());
  await windows[1].screenshot({ path: './screenshot/child.png' });

  await mainWindow.click('#inspire > div.v-application--wrap > header > div.v-toolbar__content > header > div > button:nth-child(11)');
  await mainWindow.waitForTimeout(2000);
  windows = await electronApp.windows();
  expect(windows.length).toBe(3);
  await windows[2].screenshot({ path: './screenshot/favs.png' });

  await electronApp.close();
});

async function isPackaged (electronApp) {
  const result = await electronApp.evaluate(async ({ app }) => { return app.isPackaged; });
  return result;
}
