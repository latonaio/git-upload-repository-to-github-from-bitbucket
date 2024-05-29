import { exec } from 'child_process';

export const executeCommand = async (command: string, options: any): Promise<Buffer | null> => {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        return reject(error.message);
      }
      if (stderr) {
        return resolve(stderr);
      }
      return resolve(stdout);
    });
  });
};
