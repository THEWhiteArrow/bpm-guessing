
const app = (() => {
   const searchbar = document.querySelector('#searchbar');
   const guessForm = document.querySelector('#guessForm');
   const trackContainer = document.querySelector('#trackContainer');
   const clickBoundary = document.querySelector('#clickBoundary');
   const linkIcon = document.querySelector("link[rel~='icon']");

   const trackNameDisplay = document.querySelector('#trackName');
   const trackImgDisplay = document.querySelector('#trackImg');

   const statsEvaluation = document.querySelector('#statsEvaluation');
   const statsError = document.querySelector('#statsError');
   const statsBpm = document.querySelector('#statsBpm');
   const statsAdvise = document.querySelector('#statsAdvise');

   let sound = null;
   let bpm = null;
   let appReady = true;

   const advise = {
      "terrible": 'definitely not your cup of tea',
      "bad": "it is not that easy for you is it?",
      "average": 'come on, you can do better lol',
      "good": 'ur getting good at that',
      "decent": 'my man! good job',
      "excellent": "wow! that's the spirit! gj!",
   }


   const getData = async (url) => {
      return await (await fetch(url)).json();
   }


   const manageSearchbar = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      trackContainer.innerHTML = null;

      if (searchbar.value == '' || !appReady) return;
      appReady = false;

      const { data } = await getData(`/api/spotify?q=t&id=${searchbar.value}`);
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
      setIcon(imgUrl);

      sound = new Audio(soundUrl);
      setTrackBtns();

      const analysis = (await getData(`/api/spotify?q=a&id=${trackId}`)).data;
      bpm = analysis.track.tempo;
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

   const setIcon = (url) => {
      if (!linkIcon) {
         linkIcon = document.createElement('link');
         linkIcon.rel = 'icon';
         document.getElementsByTagName('head')[0].appendChild(linkIcon);
      }
      linkIcon.href = url;
   }

   const setupRecommendation = async () => {
      const { data } = await getData('/api/spotify?q=r');
      const track = data.tracks[0];
      if (track.preview_url == null) return setupRecommendation();

      const trackId = track.id;
      const imgUrl = track.album.images[0].url;
      const soundUrl = track.preview_url;
      const trackName = track.name;
      const artistName = track.artists[0].name;


      trackNameDisplay.innerText = `${trackName} | ${artistName}`;
      trackImgDisplay.src = imgUrl;


      clearTrackBtns();
      setIcon(imgUrl);
      sound = new Audio(soundUrl);
      setTrackBtns();

      const analysis = (await getData(`/api/spotify?q=a&id=${trackId}`)).data;
      bpm = analysis.track.tempo;
   }

   const init = () => {
      searchbar.addEventListener('input', manageSearchbar);
      guessForm.addEventListener('submit', evaluateGuess);
      setupRecommendation();
   }

   return { init }
})();


