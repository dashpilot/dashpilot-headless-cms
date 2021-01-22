<script>
import { beforeUpdate, afterUpdate, onDestroy } from 'svelte';

onDestroy(() => {

console.log('destroy called');
    if(window.easyMDE !== null && typeof window.easyMDE !== 'undefined'){
      window.easyMDE.toTextArea();
      window.easyMDE = null;
      console.log('destroyed');
    }
});

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
  alert(JSON.stringify(data));
}

</script>

{#if collection}


<div class="row topnav">
<div class="col-6">
<h4>Edit {pluralize.singular(collection.title)}</h4>
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

  {#if field.type=='mde'}
  <textarea id="my-text-area">{data[cat][index][field.title]}</textarea>
    <script>
    window.easyMDE = new EasyMDE({element: document.getElementById('my-text-area')});
    </script>
  {/if}



  {/each}

</div>

{/if}
