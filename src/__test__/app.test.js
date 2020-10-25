const Application = require("spectron").Application;
const electron = require("electron");
const path = require("path");

jest.setTimeout(20000)
let app = null;

beforeAll(function() {
  app = new Application({
    path: electron,
    args: [path.join(__dirname, "..", "main.js")]
  });
  return app.start();
});

afterAll(function() {
  if (app && app.isRunning()) {
    return app.stop();
  }
});

test("Application window should be opened", async () => {
  let isVisible = await app.browserWindow.isVisible();
  expect(isVisible).toBe(true);
  let title = await app.client.getTitle();
  expect(title).toBe("sbe - Scrapbox in Electron");
});
