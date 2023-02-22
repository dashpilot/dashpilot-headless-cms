<script>
import { fade, fly } from 'svelte/transition';
import { onMount } from 'svelte';
export let showPublish;
let loading = false;
let preview = false;
let checked = true;
let error = false;
let liveUrl = false;

	onMount(async () => {

		/*
    loading = true;
    fetch('api/check', {
      method: 'get'
    })
    .then(function(response) {
      return response.json();
    }).then(function(data) {
      console.log(data);
      if(data.ok){
        error = false;
        checked = true;
      }else{
        error = true;
        checked = false;
      }
      loading = false;

    })
    .catch(function(error) {
      console.log(error);
      loading = false;
    });
		*/

	});

function publish(){
  loading = true;
  fetch('/api/publish', {
    method: 'get'
  })
  .then(function(response) {
    return response.json();
  }).then(function(data) {
    console.log(data);
		liveUrl = data.domain;
    window.setTimeout(function(){
      loading = false;
      preview = true;
    }, 6000);
  })
  .catch(function(error) {
    console.log(error);
    loading = false;
  });
}

function close(){
  showPublish = false;
  preview = false;
}
</script>

{#if showPublish}
<div class="backdrop" transition:fade={{duration: 200}}>
<div id="publisher" class="wdgt">

<div class="wdgt-content">

<div class="close" on:click="{close}">&times;</div>

<h6>Publish</h6>
<p>Publish your site</p>

</div>

<div class="wdgt-footer">


{#if checked}

  {#if preview}
  <a href="{liveUrl}" target="blank" class="btn btn-primary float-right">View Site</a>
  {:else}

    <button class="btn btn-primary float-right" on:click="{publish}">
    {#if loading}
    <span class="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span> Publishing...
    {:else}
    Publish
    {/if}
    </button>

  {/if}

{:else}

  {#if error}
  Please <a href="/upgrade">upgrade</a> to publish your site.
  {:else}
  <span class="spinner-border spinner-border-sm mr-1" role="status" aria-hidden="true"></span> Checking status...
  {/if}

{/if}

<div class="clear"></div>
</div>

</div>
</div>

{/if}


<style>
#publisher{
  position: fixed;
  top: 10%;
  left: calc(50% - 300px);
	width: 600px;
  min-height: 300px;
	border-radius: 4px;
  background-color: #F8F8F8;
  border-left: 1px solid #DDD;
}

.wdgt-content{
	padding: 20px;
  min-height: 250px;
}

.wdgt-footer{
	padding: 15px;
	background-color: white;
	border-top: 1px solid #DDD;
	border-bottom-left-radius: 4px;
	border-bottom-right-radius: 4px;
}

.clear{
	clear: both;
}

.btn-primary{
	width: 160px;
}

.backdrop{
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0,0,0,0.5);
  z-index: 99999999999 !important;
}

.close{
	cursor: pointer;
}

.spinner-border{
	display: inline-block;
}

h6{
  font-weight: 600;
}
</style>
