const assert = require("assert");
const ts = require("typescript");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const fixturePath = path.join(__dirname, "testdata", "transpile_input.ts");
const snapPath = path.join(__dirname, "testdata", "transpile_snapshot.js");

exports.tests = async function tests() {
  const transpile = require("./transpile_code");
  const { transformImports, transformModuleSpecifier } = transpile;

  assert.ok(
    transformImports && transformModuleSpecifier,
    "Missing exports from transpile_code.js"
  );

  const normalSpecifier = transformModuleSpecifier("./foo.ts", "/x/foo/mod.ts");
  assert.equal(normalSpecifier, "./foo.ts?js");

  const querySpecifier = transformModuleSpecifier(
    "./foo.ts?foo=bar",
    "/x/foo/mod.ts"
  );
  assert.equal(querySpecifier, "./foo.ts?foo=bar&js");

  const transpileSpecifier = transformModuleSpecifier(
    "./foo.ts?js",
    "/x/foo/mod.ts"
  );
  assert.equal(transpileSpecifier, "./foo.ts?js");

  const inputFixture = await readFile(fixturePath, "utf8");
  const result = transpile("/x/test/mod.ts", inputFixture);
  assert.equal(result.diagnostics.length, 0);
  if (fs.existsSync(snapPath)) {
    assert.equal(await readFile(snapPath, "utf8"), result.outputText);
  } else {
    await writeFile(snapPath, result.outputText, "utf8");
  }
};

require("./test_utils").runIfMain(module);
