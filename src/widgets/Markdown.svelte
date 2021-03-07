<script>
import { onMount, onDestroy } from 'svelte';
export let key;
export let html;
let easyMDE = false;

onMount(() => {
  easyMDE = new EasyMDE({element: document.getElementById('mde-'+key), spellChecker: false});
  easyMDE.codemirror.on("change", function(){
    // console.log(easyMDE.value());
    html = easyMDE.value();
  });
});

onDestroy(() => {
    if(easyMDE && easyMDE !== null && typeof easyMDE !== 'undefined'){
      easyMDE.toTextArea();
      easyMDE = null;
    }
});

function defined(val){
  if(typeof val === 'undefined'){
    val = '';
  }
  return val;
}
</script>

<textarea id="mde-{key}">{defined(html)}</textarea>
