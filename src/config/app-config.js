import { readFile } from 'node:fs/promises';

const configUrl = new URL('../../config/config.json', import.meta.url);

export const loadAppConfig = async () => {
  const contents = await readFile(configUrl, 'utf8');
  const config = JSON.parse(contents);

  if (!config.serialPort || !config.modbus) {
    throw new Error('config/config.json must contain serialPort and modbus sections');
  }

  return Object.freeze(config);
};

export const appConfig = await loadAppConfig();
