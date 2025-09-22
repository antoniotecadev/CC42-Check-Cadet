// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
// Garantir que o SDK do Firebase JS esteja empacotado corretamente
config.resolver.sourceExts.push("cjs");
config.resolver.unstable_enablePackageExports = false;

config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    "./vendor/eventemitter3": require.resolve("eventemitter3"),
};

module.exports = config;
