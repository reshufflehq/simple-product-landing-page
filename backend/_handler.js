import express from 'express';
import Validator from 'fastest-validator';
const db = require('@reshuffle/db');
import path from 'path';
import { defaultHandler } from '@reshuffle/server-function';
import { schema } from './schema';
import { authHandler } from '@reshuffle/passport';
const moment = require('moment');
const devDBAdmin = require('@reshuffle/db-admin');
var exphbs = require('express-handlebars');

const validator = new Validator();
const app = express();

app.set('trust proxy', true);
app.use('/db/db-admin', express.json(), devDBAdmin.devDBAdminHandler);
app.use(authHandler);

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(express.static('public'));

app.get('/', async function(req, res) {
  let texts = await db.get('texts');
  res.render('index', { texts: texts });
});

app.get('/admin', async function(req, res) {
  if (req.user) {
    let texts = await db.get('texts');
    const allKeysQuery = db.Q.filter(db.Q.key.startsWith('user/'));
    const result = await db.find(allKeysQuery);
    res.render('admin', {
      user: req.user,
      data: result,
      texts: texts,
      layout: false,
    });
  } else {
    let host = req.get('host');
    if (host.startsWith('localhost')) {
      host = `http://${host}`;
    } else {
      host = `https://${host}`;
    }
    res.redirect(`./login?returnTo=${host}/admin`);
  }
});

app.get('/users', async function(req, res) {
  if (!req.user) return;
});

app.post('/register', express.json(), async function(req, res) {
  const email = req.body.email;
  const valid = validator.validate({ email: email }, schema);
  if (valid.length) {
    res.status(200).send(valid[0].message);
  } else {
    let key = `user/${req.body.email}`;
    let time = moment().format('MMMM Do YYYY, h:mm:ss a');
    let value = { email: req.body.email, time: time };
    await db.create(key, value);
    res.sendStatus(200);
  }
});

//todo protect this endpoint
app.post('/update', express.json(), async function(req, res) {
  let key = `texts`;
  const created = await db.update(key, () => {
    const body = { ...req.body };
    body['primary'] = body['primary'] === '' ? `#002e66` : body['primary'];
    body['secondary'] =
      body['secondary'] === '' ? `#cd9557` : body['secondary'];
    body['video'] = body['video'] === '' ? `mp4/bg.mp4` : body['video'];
    return body;
  });

  res.sendStatus(200);
});

app.post('/delete', express.json(), async function(req, res) {
  let key = `user/${req.body.email}`;
  await db.remove(key);
  res.sendStatus(200);
});

app.use(defaultHandler);
export default app;
