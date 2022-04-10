const advise = (() => {
   const terrible = 'definitely not your cup of tea'
   const bad = "it is not that easy for you is it?"
   const average = 'come on, you can do better lol'
   const good = 'ur getting good at that'
   const decent = 'my man! good job'
   const excellent = "wow! that's the spirit! gj!"
   return { terrible, bad, average, good, decent, excellent };
})();

const spotify = (() => {
   const clientId = api.CLIENT_ID;
   const clientSecret = api.CLIENT_SECRET;
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
      return data;
   }

   const _getAudioAnalysis = async (id) => {
      const token = await _getToken();
      const result = await fetch(`https://api.spotify.com/v1/audio-analysis/${id}`, {
         method: 'GET',
         headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
         }
      })
      const data = await result.json();
      return data;
   }

   const _getRecommendation = async () => {
      const token = await _getToken();
      const result = await fetch(`https://api.spotify.com/v1/recommendations?limit=1&market=PL&seed_genres=classical,pop,anime,rock,rap`, {
         method: 'GET',
         headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
         }
      })
      const data = await result.json();
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
   return { _getTrack, _getAudioAnalysis, _getRecommendation };

})();


const app = (() => {
   const searchbar = document.querySelector('#searchbar');
   const guessForm = document.querySelector('#guessForm');
   const trackContainer = document.querySelector('#trackContainer');
   const clickBoundary = document.querySelector('#clickBoundary');

   const trackNameDisplay = document.querySelector('#trackName');
   const trackImgDisplay = document.querySelector('#trackImg');
   const trackDescDisplay = document.querySelector('#trackDesc');

   const statsEvaluation = document.querySelector('#statsEvaluation');
   const statsError = document.querySelector('#statsError');
   const statsBpm = document.querySelector('#statsBpm');
   const statsAdvise = document.querySelector('#statsAdvise');

   let sound = null;
   let bpm = null;
   let appReady = true;

   const manageSearchbar = async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (searchbar.value == '' || !appReady) return;
      appReady = false;
      trackContainer.innerHTML = null;

      const data = await spotify._getTrack(searchbar.value);
      const tracks = data.tracks.items;

      tracks.forEach(t => {
         if (t.preview_url != null) {
            trackContainer.innerHTML += `
            <div id="${t.id}" class="track col-12 d-flex py-2" data-spotify-sound-url="${t.preview_url}">
               <img class="img-track" src="${t.album.images[2].url}" alt="${t.album.images[0].url}"/>
               <h4 class="track-name ms-2 mb-0 lead fs-6 d-flex align-items-center">${t.name}</h4>
               <h4 class="track-artist-name ms-2 lead fs-6 pb-0 mb-0 d-flex align-items-center">${t.artists[0].name}</h4>
               </div>`;
         }
      });

      setupTrackListeners();

      document.addEventListener('click', clearOnClickTrackContainer);
      document.addEventListener('keydown', clearOnKeydownTrackContainer);
      appReady = true;
   }

   const setupTrackListeners = () => {
      const tracksElements = document.querySelectorAll('.track');
      tracksElements.forEach(el => el.addEventListener('click', setTrack));
   }

   async function setTrack() {
      const trackId = this.id;
      const imgUrl = this.querySelector('img').alt;
      const soundUrl = this.getAttribute('data-spotify-sound-url');
      const trackName = this.querySelector('.track-name').innerText;
      const artistName = this.querySelector('.track-artist-name').innerText;

      trackNameDisplay.innerText = `${trackName} | ${artistName}`;
      trackImgDisplay.src = imgUrl;

      clearTracks();
      clearTrackBtns();

      sound = new Audio(soundUrl);
      setTrackBtns();

      bpm = (await spotify._getAudioAnalysis(trackId)).track.tempo;
   }

   const blurBtns = () => {
      playBtn.blur();
      stopBtn.blur();
      backwardsBtn.blur();
      forwardsBtn.blur();
   }

   const clearTrackBtns = () => {
      resetBtn();

      if (sound != null) sound.addEventListener('ended', blurBtns);

      playBtn.removeEventListener('click', playTrack);
      stopBtn.removeEventListener('click', stopTrack);
      backwardsBtn.removeEventListener('click', backwardsTrack);
      forwardsBtn.removeEventListener('click', forwardsTrack);
   }

   const setTrackBtns = () => {
      sound.addEventListener('ended', blurBtns);

      const playBtn = document.querySelector('#playBtn');
      const stopBtn = document.querySelector('#stopBtn');
      const backwardsBtn = document.querySelector('#backwardsBtn');
      const forwardsBtn = document.querySelector('#forwardsBtn');

      playBtn.addEventListener('click', playTrack);
      stopBtn.addEventListener('click', stopTrack);
      backwardsBtn.addEventListener('click', backwardsTrack);
      forwardsBtn.addEventListener('click', forwardsTrack);
   }

   const playTrack = () => (sound.play());
   const stopTrack = () => (sound.pause());
   const backwardsTrack = () => (sound.currentTime -= 5);
   const forwardsTrack = () => (sound.currentTime += 5);
   const resetBtn = () => {
      if (sound == null) return;
      sound.pause();
      sound.currentTime = 0;
   }

   const clearTracks = () => {
      const tracksElements = document.querySelectorAll('.track');
      tracksElements.forEach(el => el.removeEventListener('click', setTrack));
      trackContainer.innerHTML = null;
      searchbar.value += ' ';
      document.removeEventListener('click', clearOnClickTrackContainer);
      document.removeEventListener('keydown', clearOnKeydownTrackContainer);
   }
   const clearOnKeydownTrackContainer = (e) => {
      const { key } = e;
      if (key == "Escape" || key == "Tab") {
         clearTracks();
      }
   }
   const clearOnClickTrackContainer = (e) => {
      const withinBoundaries = e.composedPath().includes(clickBoundary);
      if (!withinBoundaries)
         clearTracks();
   }

   const rError = (a, b) => (Math.ceil(Math.abs(b - a) * 100 / b) / 100)

   const evaluateGuess = (e) => {
      e.preventDefault();
      if (bpm == null) return;

      const guess = guessForm[0].value;
      setStatistics(guess);
   }

   const setStatistics = (g) => {
      const re = rError(g, bpm);
      const lvl = 0.05
      statsEvaluation.innerHTML = re < 3 * lvl ? "&#128578;" : "&#128577;";
      statsError.innerText = re;
      statsBpm.innerText = bpm;

      if (re < lvl) statsAdvise.innerText = advise.excellent;
      else if (re < 2 * lvl) statsAdvise.innerText = advise.decent;
      else if (re < 3 * lvl) statsAdvise.innerText = advise.good;
      else if (re < 4 * lvl) statsAdvise.innerText = advise.average;
      else if (re < 5 * lvl) statsAdvise.innerText = advise.bad;
      else statsAdvise.innerText = advise.terrible;
   }

   const setupRecommendation = async () => {
      const t = (await spotify._getRecommendation()).tracks[0];
      if (t.preview_url == null) return setupRecommendation();
      const trackId = t.id;
      const imgUrl = t.album.images[0].url;
      const soundUrl = t.preview_url;
      const trackName = t.name;
      const artistName = t.artists[0].name;

      trackNameDisplay.innerText = `${trackName} | ${artistName}`;
      trackImgDisplay.src = imgUrl;


      clearTrackBtns();
      sound = new Audio(soundUrl);
      setTrackBtns();

      bpm = (await spotify._getAudioAnalysis(trackId)).track.tempo;
   }

   const init = () => {
      searchbar.addEventListener('input', manageSearchbar);
      guessForm.addEventListener('submit', evaluateGuess);
      setupRecommendation();
   }

   return { init }
})();


