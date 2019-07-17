require("./test_utils").runTests(async () => {
  await require("./app_test.js").tests();
  await require("./transpile_code_test.js").tests();
});
