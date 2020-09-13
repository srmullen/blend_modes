<script>
	import { GPU } from 'gpu.js';
	import throttle from 'lodash.throttle';
	import { createCanvas, randomImageURL, saveImage } from './utils';
	import * as kernels from './kernels';
	import Select from './components/Select.svelte';
	import Image from './components/Image.svelte';
	import UploadImage from './components/UploadImage.svelte';
	import ColorLayer from './components/ColorLayer.svelte';
	import Button from './components/Button.svelte';
	import { MODES, CANVAS_STYLE } from "./constants";
	
	let url1 = 'https://source.unsplash.com/ISI5DlnYvuY';
	let url2 = 'https://source.unsplash.com/0DLKy4IPoc8';
	// let url1 = randomImageURL();
	// let url2 = randomImageURL();

	let image1, image2;
	let kernel;
	let canvas;
	let cutoff = 0.5;
	let gpu;
	let image1Loaded = false;
	let image2Loaded = false;
	let mode = getModeFromURLHash();

	function getModeFromURLHash() {
		if (window.location.hash) {
			const hash = window.location.hash.slice(1);
			for (let i = 0; i < MODES.length; i++) {
				const mode = MODES[i];
				if (mode.value.toLowerCase() === hash.toLowerCase()) {
					return mode;
				}
			}
			setURLHash();
			return MODES[0];
		} else {
			return MODES[0];
		}
	}

	function setURLHash(value) {
		if (value) {
			window.history.replaceState(undefined, undefined, `#${value}`);
		}
	}

	const runKernel = throttle(() => {
		if (!kernel) {
			return;
		}

		if (mode.value === 'overlay' || mode.value === 'random_component') {
			kernel(image1, image2, cutoff);
		} else {
			kernel(image1, image2);
		}
	}, 50);

	function onImageLoad(event) {
		if (event.target === image1) {
			image1Loaded = true;
		}
		
		if (event.target === image2) {
			image2Loaded = true;
		}

		if (image1Loaded && image2Loaded && !kernel) {
			const canvasContainer = document.querySelector('.canvas-container');
			canvas = createCanvas([image1.width, image1.height], {
				el: canvasContainer,
				style: CANVAS_STYLE
			});

			gpu = new GPU({
				canvas,
				// mode: 'dev',
				context: canvas.getContext('webgl', { 
					preserveDrawingBuffer: true,
					premultipliedAlpha: false
				})
			});

			gpu.addFunction(kernels.minimum);
			gpu.addFunction(kernels.maximum);
			gpu.addFunction(kernels.mmm);
			gpu.addFunction(kernels.lum);
			gpu.addFunction(kernels.clipColor);
			gpu.addFunction(kernels.sat);
			gpu.addFunction(kernels.setLum);
			gpu.addFunction(kernels.setSat, {
				argumentTypes: { pix: 'Array(4)', s: 'Number' }
			});
			gpu.addFunction(kernels.calcAlpha);
			gpu.addFunction(kernels.applyAlpha);

			kernel = gpu.createKernel(kernels[mode.value], {
				graphical: true,
				output: [image1.width, image1.height]
			});
		}

		runKernel();
	}

	function onModeChange() {
		setURLHash(mode.value);
		kernel = gpu.createKernel(kernels[mode.value], {
			graphical: true,
			output: [image1.width, image1.height]
		});

		runKernel();
	}

	async function createBlendLayer(width, height, color) {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		canvas.style = 'display: none;';
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
		ctx.fillRect(0, 0, width, height);
		const img = document.createElement('img');
		return await canvas.toDataURL('image/png');
	}
</script>

<main>
	<header>
		<div class="title">
			<h1>Blend Modes</h1>
		</div>
	</header>
	<div class="container">
		<div class="source-images">
			<div class="image-container">
				<h3>Backdrop</h3>
				<div class="image-buttons">
					<div>
						<Button 
							on:click={() => {
								url1 = randomImageURL();
							}}>
							Random
						</Button>
					</div>
					<UploadImage onLoad={(src) => {
						url1 = src;
					}} />
					<div class="color-picker">
						<ColorLayer on:change={throttle(async (event) => {
							const color = event.detail;
							const src = await createBlendLayer(image1.width, image1.height, color.rgba);
							url1 = src;
						}, 50)} />
					</div>
				</div>
				<Image 
					bind:image={image1} 
					src={url1} 
					on:load={onImageLoad}
				/>
			</div>
			<div class="image-container">
				<h3>Source</h3>
				<div class="image-buttons">
					<div>
						<Button 
							on:click={() => {
								url2 = randomImageURL();
							}}>
							Random
						</Button>
					</div>
					<UploadImage onLoad={(src) => {
						url2 = src;
					}} />
					<div class="color-picker">
						<ColorLayer on:change={throttle(async (event) => {
							const color = event.detail;
							const src = await createBlendLayer(image1.width, image1.height, color.rgba);
							url2 = src;
						}, 50)} />
					</div>
				</div>
				<Image 
					bind:image={image2} 
					src={url2} 
					on:load={onImageLoad}
				/>
			</div>
		</div>
		<div class="output">
				<section class="about">
				<h2>About</h2>
				<a href="https://twitter.com/srmullen?ref_src=twsrc%5Etfw" class="twitter-follow-button"
					data-show-count="false">Follow
					@srmullen</a>
				<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
				<div>
					Image blending modes are a way of combining two images into one image that maintains characteristics of the original images.
					This site implements the blend modes as described in the W3C specification. They are rendered to a canvas using <a href="https://gpu.rocks/">GPU.js</a>.
					For more information you can see the <a href="https://github.com/srmullen/blend_modes">Github repo</a> and the <a href="https://srmullen.com/articles/blend-modes">blog post</a> describing the blend mode implementations.
				</div>
			</section>
			<div class="inputs-container">
				<label>
					<h3>Blend Mode</h3>
					<div class="select-container">
						<Select options={MODES} bind:selected={mode} on:change={onModeChange} />
					</div>
				</label>
			</div>
			<section class="description">
				{mode.description}
			</section>
			<div class="download">
				<Button color='blue' on:click={() => saveImage(canvas)} class="btn bg-blue">Download</Button>
			</div>
			<div class='canvas-container'></div>
		</div>
	</div>
</main>

<style lang="scss">
	$primary-color: rgb(214, 3, 3);
	$green: green;
	$blue: rgb(39, 70, 247);
	
	:global(body) {
		padding: 28px;
	}

	main {
		max-width: 1300px;
		margin: auto;
	}

	header {
		width: 100%;
		display: flex;
	}

	.title {
		width: 38.2%;
		min-width: 50px;
	}

	h1, h2, h3 {
		margin: 0;
	}

	.container {
		display: flex;
	}

	.output {
		width: 50%;
		margin: auto;
	}

	.about {
		h2 {
			display: inline;
			padding-right: 12px;
		}
	}

	.download {
		padding: 12px 0;
	}

	.source-images {
		display: flex;
		flex-direction: column;
		justify-content: space-around;
		width: 38.2%;
		min-width: 250px;
	}

	.image-container {
		margin: 16px 16px 16px 0;

	}

	.select-container {
    width: 300px;
    height: 37px;
		margin: 8px;
		margin-left: 0;
  }

	.inputs-container {
		display: flex;
		justify-content: space-between;
		margin-top: 12px;
	}

	.image-buttons {
		display: flex;
		* {
			margin-right: 8px;
			margin-bottom: 8px;
		}
	}

	.color-picker {
		margin-left: 8px;
	}

	// @media (min-width: 640px) {
	// 	main {
	// 		max-width: none;
	// 	}
	// }
</style>