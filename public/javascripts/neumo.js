const neumo = (() => {
   const start = (...args) => {
      const elements = [];
      const shadowInset = args[0];
      args.shift();

      args.forEach(a => {
         elements.push(...document.querySelectorAll(a))
      });

      elements.forEach(el => {
         el.classList.add('neumo-reset', `${shadowInset ? 'neumo-shadow-inset' : 'neumo-shadow'}`)
      })
   }

   const off = (id) => {
      const el = document.querySelector('#' + id)
      el.classList.add('neumo-hide')
   }

   const on = (id) => {
      const el = document.querySelector('#' + id)
      el.classList.remove('neumo-hide')
   }

   return { start, off, on };
})();




