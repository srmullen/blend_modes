<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import Picker from 'vanilla-picker';

  const dispatch = createEventDispatcher();

  let parent;
  let picker;

  onMount(() => {
    picker = new Picker(parent);

    picker.onChange = (color) => {
      // getComputedStyle(document.documentElement).getPropertyValue('--selected-color');

      // document.documentElement.style.setProperty('--selected-color', color.hex);
      parent.style.setProperty('--selected-color', color.hex);

      dispatch('change', color);
    }
  });
</script>

<div class="parent" bind:this={parent}></div>

<style>
  .parent {
    --selected-color: #f00;
  }

  .parent {
    width: 40px;
    height: 40px;
    background-color: var(--selected-color);
    width: 40px;
    border-radius: 50%;
    border: 2px solid black;
  }
</style>

