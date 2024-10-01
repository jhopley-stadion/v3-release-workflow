import fs from 'fs';

/**
 * Loads the branch configuration file.
 * @param {string} configPath - The path to the config file.
 * @returns {Object} - The parsed configuration object.
 * @throws {Error} - Throws an error if the config file cannot be read or parsed.
 */
export const loadConfig = (configPath) => {
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