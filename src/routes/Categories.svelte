<script>
export let data;
let cat = false;
let items = false;
let addCat = false;

items = data.categories;


function deleteItem(id){
  let result = confirm("Are you sure you want to delete this category?");
  if(result){
    data.categories = data.categories.filter(x => x.id !== id)
    data = data;
    items = data.categories;
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
    addCat = false;
}

function slugify(text)
{

  let slug = text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
  return slug;
}
</script>

<div class="row topnav">
<div class="col-6">
<h4>Categories</h4>
</div>
<div class="col-6 text-right">
<button class="btn btn-dark btn-add" on:click="{() => addCat = true}">Add</button>
</div>
</div>

<div class="content">



<ul class="list-group entries-list">
{#each items as item}
  <li class="list-group-item">
  <div class="row">
  <div class="col-6 text-truncate d-flex align-items-center">

{item.title}

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
