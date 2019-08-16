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
