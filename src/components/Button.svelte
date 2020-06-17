<script>
  export let color = 'red';
  export let button;
</script>

<button
  bind:this={button}
  class="btn"
  class:bg-red={color === 'red'}
  class:bg-green={color === 'green'}
  class:bg-blue={color === 'blue'}
	on:click
>
  <slot></slot>
</button>

<style type="text/scss">
  $primary-color: rgb(214, 3, 3);
	$green: green;
	$blue: rgb(39, 70, 247);
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
		margin: 0;
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
			}
		}

		&.bg-green {
			&:hover {
				background-color: lighten($color: $green, $amount: 5);
			}
		}

		&.bg-blue {
			&:hover {
				background-color: lighten($color: $blue, $amount: 5);
			}
		}
	}
</style>