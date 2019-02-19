const { proxy, indexPage } = require("./app");
const assert = require("assert");

assert.equal(
  proxy("/x/std/foo/bar.js"),
  "https://raw.githubusercontent.com/denoland/deno_std/master/foo/bar.js"
);
assert.equal(
  proxy("/x/std@v0.1.2/foo/bar.js"),
  "https://raw.githubusercontent.com/denoland/deno_std/v0.1.2/foo/bar.js"
);

let page = indexPage();
assert(page.body.indexOf("html") >= 0);
