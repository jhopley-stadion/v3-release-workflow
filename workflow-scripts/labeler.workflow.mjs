import fs from 'fs';
import pkg from '@actions/github';

const { getOctokit, context } = pkg;  // Use getOctokit instead of GitHub

/**
 * Loads the branch configuration file.
 * @param {string} configPath - The path to the config file.
 * @returns {Object} - The parsed configuration object.
 */
const loadConfig = (configPath) => {
  try {
    // Read the content of the config file
    const configContent = fs.readFileSync(configPath, 'utf-8');
    
    // Parse the content as JSON and return it
    return JSON.parse(configContent);
  } catch (error) {
    // Throw an error if loading the config fails
    throw new Error(`Failed to load config file: ${error.message}`);
  }
};

/**
 * Extracts the branch type from the source branch name.
 * @param {string} sourceBranch - The full source branch name (e.g., "feature/new-feature").
 * @returns {string} - The branch type (e.g., "feature").
 */
const extractBranchType = (sourceBranch) => {
  // Split the source branch name by '/' and return the first part as the branch type
  return sourceBranch.split('/')[0];
};

/**
 * Checks if the branch type is allowed for the target branch.
 * @param {string} targetBranch - The branch we are merging into (e.g., "main", "develop").
 * @param {string} branchType - The type of the source branch (e.g., "feature", "bug").
 * @param {Object} config - The loaded branch configuration object.
 * @returns {Array<string>} - A list of labels to apply to the PR.
 */
const determineLabels = (targetBranch, branchType, config) => {
  let labels = [];

  // Check if the target branch is defined in the config
  if (config.branchSystem[targetBranch]) {
    // Get the list of accepted branch types for the target branch
    const acceptedTypes = config.branchSystem[targetBranch].accepts;

    // Add branch type as a label if it's accepted for the target branch
    if (acceptedTypes.includes(branchType)) {
      labels.push(branchType);
    } else {
      // Add 'invalid-branch' label if the branch type is not allowed for the target branch
      labels.push('invalid-branch');
    }
  } else {
    // Add 'unknown-target-branch' if the target branch is not in the config
    labels.push('unknown-target-branch');
  }

  return labels;
};

/**
 * Adds labels to the pull request and posts a comment with the added labels.
 * @param {Object} context - The GitHub Actions context object.
 * @param {Object} octokit - The GitHub API client.
 * @param {Array<string>} labels - The labels to add to the PR.
 */
const addLabelsAndComment = async (context, octokit, labels) => {
  try {
    // Add the determined labels to the pull request
    await octokit.rest.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      labels: labels
    });
    console.log(`Labels added: ${labels.join(', ')}`);

    // Post a comment on the PR listing the added labels
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: `Labels have been added to this PR based on the branch type: ${labels.join(', ')}`
    });
    console.log('Comment added to PR');
  } catch (error) {
    // Log any errors encountered during the labeling or commenting process
    console.error('Error adding labels or posting comment:', error);
  }
};

/**
 * Main function to handle the PR labeling process.
 * @param {Object} context - The GitHub Actions context object.
 * @param {Object} octokit - The GitHub API client.
 */
const labelPR = async (context, octokit) => {
  const configPath = '../workflow.config.json';
  
  // Load the configuration file
  const config = loadConfig(configPath);
  
  // Extract the branch we are merging into (target branch)
  const targetBranch = context.payload.pull_request.base.ref;
  
  // Extract the branch being merged (source branch)
  const sourceBranch = context.payload.pull_request.head.ref;
  
  // Extract the branch type from the source branch
  const branchType = extractBranchType(sourceBranch);
  
  // Determine the appropriate labels based on the branch type and config
  const labels = determineLabels(targetBranch, branchType, config);
  
  // Add the labels to the PR and post a comment with the details
  await addLabelsAndComment(context, octokit, labels);
};

// Execute the main labeling function
const run = async () => {
  const octokit = getOctokit(process.env.GITHUB_TOKEN); // Use getOctokit instead of GitHub
  await labelPR(context, octokit); // Call the labeling function
};

// Invoke the run function to execute the script
run().catch(error => {
  console.error('Error running the labeling process:', error);
  process.exit(1); // Exit with error status
});
