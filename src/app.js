// TODO Cron job to update the database with current values.
const DATABASE = require("./database.json");
const homepageHTML = require("./homepage");
const { assert } = console;

const response = require("./response");
const renderPretty = require("./render");

function proxy(pathname) {
  if (pathname.startsWith("/core") || pathname.startsWith("/std")) {
    return proxy("/x" + pathname);
  }
  if (!pathname.startsWith("/x/")) {
    return null;
  }

  const i = pathname.indexOf("/", 3);
  const rest = pathname.slice(i + 1);
  const nameBranch = pathname.slice(3, i);
  let [name, branch] = nameBranch.split("@", 2);
  const urlPattern = DATABASE[name] ? DATABASE[name].url : null;

  if (!branch) {
    branch = "master";
  }

  if (!urlPattern) {
    return null;
  }

  const url = urlPattern.replace("${b}", branch);
  assert(url.endsWith("/"));
  assert(!rest.startsWith("/"));
  return {
    url: url + rest,
    repo: DATABASE[name].repo
  };
}
exports.proxy = proxy;

exports.lambdaHandler = async function lambdaHandler(event, context, callback) {
  context.callbackWaitsForEmtpyEventLoop = false;
  // console.log("event:", JSON.stringify(event, null, 2));
  // console.log("context:", JSON.stringify(context, null, 2));
  const { request } = event.Records[0].cf;

  const olduri = request.uri;
  request.uri = olduri.replace(/\/$/, "/index.html");
  if (olduri !== request.uri) {
    console.log("rewrite uri", olduri, request.uri);
  }

  const pathname = request.uri;
  // console.log("pathname", pathname);

  if (pathname === "/x/" || pathname === "/x" || pathname === "/x/index.html") {
    callback(null, response.success(homepageHTML));
    return;
  }

  const result = proxy(pathname);
  if (!result) {
    // Do not process if not in proxy. Forwards to deno.land s3 bucket.
    return callback(null, request);
  }
  const { url, repo } = result;

  // URLs from error messages, i.e. https://deno.land/std/http/server.ts:10:24
  const lineAndColumnMatch = pathname.match(/:(\d+)(?::\d+)?$/);
  if (lineAndColumnMatch) {
    return callback(
      null,
      response.redirect(pathname.replace(/:(\d+)(?::\d+)?$/, "#L$1"))
    );
  }

  const response_ = await renderPretty(request, pathname, result);
  return callback(null, response_);
};
