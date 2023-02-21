<script>
	export let item;
	
</script>


  
  <div class="preview">
	 {#if item.image}
	 <img src="{item.image}" class="img-fluid mb-4" />
	 {/if} 
	  
	<h2>{item.title}</h2>
	
	
	<p>{@html item.body}</p>
	
	
	
  </div>
  
  
  <style>
	  
	 
	  
	  .preview{
		  padding: 20px;
		  border: 1px solid #DDD;
		  border-radius: 4px;
		  background-color: white;
	  }
	  
	@import"https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Playfair+Display:wght@500&display=swap";:root{font-family:Inter,system-ui,Avenir,Helvetica,Arial,sans-serif;line-height:1.5;font-weight:400;font-synthesis:none;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;-webkit-text-size-adjust:100%}a{font-weight:500;color:#646cff;text-decoration:inherit}a:hover{color:#535bf2}.container{margin-top:50px;max-width:600px;margin-bottom:70px}h1,h2,h3{font-family:"DM Serif Display",serif}h1{font-size:50px}h1 a,h2 a{color:#000;text-decoration:none}h1 a:hover,h2 a:hover{color:#000;text-decoration:underline}h2{font-size:35px;margin-bottom:25px}.container p,.preview p{font-size:19px;line-height:29px}nav{width:100%;text-align:center;margin-bottom:45px}nav a{margin-left:10px;margin-right:10px;color:#000}.code{border:1px solid black;border-radius:4px;max-width:600px;margin:0 auto 25px;text-align:left}.code pre{padding:25px;margin:0}.intro{max-width:600px;margin:0 auto;padding:0 10px 20px}.intro p{font-size:24px;line-height:32px}section{margin-bottom:50px}
	  
	 h1, h2, h3{
		 text-transform: none;
	 }
	  
  </style>