const { escapeHtml } = require("./utils");

module.exports = { safe, unsafe, applyReplacements, toString };

/**
 * @param {number} start
 * @param {string} content
 * @returns {import('./types').UnsafeToken}
 */
function unsafe(start, content) {
  return { start, content, safe: false };
}

/**
 * @param {number} start
 * @param {string} content
 * @returns {import('./types').SafeToken}
 */
function safe(start, content) {
  return { start, content, safe: true };
}

/**
 * @param  {string} code
 * @param  {import('./types').Replacement[]} replacements [description]
 */
function applyReplacements(code, replacements) {
  const sortedReplacements = replacements.slice();
  sortedReplacements.sort((a, b) => b.start - a.start);
  const merged = sortedReplacements.reduce(
    (segments, replacement) => {
      let segmentIndex = -1;
      /** @type {import('./types').Token} */
      const toSplit = segments.find((segment, i) => {
        segmentIndex = i;
        return (
          (!segment.safe &&
          segment.start <= replacement.start &&
          segment.start + segment.content.length >= replacement.end)
        );
      });
      const newBefore =
        replacement.start === toSplit.start
          ? []
          : [
              unsafe(
                toSplit.start,
                toSplit.content.slice(0, replacement.start - toSplit.start)
              )
            ];
      const newAfter =
        replacement.end === toSplit.start + toSplit.content.length
          ? []
          : [
              unsafe(
                replacement.end,
                toSplit.content.slice(replacement.end - toSplit.start)
              )
            ];

      return [
        ...segments.slice(0, segmentIndex),
        ...newBefore,
        ...replacement.with,
        ...newAfter,
        ...segments.slice(segmentIndex + 1)
      ];
    },
    [unsafe(0, code)]
  );
  return merged;
}

/**
 * @param  {import('./types').Token[]} tokens
 */
function toString(tokens) {
  return tokens.map(t => (t.safe ? t.content : escapeHtml(t.content))).join("");
}
