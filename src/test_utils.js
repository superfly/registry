exports.runTests = async function runTests(tests) {
  try {
    await tests();
  } catch (e) {
    console.error(e.stack);
    process.exit(1);
  }
};

exports.runIfMain = function runIfMain(module) {
  if (require.main === module) {
    exports.runTests(module.exports.tests);
  }
};
