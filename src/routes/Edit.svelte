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

function addField(){
  let newField = {};
  newField.title = '';
  newField.description = '';
  newField.type = 'txt';
  data.collections[index].fields.push(newField);
  data = data;
}

function deleteField(title){
  let result = confirm("Are you sure you want to delete this field?");
  if(result){
    data.collections[index].fields = data.collections[index].fields.filter(x => x.title !== title)
    data = data;
  }
}

function slugifyTitle(key)
{

  let slug = data.collections[index][key].toString().toLowerCase()
    .replace(/\s+/g, '_')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '_')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text

  data.collections[index][key] = slug;
  data = data;
}

function slugifyFieldTitle(i)
{
  let slug = data.collections[index].fields[i].title.toString().toLowerCase()
    .replace(/\s+/g, '_')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '_')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text

  data.collections[index].fields[i].title = slug;
  data = data;
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

{:else}

<div class="row topnav">
<div class="col-6">
<h4>Edit Collection</h4>
</div>
<div class="col-6 text-right">
<button class="btn btn-dark btn-add" on:click="{save}">Save</button>
</div>
</div>

<div class="content">

    <b>Title</b>
    <div class="description"></div>
    <input type="text" class="form-control" bind:value={data.collections[index].title} on:keyup="{() => slugifyTitle('title')}" />


    <b>Fields</b>

<button class="btn btn-outline-dark btn-add" on:click="{addField}"><i class="bi bi-plus-circle"></i> Add Field</button>

    {#if data.collections[index].fields}
    <ul class="list-group">
    {#each data.collections[index].fields as field, i}
      <li class="list-group-item">
      <div class="row">
      <div class="col-md-4"><input type="text" class="form-control mb-0" bind:value="{field.title}" on:keyup="{() => slugifyFieldTitle(i)}" placeholder="field name" /></div>
      <div class="col-md-4"><input type="text" class="form-control mb-0" bind:value="{field.description}" placeholder="field description (optional)" /></div>
      <div class="col-md-3">
      <select bind:value="{field.type}" class="form-control mb-0">
      <option value="txt">Text</option>
      <option value="mde">Markdown</option>
      </select>

      </div>
      <div class="col-md-1 text-right">
      <button class="btn btn-outline-secondary" on:click="{() => deleteField(field.title)}">
      <i class="bi bi-trash"></i>
      </div>
      </div>


      </li>
    {/each}
    </ul>
    {/if}

    </div>

{/if}
