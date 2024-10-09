
import slackify from 'slackify-markdown';

const releaseNotes = process.env.RELEASE_NOTES || '';
const formattedReleaseNotes = slackify(releaseNotes);

// Output the formatted notes as a single line, replacing newlines with spaces
console.log(formattedReleaseNotes.replace(/\n/g, '\\n'));