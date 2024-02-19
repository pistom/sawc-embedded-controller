import * as fs from 'fs';

const uploadFileToGist = async (filenames, path) => {
  const files = {};
  for (const filename of filenames) {
    files[filename] = {
      content: fs.readFileSync(`${path}/${filename}`, 'utf8'),
    }
  }
  const url = `https://api.github.com/gists/${process.env.GIST_ID}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `token ${process.env.GIST_TOKEN}`,
    },
    body: JSON.stringify({
      files
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to upload files to Gist: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.html_url;
};

const badges = [
  'badge-lines.svg',
  'badge-branches.svg',
  'badge-functions.svg',
  'badge-statements.svg',
]

uploadFileToGist(badges, `./coverage`)
  .then((url) => console.log(`File uploaded: ${url}`))
  .catch((error) => console.error(error));
