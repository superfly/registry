///<reference lib="es2015"/>
const ts = require("typescript");
const { safe, unsafe, applyReplacements, toString } = require("./replacements");
const { walkAST, escapeHtml } = require("./utils");
const linkify = require("linkify-lite");
/** @typedef {import('./types').Token} Token */
/** @typedef {import('./types').Replacement} Replacement */

module.exports = { annotate };

/**
 * @param {string} pathname
 * @param {string} code
 */
function annotate(pathname, code) {
  const state = parse(pathname, code);
  const replacements = [...linkToDefinitions(state)];
  return toString(
    applyReplacements(state.code, replacements).map(token => {
      if (token.safe) {
        return token;
      }
      return safe(token.start, linkify(escapeHtml(token.content)));
    })
  );
}

/**
 * @param {string} pathname
 * @param {string} code
 */
function parse(pathname, code) {
  const sourceFile = ts.createSourceFile(
    `https://deno.land${pathname}`,
    code,
    ts.ScriptTarget.ESNext
  );
  const program = ts.createProgram({
    rootNames: [pathname],
    options: {
      module: "esnext"
    },
    host: {
      getSourceFile: () => sourceFile,
      getDefaultLibFileName: () => "lib.esnext.d.ts",
      getCurrentDirectory: () => "/",
      getCanonicalFileName: f => f,
      useCaseSensitiveFileNames: () => true,
      fileExists: name => name === pathname
    }
  });
  const typeChecker = program.getTypeChecker();

  return { code, sourceFile, program, typeChecker };
}

/**
 * @param {ReturnType<typeof parse>} state
 */
function linkToDefinitions({ sourceFile, typeChecker }) {
  /** @type {Array<Replacement>} */
  const replacements = []; // must be non-overlapping!
  walkAST(sourceFile, node => {
    /**
     * @param {ts.StringLiteral} specifier
     */
    const transformImportSource = specifier => {
      const text = specifier.getText();
      const start = specifier.getStart();
      const end = specifier.getEnd();

      replacements.push({
        start,
        end,
        with: [
          safe(
            start,
            `<a href="${escapeHtml(
              specifier.text
            )}" class="hljs-string">${escapeHtml(text)}</a>`
          )
        ]
      });
    };
    switch (node.kind) {
      case ts.SyntaxKind.Identifier: {
        const symbol = typeChecker.getSymbolAtLocation(node);
        const nodeText = node.getText();
        const start = node.getStart();
        const end = node.getEnd();

        const statement = getStatement(node);
        const isImported = !!statement.moduleSpecifier;
        if (isImported) {
          const isLocalDeclaration = node.parent.name === node;
          const isRemoteDeclaration =
            !ts.isNamespaceImport(node.parent) &&
            (!node.parent.propertyName || node.parent.propertyName === node);
          const prefix = ts.isImportDeclaration(statement) ? "symbol-" : "";
          if (isLocalDeclaration && isRemoteDeclaration) {
            return replacements.push({
              start,
              end,
              with: createRef(
                start,
                getRemoteLink(node, statement),
                createDefinition(start, prefix + nodeText, nodeText),
                nodeText.length
              )
            });
          }
          if (isLocalDeclaration) {
            return replacements.push({
              start,
              end,
              with: createDefinition(start, prefix + nodeText, nodeText)
            });
          }
        }

        if (!symbol) {
          // {im,ex}port { *node* as foo } from '...'
          if (node.parent.propertyName === node && statement.moduleSpecifier) {
            return replacements.push({
              start,
              end,
              with: createRef(start, getRemoteLink(node, statement), nodeText)
            });
          }
        }

        if (!symbol || !symbol.declarations || symbol.declarations.length === 0)
          return;
        /** @type {ts.Identifier} */
        const valueDecl = (symbol.valueDeclaration || symbol.declarations[0])
          .name;

        replacements.push({
          start,
          end,
          with: isDefinition(symbol, node)
            ? createDefinition(start, idFor(node, typeChecker), nodeText)
            : createRef(start, `#${idFor(valueDecl, typeChecker)}`, nodeText)
        });
        return;
      }
      case ts.SyntaxKind.ImportDeclaration:
      case ts.SyntaxKind.ExportDeclaration: {
        const specifier = node.moduleSpecifier;
        if (specifier) transformImportSource(specifier);
        return;
      }
      case ts.SyntaxKind.ImportEqualsDeclaration: {
        const specifier = node.moduleReference.expression;
        if (specifier && specifier.kind === ts.SyntaxKind.StringLiteral) {
          transformImportSource(specifier);
        }
        return;
      }
    }
  });

  idCache.clear();

  return replacements;
}

