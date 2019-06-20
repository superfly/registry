// TODO Cron job to update the database with current values.
const DATABASE = require("./database.json");
const homepageHTML = require("./homepage");
const { assert } = console;
const fetch = require("node-fetch");
const path = require("path");
const linkifyUrls = require("linkify-urls");

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

async function fetchRemote(u, pathname, repo) {
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
    body: renderPrettyCode(pathname, body, repo),
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

const redirect = dest => ({
  status: "302",
  headers: {
    location: [
      {
        key: "Location",
        value: dest
      }
    ],
    "access-control-allow-origin": [
      {
        key: "Access-Control-Allow-Origin",
        value: "*"
      }
    ]
  }
});

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

  const result = proxy(pathname);
  if (!result) {
    // Do not process if not in proxy. Forwards to deno.land s3 bucket.
    return callback(null, request);
  }
  const { url: l, repo } = result;

  // URLs from error messages, i.e. https://deno.land/std/http/server.ts:10:24
  const lineAndColumnMatch = pathname.match(/:(\d+)(?::\d+)?$/);
  if (lineAndColumnMatch) {
    return callback(
      null,
      redirect(pathname.replace(/:(\d+)(?::\d+)?$/, "#L$1"))
    );
  }

  //const response = await fetchRemote(l);
  //callback(null, response);

  if (
    request.headers.accept &&
    request.headers.accept.some(header => header.value.includes("text/html"))
  ) {
    const response = await fetchRemote(l, pathname, repo);
    return callback(null, response);
  }

  console.log("redirect", pathname, l);
  callback(null, redirect(l));
};

function renderPrettyCode(pathname, code, repo) {
  const url = `https://deno.land${pathname}`;
  const ext = path.extname(pathname);

  let language = "";

  switch (ext) {
    case ".ts":
      language = "typescript";
      break;
    case ".js":
      language = "javascript";
      break;
    // otherwise rely on autodetection
  }

  const escapedLines = escapeHtml(code)
    .trimEnd()
    .split(/\r|\n|\r\n/g);
  const lineNumberedCode = escapedLines
    .map((content, i) => {
      const line = i + 1;
      return `<span
        id="L${line}"
        class="numbered-line${content ? "" : " empty"}"
        ><a
          href="#L${line}"
          class="line-number"
          data-line="${line}"
        ></a
        >${linkifyUrls(content)}</span
      >`.replace(/\n\s+/g, " ");
    })
    .join("\n");
  const maxNumberLength = String(escapedLines.length).length;

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>${escapeHtml(url)}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/styles/default.min.css">
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/styles/github-gist.min.css">
      <link rel="stylesheet" media="(prefers-color-scheme: dark)" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/styles/monokai-sublime.min.css">
      <link rel="stylesheet" href="https://deno.land/style.css">
      <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/highlight.min.js"></script>
      <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/languages/typescript.min.js"></script>
      <style>
        body {
          --highlight-border-radius: 5px;
          max-width: calc(80ex + ${maxNumberLength + 3}ex);
        }
        pre, code.hljs {
          position: relative;
          padding-left: 0;
          padding-right: 0;
          background: transparent;
        }
        pre a {
          color: inherit;
        }
        .numbered-line {
          display: inline-block;
          padding-left: ${maxNumberLength + 4}ex;
          width: 100%;
          box-sizing: border-box;
          border-radius: var(--highlight-border-radius);
        }
        .numbered-line.empty::after {
          content: ' '; /* fix positioning of line numbers on blank lines */
        }

        .numbered-line.highlighted {
          border-radius: 0;
        }
        .numbered-line:not(.highlighted) + .numbered-line.highlighted {
          border-top-left-radius: var(--highlight-border-radius);
          border-top-right-radius: var(--highlight-border-radius);
        }
        .numbered-line.last-highlight {
          border-bottom-left-radius: var(--highlight-border-radius);
          border-bottom-right-radius: var(--highlight-border-radius);
        }
        .numbered-line:target,
        .numbered-line.highlighted {
          background: rgba(255, 225, 0, 0.33);
        }
        @media (prefers-color-scheme: dark) {
          .numbered-line:target,
          .numbered-line.highlighted {
            background: rgba(255, 232, 63, 0.33);
          }
        }
        .line-number {
          position: absolute;
          text-decoration: none;
          left: 1ex;
        }
        .line-number::before {
          content: attr(data-line);
          display: inline-block;
          width: ${maxNumberLength + 1}ex;
          text-align: right;
          opacity: 0.33;
        }
      </style>
  </head>
  <body>
      <a href="${repo}">View repository on GitHub</a>
      <pre><code class="${language}">${lineNumberedCode}</code></pre>

      <script>
        (${() => {
          hljs.initHighlighting();

          for (const keyword of document.querySelectorAll(".hljs-keyword")) {
            if (
              keyword.textContent !== "import" &&
              keyword.textContent !== "export"
            )
              continue;
            let source = keyword;
            let line = keyword.parentNode;
            while (source.className !== "hljs-string") {
              // e.g. `export class`, `export const`
              if (
                source.className === "hljs-keyword" &&
                !["import", "export", "default", "as", "from"].includes(
                  source.textContent
                )
              ) {
                source = null;
                break;
              }
              source = source.nextElementSibling;
              while (!source) {
                line = line.nextElementSibling;
                // children[0] is the line number
                source = line.children[1];
              }
            }
            if (!source) continue;
            if (source.children.length > 0) continue; // already linkified
            source.innerHTML = `<a href=${source.textContent}>${
              source.innerHTML
            }</a>`;
          }
        }})()
      </script>
      <script>
        (${() => {
          const parseHash = () => {
            const singleMatch = location.hash.match(/^#L(\d+)$/);
            const rangeMatch = location.hash.match(/^#L(\d+)-L(\d+)$/);
            if (singleMatch) {
              return { type: "single", line: +singleMatch[1] };
            } else if (rangeMatch) {
              return {
                type: "range",
                start: +rangeMatch[1],
                end: +rangeMatch[2]
              };
            } else {
              return null;
            }
          };

          const onHashChange = event => {
            for (const el of document.querySelectorAll(
              ".numbered-line.highlighted"
            )) {
              el.classList.remove("highlighted", "last-highlight");
            }

            const hash = parseHash();
            if (!hash) return;
            if (hash.type === "single") {
              // ensure proper behavior on reload
              document.getElementById("L" + hash.line).scrollIntoView();
            } else if (hash.type === "range") {
              for (let line = hash.start; line <= hash.end; line++) {
                const el = document.getElementById("L" + line);
                el.classList.add("highlighted");
                if (line === hash.end) {
                  el.classList.add("last-highlight");
                }
              }
              document.getElementById("L" + hash.start).scrollIntoView();
            }
            document.body.scrollTop -= 19 * 3.5;
          };
          requestAnimationFrame(onHashChange);
          addEventListener("hashchange", onHashChange);

          document.querySelector("pre").addEventListener("click", event => {
            if (!event.target.classList.contains("line-number")) return;
            if (event.shiftKey) {
              const hash = parseHash();
              if (!hash) return;

              event.preventDefault();
              const clickedLine = +event.target.dataset.line;
              if (hash.type === "single") {
                location.hash =
                  "#L" +
                  [hash.line, clickedLine].sort((a, b) => a - b).join("-");
              } else if (hash.type === "range") {
                if (clickedLine <= hash.start) {
                  location.hash = `#L${clickedLine}-L${hash.end}`;
                } else {
                  location.hash = `#L${hash.start}-L${clickedLine}`;
                }
              }
            }
          });
        }})()
      </script>
  </body>
  </html>
  `;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
