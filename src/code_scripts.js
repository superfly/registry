const highlight = () => {
  const code = document.querySelector("pre code");
  if (code.className === "no-highlight") {
    code.classList.add("hljs");
  } else {
    hljs.highlightBlock(code);
  }
  for (const keyword of document.querySelectorAll(".hljs-keyword")) {
    if (keyword.textContent !== "import" && keyword.textContent !== "export")
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
    source.innerHTML = `<a href=${source.textContent}>${source.innerHTML}</a>`;
  }
};

const selection = () => {
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

  const onHashChange = () => {
    for (const el of document.querySelectorAll(".numbered-line.highlighted")) {
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
          "#L" + [hash.line, clickedLine].sort((a, b) => a - b).join("-");
      } else if (hash.type === "range") {
        if (clickedLine <= hash.start) {
          location.hash = `#L${clickedLine}-L${hash.end}`;
        } else {
          location.hash = `#L${hash.start}-L${clickedLine}`;
        }
      }
    }
  });
};

// prettier-ignore
module.exports = /* HTML */ `
  <script>
    (${highlight})();
  </script>
  <script>
    (${selection})();
  </script>
`;
