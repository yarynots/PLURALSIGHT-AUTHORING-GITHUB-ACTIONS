// @ts-check
const core = require("@actions/core");
const github = require("@actions/github");
const { WebClient } = require("@slack/web-api");

run();

async function run() {
  try {

    core.info("This is core.info.  Looking up Slack user ID by GitHub username...");
    console.log("This is console.log.  Looking up Slack user ID by GitHub username...");

    const githubUsername = core.getInput("github-username");
    const githubToken = core.getInput("github-token");
    const slackToken = core.getInput("slack-token");

    const slackUserId = await lookupSlackUserByGitHubUsername(githubUsername, githubToken, slackToken);
    core.setOutput("slack-user-id", slackUserId);
  } catch (error) {
    core.debug("An error occurred while looking up the Slack user ID.");
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
