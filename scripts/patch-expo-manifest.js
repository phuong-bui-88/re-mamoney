#!/usr/bin/env node
/**
 * Postinstall guard for Expo CLI manifest-asset resolution.
 *
 * SDK 58+ (@expo/cli >= 58) fixed both upstream bugs:
 *   1. resolver regex is unanchored (?:https?|exps?):\/\/[^/]+\/
 *   2. x-forwarded-proto is parsed via resolveForwarded.parseForwardedRequestInfo
 *      (handles comma-joined multi-proxy values)
 *
 * For SDK 58+ this script is a no-op verification. For older layouts it
 * applies the historical patches. Safe to run repeatedly.
 */
const fs = require('fs');
const path = require('path');

const CLI = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo',
  'node_modules',
  '@expo',
  'cli',
  'build',
  'src',
  'start',
  'server',
  'middleware'
);

const MANIFEST_MIDDLEWARE = path.join(CLI, 'ManifestMiddleware.js');
const EXPO_GO_MIDDLEWARE = path.join(CLI, 'ExpoGoManifestHandlerMiddleware.js');
const RESOLVE_FORWARDED = path.join(CLI, 'resolveForwarded.js');

function fileContains(file, needle) {
  return fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(needle);
}

// SDK 58+ signatures
const UPSTREAM_REGEX = 'bundleUrl.match(/(?:https?|exps?):\\/\\/[^/]+\\//)';
const UPSTREAM_FORWARDED = 'parseForwardedRequestInfo';

// Legacy (SDK 57) vulnerable signatures
const LEGACY_V1_REGEX = 'bundleUrl.match(/^https?:\\/\\/.*?\\//)';
const LEGACY_V2_REGEX = 'bundleUrl.match(/^(?:https?|exp|exps):\\/\\/.*?\\//)';
const LEGACY_RAW_PROTOCOL = "protocol: req.headers['x-forwarded-proto']";

if (!fs.existsSync(MANIFEST_MIDDLEWARE)) {
  console.warn('[patch-expo-manifest] ManifestMiddleware.js not found, skipping:', MANIFEST_MIDDLEWARE);
  process.exit(0);
}

// SDK 58+: upstream already fixed both issues — verify and exit.
if (fileContains(EXPO_GO_MIDDLEWARE, UPSTREAM_FORWARDED) && fileContains(RESOLVE_FORWARDED, 'coerceProtocol')) {
  if (fileContains(MANIFEST_MIDDLEWARE, UPSTREAM_REGEX)) {
    console.log('[patch-expo-manifest] SDK 58+ upstream fix detected — no patch needed');
    process.exit(0);
  }
}

// Legacy SDK 57: apply historical patches.
let applied = 0;

if (fileContains(MANIFEST_MIDDLEWARE, LEGACY_V1_REGEX)) {
  let src = fs.readFileSync(MANIFEST_MIDDLEWARE, 'utf8');
  src = src.split(LEGACY_V1_REGEX).join(UPSTREAM_REGEX);
  src = src.split(LEGACY_V2_REGEX).join(UPSTREAM_REGEX);
  fs.writeFileSync(MANIFEST_MIDDLEWARE, src);
  applied += 1;
  console.log('[patch-expo-manifest] applied resolver regex patch (legacy SDK 57)');
} else if (fileContains(MANIFEST_MIDDLEWARE, UPSTREAM_REGEX)) {
  console.log('[patch-expo-manifest] resolver regex: already applied');
} else {
  console.warn('[patch-expo-manifest] resolver regex: expected pattern not found');
}

if (fileContains(EXPO_GO_MIDDLEWARE, LEGACY_RAW_PROTOCOL)) {
  let src = fs.readFileSync(EXPO_GO_MIDDLEWARE, 'utf8');
  src = src
    .split(LEGACY_RAW_PROTOCOL)
    .join(
      "protocol: (String(req.headers['x-forwarded-proto'] ?? '').split(',')[0].trim()) || undefined"
    );
  fs.writeFileSync(EXPO_GO_MIDDLEWARE, src);
  applied += 1;
  console.log('[patch-expo-manifest] applied protocol sanitizer patch (legacy SDK 57)');
} else if (fileContains(EXPO_GO_MIDDLEWARE, 'split(\',\')[0].trim()')) {
  console.log('[patch-expo-manifest] protocol sanitizer: already applied');
} else {
  console.warn('[patch-expo-manifest] protocol sanitizer: expected pattern not found');
}

if (applied === 0) {
  console.log('[patch-expo-manifest] nothing to do');
}
