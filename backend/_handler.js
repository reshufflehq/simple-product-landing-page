import express from 'express';
import { get } from '@reshuffle/db';

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

app.get('/', (_, res) => {
  res.end('hello from express');
});

export default app;
