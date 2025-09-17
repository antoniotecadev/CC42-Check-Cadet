// Entry shim: ensure reanimated logger config initializer runs before any
// other module (notably react-native-reanimated). This file should be the
// package main so Metro evaluates it first.

try {
  require('./reanimated-logger-init.js');
} catch (e) {
    console.warn('reanimated-logger-init import warning:', e && e.message);
}

// Delegate to expo-router's entry (the original app entry)
module.exports = require('expo-router/entry');
