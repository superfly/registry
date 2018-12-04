// TODO Cron job to update the database with current values.
const DATABASE = require("./database.json");
const { assert } = console;

function notFound() {
  return {
    status: "404",
    body: "Not Found\r\n"
  };
}

exports.proxy = (pathname) => {
  if (!pathname.startsWith("/x/")) {
    return notFound();
  }

  const i = pathname.indexOf("/", 3);
  const rest = pathname.slice(i + 1);
  assert(!rest.startsWith("/"));
  const nameBranch = pathname.slice(3, i);
  let [name, branch] = nameBranch.split("@", 2);
  const urlPattern = DATABASE[name];

  if (!branch) {
    branch = "master";
  }

  if (!urlPattern) {
    return notFound();
  }

  const url = urlPattern.replace("${b}", branch);
  assert(url.endsWith("/"));
  return url + rest;
}

exports.lambdaHandler = (event, context, callback) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  const pathname = event.Records[0].cf.request.uri;
  console.log("pathname", pathname);
  const l = proxy(pathname);
  console.log("redirect", pathname, l);
  const response = {
    status: "302",
    headers: {
      location: [
        {
          key: "Location",
          value: l
        }
      ]
    }
  };
  callback(null, response);
};
