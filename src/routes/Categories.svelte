<script>
import {flip} from "svelte/animate";
import {dndzone} from "svelte-dnd-action";
import {slugify} from "../components/Helpers.svelte";

export let data;
let cat = false;
let items = false;
let addCat = false;

items = data.categories;

const flipDurationMs = 300;
function handleDndConsider(e) {
  items = e.detail.items;
}
function handleDndFinalize(e) {
  items = e.detail.items;
  data.categories = items;
  renderData(data) // force re-render
}

function deleteItem(what, id){
  let result = confirm("Are you sure you want to delete this item?");
  if(result){
    data.categories = data.categories.filter(x => x.id !== id)
    data = data;
    items = data.categories;
    renderData(data) // force re-render
  }
}

function saveCat(){
    let val = document.querySelector('#new-cat').value;
    console.log(val);
    let newItem = {};
    newItem.id = Date.now();
    newItem.title = val;
    newItem.slug = slugify(val);
    data.categories.push(newItem);
    data.categories = data.categories;
    items = data.categories;
    console.log(data.categories);
    
    loading = true;
    let opts = {};
    opts.path = 'data.json';
    opts.type = 'json';
    opts.data = data;
    call_api('api/save', opts).then(function(res) {
      if (res.status=='ok') {
        console.log('Saved');
        loading = false;
      } else {
        console.log('Error saving');
        setTimeout(function(){
            loading = false;
        }, 1000)
      }
    });
    
    
    addCat = false;
}
</script>

<div class="row topnav">
<div class="col-6">
<h4>Categories</h4>
</div>
<div class="col-6 text-right">
<button class="btn btn-dark btn-add" on:click="{() => addCat = true}">Add Category</button>
</div>
</div>

<div class="content">

<ul class="list-group entries-list" use:dndzone="{{items, flipDurationMs}}" on:consider="{handleDndConsider}" on:finalize="{handleDndFinalize}">
{#each items as item(item.id)}
  <li class="list-group-item" animate:flip="{{duration: flipDurationMs}}">
  <div class="row">
  <div class="col-6 text-truncate d-flex align-items-center">

<a href="/#/edit/categories/{item.id}">{item.title}<a>

  </div>
  <div class="col-6 text-right">
  {#if item.slug !== 'home'}
  <div class="btn-group">
  <button class="btn btn-outline-secondary" on:click="{() => deleteItem(item.id)}"><i class="bi bi-trash"></i></button>
  </div>
  {/if}
  </div>
  </div>
  </li>
{/each}
</ul>
</div>

{#if addCat}
<div class="backdrop">

<div class="modal" tabindex="-1" role="dialog">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">Add Category</h4>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true" on:click="{() => addCat = false}">&times;</span>
        </button>
      </div>
      <div class="modal-body">

      <b>Category Name</b>
      <input type="text" class="form-control" id="new-cat" />
          <div class="description-sub"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" on:click="{saveCat}">Add Category</button>
      </div>
    </div>
  </div>
</div>

</div>
{/if}

