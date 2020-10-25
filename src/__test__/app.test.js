const Application = require("spectron").Application;
const electron = require("electron");
const path = require("path");
const fs = require("fs").promises;

jest.setTimeout(20000)
let app = null;

const scDir = __dirname + path.sep + "screenshot" + path.sep;

beforeAll(() => {
  app = new Application({
    path: electron,
    args: [path.join(__dirname, "..", "main.js")]
  });
  return app.start();
});

afterAll(() => {
  if (app && app.isRunning()) {
    return app.stop();
  }
});

async function captureScreen(fileName) {
  const image = await app.browserWindow.capturePage();
  await fs.mkdir(scDir, { recursive: true });
  await fs.writeFile(scDir + fileName, image);
}

test("Application window should be opened", async () => {
  const isVisible = await app.browserWindow.isVisible();
  expect(isVisible).toBe(true);
  const title = await app.client.getTitle();
  expect(title).toBe("sbe - Scrapbox in Electron");
  captureScreen("top.png");
});

test("Applicaiton audit accessibility", async () => {
  const audit = await app.client.auditAccessibility({
      ignoreWarnings: true,
      ignoreRules: ["AX_TEXT_01"]
    });
  expect(audit.failed).toBe(false);
});

test("Open public project", async () => {
  const inputUrl = await app.client.$("#open_url");
  await inputUrl.setValue("https://scrapbox.io/kondoumh");
  await app.client.keys("Enter");
  await new Promise(r => setTimeout(r, 10000));
  captureScreen("public_page.png");
});
