/* Safety shim: some embedded webviews/wrappers don't define every console method
   (console.debug in particular). Define any missing ones as no-ops BEFORE anything
   else runs, so no injected or app code can throw "console.debug is not a function". */
(function(){
  try{
    if(typeof window.console==="undefined"){ window.console={}; }
    var noop=function(){};
    var methods=["debug","log","info","warn","error","trace","group","groupCollapsed",
                 "groupEnd","table","assert","dir","dirxml","count","countReset","time",
                 "timeEnd","timeLog","profile","profileEnd","clear"];
    for(var i=0;i<methods.length;i++){
      if(typeof window.console[methods[i]]!=="function"){ window.console[methods[i]]=noop; }
    }
  }catch(e){/* never let the shim itself break the page */}
})();
