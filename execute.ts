import * as fs from 'fs-extra';
import path from 'path';
import { Logger } from 'tslog';
import { copy, removeNonDotFiles } from './util/directory';
import { executeCommand } from './util/command';

const loggerApp = new Logger({ name: 'app' });
const loggerBitbucket = new Logger({ name: 'bitbucket' });
const loggerGithub = new Logger({ name: 'github' });

let jsonFileInfo: {
  bitbucket: { org: string };
  directories: string[];
  excludeFiles: string[];
} = {
  bitbucket: { org: '' },
  directories: [],
  excludeFiles: []
};

async function getFileListFromJson(jsonPath: string): Promise<string[]> {
  try {
    const jsonData = await fs.readJson(jsonPath);
    return jsonData.directories;
  } catch (error) {
    loggerApp.error('Error reading JSON file:', error);
    return [];
  }
}

const setBitbucketConfig = async (jsonPath: string) => {
  return (jsonFileInfo = await fs.readJson(jsonPath));
};

const checkDirectory = (directoryPath: fs.PathLike) => {
  try {
    fs.accessSync(directoryPath, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
};

const cloneOrFetchToBitbucket = async (gitRepoUrl: string) => {
  const targetDirectory = path.resolve(__dirname, 'bitbucket');
  // git clone git@bitbucket.org:latonaio/data-platform-api-project-creates-rmq-kube.git
  const isExistDirectory = checkDirectory(`${targetDirectory}/${gitRepoUrl}`);

  if (isExistDirectory) {
    loggerBitbucket.info(`try fetch and pull to repository: ${targetDirectory}/${gitRepoUrl}`);

    try {
      await executeCommand('git fetch && git pull', {
        cwd: `${targetDirectory}/${gitRepoUrl}`
      });
      loggerBitbucket.info(`Successfully fetch and pull: ${targetDirectory}/${gitRepoUrl}`);
    } catch (error) {
      loggerBitbucket.info(`Error executing command: ${error}`);
    }
  } else {
    loggerBitbucket.info(`try clone to: ${targetDirectory}/${gitRepoUrl}`);

    try {
      const bitbucketCorrectRepositories = await fs.readJson('json/checkBitbucketRepositoryNameAndUrl.json');

      const foundRepo: { bitbucketRepositoryName: string; bitbucketRepositoryUrl: string } | undefined =
        bitbucketCorrectRepositories.find(
          (bitbucketCorrectRepository: { bitbucketRepositoryName: string; bitbucketRepositoryUrl: string }) =>
            bitbucketCorrectRepository.bitbucketRepositoryName === gitRepoUrl
        );

      if (foundRepo) {
        loggerBitbucket.info(
          `Wrong git clone name and url in bitbucket: ${foundRepo.bitbucketRepositoryName} |  ${foundRepo.bitbucketRepositoryUrl}`
        );

        await executeCommand(
          `git clone git@bitbucket.org:${jsonFileInfo.bitbucket.org}/${foundRepo.bitbucketRepositoryUrl}.git ${foundRepo.bitbucketRepositoryName}`,
          {
            cwd: targetDirectory
          }
        );
      } else {
        await executeCommand(`git clone git@bitbucket.org:${jsonFileInfo.bitbucket.org}/${gitRepoUrl}.git`, {
          cwd: targetDirectory
        });
      }
      loggerBitbucket.info(`Successfully cloned: ${targetDirectory}/${gitRepoUrl}`);
    } catch (error) {
      loggerBitbucket.error(`Error executing command: ${error}`);
    }
  }
};

const cloneOrFetchToGithub = async (gitRepoUrl: string) => {
  const targetDirectory = path.resolve(__dirname, 'github');
  const isExistDirectory = checkDirectory(`${targetDirectory}/${gitRepoUrl}`);

  if (isExistDirectory) {
    loggerGithub.info(`try fetch and pull to repository: ${targetDirectory}/${gitRepoUrl}`);

    try {
      await executeCommand('git fetch && git pull', {
        cwd: `${targetDirectory}/${gitRepoUrl}`
      });
      loggerGithub.info(`Successfully fetch and pull: ${targetDirectory}/${gitRepoUrl}`);
    } catch (error) {
      loggerGithub.info(`Error executing command: ${error}`);
    }
  } else {
    // git@github.com:latonaio/data-platform-api-project-creates-rmq-kube.git
    loggerGithub.info(`try clone to: ${targetDirectory}/${gitRepoUrl}`);

    try {
      await executeCommand(`git clone git@github.com:${jsonFileInfo.bitbucket.org}/${gitRepoUrl}.git`, {
        cwd: targetDirectory
      });
      loggerGithub.info(`Successfully cloned: ${targetDirectory}/${gitRepoUrl}`);
    } catch (error) {
      loggerGithub.error(`Error executing command: ${error}`);
    }
  }

  try {
    await removeNonDotFiles(`${targetDirectory}/${gitRepoUrl}/`, loggerGithub);
    loggerGithub.info(`Successfully remove files: ${targetDirectory}/${gitRepoUrl}`);
  } catch (error) {
    loggerGithub.info(`Error cannot remove files: ${error}`);
  }
};

const copyFilesInDirectory = async (sourceDir: string, excludeList: string[]) => {
  const bitbucketDirectory = path.resolve(__dirname, 'bitbucket');
  const githubDirectory = path.resolve(__dirname, 'github');

  const files = fs.readdirSync(`${bitbucketDirectory}/${sourceDir}`);

  for (const file of files) {
    if (jsonFileInfo.excludeFiles.some((pattern) => new RegExp(pattern).test(file))) {
      loggerApp.info(`File ${file} matches an exclusion pattern. Skipping.`);
      continue;
    }

    const sourceFilePath = path.join(`${bitbucketDirectory}/${sourceDir}`, file);
    const destinationFilePath = path.join(`${githubDirectory}/${sourceDir}`, file);

    await copy(sourceFilePath, destinationFilePath);

    loggerApp.info(`Copied ${file}`);
  }
};

async function main() {
  const jsonFilePath = 'json/data.json';
  await setBitbucketConfig(jsonFilePath);
  const directoryList = await getFileListFromJson(jsonFilePath);

  for (const directory of directoryList) {
    await cloneOrFetchToBitbucket(directory);
  }

  for (const directory of directoryList) {
    await cloneOrFetchToGithub(directory);
  }

  for (const directory of directoryList) {
    await copyFilesInDirectory(directory, []);
  }
}

(async () => {
  await main();
})();
