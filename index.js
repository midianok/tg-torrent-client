const WebTorrent = require('webtorrent');
const Telegraf = require('telegraf');
const parseTorrent = require('parse-torrent');

const client = new WebTorrent();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => ctx.reply('Send me magnet url'));
bot.help((ctx) => ctx.reply('Send me magnet url'));

bot.on('text', ctx => {
    const infoHash = tryParseTorrent(ctx.message.text);
    if (!infoHash) {
        ctx.reply('It\'s not a magnet link');
        return;
    }
    const magnet = ctx.message.text;

    client.on('error', err => ctx.reply(err));

    client.add(magnet, { path: `${__dirname}/torrents/${ctx.chat.id}`}, async torrent => {
        let torrentSize = 0;
        torrent.files.forEach( file => {
            torrentSize += file.length
        });
        if (torrentSize > 50 * 1024 * 1024){
            await ctx.reply("Torrent size can not be more than 50Mb");
            return;
        }

        let updateMessage = await ctx.telegram.sendMessage(ctx.chat.id, `${formatBytes(torrent.downloaded)} of ${formatBytes(torrentSize, 2)}`);

        const updateProgress = debounce( () => {
            const downloaded = formatBytes(torrent.downloaded, 2);
            const fullSize = formatBytes(torrentSize, 2);
            ctx.telegram.editMessageText(updateMessage.chat.id, updateMessage.message_id, null, `${downloaded} of ${fullSize}`);
        }, 200);

        torrent.on('download', bytes => updateProgress());

        torrent.on('done', async () => {
            await ctx.telegram.editMessageText(updateMessage.chat.id, updateMessage.message_id, null, `Torrent download completed. Sending...`);
            const promises = [];
            torrent.files.forEach(file => {
                promises.push(getBuffer(file, buf => ctx.replyWithDocument({source: buf, filename: file.name})));
            });
            await Promise.all(promises);
            await ctx.telegram.editMessageText(updateMessage.chat.id, updateMessage.message_id, null, `Done`);
            await client.remove(magnet, () => {});
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

const tryParseTorrent = (torrent) => {
    try {
        return parseTorrent(torrent);
    }
    catch (e) {
        return null;
    }
}

function debounce(f, ms) {

    let isCooldown = false;

    return function() {
        if (isCooldown) return;

        f.apply(this, arguments);

        isCooldown = true;

        setTimeout(() => isCooldown = false, ms);
    };

}

const formatBytes =  (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

bot.launch();