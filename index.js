const express = require('express');
const { createClient } = require('redis');

const app = express();
const port = process.env.PORT || 3000;
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const client = createClient({ url: redisUrl });

app.use(express.json());

client.connect().catch(console.error);

app.post('/matchmaking', async (req, res) => {
    const { playerId, skill } = req.body;
    
    // RedisのSorted Setを使いスキルレベル順に並べる
    await client.zAdd('match_queue', [{ score: skill, value: playerId }]);

    // 近いスキルレベルのプレイヤーを探す
    const players = await client.zRangeByScore('match_queue', skill - 50, skill + 50, { limit: { offset: 0, count: 2 } });

    if (players.length >= 2) {
        // マッチング成立 → キューから削除
        await client.zRem('match_queue', players[0], players[1]);
        return res.json({ match: players });
    }

    res.json({ message: 'Waiting for a match...' });
});

app.listen(port, () => console.log(`Matchmaking server running on port ${port}`));
