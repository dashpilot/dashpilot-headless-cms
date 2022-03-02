<script>
import { onMount } from 'svelte';

export let key;
export let item;
export let settings;

let uploading = false;
if(!item[key]){
  item[key] = [];
}


onMount(async () => {

  document.getElementById('fileInput').addEventListener('change', function(e) {

    uploading = true;

    if(typeof settings.image_width !== 'undefined'){
      var width = settings.image_width;
    }else{
      var width = 800;
    }
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas'),
        ctx = canvas.getContext("2d"),
        oc = document.createElement('canvas'),
        octx = oc.getContext('2d');

      canvas.width = width; // destination canvas size
      canvas.height = canvas.width * img.height / img.width;

      var cur = {
        width: Math.floor(img.width * 0.5),
        height: Math.floor(img.height * 0.5)
      }

      oc.width = cur.width;
      oc.height = cur.height;

      octx.drawImage(img, 0, 0, cur.width, cur.height);

      while (cur.width * 0.5 > width) {
        cur = {
          width: Math.floor(cur.width * 0.5),
          height: Math.floor(cur.height * 0.5)
        };
        octx.drawImage(oc, 0, 0, cur.width * 2, cur.height * 2, 0, 0, cur.width, cur.height);
      }

      ctx.drawImage(oc, 0, 0, cur.width, cur.height, 0, 0, canvas.width, canvas.height);
      var base64Image = canvas.toDataURL('image/jpeg')

      console.log(base64Image);
      let opts = {};
      opts.path = 'img/'+Date.now()+".jpg";
      opts.type = 'img';
      opts.data = base64Image;
      call_api('api/save', opts).then(function(res) {
        if (res.ok) {
          console.log('Saved');
          let newItem = {'filename': res.path};
          item[key].push(newItem);
          item = item;
          uploading = false;
        } else {
          console.log('Error saving');
          setTimeout(function(){
              uploading = false;
          }, 1000)

        }
      });

      // cleaning up
      URL.revokeObjectURL(img.src)

    }
    img.src = URL.createObjectURL(e.target.files[0]);


  })

});

function clickSelect(mykey){
  document.querySelector('#fileInput').click();
}

function deleteImage(key, i){
  console.log(key);

  var r = confirm("Are you sure you want to delete this image?");
  if (r == true) {
  uploading = true;

    let opts = {};
    opts.path = item[key][i].filename;
    call_api('api/delete', opts).then(function(res) {
      if (res.ok) {
        console.log('Deleted');
        item[key].splice(i, 1);
        item = item;
        uploading = false;
      } else {
        console.log('Error deleting');
        setTimeout(function(){
            uploading = false;
        }, 1000)

      }
    });
  }
}

function move(array, from, to) {
  if (to === from) return array

  var target = array[from]
  var increment = to < from ? -1 : 1

  for (var k = from; k != to; k += increment) {
    array[k] = array[k + increment]
  }
  array[to] = target
  return array
}

function moveDown(key, index) {

    var newindex = index + 1

  if (typeof item[key][newindex] !== 'undefined') {
    item[key] = move(item[key], index, index + 1)
    item = item;
  }
}

function imageExists(image_url){

    var http = new XMLHttpRequest();

    http.open('HEAD', image_url, false);
    http.send();

    return http.status != 404;

}
</script>

<input type="file" id="fileInput" class="fileInput" accept="image/*" data-name="{key}" />
<button class="btn btn-outline-secondary w-25 mb-3" on:click="{() => clickSelect(key)}">


{#if uploading}
<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
{:else}
<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-images" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M12.002 4h-10a1 1 0 0 0-1 1v8l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71a.5.5 0 0 1 .577-.094l1.777 1.947V5a1 1 0 0 0-1-1zm-10-1a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-10zm4 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
  <path fill-rule="evenodd" d="M4 2h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1v1a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2h1a1 1 0 0 1 1-1z"/>
</svg>
{/if}

&nbsp;Choose Image</button>

{#if item[key].length > 0}

<ul class="list-group">

{#each item[key] as img, i}

<li class="list-group-item">

<div class="row">
  <div class="col-md-4">

{#if settings.live_url}

  {#if imageExists(settings.live_url+img.filename)}
    <div class="box" style="background-image: url({settings.live_url+img.filename});"></div>
  {:else}
    <div class="p-1">Generating thumbnails...</div>
  {/if}

{:else}
  <div class="p-1"><a href="/#/settings">Live URL</a> not configured</div>
{/if}

  </div>
  <div class="col-md-4">{#if window.config.imgTitle}<input type="text" class="form-control" bind:value="{item[key][i].title}" placeholder="{window.config.imgTitle}" />{/if}</div>
  <div class="col-md-4">

<div class="btn-group float-right">

<button class="btn btn-outline-secondary" on:click="{() => moveDown(key, i)}">
<svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-caret-down" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" d="M3.204 5L8 10.481 12.796 5H3.204zm-.753.659l4.796 5.48a1 1 0 0 0 1.506 0l4.796-5.48c.566-.647.106-1.659-.753-1.659H3.204a1 1 0 0 0-.753 1.659z"/>
</svg>
</button>


  <button class="btn btn-outline-secondary" on:click="{() => deleteImage(key, i)}">
  <svg width="1em" height="1em" viewBox="0 0 16 16" class="bi bi-trash" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
  </svg>
  </button>
</div>

  </div>
</div>

</li>

{/each}
</ul>
{/if}

<br />



<style>
.fileInput{
  display: none;
}

.btn {
    margin-bottom: 10px;
}

.row .btn{
  margin-bottom: 0;
}

.img-preview{
  background-size: cover;
}

.box{
  display: inline-block;
  width: 39px;
  height: 39px;
  border: 1px solid #6c757d;
  background-size: cover;
  border-radius: 4px;
}

.list-group-item{
  padding-bottom: 5px;
  padding-left: 15px;
  padding-right: 15px;
}

.btn svg{
  margin-top: -3px;
}
</style>
