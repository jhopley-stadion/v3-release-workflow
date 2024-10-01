import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const GITHUB_TOKEN = process.env.GH_TOKEN;

async function getOrCreateTag() {
  try {
    console.log("Fetching latest tag...");
    const { stdout: tagOutput } = await execAsync('gh release list --limit 1 --json tagName --jq \'[0].tagName\'');
    let latest_tag = tagOutput.trim();

    if (!latest_tag) {
      console.log("No tags found. Setting initial version to 1.0.0");
      latest_tag = "1.0.0";
      await execAsync('git tag 1.0.0');
      await execAsync('git push origin 1.0.0');
      console.log("Initial tag created.");
      process.env.initial_version = 'true';
    } else {
      console.log("Initial version flag not set.");
      process.env.initial_version = 'false';
    }
    
    console.log(`Latest tag is: ${latest_tag}`);
    process.env.latest_tag = latest_tag;

  } catch (error) {
    console.error(`Error retrieving or creating tag: ${error}`);
    process.exit(1);
  }
}

getOrCreateTag();
