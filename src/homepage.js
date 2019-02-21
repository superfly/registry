const DATABASE = require("./database.json");

const LOGO_PATH =
  "https://raw.githubusercontent.com/denoland/deno/master/website/deno_logo_2.gif";

const homepageHTML = /* HTML */ `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Deno Modules</title>

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
      <main>
        <img src="${LOGO_PATH}" width="150px" />
        <h1>Deno Modules</h1>

        <p>This is a URL redirection service for Deno scripts.</p>

        <p>
          The basic format is
          <code>https://deno.land/x/MODULE_NAME@BRANCH/SCRIPT.ts</code>. If you
          leave out the branch, it will default to master.
        </p>
        <h2>Standard</h2>

        <ul class="modules">
          <li>
            <code>https://deno.land/std/</code>
            <a href="https://github.com/denoland/deno_std">repo</a>
          </li>

          <li>
            <code>https://deno.land/core/</code>
            <a href="https://github.com/denoland/deno">repo</a>
          </li>
        </ul>

        <h2 id="modules">Third Party</h2>

        <ul class="modules">
          ${
            Object.entries(DATABASE)
              .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
              .map(([name, { repo }]) => {
                const link = `https://deno.land/x/${name}/`;
                return `<li><a href=${link}>${link}</a> — <a href="${repo}">Repo</a></li>`;
              })
              .join("\n")
          }
        </ul>

        <br />
        <h2 id="contributing">Contributing</h2>

        <p>
          To add a module send a pull request to
          <a href="https://github.com/denoland/registry">
            https://github.com/denoland/registry
          </a>
          with changes in <code>src/database.json</code>
        </p>
      </main>
    </body>
  </html>
`;

module.exports = homepageHTML;
