<script>
  export let src;
  export let alt = '';
  export let image;
</script>

<img 
  bind:this={image}
  class="visible" 
  {src} 
  {alt} 
  crossorigin="anonymous"
/>

<img 
  bind:this={image}
  class="source" 
  {src} 
  {alt} 
  crossorigin="anonymous"
  on:load
/>

<style>
  .visible {
    max-width: 100%;
    max-height: 100%;
  }

  .source {
		display: none;
	}
</style>

