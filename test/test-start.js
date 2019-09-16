const Application = require("spectron").Application;
const assert = require("assert");

let appPath;

if (process.platform == "darwin") {
  appPath = "sbe-darwin-x64/sbe.app/Contents/MacOS/sbe";  
}

const app = new Application({
  path: appPath
});

app.start().then(() => {
  return app.browserWindow.isVisible();
}).then(isVisible => {
  assert.equal(isVisible, true);
}).then(() => {
  console.log("Test succeed.");
  return app.stop();
}).catch(error => {
  console.error("Test failed", error.message);
});