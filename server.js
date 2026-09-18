const express = require('express');
const path = require('path');
require('dotenv').config();
const { Redis } = require('@upstash/redis');

const redis = Redis.fromEnv();
const fruitCounters = Object.freeze({
  strawberry: 'strawberry_count',
  orange: 'orange_count',
  lemon: 'lemon_count'
});

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (req, res) => {
  try {
    const counts = await redis.mget(...Object.values(fruitCounters));
    res.render('index', {
      title: 'Fruit Vote',
      counts: {
        strawberry: Number(counts[0] || 0),
        orange: Number(counts[1] || 0),
        lemon: Number(counts[2] || 0)
      }
    });
  } catch (error) {
    console.error('Unable to load vote counts:', error);
    res.status(500).send('Unable to load vote counts.');
  }
});

app.post('/vote/:fruit', async (req, res) => {
  const fruit = req.params.fruit;
  const isAllowedFruit = Object.prototype.hasOwnProperty.call(fruitCounters, fruit);

  if (!isAllowedFruit) {
    return res.status(400).json({ error: 'Unknown fruit.' });
  }

  try {
    const count = await redis.incr(fruitCounters[fruit]);
    res.json({ fruit, count });
  } catch (error) {
    console.error('Unable to save vote:', error);
    res.status(500).json({ error: 'Unable to save vote.' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
