const WebTorrent = require('webtorrent');
const Telegraf = require('telegraf');
const magnetUri = require('magnet-uri');

const client = new WebTorrent();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Send me magnet url'));
bot.help((ctx) => ctx.reply('Send me magnet url'));

bot.on('text', ctx => {
    const infoHash =  magnetUri.decode(ctx.message.text).infoHash;
    if (!infoHash) {
        ctx.reply('It\'s not a magnet link');
        return;
    }
    const magnet = ctx.message.text;
    client.on('error', (err) => ctx.reply(err));
    client.add(magnet, { path: `${__dirname}/torrents/${ctx.chat.id}`}, torrent => {
        torrent.on('done', async () => {
            const promises = [];
            torrent.files.forEach(file => {
                promises.push(getBuffer(file, buf => ctx.replyWithDocument({source: buf, filename: file.name})));
            });
            await Promise.all(promises);
            client.remove(magnet, () => ctx.reply('Done'));
        });
    });
});

const getBuffer = (file, callback) => {
    return new Promise(((resolve, reject) => {
            file.getBuffer( async (err, buf) => {
                if (err) reject(err);
                await callback(buf);
                resolve();
            });
        })
    )
};

bot.launch();