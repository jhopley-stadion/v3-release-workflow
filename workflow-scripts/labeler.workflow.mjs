import fs from 'fs';
import pkg from '@actions/github';

const { getOctokit, context } = pkg;  // Use getOctokit instead of GitHub

/**
 * Loads the branch configuration file.
 * @param {string} configPath - The path to the config file.
 * @returns {Object} - The parsed configuration object.
 * @throws {Error} - Throws an error if the config file cannot be read or parsed.
 */
const loadConfig = (configPath) => {
  try {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found at path: ${configPath}`);
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');

    if (!configContent) {
      throw new Error(`Configuration file is empty: ${configPath}`);
    }

    return JSON.parse(configContent);
  } catch (error) {
    throw new Error(`Failed to load config file: ${error.message}`);
  }
};

/**
 * Extracts the branch type from the source branch name.
 * @param {string} sourceBranch - The full source branch name (e.g., "feature/new-feature").
 * @returns {string} - The branch type (e.g., "feature").
 * @throws {Error} - Throws an error if the branch name is not in the expected format.
 */
const extractBranchType = (sourceBranch) => {
  if (typeof sourceBranch !== 'string' || sourceBranch.trim() === '') {
    throw new Error('Invalid source branch name: Branch name must be a non-empty string.');
  }

  const branchParts = sourceBranch.split('/');

  if (branchParts.length < 2) {
    throw new Error(`Invalid branch format: "${sourceBranch}" does not follow the expected "type/branch-name" format.`);
  }

  return branchParts[0];
};

/**
 * Checks if the branch type is allowed for the target branch.
 * @param {string} targetBranch - The branch we are merging into (e.g., "main", "develop").
 * @param {string} branchType - The type of the source branch (e.g., "feature", "bug").
 * @param {Object} config - The loaded branch configuration object.
 * @returns {Array<string>} - A list of labels to apply to the PR.
 * @throws {Error} - Throws an error if the branch type or target branch is not valid.
 */
const determineLabels = (targetBranch, branchType, config) => {
  if (!config || !config.branchSystem) {
    throw new Error('Invalid configuration: Missing or malformed branch system configuration.');
  }

  if (!config.branchSystem[targetBranch]) {
    throw new Error(`Unknown target branch: "${targetBranch}" is not defined in the configuration.`);
  }

  const acceptedTypes = config.branchSystem[targetBranch].accepts;

  if (!Array.isArray(acceptedTypes)) {
    throw new Error(`Invalid configuration: Accepted branch types for "${targetBranch}" should be an array.`);
  }

  const labels = [];

  if (acceptedTypes.includes(branchType)) {
    labels.push(branchType);
  } else {
    labels.push('invalid-branch');
  }

  return labels;
};

/**
 * Adds labels to the pull request and posts a comment with the added labels.
 * @param {Object} context - The GitHub Actions context object.
 * @param {Object} octokit - The GitHub API client.
 * @param {Array<string>} labels - The labels to add to the PR.
 * @throws {Error} - Throws an error if the labeling or commenting process fails.
 */
const addLabelsAndComment = async (context, octokit, labels) => {
  try {
    if (!Array.isArray(labels) || labels.length === 0) {
      throw new Error('No labels provided to add to the pull request.');
    }

    // Add the determined labels to the pull request
    await octokit.rest.issues.addLabels({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      labels
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
    console.error('Error adding labels or posting comment:', error);
    throw new Error(`Failed to add labels or comment on the pull request: ${error.message}`);
  }
};

/**
 * Main function to handle the PR labeling process.
 * @param {Object} context - The GitHub Actions context object.
 * @param {Object} octokit - The GitHub API client.
 * @throws {Error} - Throws an error if any part of the process fails.
 */
const labelPR = async (context, octokit) => {
  try {
    const configPath = './workflow.config.json';

    // Load the configuration file
    const config = loadConfig(configPath);

    // Extract the branch we are merging into (target branch)
    const targetBranch = context.payload.pull_request.base.ref;

    if (!targetBranch) {
      throw new Error('Target branch is undefined in the pull request context.');
    }

    // Extract the branch being merged (source branch)
    const sourceBranch = context.payload.pull_request.head.ref;

    if (!sourceBranch) {
      throw new Error('Source branch is undefined in the pull request context.');
    }

    // Extract the branch type from the source branch
    const branchType = extractBranchType(sourceBranch);

    // Determine the appropriate labels based on the branch type and config
    const labels = determineLabels(targetBranch, branchType, config);

    // Add the labels to the PR and post a comment with the details
    await addLabelsAndComment(context, octokit, labels);
  } catch (error) {
    console.error(`Error processing PR labeling: ${error.message}`);
    throw new Error(`Failed to label pull request: ${error.message}`);
  }
};

/**
 * Executes the main labeling function.
 * @throws {Error} - Throws an error if the process fails.
 */
const run = async () => {
  try {
    const octokit = getOctokit(process.env.GITHUB_TOKEN); // Use getOctokit instead of GitHub
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN is not set.');
    }
    // Call the labeling function
    await labelPR(context, octokit); 
  } catch (error) {
    console.error('Error running the labeling process:', error.message);
    process.exit(1); 
  }
};

// Execute the script
run().catch((error) => {
  console.error('Unhandled error:', error.message);
  process.exit(1); 
});
