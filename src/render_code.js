const path = require("path");

const response = require("./response");
const { escapeHtml } = require("./utils");
const styles = require("./code_styles");
const scripts = require("./code_scripts");
const { transformModuleSpecifier } = require("./transpile_code");
const { annotate } = require("./analyze_code");

module.exports = function renderCode(pathname, code, repo, opts = {}) {
  const url = `https://deno.land${pathname}`;

  const escapedLines = annotate(pathname, code).split("\n");
  const lineNumberedCode = escapedLines
    .map((content, i) => {
      const line = i + 1;
      return (
        `<span id="L${line}" class="numbered-line${content ? "" : " empty"}">` +
        `<a href="#L${line}" class="line-number" data-line="${line}"></a>` +
        content +
        `</span>`
      );
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
        <a href="${repo}">View repository on GitHub</a> <br /><br /><em>
          ${pathname.endsWith(".ts")
            ? opts.compiled
              ? `This file has been compiled to JS. <a href="${url}">View the original version here</a>.`
              : `deno.land can automatically transpile this file. <a href="${transformModuleSpecifier(
                  pathname,
                  pathname
                )}">View the transpiled version</a>.`
            : "deno.land can’t automatically transpile this file. If you think it should be able to, open an issue!"}
        </em>
        <pre><code class="${path.extname(pathname).slice(1) ||
          "no-highlight"}">${lineNumberedCode}</code></pre>
        ${scripts}
      </body>
    </html>
  `);
};
