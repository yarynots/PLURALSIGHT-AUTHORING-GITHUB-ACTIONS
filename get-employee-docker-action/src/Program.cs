using Octokit;
using Slack.NetStandard;

var githubUsername = Environment.GetEnvironmentVariable("INPUT_GITHUB-USERNAME");
var githubToken = Environment.GetEnvironmentVariable("INPUT_GITHUB-TOKEN");
var slackToken = Environment.GetEnvironmentVariable("INPUT_SLACK-TOKEN");

try
{
    var slackUserId = await LookupSlackUserByGitHubUsername(githubUsername, githubToken, slackToken);

    Console.WriteLine("Found Slack user ID: " + slackUserId);
    
    await File.AppendAllLinesAsync(Environment.GetEnvironmentVariable("GITHUB_OUTPUT"), [
        $"slack-user-id={slackUserId}"
    ]);
}
catch (Exception ex)
{
    Console.WriteLine($"::error::Failed to lookup Slack ID for GitHub user: {ex.Message}");
    Environment.Exit(1);
}

async Task<string> LookupSlackUserByGitHubUsername(string githubUsername, string githubToken, string slackToken)
{
    var octokit = new GitHubClient(new ProductHeaderValue("PluralsightDemoAction"));
    var tokenAuth = new Credentials(githubToken);
    octokit.Credentials = tokenAuth;

    var githubUser = await octokit.User.Get(githubUsername);
    var email = githubUser?.Email;

    if (email == null)
    {
        throw new ApplicationException($"GitHub user '{githubUsername}' does not have a public email address");
    }

    var client = new SlackWebApiClient(slackToken);
    var slackResponse = await client.Users.LookupByEmail(email);

    if (slackResponse?.User == null)
    {
        throw new ApplicationException($"Slack user with email '{email}' not found");
    }

    return slackResponse.User.ID;
}
