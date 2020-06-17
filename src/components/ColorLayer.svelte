<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import Picker from 'vanilla-picker';
  import Button from './Button.svelte';

  const dispatch = createEventDispatcher();

  let parent;
  let picker;

  onMount(() => {
    picker = new Picker({ 
      parent,
      alpha: false
    });

    picker.onChange = (color) => {
      parent.style.setProperty('--selected-color', color.hex);

      dispatch('change', color);
    }
  });
</script>

<Button color='blue' bind:button={parent}>Color</Button>

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

