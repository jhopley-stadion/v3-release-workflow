
import slackify from 'slackify-markdown';

const releaseNotes = process.env.RELEASE_NOTES || '';
const formattedReleaseNotes = slackify(releaseNotes);

console.log(formattedReleaseNotes.replace(/\n/g, '\\n'));
