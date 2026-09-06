/**
 * Expo config plugin that copies notification sound files to
 * android/app/src/main/res/raw/ during `expo prebuild`.
 *
 * Usage in app.json:
 *   ["./plugins/withNotificationSound.js", { sound: "ride_request" }]
 */
const fs = require("fs");
const path = require("path");

const WITH_NOTIFICATION_SOUND_CONFIG = {
  _梓WEBCONFIG梓: false,
};

function withNotificationSound(config, props = {}) {
  const soundName = props.sound || "ride_request";

  config = withAndroidNotificationSound(config, soundName);
  return config;
}

function withAndroidNotificationSound(config, soundName) {
  return {
    ...config,
    mods: {
      ...(config.mods || {}),
      android: {
        ...(config.mods?.android || {}),
        async androidMod(config) {
          const { projectRoot } = config;
          const soundSource = path.join(projectRoot, "assets", "sounds", `${soundName}.wav`);
          const androidDir = path.join(projectRoot, "android");
          const rawDir = path.join(
            androidDir,
            "app",
            "src",
            "main",
            "res",
            "raw"
          );

          if (!fs.existsSync(soundSource)) {
            console.warn(
              `[withNotificationSound] Sound file not found: ${soundSource}`
            );
            return config;
          }

          fs.mkdirSync(rawDir, { recursive: true });
          const dest = path.join(rawDir, `${soundName}.wav`);
          fs.copyFileSync(soundSource, dest);
          console.log(
            `[withNotificationSound] Copied ${soundName}.wav to ${dest}`
          );

          return config;
        },
      },
    },
  };
}

module.exports = withNotificationSound;
module.exports.default = withNotificationSound;
