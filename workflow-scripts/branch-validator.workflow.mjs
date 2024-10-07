import pkg from '@actions/github';
import {
  loadConfig
} from './utils.workflow.mjs';
import { CONFIG_PATH } from './constants.workflow.mjs';

const {
  getOctokit,
  context
} = pkg;


/**
 * Validates whether the source branch type is accepted for the given target branch.
 * @param {string} targetBranch - The base branch of the PR (e.g., "main", "develop").
 * @param {string} sourceBranch - The source branch being merged into the base branch.
 * @param {Object} config - The branch configuration object.
 * @returns {boolean} - Returns true if the source branch is valid for the target branch.
 */
const isBranchValid = (targetBranch, sourceBranch, config) => {
  const branchType = sourceBranch.split('/')[0];
  if (config.branchSystem[targetBranch]) {
    const acceptedBranchTypes = config.branchSystem[targetBranch].accepts;
    return acceptedBranchTypes.includes(branchType);
  }
  return false;
};

/**
 * Posts a comment and closes the PR if the source branch is invalid.
 * @param {Object} context - The GitHub Actions context object.
 * @param {Object} octokit - The GitHub API client.
 * @param {string} sourceBranch - The name of the source branch.
 */
const handleInvalidBranch = async (context, octokit, sourceBranch) => {
  try {
    // Post a comment explaining why the PR is invalid
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: `🤖 ❌ **This PR cannot be merged into \`${context.payload.pull_request.base.ref}\`.**
            Only branches starting with the allowed types are accepted. The current source branch is: \`${sourceBranch}\`.`
    });
    console.log(`Posted comment on PR #${context.issue.number}`);

    // Optionally close the PR
    await octokit.rest.pulls.update({
      owner: context.repo.owner,
      repo: context.repo.repo,
      pull_number: context.issue.number,
      state: 'closed'
    });
    console.log(`Closed PR #${context.issue.number}`);
  } catch (error) {
    console.error('Error handling invalid branch:', error);
    throw error;
  }
};

/**
 * Posts a success comment to the PR when the branch validation passes.
 * @param {Object} context - The GitHub Actions context object.
 * @param {Object} octokit - The GitHub API client.
 * @param {string} sourceBranch - The name of the source branch.
 */
const handleValidBranch = async (context, octokit, sourceBranch) => {
  try {
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: `🤖 ✅ **This PR is valid!** The source branch \`${sourceBranch}\` follows the allowed conventions for merging into \`${context.payload.pull_request.base.ref}\`.`
    });
    console.log(`Posted success comment on PR #${context.issue.number}`);
  } catch (error) {
    console.error('Error posting valid branch comment:', error);
    throw error;
  }
};

/**
 * Main function to validate the PR branches based on config.
 * @param {Object} context - The GitHub Actions context object.
 * @param {Object} octokit - The GitHub API client.
 */
const validatePR = async (context, octokit) => {

  const config = loadConfig(CONFIG_PATH);
  const targetBranch = context.payload.pull_request.base.ref;
  const sourceBranch = context.payload.pull_request.head.ref;

  // Validate the source branch against the config
  const isValid = isBranchValid(targetBranch, sourceBranch, config);

  if (!isValid) {
    console.log(`Invalid source branch '${sourceBranch}' for target branch '${targetBranch}'`);
    await handleInvalidBranch(context, octokit, sourceBranch);
    process.exit(1); // Exit with error status
  } else {
    console.log(`The PR source branch '${sourceBranch}' is valid for the target branch '${targetBranch}'`);
    await handleValidBranch(context, octokit, sourceBranch); // Add a success comment
  }
};

// Execute the main validation function
const run = async () => {
  const octokit = getOctokit(process.env.GITHUB_TOKEN);
  await validatePR(context, octokit);
};

run().catch((error) => {
  console.error('Error running the PR branch validation process:', error);
  process.exit(1);
});