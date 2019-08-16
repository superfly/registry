const assert = require("assert");

exports.tests = async function tests() {
  const {
    safe,
    unsafe,
    applyReplacements,
    toString
  } = require("./replacements");

  function runTest(code, expected, replacements) {
    assert.equal(toString(applyReplacements(code, replacements)), expected);
  }

  assert.deepEqual(
    applyReplacements("ac", [{ start: 1, end: 1, with: [unsafe(1, "b")] }]),
    [unsafe(0, "a"), unsafe(1, "b"), unsafe(1, "c")]
  );

  // insert
  runTest("ac", "abc", [{ start: 1, end: 1, with: [unsafe(1, "b")] }]);
  // delete
  runTest("abc", "ac", [{ start: 1, end: 2, with: [] }]);
  // escape
  runTest("abc", "a&lt;b<c", [
    { start: 1, end: 1, with: [unsafe(1, "<")] },
    { start: 2, end: 2, with: [safe(2, "<")] }
  ]);
  // wrap
  runTest("a<b>c", "a<span>&lt;b&gt;</span>c", [
    {
      start: 1,
      end: 4,
      with: [safe(1, "<span>"), unsafe(1, "<b>"), safe(4, "</span>")]
    }
  ]);
  // replace
  runTest("hello world", "Hello, World!", [
    { start: 0, end: 1, with: [unsafe(0, "H")] },
    { start: 5, end: 7, with: [unsafe(5, ", W")] },
    { start: 11, end: 11, with: [unsafe(11, "!")] }
  ]);
};

require("./test_utils").runIfMain(module);
