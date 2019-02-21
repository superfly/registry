// TODO Cron job to update the database with current values.
const DATABASE = require("./database.json");
const homepageHTML = require("./homepage");
const { assert } = console;
const fetch = require("node-fetch");

async function serveDir(u) {
  return {
    status: "200",
    body: "Directories not yet supported.",
    headers: {
      "Content-Type": [
        {
          key: "Content-Type",
          value: "text/plain"
        }
      ]
    }
  };
}

async function fetchRemote(u) {
  // console.log("fetchRemote", u);

  if (u.endsWith("/") || u.endsWith("/index.html")) {
    return serveDir(u);
  }

  const res = await fetch(u);
  // console.log("res", res);
  const body = await res.text();
  // console.log("body", body);

  return {
    status: "200",
    body,
    headers: {
      "Content-Type": [
        {
          key: "Content-Type",
          value: "text/plain"
        }
      ]
    }
  };
}

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

const sourceHtmlPrefix = /* HTML */ `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/styles/default.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/styles/github-gist.min.css"
      />
      <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/highlight.min.js"></script>
      <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/languages/typescript.min.js"></script>

      <link rel="stylesheet" href="https://deno.land/style.css" />

      <meta content="width=device-width, initial-scale=1.0" name="viewport" />
    </head>
    <body>
      <main><pre></pre></main>
    </body>
  </html>
`;

exports.lambdaHandler = async (event, context, callback) => {
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
    callback(null, indexPage());
    return;
  }

  const l = proxy(pathname);
  if (!l) {
    // Do not process if not in proxy. Forwards to deno.land s3 bucket.
    return callback(null, request);
  }

  //const response = await fetchRemote(l);
  //callback(null, response);

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
