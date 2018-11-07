// TODO Cron job to update the database with current Firebase values.
const DATABASE = require("./database.json");

function notFound() {
  return {
    status: "404",
    body: "Not Found\r\n"
  };
}

function proxy(pathname) {
  if (!pathname.startsWith("/x/")) {
    return notFound();
  }

  const i = pathname.indexOf("/", 3);
  const name = pathname.slice(3, i);
  const rest = pathname.slice(i);
  const proxyUrl = DATABASE[name];

  if (!proxyUrl) {
    return notFound();
  }

  const l = proxyUrl + rest;
  console.log("redirect", pathname, l);
  return {
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
}

exports.lambdaHandler = (event, context, callback) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  const pathname = event.Records[0].cf.request.uri;
  console.log("pathname", pathname);
  const response = proxy(pathname);
  callback(null, response);
};
