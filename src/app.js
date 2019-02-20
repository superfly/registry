// TODO Cron job to update the database with current values.
const DATABASE = require("./database.json");
const homepageHTML = require("./homepage");
const { assert } = console;

const notFound = {
  status: "404",
  headers: {
    "Content-Type": [
      {
        key: "Content-Type",
        value: "text/plain"
      }
    ]
  },
  body: "Not Found\r\n"
};

function proxy(pathname) {
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
  return url + rest;
}
exports.proxy = proxy;

function indexPage() {
  return {
    status: "200",
    body: homepageHTML,
    headers: {
      "Content-Type": [
        {
          key: "Content-Type",
          value: "text/html"
        }
      ]
    }
  };
}
exports.indexPage = indexPage;

exports.lambdaHandler = (event, context, callback) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  const { request } = event.Records[0].cf;

  const olduri = request.uri;
  request.uri = olduri.replace(/\/$/, "/index.html");
  if (olduri !== request.uri) {
    console.log("rewrite uri", olduri, request.uri);
  }

  const pathname = request.uri;
  console.log("pathname", pathname);

  if (pathname === "/x/" || pathname === "/x" || pathname === "/x/index.html") {
    callback(null, indexPage());
    return;
  }

  const l = proxy(pathname);
  if (!l) {
    // Do not process if not in proxy. Forwards to deno.land s3 bucket.
    return callback(null, request);
  }

  console.log("redirect", pathname, l);
  const response = {
    status: "302",
    headers: {
      location: [
        {
          key: "Location",
          value: l
        }
      ],
      "access-control-allow-origin": [
        {
          key: "Access-Control-Allow-Origin",
          value: "*"
        }
      ]
    }
  };
  callback(null, response);
};
