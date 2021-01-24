<script>
export let params;
export let data;
let cat = false;
let items = false;
let addColl = false;
let error = false;

$: if (params.cat) {
cat = params.cat;

// check if object key exists, else create empty array
if(cat in data){
  items = data[cat];
}else{
  data[cat] = [];
  items = data[cat];
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

function saveCollection(){
  let val = slugifyTitle();
  if(val.length<3){
    error = "Collection name should be at least 3 characters long"
  }else if(val in data){
    error = "Collection already exists"
  }else{
    let newItem = {};
    newItem.id = Date.now();
    newItem.title = pluralize.plural(val);
    newItem.singular = pluralize.singular(val);
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
<h4>{cat}</h4>
</div>
<div class="col-6 text-right">
<button class="btn btn-dark btn-add" on:click="{addItem}">Add</button>
</div>
</div>

<div class="content">
<ul class="list-group entries-list">
{#each items as item}
  <li class="list-group-item">
  <div class="row">
  <div class="col-6 text-truncate">
  {#if cat == 'collections'}
  <a href="/#/collections/{item.id}">{item.title}</a>
  {:else}
  <a href="/#/edit/{cat}/{item.id}">{#if item.title==''}Untitled{:else}{item.title}{/if}</a>
  {/if}
  </div>
  <div class="col-6 text-right">
  {#if cat !== 'collections'}
  <button class="btn btn-outline-secondary" on:click="{() => deleteItem(item.id)}"><i class="bi bi-trash"></i></button>
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
        <h5 class="modal-title">Add Collection</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true" on:click="{() => addColl = false}">&times;</span>
        </button>
      </div>
      <div class="modal-body">

{#if error}
<div class="alert alert-danger">{error}</div>
{/if}


  <b>Collection Name</b>
      <input type="text" class="form-control" on:keyup="{() => slugifyTitle()}" id="coll-title" />
          <div class="description-sub">Plural, lowercase, no spaces (e.g. 'entries', 'pages')</div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" on:click="{saveCollection}">Add Collection</button>
      </div>
    </div>
  </div>
</div>

</div>
{/if}
