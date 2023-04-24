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
			file: `lib/${file.substring(4)}`, // Remove "src/" from the path
			format: 'es',
			sourcemap: true,
		},
		{
			file: `cjs/${file.substring(4)}`, // Remove "src/" from the path
			format: 'cjs',
			sourcemap: true,
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
		{
			// Replace "@appbaseio/reactivecore/lib" with the appropriate path
			// based on the output format
			name: 'replace-paths',
			transform(code, id) {
				if (/\/node_modules\/@appbaseio\/reactivecore\/lib\//.test(id)) {
					return code.replace(
						'@appbaseio/reactivecore/lib',
						id.endsWith('/cjs/')
							? '@appbaseio/reactivecore/lib/cjs'
							: '@appbaseio/reactivecore/lib/es',
					);
				}
				return code;
			},
		},
	],
}));
