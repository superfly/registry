const { escapeHtml, html } = require("./utils");
const octicons = require("@primer/octicons");

/**
 * @param  {string} moduleRoot e.g. '/x/foo/'
 * @param  {string} path e.g. 'bar/baz/mod.ts' or 'bar/baz/'
 */
module.exports = function renderBreadcrumbs(pathname, entry) {
  let url = "/";
  const crumbs = [
    html`
      <span class="subtle">https://deno.land</span>
    `
  ];
  const segments = pathname.replace(/^\/|\/$/g, "").split("/");
  for (const [i, segment] of segments.map((s, i) => [i, s])) {
    url += segment + "/";
    crumbs.push(
      html`
        <wbr /><span class="slash">/</span>
      `
    );
    if (i === segments.length - 1) {
      crumbs.push(
        html`
          <strong>${escapeHtml(segment)}</strong>
        `
      );
    } else {
      crumbs.push(
        html`
          <a href="${url}">${escapeHtml(segment)}</a>
        `
      );
    }
    if ((i === 0 && segment === "std") || (i === 1 && segments[0] === "x")) {
      crumbs.push(html`
        &nbsp;<a href="${entry.repo}"
          >${(entry.raw.type === "github"
            ? octicons["mark-github"]
            : octicons.repo
          ).toSVG({
            "aria-label": "View Repository",
            style:
              "height: 0.8em; width: auto; fill: currentColor; opacity: 0.5;"
          })}</a
        >
      `);
    }
  }
  console.log(crumbs);

  return html`
    <h1 class="breadcrumbs">${crumbs.join("")}</h1>
  `;
};
