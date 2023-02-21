<svelte:head>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0/font/bootstrap-icons.css">
	<script src="https://cdnjs.cloudflare.com/ajax/libs/pluralize/8.0.0/pluralize.min.js"></script>
	<link rel="stylesheet" href="https://unpkg.com/easymde/dist/easymde.min.css">
	<script src="https://unpkg.com/easymde/dist/easymde.min.js"></script>
</svelte:head>

<script>
import { fade } from 'svelte/transition';
import { onMount } from 'svelte';
import Router from 'svelte-spa-router'
import {wrap} from 'svelte-spa-router/wrap'
import {location} from 'svelte-spa-router'

import Home from './routes/Home.svelte'
import Types from './routes/Types.svelte'
import Edit from './routes/Edit.svelte'
import EditType from './routes/EditType.svelte'
import Categories from './routes/Categories.svelte'
import Posts from './routes/Posts.svelte'
import Settings from './routes/Settings.svelte'
import NotFound from './routes/NotFound.svelte'

let data = false;
let showApp = false;
let routes = false;
let current = false;
let loading = true;

let curCat = sessionStorage.getItem('curcat');

onMount(async () => {

				const res = await fetch('https://api.eu-central-1.linodeobjects.com/frontsome/data.json');
				data = await res.json();
				console.log(data);
				
				if(!data.permissions){
					data.permissions = {
						"categories": true,
						"types": true,
						"settings": true
					}
				}
				
				if(!data.types){
					data.types = [{
					"id": "1",
					"title": "Post",
					"slug": "post",
					"fields": [{
					  "title": "body",
					  "description": "",
					  "type": "rte"
					}, {
					  "title": "Gallery",
					  "description": "",
					  "type": "gal"
					}, {
					  "title": "Category",
					  "description": "",
					  "type": "cat"
					}]
					}]
				}
				  

				routes = {
						// Exact path
						'/': wrap({
								component: Home,
								props: {
										data:data,
								}
						}),

						'/posts/:cat': wrap({
								component: Posts,
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

						'/edit/:cat/:catslug/:id': wrap({
								component: Edit,
								props: {
										data:data
								}
						}),

						'/types': wrap({
								component: Types,
								props: {
										data:data
								}
						}),

						'/type/:id': wrap({
								component: EditType,
								props: {
										data:data
								}
						}),

						'/categories': wrap({
								component: Categories,
								props: {
										data:data
								}
						}),

						'/settings': wrap({
								component: Settings,
								props: {
										data:data
								}
						}),

						// Catch-all
						// This is optional, but if present it must be the last
						'*': NotFound,
				}

				setTimeout(function(){
					loading = false;
				}, 500)


	});


// allows force re-rendering
window.renderData = function(mydata){
	data = mydata;
}

function setCat(slug){
	sessionStorage.setItem('curcat', slug);
}
</script>

{#if loading}

<div id="loading" class="text-center">

<img src="https://dashpilot-headless-cms.vercel.app/assets/img/rocket-planet.png" />
<div class="clear"></div>
<div class="spinner-border" role="status">
  <span class="sr-only">Loading...</span>
</div>

</div>

{:else if routes && data}
<div class="row no-gutters page" transition:fade>
<div class="col-md-2">
<div class="side">

<!--
<a href="/#/" class:selected="{current === false}" on:click="{() => current = false}"><img src="assets/img/rocketlogo.png" id="logo" /></a>
-->

<div class="side-nav">


<h5>Content</h5>
<div id="collections-nav">

{#each data.categories as item}

<a href="/#/posts/{item.slug}" class:selected="{current === item.title || $location.includes('/posts/'+item.slug)}"
on:click="{() => current = item.slug}" class="text-truncate">{item.title}</a>

{/each}


</div>


<div class="d-none d-md-block">

<h5>Manage</h5>

{#if data.permissions.categories}
<a href="/#/categories" class:selected="{$location.includes('categories')}"
on:click="{() => current = 'categories'}">Categories</a>
{/if}

{#if data.permissions.types}
<a href="/#/types" class:selected="{$location.includes('type')}"
	on:click="{() => current = 'types'}">Post Types</a>
{/if}

{#if data.permissions.settings}
	<a href="/#/settings" class:selected="{$location.includes('settings')}"
	on:click="{() => current = 'settings'}">settings</a>
{/if}
<br><br>


	<a href="/api/logout" id="logout">Log Out</a>
</div>
	
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
