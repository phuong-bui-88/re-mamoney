/**
 * Tests for Expo CLI manifest-asset resolution (SDK 58 upstream fix +
 * legacy patch script).
 *
 * SDK 58 fixed both upstream bugs:
 * 1. resolver regex is unanchored (?:https?|exps?):\/\/[^/]+\/ — tolerates
 *    exp:// and comma-joined prefixes.
 * 2. x-forwarded-proto is parsed via resolveForwarded.parseForwardedRequestInfo
 *    which takes the first comma-separated segment and coerces exp→http, exps→https.
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const CLI = path.join(
  __dirname,
  '../../../node_modules/expo/node_modules/@expo/cli/build/src/start/server/middleware'
);
const MANIFEST_MIDDLEWARE = path.join(CLI, 'ManifestMiddleware.js');
const EXPO_GO_MIDDLEWARE = path.join(CLI, 'ExpoGoManifestHandlerMiddleware.js');
const RESOLVE_FORWARDED = path.join(CLI, 'resolveForwarded.js');
const PATCH_SCRIPT = path.join(__dirname, '../../../scripts/patch-expo-manifest.js');

/** Extract the resolver regex literal from ManifestMiddleware. */
function getResolverRegex(): RegExp {
  const source = fs.readFileSync(MANIFEST_MIDDLEWARE, 'utf8');
  const line = source.split('\n').find((l) => l.includes('bundleUrl.match('));
  expect(line).toBeDefined();
  const m = line!.match(/bundleUrl\.match\((.+)\)\[0\]/);
  expect(m).not.toBeNull();
  // eslint-disable-next-line no-eval
  return eval(m![1]) as RegExp;
}

/** Mirror of the resolver line in ManifestMiddleware. */
function resolveAssetUrl(bundleUrl: string, assetPath: string): string {
  const match = bundleUrl.match(getResolverRegex());
  if (!match) {
    throw new Error(`Cannot read properties of null (reading '0') for: ${bundleUrl}`);
  }
  return match[0] + 'assets/' + assetPath;
}

describe('ManifestMiddleware asset resolver (SDK 58)', () => {
  const assetPath = './assets/favicon.png';

  it('resolves_assets_for_exp_bundle_url (tunnel)', () => {
    const bundleUrl =
      'exp://aniy1ak-phuongbui1988-8081.exp.direct/index.bundle?platform=ios&dev=true';
    expect(resolveAssetUrl(bundleUrl, assetPath)).toBe(
      'exp://aniy1ak-phuongbui1988-8081.exp.direct/assets/' + assetPath
    );
  });

  it('resolves_assets_for_exps_bundle_url (secure tunnel)', () => {
    const bundleUrl = 'exps://example.exp.direct/index.bundle?platform=android';
    expect(resolveAssetUrl(bundleUrl, assetPath)).toBe(
      'exps://example.exp.direct/assets/' + assetPath
    );
  });

  it('resolves_assets_for_https_bundle_url (regression)', () => {
    const bundleUrl = 'https://example.exp.direct/index.bundle?platform=ios';
    expect(resolveAssetUrl(bundleUrl, assetPath)).toBe(
      'https://example.exp.direct/assets/' + assetPath
    );
  });

  it('resolves_assets_for_http_bundle_url (regression: LAN)', () => {
    const bundleUrl = 'http://192.168.1.5:8081/index.bundle?platform=ios';
    expect(resolveAssetUrl(bundleUrl, assetPath)).toBe(
      'http://192.168.1.5:8081/assets/' + assetPath
    );
  });

  it('resolves_assets_for_comma_joined_exp_https_url (multi-proxy)', () => {
    const bundleUrl =
      'exp, https://aniy1ak-phuongbui1988-8081.exp.direct/index.bundle?platform=ios';
    expect(resolveAssetUrl(bundleUrl, assetPath)).toBe(
      'https://aniy1ak-phuongbui1988-8081.exp.direct/assets/' + assetPath
    );
  });

  it('resolves_assets_for_comma_joined_https_exp_url (reversed order)', () => {
    const bundleUrl = 'https, exp://example.exp.direct/index.bundle?platform=android';
    expect(resolveAssetUrl(bundleUrl, assetPath)).toBe(
      'exp://example.exp.direct/assets/' + assetPath
    );
  });

  it('resolver regex is unanchored (no leading ^)', () => {
    const source = fs.readFileSync(MANIFEST_MIDDLEWARE, 'utf8');
    expect(source).not.toMatch(/bundleUrl\.match\(\/\^/);
    expect(source).toMatch(/bundleUrl\.match\(\/\(\?:https\?\|exps\?\):/);
  });

  it('patched file no longer contains the vulnerable https?-only regex', () => {
    const source = fs.readFileSync(MANIFEST_MIDDLEWARE, 'utf8');
    expect(source).not.toMatch(/bundleUrl\.match\(\/\^https\?:/);
  });
});

describe('resolveForwarded protocol parsing (SDK 58)', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { parseForwardedRequestInfo } = require(path.join(RESOLVE_FORWARDED));

  function fakeReq(headers: Record<string, string>): any {
    return { headers };
  }

  it('coerces exp protocol to http', () => {
    const result = parseForwardedRequestInfo(
      fakeReq({ 'x-forwarded-proto': 'exp', host: 'example.exp.direct:8081' })
    );
    expect(result?.protocol).toBe('http');
  });

  it('coerces exps protocol to https', () => {
    const result = parseForwardedRequestInfo(
      fakeReq({ 'x-forwarded-proto': 'exps', host: 'example.exp.direct:8081' })
    );
    expect(result?.protocol).toBe('https');
  });

  it('takes first segment from comma-joined x-forwarded-proto', () => {
    const result = parseForwardedRequestInfo(
      fakeReq({ 'x-forwarded-proto': 'exp, https', host: 'example.exp.direct:8081' })
    );
    expect(result?.protocol).toBe('http');
  });

  it('handles reversed comma order', () => {
    const result = parseForwardedRequestInfo(
      fakeReq({ 'x-forwarded-proto': 'https, exp', host: 'example.exp.direct:8081' })
    );
    expect(result?.protocol).toBe('https');
  });

  it('returns https for plain https header', () => {
    const result = parseForwardedRequestInfo(
      fakeReq({ 'x-forwarded-proto': 'https', host: 'example.exp.direct:8081' })
    );
    expect(result?.protocol).toBe('https');
  });

  it('ExpoGo handler uses parseForwardedRequestInfo', () => {
    const source = fs.readFileSync(EXPO_GO_MIDDLEWARE, 'utf8');
    expect(source).toMatch(/parseForwardedRequestInfo/);
    expect(source).not.toMatch(/protocol: req\.headers\['x-forwarded-proto'\]\s*$/m);
  });
});

describe('patch script', () => {
  it('no-ops on SDK 58+ (upstream already fixed)', () => {
    const output = execFileSync(process.execPath, [PATCH_SCRIPT], { encoding: 'utf8' });
    expect(output).toMatch(/SDK 58\+ upstream fix detected|already applied|nothing to do/);
  });

  it('is idempotent (safe to run twice)', () => {
    const first = execFileSync(process.execPath, [PATCH_SCRIPT], { encoding: 'utf8' });
    const second = execFileSync(process.execPath, [PATCH_SCRIPT], { encoding: 'utf8' });
    expect(first).toMatch(/SDK 58\+|already applied|applied|nothing to do/);
    expect(second).toMatch(/SDK 58\+|already applied|nothing to do/);
  });
});
