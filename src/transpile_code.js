const { URL } = require("url");

const response = require("./response");

/** @type {import('typescript')} */
let ts = null;
const loadTS = () => {
  if (!ts) {
    ts = require("typescript");
  }
};

exports = module.exports = function compile(pathname, content) {
  loadTS();
  return ts.transpileModule(content, {
    compilerOptions: {
      allowJs: true,
      esModuleInterop: true,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
      inlineSourceMap: true,
      stripComments: true
    },
    transformers: {
      after: [
        () => sourceFile =>
          ts.updateSourceFileNode(
            sourceFile,
            exports.transformImports(sourceFile.statements, pathname)
          )
      ]
    }
  });
};

exports.transformImports = function transformImports(statements, pathname) {
  loadTS();
  return statements.map(node => {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        return ts.updateImportDeclaration(
          node,
          node.decorators,
          node.modifiers,
          node.importClause,
          transformModuleSpecifierNode(node.moduleSpecifier, pathname)
        );
      case ts.SyntaxKind.ExportDeclaration:
        if (!node.moduleSpecifier) return node; // normal export
        return ts.updateExportDeclaration(
          node,
          node.decorators,
          node.modifiers,
          node.importClause,
          transformModuleSpecifierNode(node.moduleSpecifier, pathname)
        );
      case ts.SyntaxKind.ImportEqualsDeclaration:
        if (
          node.moduleReference.kind !== ts.SyntaxKind.ExternalModuleReference ||
          node.moduleReference.expression.kind !== ts.SyntaxKind.StringLiteral
        ) {
          return node;
        }
        const ref = ts.createExternalModuleReference(
          transformModuleSpecifierNode(
            node.moduleReference.expression,
            pathname
          )
        );
        return ts.updateImportEqualsDeclaration(
          node,
          node.decorators,
          node.modifiers,
          node.name,
          ref
        );
    }
    return node;
  });
};

function transformModuleSpecifierNode(specifier, pathname) {
  loadTS();
  return ts.createStringLiteral(
    exports.transformModuleSpecifier(specifier.text, pathname)
  );
}

exports.transformModuleSpecifier = function transformModuleSpecifier(
  specifier,
  pathname
) {
  const url = new URL(specifier, `https://deno.land${pathname}`);
  if (url.hostname !== "deno.land" || url.searchParams.has("js")) {
    return specifier;
  }

  if (specifier.includes("?")) {
    return specifier + "&js";
  }
  return specifier + "?js";
};
