const latestTag = process.env.latest_tag;
const branchType = process.env.branch_type;

async function incrementVersion() {
  try {
    const [major, minor, patch] = latestTag.split('.').map(Number);

    if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
      console.log("Error: latest_tag is not in the expected format.");
      process.exit(1);
    }

    console.log(`Current version: ${major}.${minor}.${patch}`);

    if (branchType === "release") {
      minor++;
      patch = 0;
    } else if (branchType === "hotfix") {
      patch++;
    } else {
      console.log("Unknown branch type");
      process.exit(1);
    }

    const newTag = `${major}.${minor}.${patch}`;
    console.log(`New tag calculated: ${newTag}`);
    process.env.new_tag = newTag;

  } catch (error) {
    console.error(`Error incrementing version: ${error}`);
    process.exit(1);
  }
}

incrementVersion();
