import path from 'path';
import rimraf from 'rimraf';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import external from 'rollup-plugin-peer-deps-external';

const packageJson = require('./package.json');

export default [
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      external(),
      resolve({ preferBuiltins: false }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        compilerOptions: { declarationDir: './types' },
      }),
    ],
  },
  {
    input: './dist/types/index.d.ts',
    output: [{ file: packageJson.types, format: 'esm' }],
    plugins: [
      dts(),
      (() => ({
        name: 'clean-separate-types',
        buildEnd: () => rimraf.sync(path.join(__dirname, './dist/types')),
      }))(),
    ],
  },
];
