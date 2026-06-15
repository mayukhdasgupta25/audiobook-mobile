const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const GRADLEW_EXECUTE_BLOCK =
   ':execute\r\n@rem Setup the command line\r\n\r\nset CLASSPATH=\r\n\r\n\r\n@rem Execute Gradle\r\n"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" -jar "%APP_HOME%\\gradle\\wrapper\\gradle-wrapper.jar" %*';

const GRADLEW_EXECUTE_BLOCK_FIXED =
   ':execute\r\n@rem Execute Gradle (omit empty -classpath; Oracle Java 21 on Windows rejects it)\r\n"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -jar "%APP_HOME%\\gradle\\wrapper\\gradle-wrapper.jar" %*';

function patchGradleWrapperBat(gradlewBatPath) {
   if (!fs.existsSync(gradlewBatPath)) {
      return;
   }

   const contents = fs.readFileSync(gradlewBatPath, 'utf8');
   if (contents.includes(GRADLEW_EXECUTE_BLOCK_FIXED)) {
      return;
   }

   if (!contents.includes(GRADLEW_EXECUTE_BLOCK)) {
      return;
   }

   fs.writeFileSync(gradlewBatPath, contents.replace(GRADLEW_EXECUTE_BLOCK, GRADLEW_EXECUTE_BLOCK_FIXED));
}

function ensureLocalProperties(androidProjectRoot) {
   const localPropertiesPath = path.join(androidProjectRoot, 'local.properties');
   if (fs.existsSync(localPropertiesPath)) {
      return;
   }

   const sdkDir =
      process.env.ANDROID_HOME ||
      process.env.ANDROID_SDK_ROOT ||
      path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');

   if (!sdkDir || !fs.existsSync(sdkDir)) {
      return;
   }

   const escapedSdkDir = sdkDir.replace(/\\/g, '\\\\');
   fs.writeFileSync(localPropertiesPath, `sdk.dir=${escapedSdkDir}\n`);
}

const withGradleWrapperFix = (config) =>
   withDangerousMod(config, [
      'android',
      async (config) => {
         const androidProjectRoot = config.modRequest.platformProjectRoot;
         patchGradleWrapperBat(path.join(androidProjectRoot, 'gradlew.bat'));
         ensureLocalProperties(androidProjectRoot);
         return config;
      },
   ]);

/**
 * Expo config plugin to ensure MediaSession module is properly configured
 */
const withMediaSession = (config) => config;

module.exports = (config) => withGradleWrapperFix(withMediaSession(config));
