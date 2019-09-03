const { lambdaHandler, proxy } = require("./app");
const assert = require("assert");

exports.tests = async function tests() {
  const database = require("./database.json");
  // No dashes in the database.
  for (let key in database) {
    assert(key.indexOf("-") < 0, "Key names with dashes are not allowed");
  }

  assert.deepEqual(proxy("/x/install/foo/bar.js"), {
    entry: {
      name: "install",
      raw: { type: "github", owner: "denoland", repo: "deno_install" },
      url: "https://raw.githubusercontent.com/denoland/deno_install/master/",
      repo: "https://github.com/denoland/deno_install"
    },
    path: "foo/bar.js"
  });
  assert.deepEqual(proxy("/x/install@v0.1.2/foo/bar.js"), {
    entry: {
      name: "install",
      raw: { type: "github", owner: "denoland", repo: "deno_install" },
      url: "https://raw.githubusercontent.com/denoland/deno_install/v0.1.2/",
      repo: "https://github.com/denoland/deno_install"
    },
    path: "foo/bar.js"
  });

  let event = require("./testdata/req1.json");
  const context = require("./testdata/context1.json");
  let counter = 0;
  let response = null;
  let callback = (_unused, response_) => {
    response = response_;
    counter++;
  };
  await lambdaHandler(event, context, callback);
  assert.equal(counter, 1);
  assert.equal(response.uri, "/deno_logo_2.gif");

  event = require("./testdata/req2.json");
  await lambdaHandler(event, context, callback);
  assert.equal(counter, 2);
  assert.equal(response.uri, "/index.html");

  event = require("./testdata/req3.json");
  await lambdaHandler(event, context, callback);
  assert.equal(counter, 3);
  assert.equal(response.status, "200");

  event = require("./testdata/req4.json");
  await lambdaHandler(event, context, callback);
  assert.equal(counter, 4);
  assert.equal(response.status, "200");

  event = require("./testdata/req5.json");
  await lambdaHandler(event, context, callback);
  assert.equal(counter, 5);
  assert.equal(response.status, "404");

  event = require("./testdata/req6.json");
  await lambdaHandler(event, context, callback);
  assert.equal(counter, 6);
  assert.equal(response.status, "200");

  event = require("./testdata/req7.json");
  await lambdaHandler(event, context, callback);
  assert.equal(counter, 7);
  assert.equal(response.status, "200");

  event = require("./testdata/req8.json");
  await lambdaHandler(event, context, callback);
  assert.equal(counter, 8);
  if (response.status !== "200") {
    console.error(response.body);
  }
  assert.equal(response.status, "200");
};

require("./test_utils").runIfMain(module);
