
const { proxy } = require("./app");
const assert = require("assert");

assert.equal(proxy("/x/net/main.js"),
  "https://raw.githubusercontent.com/denoland/net/master/main.js");
assert.equal(proxy("/x/net/foo/bar.js"),
  "https://raw.githubusercontent.com/denoland/net/master/foo/bar.js");
assert.equal(proxy("/x/net@v0.1.2/foo/bar.js"),
  "https://raw.githubusercontent.com/denoland/net/v0.1.2/foo/bar.js");
