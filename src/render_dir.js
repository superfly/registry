const fetch = require("node-fetch");

const response = require("./response");
const renderListing = require("./dir_listing");

module.exports = async function renderDir(pathname, entry, path) {
  if (entry.raw.type === "github") {
    const res = await fetch(
      `https://api.github.com/repos/${entry.raw.owner}/${entry.raw.repo}/contents/${path}`,
      {
        headers: {
          authorization:
            process.env.GH_TOKEN && "token " + process.env.GH_TOKEN,
          accept: "application/vnd.github.v3.object"
        }
      }
    );
    if (res.status !== 200) {
      return {
        status: "500",
        body: `Got an error (${
          res.status
        }) when querying the GitHub API:\n${await res.text()}`,
        headers: {
          "Content-Type": [{ key: "Content-Type", value: "text/plain" }]
        }
      };
    }
    const data = await res.json();
    if (data.type !== "dir") {
      return {
        status: "500",
        body: `Unexpected type ${
          data.type
        } when querying the GitHub API:\n${JSON.stringify(data, null, 2)}`,
        headers: {
          "Content-Type": [{ key: "Content-Type", value: "text/plain" }]
        }
      };
    }

    const contents = data.entries.map(entry => ({
      name: entry.name,
      type: entry.type, // "file" | "dir" | "symlink"
      size: entry.size, // file only
      target: entry.target // symlink only
    }));

    const readme = data.entries.find(
      entry => entry.name.toLowerCase() === "readme.md"
    );

    return response.success(
      renderListing(
        pathname,
        entry,
        path,
        contents,
        readme && (await fetch(readme.download_url).then(res => res.text()))
      )
    );
  }
  return {
    status: "501", // Not Implemented
    body: `Directories not yet supported for entry type ${entry.raw.type}.`,
    headers: {
      "Content-Type": [{ key: "Content-Type", value: "text/plain" }]
    }
  };
};
