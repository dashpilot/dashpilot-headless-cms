<script>
export let data;
let loading = false;

function save(){

  loading = true;
  let opts = {};
  opts.path = 'data.json';
  opts.type = 'json';
  opts.data = data;
  call_api('api/save', opts).then(function(res) {
    if (res.status=='ok') {
      console.log('Saved');
      loading = false;
    } else {
      console.log('Error saving');
      setTimeout(function(){
          loading = false;
      }, 1000)
    }
  });

}


</script>

<div class="row topnav">
<div class="col-6">
<h4>Settings</h4>
</div>
<div class="col-6 text-right">
<button class="btn btn-dark btn-add" on:click="{save}">{#if loading}<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> {/if} &nbsp;Save</button>
</div>
</div>

<div class="content">

{#each Object.entries(data.settings) as [key, value]}

<b>{key.replaceAll('_', ' ')}</b>
<input type="text" class="form-control w-50" bind:value="{data.settings[key]}" />

{/each}

</div>
