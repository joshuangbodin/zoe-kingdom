const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro'); 

const config = getDefaultConfig(__dirname);

// Treat .gz as a bundled asset (not a JS module) so the compressed Bible
// dataset can be required via expo-asset and decompressed at runtime.
config.resolver.assetExts.push("gz");

// your metro modifications

module.exports = withUniwindConfig(config, {  
  // relative path to your global.css file (from previous step)
  cssEntryFile: './src/global.css',
  // (optional) path where we gonna auto-generate typings
  // defaults to project's root
  dtsFile: './src/uniwind-types.d.ts'
});