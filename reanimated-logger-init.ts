// Minimal initializer for Reanimated logger config to avoid
// `Cannot read property 'level' of undefined` during module initialization.
// This file must be imported before any module that triggers reanimated's code.

type LogData = { level: number; message: string };

const defaultLoggerConfig = {
  logFunction: (data: LogData) => {
    // level: 1 = warn, 2 = error (mirror ReanimatedLogLevel)
    try {
      if (data.level === 2) {
        // eslint-disable-next-line no-console
        console.error(data.message);
      } else {
        // eslint-disable-next-line no-console
        console.warn(data.message);
      }
    } catch (e) {
      // swallow any console errors during logger init
    }
  },
  level: 1,
  strict: true,
};

// Only set if not already defined by native initialization or other code.
(global as any).__reanimatedLoggerConfig =
  (global as any).__reanimatedLoggerConfig ?? defaultLoggerConfig;

export { };

