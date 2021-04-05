<script>
export let params;
export let data;
let cat = false;
let items = false;
let curCat = false;


$: if (params.cat) {
  cat = params.cat;
  curCat = data.categories.filter(x => x.slug == cat)[0];
  items = data.posts.filter(x => x.category == cat);
}

function addItem(){

  let newItem = {}
  newItem.id = Date.now();
  newItem.title = "";
  newItem.slug = "";
  newItem.category = cat;

  data.posts.unshift(newItem);
  window.location = "/#/edit/posts/"+newItem.id;

}

function deleteItem(id){
  let result = confirm("Are you sure you want to delete this item?");
  if(result){
    data.posts = data.posts.filter(x => x.id !== id)
    data = data;
  }
}

function moveItemDown(id) {

    let fromIndex = data[cat].findIndex(x => x.id == id);
    let toIndex = fromIndex + 1;
    var element = data[cat][fromIndex];
    data.posts.splice(fromIndex, 1);
    data.posts.splice(toIndex, 0, element);
    data = data

}

</script>

<div class="row topnav">
<div class="col-6">
<h4>{curCat.title}</h4>
</div>
<div class="col-6 text-right">
<button class="btn btn-dark btn-add" on:click="{addItem}">Add Post</button>
</div>
</div>

<div class="content">


<ul class="list-group entries-list">
{#each items as item}
  <li class="list-group-item">
  <div class="row">
  <div class="col-6 text-truncate d-flex align-items-center">

  <a href="/#/edit/posts/{item.id}" class="text-truncate">{#if item.title==''}Untitled{:else}{item.title}{/if}</a>

  </div>
  <div class="col-6 text-right">

<div class="btn-group">
  <button class="btn btn-outline-secondary w-50" on:click="{() => moveItemDown(item.id)}"><i class="bi bi-caret-down"></i></button>
  <button class="btn btn-outline-secondary w-50" on:click="{() => deleteItem(item.id)}"><i class="bi bi-trash"></i></button>
  </div>

  </div>
  </div>
  </li>
{/each}
</ul>
</div>
