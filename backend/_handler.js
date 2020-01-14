import express from 'express';
import exphbs from 'express-handlebars';
import moment from 'moment';
import Validator from 'fastest-validator';
import { get, find, Q, update, create, remove } from '@reshuffle/db';
import { defaultHandler } from '@reshuffle/server-function';
import { authHandler } from '@reshuffle/passport';
import devDBAdmin from '@reshuffle/db-admin';
import { defaultStyle } from './constants';
import { schema } from './schema';

const validator = new Validator();
const app = express();

app.set('trust proxy', true);

//For developing/testing only
// app.use('/db/db-admin', express.json(), devDBAdmin.devDBAdminHandler);

app.use(authHandler);

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
app.use(express.static('public'));

app.get('/', async function(req, res) {
  let texts = await get('texts');
  res.render('index', { texts: texts });
});

app.get('/admin', async function(req, res) {
  if (req.user) {
    let texts = await get('texts');
    const allKeysQuery = Q.filter(Q.key.startsWith('user/'));
    const result = await find(allKeysQuery);
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
    let time = moment().toISOString(true);
    let value = { email: req.body.email, time: time };
    await create(key, value);
    res.sendStatus(200);
  }
});

app.post('/update', express.json(), async function(req, res) {
  let key = `texts`;
  const created = await update(key, () => {
    const body = { ...req.body };
    body['primary'] = body['primary'] || defaultStyle.primary;
    body['secondary'] = body['secondary'] || defaultStyle.secondary;
    body['video'] = body['video'] || defaultStyle.video;
    return body;
  });

  res.sendStatus(200);
});

app.post('/delete', express.json(), async function(req, res) {
  let key = `user/${req.body.email}`;
  await remove(key);
  res.sendStatus(200);
});

app.use(defaultHandler);
export default app;
