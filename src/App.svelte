<script>
	import { GPU } from 'gpu.js';
	import { createCanvas } from './utils';

	const CANVAS_STYLE = 'max-height: 75vh; max-width: 100%;';

	const url1 = 'https://source.unsplash.com/0DLKy4IPoc8';
	const url2 = 'https://source.unsplash.com/ISI5DlnYvuY';

	let image1, image2;
	let kernel;
	let image1Loaded = false;
	let image2Loaded = false;

	function onImageLoad(event) {
		if (event.target === image1) {
			image1Loaded = true;
		}
		
		if (event.target === image2) {
			image2Loaded = true;
		}

		if (image1Loaded && image2Loaded) {
			console.log('creating canvas');
			const canvasContainer = document.querySelector('.canvas-container');
			console.log(image1.width, image1.height);
			const canvas = createCanvas([image1.width, image1.height], {
				el: canvasContainer,
				style: CANVAS_STYLE
			});

			const gpu = new GPU({
				canvas,
				context: canvas.getContext('webgl', { preserveDrawingBuffer: true })
			});

			kernel = gpu.createKernel(function kernel(img1, img2) {
				const pixel1 = img1[this.thread.y][this.thread.x];
				const pixel2 = img2[this.thread.y][this.thread.x];
				const r1 = pixel1[0];
				const g1 = pixel1[1];
				const b1 = pixel1[2];
				const r2 = pixel2[0];
				const g2 = pixel2[1];
				const b2 = pixel2[2];
				this.color(r1 + r2, g1 + g2, b1 + b2, 1);
			}, {
				graphical: true,
				output: [image1.width, image1.height]
			});

			kernel(image1, image2);
		}
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