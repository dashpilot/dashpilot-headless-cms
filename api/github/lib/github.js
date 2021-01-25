const {
  Octokit
} = require("@octokit/rest");

const owner = process.env.GH_OWNER;
const repo = process.env.GH_REPO;
const octokit = new Octokit({
  auth: process.env.GH_TOKEN
});

const getData = async function(path) {

  var result = {};

  try {
    const response = await octokit.repos.getContent({
      owner: owner,
      repo: repo,
      path: path
    })

    result.content = Buffer.from(response.data.content, 'base64').toString();
    result.sha = response.data.sha;
    result.status = response.status;
    return result;
  } catch (e) {
    result.status = "404";
    return result;
  }

}

const setData = async function(path, content, type) {

  const myres = await getData(path);

  let sha = myres.sha;
  let message = "Updating data";

  const response = await octokit.repos.createOrUpdateFileContents({
    owner: owner,
    repo: repo,
    path: path,
    message: message,
    content: Buffer.from(content).toString('base64'), // reverse: Buffer.from(b64Encoded, 'base64').toString()
    sha: sha
  })

  var result = {};
  if (response.status == 200 || response.status == 201) {
    result.ok = true;
  } else {
    result.ok = false;
  }

  return result;

}

export {
  getData,
  setData
};