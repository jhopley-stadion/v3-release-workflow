import slackify from 'slackify-markdown';

// Read the release notes from an environment variable
const releaseNotes = process.env.RELEASE_NOTES || '';

// Convert the release notes to Slack format
const formattedReleaseNotes = slackify(releaseNotes);

// Output the formatted notes
console.log(formattedReleaseNotes);