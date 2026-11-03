document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('[data-confirm]').forEach(btn=>btn.addEventListener('click',ev=>{
    if(!confirm(btn.getAttribute('data-confirm')||'Are you sure?')) ev.preventDefault();
  }));
  document.querySelectorAll('[data-toggle-sidebar]').forEach(btn=>btn.addEventListener('click',()=>{
    document.body.classList.toggle('nav-open');
  }));
  const a=document.querySelector('nav a[aria-current="page"]');
  if(a) a.scrollIntoView({block:'nearest'});
});
