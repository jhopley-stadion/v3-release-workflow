import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const GH_TOKEN = process.env.GH_TOKEN;
const newTag = process.env.new_tag;

async function publishRelease() {
  try {
    console.log(`Publishing new release ${newTag}...`);
    await execAsync(`gh release edit _DRAFT_ --tag ${newTag} --title "Release v${newTag}" --draft=false`);
    console.log(`Release published: ${newTag}`);
  } catch (error) {
    console.error(`Error publishing release: ${error}`);
    process.exit(1);
  }
}

publishRelease();
