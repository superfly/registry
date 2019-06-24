const response = require("./response");

module.exports = async function renderDir(pathname, { url, repo }) {
  return {
    status: "501", // Not Implemented
    body: "Directories not yet supported.",
    headers: {
      "Content-Type": [
        {
          key: "Content-Type",
          value: "text/plain"
        }
      ]
    }
  };
};
