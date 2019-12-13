import express from 'express';
import { get } from '@reshuffle/db';
const db = require('@reshuffle/db');
import path from 'path';
import { defaultHandler } from '@reshuffle/server-function';
import { authHandler } from '@reshuffle/passport';
const moment = require('moment');
const devDBAdmin = require('@reshuffle/db-admin');
var exphbs  = require('express-handlebars');



const app = express();
app.set('trust proxy', true);
app.use("/db/db-admin", express.json(), devDBAdmin.devDBAdminHandler);
app.use(authHandler);

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(express.static("public"));


app.get('/', async function (req, res) {
  let texts = await db.get("texts");
  //console.log(texts);
  res.render('index', {texts: texts});
});

app.get('/admin', async function(req, res) {
  if(req.user){
    let texts = await db.get("texts");
    const allKeysQuery = db.Q.filter(db.Q.key.startsWith('user/'));
    const result = await db.find(allKeysQuery);
    res.render('admin', {user: req.user, data:result, texts:texts, layout: false});
    
  }else{
    let host = req.get('host');
    if(host.startsWith("localhost")){
      host = `http://${host}`;
    }else{
      host = `https://${host}`;
    }
    res.redirect(`./login?returnTo=${host}/admin`);
  }
  
});

app.get('/users', async function(req, res) {
  if(!req.user) return;
  
  //res.end(JSON.stringify(result));
});


app.post('/register', express.json(), async function(req, res) {
  let key = `user/${req.body.email}`;

  let time = moment().format('MMMM Do YYYY, h:mm:ss a')
  let value = {"email":req.body.email, "time":time};
  const created = await db.create(key, value);
  
  res.sendStatus(200);
});

//todo protect this endpoint
app.post('/update', express.json(), async function(req, res) {
  let key = `texts`;
  const created = await db.update(key, () => {
    return req.body;
  });
  
  res.sendStatus(200);
});


app.use(defaultHandler);
export default app;
