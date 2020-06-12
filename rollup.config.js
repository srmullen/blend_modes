import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import html from '@rollup/plugin-html';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import autoPreprocess from 'svelte-preprocess';

const production = !process.env.ROLLUP_WATCH;

const GITHUB_URL = 'https://srmullen.github.io/blend_modes/';

export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'dist/bundle.js'
	},
	plugins: [
// 		html({
// 			title: 'Blend Modes',
// 			template: ({ attributes, bundle, files, publicPath, title }) => `<!DOCTYPE html>
// <html lang="en">
// <head>
// 	<meta charset='utf-8'>
// 	<meta name='viewport' content='width=device-width,initial-scale=1'>
// 	<base href="${production ? GITHUB_URL : '/'}">

// 	<title>${title}</title>

// 	<link rel='icon' type='image/png' href='favicon.ico'>
// 	<link rel='stylesheet' href='global.css'>
// 	<link rel='stylesheet' href='bundle.css'>

// 	<script defer src='bundle.js'></script>
// </head>
// <body>
// </body>
// </html>
// 			`
// 		}),
		copy({
			targets: [
				{ src: 'public/index.html', dest: 'dist/'},
				{ src: 'public/favicon.ico', dest: 'dist/' },
				{ src: 'public/global.css', dest: 'dist/' }
			]
		}),
		svelte({
			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into
			// a separate file - better for performance
			css: css => {
				css.write('dist/bundle.css');
			},
			preprocess: autoPreprocess()
		}),

		replace({
			process: JSON.stringify({
				env: {
					production
				}
			})
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('dist'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};

function serve() {
	let started = false;

	return {
		writeBundle() {
			if (!started) {
				started = true;

				require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true
				});
			}
		}
	};
}
