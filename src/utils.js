// TODO Cron job to update the database with current values.
/** @type {{ [key: string]: import('./types').RawEntry }} */
const DATABASE = require("./database.json");

exports.escapeHtml = function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * @param {import('typescript').Node} node
 * @param {(node: import('typescript').Node) => void} cb
 */
exports.walkAST = function walkAST(node, cb) {
  cb(node);
  require("typescript").forEachChild(node, n => walkAST(n, cb));
};

/**
 * Pull an entry from the database
 * @param  {string} name
 * @param  {string}                branch
 * @return {import('./types').Entry}
 */
exports.getEntry = function getEntry(name, branch = "master") {
  const rawEntry = DATABASE[name];
  if (rawEntry.type === "url") {
    return {
      name,
      raw: rawEntry,
      url: rawEntry.url.replace(/\$\{b}/, branch),
      repo: rawEntry.repo.replace(/\$\{b}/, branch)
    };
  }
  if (rawEntry.type === "github") {
    return {
      name,
      raw: rawEntry,
      url: `https://raw.githubusercontent.com/${rawEntry.owner}/${
        rawEntry.repo
      }/${branch}${rawEntry.path || "/"}`,
      repo: `https://github.com/${rawEntry.owner}/${rawEntry.repo}${
        rawEntry.path ? `/tree/${branch}/${rawEntry.path}` : ""
      }`
    };
  }
  return null;
};

/**
 * @param  {[string[], ...any[]]} args
 */
exports.html = (...args) => String.raw(...args).trim();
