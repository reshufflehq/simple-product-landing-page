import express from 'express';
import { get } from '@reshuffle/db';
import path from 'path';

const app = express();

app.get('/hello', async (_, res) => {
  try {
    const val = await get('hello') || 'World';
    res.end('Hello ', val);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.use(express.static("public"));


app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

export default app;