/**
 * @param  {ts.Node} node
 * @param  {ts.ImportDeclaration | ts.ExportDeclaration} statement
 */
function getRemoteLink(node, statement) {
  return `${statement.moduleSpecifier.text}#${
    node.parent.propertyName
      ? node.parent.propertyName.text
      : ts.isNamedImports(node.parent.parent) ||
        ts.isNamedExports(node.parent.parent)
      ? node.parent.name.text
      : "default"
  }`;
}

/**
 * @param  {number} start
 * @param  {string} id
 * @param  {string | Token | Token[]} content
 * @param  {number} length
 * @return {Token[]}
 */
function createDefinition(start, id, content, length = content.length) {
  return [
    safe(start, `<span class="definition" id="${escapeHtml(id)}">`),
    ...embed(start, content),
    safe(start + length, "</span>")
  ];
}

/**
 * @param {number} start
 * @param {string} href
 * @param {string | Token | Token[]} content
 * @param {number} length
 */
function createRef(start, href, content, length = content.length) {
  return [
    safe(start, `<a class="ref" href="${escapeHtml(href)}">`),
    ...embed(start, content),
    safe(start + length, "</a>")
  ];
}

/**
 * @param {number} start
 * @param {string | Token | Token[]} content
 */
function embed(start, content) {
  return Array.isArray(content)
    ? content
    : [typeof content === "string" ? unsafe(start, content) : content];
}

/** @type {Map<ts.Node, string>} */
const idCache = new Map();

/**
 * @param {ts.Node} node
 * @param {ts.TypeChecker} typeChecker
 */
function idFor(node, typeChecker) {
  if (idCache.has(node)) return idCache.get(node);

  const id = (() => {
    const moduleSymbol = typeChecker.getSymbolAtLocation(node.getSourceFile());
    const symbol = typeChecker.getSymbolAtLocation(node);
    const exportEntry = [...moduleSymbol.exports.values()].find(exported =>
      exported.declarations.some(
        decl =>
          typeChecker.getSymbolAtLocation(decl.propertyName) === symbol ||
          typeChecker.getSymbolAtLocation(decl.name) === symbol
      )
    );

    if (exportEntry) {
      return exportEntry.name;
    }

    if (!ts.isSourceFile(getStatement(node).parent)) {
      return `symbol-${escapeHtml(node.getText())}-${node.getStart()}`;
    }

    /** @type {ts.Parameter | false} */
    const param = (function check(node) {
      if (!node) return false;
      if (ts.isParameter(node)) return node;
      return check(node.parent);
    })(node);

    if (!param) return `symbol-${node.getText()}`;

    const fn = param.parent;

    return idFor(fn, typeChecker) + "-" + node.getText();
  })();

  idCache.set(node, id);
  return id;
}

/**
 * @param {ts.Node} node
 */
function getStatement(node) {
  let statement = node.parent;
  while (
    statement &&
    !(
      ts.isSourceFile(statement.parent) ||
      ts.isBlock(statement.parent) ||
      ts.isModuleBlock(statement.parent) ||
      ts.isCaseOrDefaultClause(statement.parent)
    )
  )
    statement = statement.parent;
  return statement;
}

/**
 * @param {ts.Symbol} symbol
 * @param {ts.Node} node
 */
function isDefinition(symbol, node) {
  if (symbol.valueDeclaration) {
    return symbol.valueDeclaration.name === node;
  }
  if (symbol.declarations.length > 1) foo;
  const declaration = symbol.declarations[0];

  return declaration.name === node;
}
