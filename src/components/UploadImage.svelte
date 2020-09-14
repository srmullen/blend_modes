<script>
  export let onLoad = () => {};
  // export let img; // HTMLImageElement

  function onChange() {
    if (this.files && this.files[0]) {
      const img = document.createElement('img');
      const src = URL.createObjectURL(this.files[0]); // set src to blob url
      img.src = src;
      img.hidden = true;
      img.onload = () => {
        onLoad(src);
      };
      img.onerror = onerror;
      const source = document.querySelector('.source');
      source.appendChild(img);
    }
  }
</script>

<div>
  <label class="bg-green">
    Choose Image
    <input type="file" on:change="{onChange}" />
  </label>
</div>

<div class="source"></div>

<style type="text/scss">
  $body-color: #fff;
	$top-padding: 10px;
	$primary-color: rgb(214, 3, 3);
	$green: green;
	$blue: rgb(39, 70, 247);

  .source {
    display: none;
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
  
  label {
		padding: 10px;
		color: #fff;
		font-family: 'Courier New', Courier, monospace;
		font-weight: 550;
		letter-spacing: 0.3px;
		white-space: nowrap;
		font-size: 14px;
		display: block;
		cursor: pointer;
		input[type=file] {
			display: none;
		}
		&:hover {
			background-color: lighten($color: $green, $amount: 5);
			opacity: 0.7;
		}
	}
</style>
