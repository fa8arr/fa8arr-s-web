(function(){
  var still=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nums=document.querySelectorAll('[data-count]'),bars=document.querySelectorAll('.bar i');
  function run(){
    bars.forEach(function(b){b.style.width=b.dataset.w+'%'});
    nums.forEach(function(n){
      var t=+n.dataset.count;
      if(still){n.textContent=t;return}
      var s=performance.now();
      (function step(now){var p=Math.min((now-s)/1600,1);n.textContent=Math.round(t*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(step)})(s);
    });
  }
  setTimeout(run,250);
})();
