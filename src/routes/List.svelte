<script>
export let params;
export let data;
let cat = false;
let items = false;

$: if (params.cat) {
cat = params.cat;
items = data[cat];
}

function addItem(){
  let newItem = {}
  newItem.id = Date.now();
  newItem.title = "untitled";
  if(cat=='collections'){
    newItem.fields = [];
  }else{
    newItem.slug = "";
  }
  data[cat].push(newItem);
  window.location = "/#/edit/"+cat+"/"+newItem.id;
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
  <a href="/#/edit/{cat}/{item.id}">{item.title}</a>
  </li>
{/each}
</ul>
</div>
