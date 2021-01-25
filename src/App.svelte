<svelte:head>
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0/font/bootstrap-icons.css">
	<script src="https://cdnjs.cloudflare.com/ajax/libs/pluralize/8.0.0/pluralize.min.js"></script>
</svelte:head>

<script>
import { fade } from 'svelte/transition';
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
let loading = true;




onMount(async () => {

	firebase.auth().onAuthStateChanged(async function(user){
		if (user) {
			//console.log(user);
			user.getIdToken().then(async function(idToken) {
				console.log('Signed in');
				const res = await fetch(`data.json`);
				data = await res.json();
				console.log(data);

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

				setTimeout(function(){
					loading = false;
				}, 1000)


			});

		} else {
			console.log('User not signed in');
			setTimeout(function(){
				loading = false;
			}, 1000)
		}
	});

});

function logout() {
  firebase.auth().signOut().then(() => {
    // Sign-out successful.
    console.log('Signed out');
		data = false;
		routes = false;
  }).catch((error) => {
    console.log(error);
  });
}

// allows force re-rendering
window.renderData = function(mydata){
	data = mydata;
}
</script>

{#if loading}

<div id="loading" class="text-center">

<img src="assets/img/rocket-planet.png" />

<div class="spinner-border" role="status">
  <span class="sr-only">Loading...</span>
</div>

</div>

{:else if routes && data}
<div class="row no-gutters page" transition:fade>
<div class="col-md-2">
<div class="side">

<a href="/#/" class:selected="{current === false}" on:click="{() => current = false}"><img src="assets/img/rocketlogo.png" id="logo" /></a>

<div class="side-nav">
<div id="collections-nav">
	{#each data.collections as item}
	{#if item.title !== 'collections'}
	<a href="/#/list/{item.title}" class:selected="{current === item.title}"
	on:click="{() => current = item.title}">{item.title}</a>
	{/if}
	{/each}
</div>
	<a href="/#/list/collections" class:selected="{current === 'collections'}"
	on:click="{() => current = 'collections'}">collections</a>
	<a href="#" on:click="{logout}">Log Out</a>
</div>

</div>

</div>
<div class="col-md-10">

<div class="main">
	<Router {routes} />
</div>

</div>
</div>

{:else}
 <div id="log-in-screen" transition:fade>
 		<img src="assets/img/rocket-planet.png" />
 		<button onclick="login();" class="btn btn-outline-dark w-100" id="log-in">Log In</button>
 </div>
{/if}
