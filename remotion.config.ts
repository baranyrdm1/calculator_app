import {Config} from '@remotion/cli/config';

// Konteynerde önceden kurulu Chromium (Remotion'ın kendi indirmesi ağ kısıtına takılabilir).
Config.setBrowserExecutable(
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
);
Config.setChromiumOpenGlRenderer('angle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
