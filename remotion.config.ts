import { Config } from '@remotion/cli/config';

Config.setConcurrency(1);
Config.setVideoImageFormat('jpeg');

// Export the config object
export default Config;