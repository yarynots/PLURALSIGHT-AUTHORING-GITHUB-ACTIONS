// @ts-check
const core = require("@actions/core");
const github = require("@actions/github");
const { WebClient } = require("@slack/web-api");

run();

async function run() {
  try {
    const githubUsername = core.getInput("github-username");
    const githubToken = core.getInput("github-token");
    const slackToken = core.getInput("slack-token");

    const slackUserId = await lookupSlackUserByGitHubUsername(githubUsername, githubToken, slackToken);
    core.setOutput("slack-user-id", slackUserId);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    core.setFailed(message);
  }
}

/**
 * @param {string} githubUsername
 * @param {string} githubToken
 * @param {string | undefined} slackToken
 */
async function lookupSlackUserByGitHubUsername(githubUsername, githubToken, slackToken) {
  const octokit = github.getOctokit(githubToken);

  const {
    data: { email },
  } = await octokit.rest.users.getByUsername({
    username: githubUsername,
  });

  if (!email) {
    throw new Error(
      `No public email found for GitHub user: ${githubUsername}`
    );
  }

  const web = new WebClient(slackToken);
  const { user: slackUser } = await web.users.lookupByEmail({ email: email });

  if (!slackUser) {
    throw new Error(`No Slack user found with email: ${email}`);
  }

  return slackUser.id
}
