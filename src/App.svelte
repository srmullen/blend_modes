<script>
	import { GPU } from 'gpu.js';
	import { createCanvas } from './utils';
	import * as kernels from './kernels';
	import Select from './components/Select.svelte';

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
		{ name: 'Color Burn', value: 'colorBurn' },
		{ name: 'Linear Burn', value: 'linearBurn' },
		{ name: 'Color Dodge', value: 'colorDodge' }
	];

	const url1 = 'https://source.unsplash.com/0DLKy4IPoc8';
	const url2 = 'https://source.unsplash.com/ISI5DlnYvuY';

	let image1, image2;
	let kernel;
	let gpu;
	let image1Loaded = false;
	let image2Loaded = false;
	let mode = MODES[0];

	function onImageLoad(event) {
		if (event.target === image1) {
			image1Loaded = true;
		}
		
		if (event.target === image2) {
			image2Loaded = true;
		}

		if (image1Loaded && image2Loaded) {
			const canvasContainer = document.querySelector('.canvas-container');
			const canvas = createCanvas([image1.width, image1.height], {
				el: canvasContainer,
				style: CANVAS_STYLE
			});

			gpu = new GPU({
				canvas,
				context: canvas.getContext('webgl', { preserveDrawingBuffer: true })
			});

			kernel = gpu.createKernel(kernels[mode.value], {
				graphical: true,
				output: [image1.width, image1.height]
			});

			kernel(image1, image2);
		}
	}

	function onModeChange() {
		kernel = gpu.createKernel(kernels[mode.value], {
			graphical: true,
			output: [image1.width, image1.height]
		});

		kernel(image1, image2);
	}
</script>

<main>
	<div class="source-images">
		<div class="image-container">
			<img 
				bind:this={image1}
				class="source" 
				src={url1} alt="A Flower" 
				crossorigin="anonymous"
				on:load={onImageLoad}
			/>
		</div>
		<div class="image-container">
			<img 
				bind:this={image2}
				class="source" 
				src={url2} alt="A Mountains" 
				crossorigin="anonymous"
				on:load={onImageLoad}
			/>
		</div>
	</div>
	<div class="select-container">
		<Select options={MODES} bind:selected={mode} on:change={onModeChange} />
	</div>
	<div class='canvas-container'></div>
</main>

<style>
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

	.source {
		/* width: 100%; */
		display: none;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>