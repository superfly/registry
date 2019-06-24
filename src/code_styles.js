const css = String.raw; // Prettier/syntax highlighting hack

module.exports = function createStyle(maxNumberLength) {
  return css`
    body {
      --highlight-border-radius: 5px;
      max-width: calc(80ex + ${maxNumberLength + 3}ex);
    }
    pre,
    code.hljs {
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
      content: " "; /* fix positioning of line numbers on blank lines */
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
  `;
};
