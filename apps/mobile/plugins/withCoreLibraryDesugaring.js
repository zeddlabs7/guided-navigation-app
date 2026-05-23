const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withCoreLibraryDesugaring(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;

    if (contents.includes('coreLibraryDesugaringEnabled')) {
      return config;
    }

    const androidPattern = '\nandroid {\n';
    const androidIndex = contents.indexOf(androidPattern);
    if (androidIndex !== -1) {
      const androidPivot = androidIndex + androidPattern.length;
      config.modResults.contents =
        contents.slice(0, androidPivot) +
        '    compileOptions {\n        coreLibraryDesugaringEnabled true\n    }\n\n' +
        contents.slice(androidPivot);
    }

    const dependenciesPattern = '\ndependencies {\n';
    const dependenciesIndex = config.modResults.contents.indexOf(dependenciesPattern);
    if (dependenciesIndex !== -1) {
      const dependenciesPivot = dependenciesIndex + dependenciesPattern.length;
      config.modResults.contents =
        config.modResults.contents.slice(0, dependenciesPivot) +
        '    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")\n\n' +
        config.modResults.contents.slice(dependenciesPivot);
    }

    return config;
  });
};
