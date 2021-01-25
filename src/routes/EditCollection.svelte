<script>
export let params;
export let data;
let cat = false;
let id = false;
let item = false;
let index = false;
let collection = false;
let fields = {};
let title = '';

$: if (params.id) {
  cat = 'collections';
  id = params.id;
  item = data[cat].filter(x => x.id == id)[0];
  index = data[cat].findIndex(x => x.id == id);
  collection = data.collections.filter(x => x.title == cat)[0];
  title = data.collections[index].title;
}

function save(){
  setData('github', 'data.json', 'json', data).then(function(result){
    console.log('saved');
  })
  //alert(JSON.stringify(data));
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


<div class="row topnav">
<div class="col-6">
<h4><span class="medium-hide">Edit Collection:</span> {data.collections[index].title}</h4>
</div>
<div class="col-6 text-right">
<button class="btn btn-dark btn-add" on:click="{save}">Save</button>
</div>
</div>

<div class="content">



<div class="row">
  <div class="col-6">
    <b>Fields</b>
    <div class="description">Fields in this collection</div>
  </div>
  <div class="col-6 text-right">
    <button class="btn btn-outline-dark btn-add float-right" on:click="{addField}"><i class="bi bi-plus-circle"></i> Add Field</button>
  </div>
</div>


    {#if data.collections[index].fields}
    <ul class="list-group">


    <li class="list-group-item">
    <div class="row">
    <div class="col-4"><input type="text" class="form-control mb-0" value="title"  readonly/></div>
    <div class="col-8"><div class="description mt-2">Each collection has a title field</div></div>
    </div>
    </li>



    {#each data.collections[index].fields as field, i}
      <li class="list-group-item">
      <div class="row">
      <div class="col-4"><input type="text" class="form-control mb-0" bind:value="{field.title}" on:keyup="{() => slugifyFieldTitle(i)}" placeholder="field name" /></div>
      <div class="col-3"><input type="text" class="form-control mb-0" bind:value="{field.description}" placeholder="field description (optional)" /></div>
      <div class="col-3">
      <select bind:value="{field.type}" class="form-control mb-0">
      <option value="txt">Text</option>
      <option value="txta">Textarea</option>
      <option value="mde">Markdown</option>
      </select>

      </div>
      <div class="col-2 text-right">
      <button class="btn btn-outline-secondary" on:click="{() => deleteField(field.title)}">
      <i class="bi bi-trash"></i>
      </button>
      </div>
      </div>
      </li>
    {/each}
    </ul>
    {/if}


    </div>
