// Minimal initializer for Reanimated logger config (JS version).
// This file must be required very early in the bundle so that
// `global.__reanimatedLoggerConfig` exists when react-native-reanimated
// modules are evaluated.

const defaultLoggerConfig = {
  logFunction: function (data) {
    // level: 1 = warn, 2 = error (mirror ReanimatedLogLevel)
    try {
      if (data && data.level === 2) {
        console.error(data.message);
      } else {
        console.warn(data && data.message);
      }
    } catch (e) {
      // swallow
    }
  },
  level: 1,
  strict: true,
};

if (typeof global !== 'undefined') {
  global.__reanimatedLoggerConfig = global.__reanimatedLoggerConfig || defaultLoggerConfig;
}

// no exports; side-effect only
