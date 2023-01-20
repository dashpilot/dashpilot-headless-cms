<script>
export let params;
export let data;
let cat = 'types';
let id = false;
let item = false;
let index = false;
let collection = false;
let fields = {};
let title = '';
let loading = false;

$: if (params.id) {
  id = params.id;
  item = data.types.filter(x => x.id == id)[0];
  index = data.types.findIndex(x => x.id == id);
}

function save(){

  loading = true;
  let opts = {};
  opts.path = 'data.json';
  opts.type = 'json';
  opts.data = data;
  call_api('api/save', opts).then(function(res) {
    if (res.ok) {
      console.log('Saved');
      loading = false;
    } else {
      console.log('Error saving');
      setTimeout(function(){
          loading = false;
      }, 1000)

    }
  });

}

function addField(){
  let newField = {};
  newField.title = '';
  newField.description = '';
  newField.type = 'txt';
  data.types[index].fields.push(newField);
  data = data;
}

function deleteField(title){
  let result = confirm("Are you sure you want to delete this field?");
  if(result){
    data.types[index].fields = data.types[index].fields.filter(x => x.title !== title)
    data = data;
  }
}

function slugifyFieldTitle(i)
{
  let slug = data.types[index].fields[i].title.toString().toLowerCase()
    .replace(/\s+/g, '_')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '_')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text

  data.types[index].fields[i].title = slug;
  data = data;
}

</script>


<div class="row topnav">
<div class="col-9">
<h4 class="text-truncate"><span class="medium-hide">Edit Post Type:</span> {data.types[index].title}</h4>
</div>
<div class="col-3 text-right">
<button class="btn btn-dark btn-add" on:click="{save}">{#if loading}<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> {/if} &nbsp;Save</button>
</div>
</div>

<div class="content">



<div class="row">
  <div class="col-6">
    <b>Fields</b>
    <div class="description">Fields for this post type</div>
  </div>
  <div class="col-6 text-right">
    <button class="btn btn-outline-dark btn-add float-right" on:click="{addField}"><i class="bi bi-plus-circle"></i> Add Field</button>
  </div>
</div>


    {#if data.types[index].fields}
    <ul class="list-group">


    <li class="list-group-item">
    <div class="row">
    <div class="col-4"><input type="text" class="form-control mb-0" value="title"  readonly/></div>
    <div class="col-8"><div class="description mt-2">Each post type has a title field</div></div>
    </div>
    </li>



    {#each data.types[index].fields as field, i}
      <li class="list-group-item">
      <div class="row">
      <div class="col-4"><input type="text" class="form-control mb-0" bind:value="{field.title}" on:keyup="{() => slugifyFieldTitle(i)}" placeholder="field name" /></div>
      <div class="col-3"><input type="text" class="form-control mb-0" bind:value="{field.description}" placeholder="field description (optional)" /></div>
      <div class="col-3">
      <select bind:value="{field.type}" class="form-control mb-0">
      <option value="txt">Text</option>
      <option value="txta">Textarea</option>
      <option value="mde">Markdown Editor</option>
      <option value="rte">Rich Text Editor</option>
      <option value="gal">Gallery</option>
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
