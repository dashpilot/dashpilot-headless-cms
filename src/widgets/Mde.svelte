<script>
import { onMount, onDestroy } from 'svelte';
export let html;

onDestroy(() => {
    if(window.easyMDE !== null && typeof window.easyMDE !== 'undefined'){
      window.easyMDE.toTextArea();
      window.easyMDE = null;
    }
});

onMount(() => {
  window.easyMDE = new EasyMDE({element: document.getElementById('my-mde')});
  easyMDE.codemirror.on("change", function(){
    // console.log(easyMDE.value());
    html = easyMDE.value();
  });
});

function defined(val){
  if(typeof val === 'undefined'){
    val = '';
  }
  return val;
}
</script>

<textarea id="my-mde">{defined(html)}</textarea>
