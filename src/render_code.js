const path = require("path");
const linkifyUrls = require("linkify-urls");

const response = require("./response");
const { escapeHtml } = require("./utils");
const styles = require("./code_styles");
const scripts = require("./code_scripts");

module.exports = function renderCode(pathname, code, repo) {
  const url = `https://deno.land${pathname}`;

  const escapedLines = escapeHtml(code)
    .replace(/\s*$/, "")
    .split(/\r|\n|\r\n/g);
  const lineNumberedCode = escapedLines
    .map((content, i) => {
      const line = i + 1;
      return /* HTML */ `<span
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

  return response.success(/* HTML */ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="ie=edge" />
        <title>${escapeHtml(url)}</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/styles/default.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/styles/github-gist.min.css"
        />
        <link
          rel="stylesheet"
          media="(prefers-color-scheme: dark)"
          href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/styles/monokai-sublime.min.css"
        />
        <link rel="stylesheet" href="https://deno.land/style.css" />
        <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/highlight.min.js"></script>
        <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@9.14.2/build/languages/typescript.min.js"></script>
        <style>
          ${styles(maxNumberLength)}
        </style>
      </head>
      <body>
        <a href="${repo}">View repository on GitHub</a>
        <pre><code class="${path.extname(pathname).slice(1) ||
          "no-highlight"}">${lineNumberedCode}</code></pre>
        ${scripts}
      </body>
    </html>
  `);
};
