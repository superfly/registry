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

  if (
    request.headers.accept &&
    request.headers.accept.some(header => header.value.includes("text/html"))
  ) {
    const response = await renderPretty(pathname, result);
    return callback(null, response);
  } else {
    // If we're not displaying HTML, proxy the body instead of redirecting.
    const fetch = require("node-fetch");
    const res = await fetch(url);
    const lambdaRes = await fetch2LambdaResponse(res);
    return callback(null, lambdaRes);
  }
};

const blacklistedHeaders = [
  // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-requirements-limits.html#lambda-blacklisted-headers
  "Connection",
  "Expect",
  "Keep-alive",
  "Proxy-Authenticate",
  "Proxy-Authorization",
  "Proxy-Connection",
  "Trailer",
  "Upgrade",
  "X-Accel-Buffering",
  "X-Accel-Charset",
  "X-Accel-Limit-Rate",
  "X-Accel-Redirect",
  "X-Amz-Cf-*",
  "X-Amzn-*",
  "X-Cache",
  "X-Edge-*",
  "X-Forwarded-Proto",
  "X-Real-IP",
  // Read only headers
  "Content-Length",
  "Host",
  "Transfer-Encoding",
  "Via",
  // Read-only Headers for CloudFront Origin Request Events
  "Accept-Encoding",
  "If-Modified-Since",
  "If-None-Match",
  "If-Range",
  "If-Unmodified-Since",
  "Range",
  // Others
  "x-github-request-id",
  "x-fastly-request-id",
  "x-geo-block-list",
  "x-served-by"
].map(n => n.toLowerCase());

function isBlacklistedHeader(name) {
  return blacklistedHeaders.indexOf(name.toLowerCase()) >= 0;
}

async function fetch2LambdaResponse(res) {
  if (res.status === 404) return response.notFound();
  // TODO(ry) use res.arrayBuffer() instead of res.text().
  const body = await res.text();
  const headers = {};
  res.headers.forEach(function(value, name) {
    if (!isBlacklistedHeader(name)) {
      headers[name] = [{ key: name, value }];
    }
  });
  return {
    status: res.status,
    body,
    headers
  };
}
