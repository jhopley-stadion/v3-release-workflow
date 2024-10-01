import fs from 'fs';
import path from 'path';

const GITHUB_EVENT_PATH = process.env.GITHUB_EVENT_PATH;

async function determineBranchType() {
  try {
    const eventData = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));
    const branchName = eventData.head_commit.message.match(/Merge pull request #[0-9]+ from \K\S+/)[0].replace(/^.*\//, '');

    console.log(`Branch name extracted: ${branchName}`);
    
    let branchType, configFile;

    if (branchName.startsWith('release/')) {
      branchType = "release";
      configFile = "release-drafter-minor.yml";
    } else if (branchName.startsWith('hotfix/')) {
      branchType = "hotfix";
      configFile = "release-drafter-patch.yml";
    } else {
      console.log("Branch does not match expected patterns");
      process.exit(1);
    }

    console.log(`Branch type determined: ${branchType}`);
    process.env.branch_type = branchType;
    process.env.config_file = configFile;

  } catch (error) {
    console.error(`Error determining branch type: ${error}`);
    process.exit(1);
  }
}

determineBranchType();
