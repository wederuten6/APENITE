const express = require('express');
const redis = require('redis');

const app = express();
const port = 3000;
const client = redis.createClient();

app.use(express.json());

app.post('/matchmaking', async (req, res) => {
    const { playerId, skill } = req.body;
    
    // RedisのSorted Setを使いスキルレベル順に並べる
    await client.zadd('match_queue', skill, playerId);
    
    // すでにマッチング可能な相手がいるか確認
    const players = await client.zrangebyscore('match_queue', skill - 50, skill + 50, 'LIMIT', 0, 2);

    if (players.length >= 2) {
        // マッチング成立 → キューから削除
        await client.zrem('match_queue', players[0], players[1]);
        return res.json({ match: players });
    }

    res.json({ message: 'Waiting for a match...' });
});

app.listen(port, () => console.log(`Matchmaking server running on port ${port}`));
