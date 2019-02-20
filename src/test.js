const { lambdaHandler, proxy, indexPage } = require("./app");
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

let event = require("./req1.json");
let context = {};
let counter = 0;
let response = null
let callback = (_unused, response_) => {
  response = response_;
  counter++;
};
lambdaHandler(event, context, callback);
assert.equal(counter, 1);
assert.equal(response.uri, "/deno_logo_2.gif");

event = require("./req2.json");
lambdaHandler(event, context, callback);
assert.equal(counter, 2);
assert.equal(response.uri, "/index.html");
