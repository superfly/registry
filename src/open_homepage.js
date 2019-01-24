const { createServer } = require("http");
const homepageHTML = require("./homepage");

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(homepageHTML);
});

server.listen(3000, () => {
  console.log("Listening on http://localhost:3000");
});
