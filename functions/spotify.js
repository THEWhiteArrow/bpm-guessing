const fetch = require('node-fetch');
const btoa = (text) => (Buffer.from(text).toString('base64'));

const spotify = (() => {
   const clientId = process.env.CLIENT_ID;
   const clientSecret = process.env.CLIENT_SECRET;
   const limit = 10;

   const getTrack = async (query) => {
      const token = await getToken();
      const result = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=track&limit=${limit}`, {
         method: 'GET',
         headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
         }
      })
      const data = await result.json();
      const validTracks = data.tracks.items.filter((el) => (el.preview_url != null))
      return validTracks;
   }

   const getAudioAnalysis = async (id) => {
      const token = await getToken();
      const result = await fetch(`https://api.spotify.com/v1/audio-analysis/${id}`, {
         method: 'GET',
         headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
         }
      })
      const data = await result.json();
      return data.track;
   }

   const getRecommendation = async () => {
      const token = await getToken();
      const result = await fetch(`https://api.spotify.com/v1/recommendations?limit=${limit}&market=PL&seed_genres=classical,pop,funk,rock,anime`, {
         method: 'GET',
         headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
         }
      })
      const data = await result.json();
      const validTracks = data.tracks.filter((el) => (el.preview_url != null))
      return validTracks[0] || null;
   }

   const getToken = async () => {
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
   return { getTrack, getAudioAnalysis, getRecommendation };

})();




exports.handler = async (e, context) => {
   const exceptions = ['getTrack', 'getAudioAnalysis', 'getRecommendation'];
   const { q, id } = e.queryStringParameters;
   if (exceptions.indexOf(q) == -1) return { statusCode: 400, body: JSON.stringify({ msg: "invalid request", btoa: btoa('dsadafsdfu872837hsdga:]') }) };
   let statusCode = 200;

   const body = {};
   try {
      if (q == exceptions[0]) {
         body.tracks = await spotify.getTrack(id);
      }
      else if (q == exceptions[1]) {
         body.analysis = await spotify.getAudioAnalysis(id);
      }
      else {
         body.track = await spotify.getRecommendation();
         body.analysis = await spotify.getAudioAnalysis(body.track.id)
      }
   } catch (error) {
      body.msg = '_' + error + '_';
      statusCode = 500;
   }

   return { statusCode, body: JSON.stringify(body) };
}