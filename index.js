// Entry shim: ensure reanimated logger config initializer runs before any
// other module (notably react-native-reanimated). This file should be the
// package main so Metro evaluates it first.

// Import the TypeScript initializer (compiled by ts-node in dev or via
// Metro's TypeScript support). Import side-effect only.
try {
  require('./reanimated-logger-init');
} catch (e) {
  // swallow - if the TS file can't be required directly, Metro will still
  // bundle the TS source. Log minimally for visibility.
  // eslint-disable-next-line no-console
  console.warn('reanimated-logger-init import warning:', e && e.message);
}

// Delegate to expo-router's entry (the original app entry)
module.exports = require('expo-router/entry');
