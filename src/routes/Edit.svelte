<script>
import Markdown from "../widgets/Markdown.svelte"
import Textarea from "../widgets/Textarea.svelte"
import Gallery from "../widgets/Gallery.svelte"
export let params;
export let data;
let cat = false;
let id = false;
let item = false;
let index = false;
let collection = false;
let fields = {};
let loading = false;

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

  loading = true;
  let opts = {};
  opts.path = 'data.json';
  opts.type = 'json';
  opts.content = data;
  call_api('github/set-data', opts).then(function(res) {
    if (res.ok) {
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
<button class="btn btn-dark btn-add" on:click="{save}">{#if loading}<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> {/if} &nbsp;Save</button>
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

  {#if field.type=='gal'}
  <Gallery bind:key={field.title} bind:item={data[cat][index]} />
  {/if}

  {/each}

</div>

{/if}
