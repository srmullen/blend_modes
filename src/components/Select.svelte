<script>
  export let options = [];
  export let selected;
</script>

<span class="select-container">
  <select bind:value={selected} name="shipping-country" on:change on:blur>
    {#each options as option}
      {#if typeof option === 'string'}
        <option value={option}>{option}</option>
      {:else}
        <option value={option}>{option.name}</option>
      {/if}
    {/each}
  </select>
  {#if typeof selected === 'string'}
    <span class="value">{selected}</span>
  {:else}
    <span class="value">{selected.name}</span>
  {/if}
</span>

<style type="text/scss">
  @mixin arrow-up {
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid black;
  }

  @mixin arrow-down {
    width: 0; 
    height: 0; 
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid #999;
  }
  .select-container {
    width: 100%;
    border: 1px solid #ddd;
    position: relative;
    margin: 0;
    height: 100%;
    display: inline-block;
    min-width: 100px;
    select {
      opacity: 0.01;
      z-index: 2;
      position: absolute;
      outline: none;
      border: none;
      background-color: white;
      width: 100%;
      height: 100%;
      option {
        display: block;
      }
    }
    &:after {
      content: "";
      position: absolute;
      color: #999;
      line-height: 42px;
      right: 8px;
      font-size: 7px;
      top: 18px;
      // @include arrow-up();
      @include arrow-down();
    }

    .value {
      left: 0;
      height: 42px;
      line-height: 42px;
      padding-left: 8px;
      padding-right: 4px;
      position: absolute;
      text-overflow: ellipsis;
    }
  }
</style>