<script>
export let params;
export let data;
let cat = false;
let items = false;
let addColl = false;
let error = false;
let coll_title = false;
let curCat = false;
let hasCat = [];
let filterBy = false;
let selected = false;

$: if (params.cat) {
cat = params.cat;

// check if object key exists, else create empty array
if(cat in data){
  items = data[cat];
}else{
  data[cat] = [];
  items = data[cat];
}


if(cat!=='collections'){
curCat = data.collections.filter(x => x.slug == cat)[0];
// check if this collection has a category dropdown
hasCat = curCat.fields.filter(x => x.type == 'cat');

if(hasCat[0] && filterBy){
  items = items.filter(x => x.category == filterBy)
}

}



}

function addItem(){
  if(cat=='collections'){
    addColl = true;
  }else{
  let newItem = {}
  newItem.id = Date.now();
  newItem.title = "";
  newItem.slug = "";

  data[cat].unshift(newItem);
  window.location = "/#/edit/"+cat+"/"+newItem.id;

  }

}

function deleteItem(id){
  let result = confirm("Are you sure you want to delete this item?");
  if(result){
    data[cat] = data[cat].filter(x => x.id !== id)
    data = data;
  }
}

function moveItemDown(id) {

    let fromIndex = data[cat].findIndex(x => x.id == id);
    let toIndex = fromIndex + 1;
    var element = data[cat][fromIndex];
    data[cat].splice(fromIndex, 1);
    data[cat].splice(toIndex, 0, element);
    data = data

}

function saveCollection(){

  let val = document.querySelector('#coll-title').value;
  let slug = slugifyTitle();

  if(val.length<3){
    error = "Name should be at least 3 characters long"
  }else if(val in data){
    error = "Name already exists"
  }else{
    let newItem = {};
    newItem.id = Date.now();
    newItem.title = val;
    newItem.slug = slug;
    newItem.fields = [];
    data.collections.push(newItem);
    data[val] = [];
    window.renderData(data);
    window.location = "/#/collections/"+newItem.id;
  }
}

function slugifyTitle()
{
  let collTitle = document.querySelector('#coll-title');
  let val = collTitle.value;
  let slug = val.toString().toLowerCase()
    .replace(/\s+/g, '_')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '_')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
  collTitle.value = slug;
  return slug;
}
</script>

<div class="row topnav">
<div class="col-6">
{#if cat=='collections'}
<h4>{data.settings.collections_label}</h4>
{:else}
<h4>{curCat.title}</h4>
{/if}

</div>
<div class="col-6 text-right">
<button class="btn btn-dark btn-add" on:click="{addItem}">Add</button>
</div>
</div>

<div class="content">

{#if hasCat[0]}


  <select class="form-control w-25" bind:value={selected} on:change="{() => filterBy = selected}">
  <option value="">All</option>
  {#each data.categories as cat}
  <option value="{cat.slug}">{cat.title}</option>
  {/each}
  </select>

{/if}


<ul class="list-group entries-list">
{#each items as item}
  <li class="list-group-item">
  <div class="row">
  <div class="col-6 text-truncate d-flex align-items-center">
  {#if cat == 'collections'}
  <a href="/#/collections/{item.id}">{item.title}</a>
  {:else}
  <a href="/#/edit/{cat}/{item.id}">{#if item.title==''}Untitled{:else}{item.title}{/if}</a>
  {/if}
  </div>
  <div class="col-6 text-right">
  {#if cat !== 'collections'}
<div class="btn-group">
  <button class="btn btn-outline-secondary w-50" on:click="{() => moveItemDown(item.id)}"><i class="bi bi-caret-down"></i></button>
  <button class="btn btn-outline-secondary w-50" on:click="{() => deleteItem(item.id)}"><i class="bi bi-trash"></i></button>
  </div>
  {/if}
  </div>
  </div>
  </li>
{/each}
</ul>
</div>

{#if addColl}
<div class="backdrop">

<div class="modal" tabindex="-1" role="dialog">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">Add {data.settings.collections_label_singular}</h4>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true" on:click="{() => addColl = false}">&times;</span>
        </button>
      </div>
      <div class="modal-body">

{#if error}
<div class="alert alert-danger">{error}</div>
{/if}


  <b>{data.settings.collections_label_singular} Name</b>
      <input type="text" class="form-control" id="coll-title" />
          <div class="description-sub"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" on:click="{saveCollection}">Add {data.settings.collections_label_singular}</button>
      </div>
    </div>
  </div>
</div>

</div>
{/if}
