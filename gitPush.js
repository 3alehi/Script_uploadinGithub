const fs = require('fs');
const { Octokit } = require('@octokit/rest');

const token = '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';
const owner = 'masihSlavik';
const repo = 'Pro_v';
const folderPath = 'pro_v2';

const octokit = new Octokit({ auth: token });

async function uploadFolder(folderPath, parentPath = '') {
  try {
    const folderContents = fs.readdirSync(folderPath);

    for (const item of folderContents) {
      const itemPath = `${folderPath}/${item}`;
      const isDirectory = fs.statSync(itemPath).isDirectory();

      const filePath = parentPath ? `${parentPath}/${item}` : item;

      // نادیده گرفتن فولدرهای node_modules و .next
      if (item === 'node_modules' || item === '.next') {
        console.log(`Skipping folder: ${filePath}`);
        continue;
      }

      if (isDirectory) {
        await uploadFolder(itemPath, filePath);
        console.log(`Folder uploaded to GitHub: ${filePath}`);
      } else {
        const fileContent = fs.readFileSync(itemPath, 'utf8');
        const contentBase64 = Buffer.from(fileContent).toString('base64');

        try {
          const { data: existingFile } = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
          });

          // If the file already exists, get its SHA
          const fileSha = existingFile.sha;

          await octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: 'Add file from script',
            content: contentBase64,
            sha: fileSha,
          });

          console.log(`File updated on GitHub: ${filePath}`);
        } catch (error) {
          // If the file doesn't exist, create it
          if (error.status === 404) {
            await octokit.repos.createOrUpdateFileContents({
              owner,
              repo,
              path: filePath,
              message: 'Add file from script',
              content: contentBase64,
            });

            console.log(`File created on GitHub: ${filePath}`);
          } else {
            throw error;
          }
        }
      }
    }

    console.log(`All files and folders in '${parentPath}' uploaded successfully!`);
  } catch (error) {
    console.error(`Error uploading files and folders in '${parentPath}' to GitHub:`, error.message);
  }
}

uploadFolder(folderPath);
