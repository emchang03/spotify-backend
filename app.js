
const express = require("express");  
const PORT = 8888; 
const app = express(); 

// app.use(express.urlencoded());
app.use(express.json());
var cors = require('cors');
app.use(cors());

const request = require("request");
const querystring=require("querystring");
require("dotenv").config();




// prep constant variables 
var client_id = process.env.CLIENT_ID; 
var client_secret = process.env.CLIENT_SECRET;
var redirect_uri = process.env.REDIRECT_URI;


// home route for right now 
app.get("/", function(req, res){
    res.render("first");
});


// login route 
var generateRandomString = function (length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state'; 

// FLOW 1: Request Authorization  
app.get("/login", (req,res)=>{
  var state = generateRandomString(16);
  var scope = "user-read-recently-played";

  res.cookie(stateKey, state); // protects against cross-site request forgery 

  res.redirect("https://accounts.spotify.com/authorize?" + 
      querystring.stringify({
          response_type: 'code',
          client_id: client_id, 
          scope: scope,
          redirect_uri: redirect_uri,
          state: state,
          show_dialog: true,
      }));
}); 

// FLOW 2: Callback function 
app.get("/callback", (req, res)=>{ //our redirect uri route 
  const code = req.query.code || null; 
  const state = req.query.state || null; 
  if(state === null){
    res.redirect('/#' + querystring.stringify({
      error: 'state_mismatch'
    }));
  } 
  else{

    // successful authorization 
    console.log("authorization done successfully");

    var authOptions = {
      url:'https://accounts.spotify.com/api/token',
      form:{
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code',
      },
      headers:{
        'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
      }, 
      json: true
    };

    request.post(authOptions, (error, response, body)=>{
      if(!error && response.statusCode === 200){
        //if we got the access token successfully! 
        const access_token = body.access_token; 
        const refresh_token = body.refresh_token;
        console.log("access code retrieved: " + access_token);
        const query = querystring.stringify({
          access_token: access_token,
          refresh_token: refresh_token,
          expires_in: body.expires_in
        });

        res.redirect("http://localhost:3000/?" + query);
      }
      else{
        res.redirect("http://localhost:3000/");
      }
    });
  }
});



// FLOW 3: REFRESH TOKEN 

// app.get("/refreshtoken", function(req,res){
//   var refresh_token = req.query.refresh_token;
//   console.log("called our refresh route successfully!!");
//   console.log("refresh token: " + refresh_token);
//   var authOptions = {
//     url: 'https://accounts.spotify.com/api/token',
//     headers:{
//       'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64'))
//     },
//     form: {
//       grant_type: 'refresh_token',
//       refresh_token: refresh_token
//     }, 
//     json: true
//   }; 

//   request.post(authOptions, (error, response, body)=>{
//     if(!error && response.statusCode===200){
//       var access_token = body.access_token; 
//       res.send({
//         'access_token': access_token,
//       })

//       console.log("NEW access token: " + access_token);
//     }

//   });
//   console.log(data);
// });

app.get('/refreshtoken', function(req, res) {

  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }

    console.log("NEW access token: " + access_token);
  });
});












app.get("/moodring", (req,res)=>{
  res.render("moodring")
});


app.get('/mymoodring', (req,res)=>{
  res.render("mymoodring",{mood1: "faatttt", mood2: "hot", mood3:"whoCares"})
});

app.listen(PORT, ()=>{
    console.log(`Example app listening on port ${PORT}`);
}); 
