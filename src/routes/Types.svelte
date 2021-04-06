<script>
import {slugify} from "./Helpers.svelte";
export let data;
let cat = false;
let items = false;
let addType = false;
let error = false;
let coll_title = false;

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
  let slug = slugify(val);

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
    data.types.push(newItem);
    window.renderData(data);
    window.location = "/#/type/"+newItem.id;
  }
}

</script>

<div class="row topnav">
<div class="col-6">

<h4>Post Types</h4>


</div>
<div class="col-6 text-right">
<button class="btn btn-dark btn-add" on:click="{() => addType = true}">Add Post Type</button>
</div>
</div>

<div class="content">

<ul class="list-group entries-list">
{#each data.types as item}
  <li class="list-group-item">
  <div class="row">
  <div class="col-6 text-truncate d-flex align-items-center">

  <a href="/#/type/{item.id}" class="text-truncate">{item.title}</a>

  </div>
  <div class="col-6 text-right">

  </div>
  </div>
  </li>
{/each}
</ul>
</div>


{#if addType}
<div class="backdrop">

<div class="modal" tabindex="-1" role="dialog">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">Add Post Type</h4>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true" on:click="{() => addColl = false}">&times;</span>
        </button>
      </div>
      <div class="modal-body">

{#if error}
<div class="alert alert-danger">{error}</div>
{/if}


  <b>Name</b>
      <input type="text" class="form-control" id="coll-title" />
          <div class="description-sub"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" on:click="{saveCollection}">Add Post Type</button>
      </div>
    </div>
  </div>
</div>

</div>
{/if}
