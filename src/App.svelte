<svelte:head>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0/font/bootstrap-icons.css">
	<script src="https://cdnjs.cloudflare.com/ajax/libs/pluralize/8.0.0/pluralize.min.js"></script>
</svelte:head>

<script>
import { onMount } from 'svelte';
import Router from 'svelte-spa-router'
import {wrap} from 'svelte-spa-router/wrap'

import Home from './routes/Home.svelte'
import List from './routes/List.svelte'
import Edit from './routes/Edit.svelte'
import EditCollection from './routes/EditCollection.svelte'
import NotFound from './routes/NotFound.svelte'


let data = false;
let showApp = false;
let routes = false;
let current = false;


onMount(async () => {
	const res = await fetch(`data.json`);
	data = await res.json();

	routes = {
	    // Exact path
	    '/': wrap({
	        component: Home,
	        props: {
	            data:data,
	        }
	    }),

	    '/list/:cat': wrap({
	        component: List,
	        props: {
	            data:data
	        }
	    }),

			'/edit/:cat/:id': wrap({
	        component: Edit,
	        props: {
	            data:data
	        }
	    }),

			'/collections/:id': wrap({
					component: EditCollection,
					props: {
							data:data
					}
			}),

	    // Catch-all
	    // This is optional, but if present it must be the last
	    '*': NotFound,
	}

});

// allows force re-rendering
window.renderData = function(mydata){
	data = mydata;
}
</script>

	{#if routes}
<div class="row no-gutters page">
<div class="col-md-2">
<div class="side">

<a href="/#/" class:selected="{current === false}" on:click="{() => current = false}"><img src="assets/img/rocketlogo.png" id="logo" /></a>

<div class="side-nav">
<div id="collections-nav">
	{#each data.collections as item}
	{#if item.title !== 'collections'}
	<a href="/#/list/{item.title}" class:selected="{current === item}"
	on:click="{() => current = item.title}">{item.title}</a>
	{/if}
	{/each}
</div>
	<a href="/#/list/collections" class:selected="{current === 'collections'}"
	on:click="{() => current = 'collections'}">collections</a>
</div>

</div>

</div>
<div class="col-md-10">

<div class="main">
	<Router {routes} />
</div>

</div>
</div>


	{/if}
