<script>
import Markdown from "../widgets/Markdown.svelte"
import Textarea from "../widgets/Textarea.svelte"
export let params;
export let data;
let cat = false;
let id = false;
let item = false;
let index = false;
let collection = false;
let fields = {};

$: if (params.cat && params.id) {
cat = params.cat;
id = params.id;
item = data[cat].filter(x => x.id == id)[0];
index = data[cat].findIndex(x => x.id == id);
collection = data.collections.filter(x => x.title == cat)[0];

}

function save(){
  if(typeof data[cat][index].slug === 'undefined' || data[cat][index].slug == ''){
    slugifyTitle();
  }
  setData('github', 'data.json', 'json', data).then(function(result){
    console.log('saved');
  })
  //alert(JSON.stringify(data));
}

function slugifyTitle()
{
  let slug = data[cat][index].title.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text

  data[cat][index].slug = slug+'-'+Math.floor(Math.random() * 999);
  data = data;
}

</script>

{#if collection}


<div class="row topnav">
<div class="col-6">
<h4>Edit {collection.singular}</h4>
</div>
<div class="col-6 text-right">
<button class="btn btn-dark btn-add" on:click="{save}">Save</button>
</div>
</div>

<div class="content">

<b>Title</b>
  <input type="text" class="form-control" bind:value="{data[cat][index].title}" />

  {#each collection.fields as field}

  <b>{field.title}</b>
  {#if field.description}
  <div class="description">{field.description}</div>
  {/if}

  {#if field.type=='txt'}
  <input type="text" class="form-control" bind:value="{data[cat][index][field.title]}" />
  {/if}

  {#if field.type=='txta'}
  <Textarea bind:val={data[cat][index][field.title]} />
  {/if}

  {#if field.type=='mde'}
  <Markdown bind:key={field.title} bind:html={data[cat][index][field.title]} />
  {/if}

  {/each}

</div>

{/if}
