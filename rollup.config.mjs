/* eslint-disable import/no-extraneous-dependencies */
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import { glob } from 'glob';
import json from '@rollup/plugin-json';

const files = glob.sync('src/**/*.js'); // Get all .js files in src directory and its subdirectories

export default files.map(file => ({
	input: file,
	output: [
		{
			file: `lib/${file.substring(4).replace(/\.js$/, '.mjs')}`, // Remove "src/" from the path and replace .js with .mjs
			format: 'es',
			sourcemap: false,
		},
		{
			file: `lib/${file.substring(4)}`, // Remove "src/" from the path
			format: 'cjs',
			sourcemap: false,
		},
	],
	plugins: [
		resolve(),
		commonjs(),
		babel({
			babelHelpers: 'runtime',
			exclude: 'node_modules/**',
			presets: [
				[
					'@babel/preset-env',
					{
						modules: false,
					},
				],
			],
			plugins: [
				[
					'@babel/plugin-transform-runtime',
					{
						corejs: false,
						helpers: true,
						regenerator: true,
						useESModules: true,
					},
				],
			],
		}),
		json(),
	],
}));
