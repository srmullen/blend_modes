<script>
	import { GPU } from 'gpu.js';
	import throttle from 'lodash.throttle';
	import { createCanvas, randomImageURL } from './utils';
	import * as kernels from './kernels';
	import Select from './components/Select.svelte';
	import Image from './components/Image.svelte';
	import UploadImage from './components/UploadImage.svelte';
	import ColorLayer from './components/ColorLayer.svelte';

	const CANVAS_STYLE = 'max-height: 75vh; max-width: 100%;';

	const MODES = [
		{ name: 'Add', value: 'add' },
		{ name: 'Subtract', value: 'subtract' },
		{ name: 'Multiply', value: 'multiply' },
		{ name: 'Divide', value: 'divide' },
		{ name: 'Darken', value: 'darken' },
		{ name: 'Lighten', value: 'lighten' },
		{ name: 'Screen', value: 'screen' },
		{ name: 'Overlay', value: 'overlay' },
		{ name: 'Hard Light', value: 'hardLight' },
		{ name: 'Color Burn', value: 'colorBurn' },
		{ name: 'Linear Burn', value: 'linearBurn' },
		{ name: 'Color Dodge', value: 'colorDodge' },
		{ name: 'Random', value: 'random_component' },
		{ name: 'Difference', value: 'difference' },
		{ name: 'Soft Light', value: 'softLight' },
		{ name: 'Exclusion', value: 'exclusion' },
		{ name: 'Hue', value: 'hue' },
		{ name: 'Saturation', value: 'saturation' },
		{ name: 'Luminosity', value: 'luminosity' },
		{ name: 'Color', value: 'color' }
	];

	const url1 = 'https://source.unsplash.com/0DLKy4IPoc8';
	const url2 = 'https://source.unsplash.com/ISI5DlnYvuY';
	// let url1 = randomImageURL();
	// let url2 = randomImageURL();

	let image1, image2;
	let kernel;
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
				if (mode.value.toLowerCase() === hash) {
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
			const canvas = createCanvas([image1.width, image1.height], {
				el: canvasContainer,
				style: CANVAS_STYLE
			});

			gpu = new GPU({
				canvas,
				context: canvas.getContext('webgl', { preserveDrawingBuffer: true })
			});

			gpu.addFunction(kernels.min);
			gpu.addFunction(kernels.max);
			gpu.addFunction(kernels.mmm);
			gpu.addFunction(kernels.lum);
			gpu.addFunction(kernels.clipColor);
			gpu.addFunction(kernels.sat);
			gpu.addFunction(kernels.setLum);
			gpu.addFunction(kernels.setSat, {
				argumentTypes: { pix: 'Array(4)', s: 'Number' }
			});

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
		ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
		ctx.fillRect(0, 0, width, height);
		const img = document.createElement('img');
		// img.src = await canvas.toDataURL('image/png');
		// return img;
		return await canvas.toDataURL('image/png');
	}
</script>

<main>
	<div class="source-images">
		<div class="image-container">
			<div class="image-buttons">
				<button 
					class="btn bg-red" 
					on:click={() => {
						url1 = randomImageURL();
					}}
				>
					Random
				</button>
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
			<div class="image-buttons">
				<button 
					class="btn bg-red" 
					on:click={() => {
						url2 = randomImageURL();
					}}
				>
					Random
				</button>
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
	<div class="inputs-container">
		<div class="select-container">
			<Select options={MODES} bind:selected={mode} on:change={onModeChange} />
		</div>
		{#if mode.value === 'overlay' || mode.value === 'random_component'}
			<div class="slider-container">
				<label for="cutoff-slider">Cutoff</label>
				<input 
					id="cutoff-slider"
					type="range" 
					min="0" 
					max="1" 
					step="0.01" 
					bind:value={cutoff} 
					class="slider" 
					on:input={runKernel}
				/>
			</div>
		{/if}
	</div>
	<div class='canvas-container'></div>
</main>

<style type="text/scss">
	$body-color: #fff;
	$top-padding: 10px;
	$primary-color: rgb(214, 3, 3);
	$green: green;
	$blue: rgb(39, 70, 247);

	.source-images {
		display: flex;
	}

	.image-container {
		margin: 15px;
		width: 50%;
	}

	.select-container {
    width: 300px;
    height: 42px;
    margin: 4px;
  }

	.inputs-container {
		display: flex;
	}

	.image-buttons {
		display: flex;
		* {
			margin-right: 8px;
		}
	}

	.color-picker {
		margin-left: 8px;
		margin-top: -2px;
	}

	.bg-red {
		background-color: $primary-color;
	}

	.bg-green {
		background-color: $green;
	}

	.bg-blue {
		background-color: $blue;
	}

	.btn {
		border: none;
		border-radius: 0;
		padding: 10px;
		color: #fff;
		font-family: 'Courier New', Courier, monospace;
		font-weight: 550;
		letter-spacing: 0.3px;
		font-size: 14px;
		&.bg-red {
			&:hover {
				background-color: lighten($color: $primary-color, $amount: 5);
				opacity: 0.7;
			}
		}

		&.bg-green {
			&:hover {
				background-color: lighten($color: $green, $amount: 5);
				opacity: 0.7;
			}
		}

		&.bg-blue {
			&:hover {
				background-color: lighten($color: $blue, $amount: 5);
				opacity: 0.7;
			}
		}
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>