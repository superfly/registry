const fetch = require("node-fetch");

const response = require("./response");

module.exports = async function render(pathname, { url, repo }) {
  if (url.endsWith("/") || url.endsWith("/index.html")) {
    return require("./render_dir")(pathname, { url, repo });
  }

  const res = await fetch(url);
  if (res.status !== 200) return response.notFound();

  const content = await res.text();

  if (pathname.endsWith(".md")) {
    return require("./render_markdown")(pathname, content, repo);
  }

  return require("./render_code")(pathname, content, repo);
};
