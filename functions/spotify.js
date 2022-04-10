const fetch = require('node-fetch');
const btoa = (text) => (Buffer.from(text).toString('base64'));


const spotify = (() => {
   const clientId = process.env.CLIENT_ID;
   const clientSecret = process.env.CLIENT_SECRET;
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




exports.handler = async (e, context) => {
   const exceptions = ['t', 'a', 'r'];
   const { q, id } = e.queryStringParameters;

   if (exceptions.indexOf(q) == -1) return { statusCode: 400, body: JSON.stringify({ msg: "invalid request", btoa: btoa('dsadafsdfu872837hsdga:]') }) };

   const body = {};
   if (q == exceptions[0]) body.data = await spotify._getTrack(id);
   else if (q == exceptions[1]) body.data = await spotify._getAudioAnalysis(id);
   else body.data = await spotify._getRecommendation();

   return { statusCode: 200, body: JSON.stringify(body) };
}