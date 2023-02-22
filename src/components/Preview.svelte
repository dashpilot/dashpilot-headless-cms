<script>
	export let item;
</script>

<div class="post">

{#if item.image}
	<img src="{item.image}" class="img-fluid" />
{/if}	
	
<h2>{item.title}</h2>

{@html item.body}
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Playfair+Display:wght@500&display=swap');
	
	.post{
	font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
	  line-height: 1.5;
	  font-weight: 400;
	
	  font-synthesis: none;
	  text-rendering: optimizeLegibility;
	  -webkit-font-smoothing: antialiased;
	  -moz-osx-font-smoothing: grayscale;
	  -webkit-text-size-adjust: 100%;
	}
	
	h1,
	h2,
	h3 {
		text-transform: none;
	  font-family: "DM Serif Display", serif;
	}
	
	h2 {
	  font-size: 35px;
	  margin-bottom: 25px;
	}
	
	.post{
	  font-size: 19px;
	  line-height: 29px;
	}
	
	img{
		margin-bottom: 25px;
	}
	
</style>
