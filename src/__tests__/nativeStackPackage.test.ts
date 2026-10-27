/* eslint-disable @typescript-eslint/no-var-requires */
import fs from 'fs';
import path from 'path';

describe('@react-navigation/native-stack package integrity', () => {
  const pkgDir = path.dirname(
    require.resolve('@react-navigation/native-stack/package.json'),
  );

  it('does not reference InteractionManager (removed in RN 0.88)', () => {
    const libDir = path.join(pkgDir, 'lib');
    const files = fs.readdirSync(path.join(libDir, 'commonjs'), {
      recursive: true,
      encoding: 'utf-8',
    }) as string[];
    const jsFiles = files.filter(
      (f: string) => f.endsWith('.js') && !f.endsWith('.d.js'),
    );
    const offenders: string[] = [];
    for (const file of jsFiles) {
      const content = fs.readFileSync(
        path.join(libDir, 'commonjs', file),
        'utf-8',
      );
      if (content.includes('InteractionManager')) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('is installed and exportable', () => {
    const nativeStack = require('@react-navigation/native-stack');
    expect(typeof nativeStack.createNativeStackNavigator).toBe('function');
  });
});
