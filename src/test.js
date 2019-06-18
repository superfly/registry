const { lambdaHandler, proxy, indexPage } = require("./app");
const assert = require("assert");

async function tests() {
  const database = require("./database.json");
  // No dashes in the database.
  for (let key in database) {
    assert(key.indexOf("-") < 0);
  }

  assert.equal(
    proxy("/x/install/foo/bar.js"),
    "https://raw.githubusercontent.com/denoland/deno_install/master/foo/bar.js"
  );
  assert.equal(
    proxy("/x/install@v0.1.2/foo/bar.js"),
    "https://raw.githubusercontent.com/denoland/deno_install/v0.1.2/foo/bar.js"
  );

  let page = indexPage();
  assert(page.body.indexOf("html") >= 0);

  let event = require("./req1.json");
  const context = require("./context1.json");
  let counter = 0;
  let response = null;
  let callback = (_unused, response_) => {
    response = response_;
    counter++;
  };
  await lambdaHandler(event, context, callback);
  assert.equal(counter, 1);
  assert.equal(response.uri, "/deno_logo_2.gif");

  event = require("./req2.json");
  await lambdaHandler(event, context, callback);
  assert.equal(counter, 2);
  assert.equal(response.uri, "/index.html");

  event = require("./req3.json");
  await lambdaHandler(event, context, callback);
  assert.equal(counter, 3);
  assert.equal(response.status, "302");

  event = require("./req4.json");
  await lambdaHandler(event, context, callback);
  assert.equal(counter, 4);
  assert.equal(response.status, "302");
}

async function main() {
  try {
    await tests();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();
