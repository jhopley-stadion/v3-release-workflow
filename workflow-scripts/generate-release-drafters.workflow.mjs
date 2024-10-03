import fs from 'fs';
import path from 'path';
import { loadConfig } from './utils.workflow.mjs'; // Correctly import loadConfig
import { CONFIG_PATH } from './constants.workflow.mjs';

/**
 * Generates Release Drafter configuration files based on the provided settings.
 * @param {Object} drafterSettings - The drafter settings from the config.
 */
const generateReleaseDrafterConfigs = (drafterSettings) => {
  const githubDir = path.join('.github'); // Define the .github directory path

  // Create the .github directory if it doesn't exist
  if (!fs.existsSync(githubDir)) {
    fs.mkdirSync(githubDir, { recursive: true });
    console.log(`Created directory: ${githubDir}`);
  }

  // Iterate over each drafter setting and generate the respective configuration file
  Object.entries(drafterSettings).forEach(([type, settings]) => {
    const fileName = settings["file-name"]; // Extract file name from settings
    console.log(`File Name from Settings: ${fileName}`); // Log the file name

    // Temporary Hardcoding for testing
    // const fileName = 'release-drafter-minor-test.yml'; // Uncomment for testing

    const configContent = generateConfigContent(settings);

    // Specify the path to save files directly under the .github directory
    const filePath = path.join(githubDir, fileName);

    // Debug: Log the constructed file path
    console.log(`Writing file to: ${filePath}`);

    try {
      fs.writeFileSync(filePath, configContent, 'utf-8'); // Write the file
      console.log(`Generated ${fileName}`);
    } catch (err) {
      console.error(`Error writing file: ${err.message}`);
    }
  });
};

/**
 * Generates the configuration content for Release Drafter based on the settings.
 * @param {Object} settings - The settings for the drafter type.
 * @returns {string} - The generated configuration content as a string.
 */
const generateConfigContent = (settings) => {
  // Construct the template based on settings
  const { 'name-template': nameTemplate, 'tag-template': tagTemplate, categories } = settings; // Use quotes for keys with hyphens

  // Generate the categories content
  const categoriesContent = categories
    .map(category => {
      return `  - title: ${category.title}\n    labels: ${JSON.stringify(category.branchTypes)}`;
    })
    .join('\n');

  // Return the full configuration content as a string
  return `name-template: '${nameTemplate}'
tag-template: '${tagTemplate}'
template: |
  ## What’s Changed in this release

  $CHANGES

  ## Contributors

  $CONTRIBUTORS

categories:\n${categoriesContent}`;
};

// Main execution
const run = () => {
  let config;

  try {
    config = loadConfig(CONFIG_PATH); // Load the configuration file
    console.log(`Loaded configuration: ${JSON.stringify(config)}`); // Log the loaded configuration
  } catch (error) {
    console.error(`Failed to load config from ${CONFIG_PATH}:`, error.message);
    return; // Exit the script if the config cannot be loaded
  }

  // Check if drafter settings are present and generate the configs
  if (config.drafterSettings) {
    generateReleaseDrafterConfigs(config.drafterSettings);
  } else {
    console.error("No drafter settings found in config.");
  }
};

// Execute the main function
run();
