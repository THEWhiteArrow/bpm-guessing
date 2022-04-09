const advise = (() => {
   const terrible = 'try harder you suck'
   const bad = "it's not that easy for you is it?"
   const average = 'come on be better than others lol'
   const good = 'ur getting good at that'
   const decent = 'my man!'
   const excellent = "wow! that's the spirit! gj!"
   return { terrible, bad, average, good, decent, excellent };
})();

const spotify = (() => {
   const clientId = 'fad4a54f6c0f4a76a8ff578b39865a84';
   const clientSecret = '16f5c62c68c244cb9bcd5466ef2c4242';
   const limit = 10;

   const _getTrack = async (query) => {
      const token = await _getToken();
      const result = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=${limit}`, {
         method: 'GET',
         headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
         }
      })
      const data = await result.json();
      // console.log(data)
      return data;
   }

   const _getToken = async () => {
      const result = await fetch('https://accounts.spotify.com/api/token', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret)
         },
         body: 'grant_type=client_credentials'
      });
      const data = await result.json();
      return data.access_token;
   }
   return { _getTrack };

})();

let appReady = true;
const app = (() => {
   const searchbar = document.querySelector('#searchbar');
   const trackContainer = document.querySelector('#trackContainer');
   const clickBoundary = document.querySelector('#clickBoundary');


   const manageSearchbar = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      trackContainer.innerHTML = null;

      if (searchbar.value == '' || !appReady) return;
      appReady = false;

      const data = await spotify._getTrack(searchbar.value);
      const tracks = data.tracks.items;

      tracks.forEach(t => {
         trackContainer.innerHTML += `
            <div class="track col-12 d-flex py-2">
               <img class="img-track" src="${t.album.images[2].url}"/>
               <h4 class="ms-2 mb-0 lead fs-6 d-flex align-items-center">${t.name}</h4>
               <h4 class="ms-2 lead fs-6 pb-0 mb-0 d-flex align-items-center">${t.artists[0].name}</h4>
            </div>`;
      });
      // TAB AND ESC EVENTS SHOULD BE HANDLED IN THE FUTURE...
      document.addEventListener('click', clearTrackContainer);
      appReady = true;
   }

   const clearTrackContainer = (e) => {
      const withinBoundaries = e.composedPath().includes(clickBoundary);
      if (!withinBoundaries) {
         trackContainer.innerHTML = null;
         searchbar.value += ' ';
         document.removeEventListener('click', clearTrackContainer);
      }
   }

   const init = () => {
      searchbar.addEventListener('input', manageSearchbar);
   }

   return { init }
})();


