import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';
import serve from 'rollup-plugin-serve';
import sveltePreprocess from 'svelte-preprocess';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'dist/bundle.js'
	},
	plugins: [
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
				css.write('bundle.css');
			},
			preprocess: sveltePreprocess({
				postcss: postcss({
					plugins: [
						autoprefixer()
					]
				})
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
		!production && serve({
			contentBase: 'dist',
			port: 5007,
			verbose: true
		}),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload({
			watch: 'dist',
			port: 31245
		}),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};