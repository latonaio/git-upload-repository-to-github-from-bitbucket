import { promisify } from 'util';
import * as fs from 'fs-extra';

const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);

import path from 'path';
import { Logger } from 'tslog';

async function copyDirectory(source: string, destination: string) {
  const dirContents = await readdir(source);
  await mkdir(destination, { recursive: true });
  for (const item of dirContents) {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    await copy(sourcePath, destPath);
  }
}

export const copy = async (source: string, destination: string) => {
  const stats = await stat(source);
  if (stats.isDirectory()) {
    await copyDirectory(source, destination);
  } else {
    await copyFile(source, destination);
  }
};

export const removeNonDotFiles = async (directory: string, logger: Logger<any>) => {
  const files = await fs.readdir(directory);
  for (const file of files) {
    if (!file.startsWith('.') && file !== 'LICENSE') {
      const filePath = path.join(directory, file);
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await fs.rmdir(filePath, { recursive: true });
        logger.info(`Removed directory: ${filePath}`);
      } else {
        await fs.unlink(filePath);
        logger.info(`Removed file: ${filePath}`);
      }
    }
  }
};
