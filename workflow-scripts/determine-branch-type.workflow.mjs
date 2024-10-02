import fs from 'fs';

const GITHUB_EVENT_PATH = process.env.GITHUB_EVENT_PATH;

async function determineBranchType() {
  try {
    const eventData = JSON.parse(fs.readFileSync(GITHUB_EVENT_PATH, 'utf8'));

    // Log event data to debug issues
    console.log("Event Data:", eventData);

    // Check if head_commit and message exist in the event data
    if (eventData.head_commit && eventData.head_commit.message) {
      const match = eventData.head_commit.message.match(/Merge pull request #[0-9]+ from \K\S+/);

      // Check if a match was found
      if (match && match[0]) {
        const branchName = match[0].replace(/^.*\//, '');

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
      } else {
        throw new Error("No match found in the commit message for a branch name.");
      }
    } else {
      throw new Error("head_commit or message not found in event data.");
    }
  } catch (error) {
    console.error(`Error determining branch type: ${error}`);
    process.exit(1);
  }
}

determineBranchType();
