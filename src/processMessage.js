const parseTorrent = require('parse-torrent');
const WebTorrent = require('webtorrent');
const fs = require('fs');


const { debounce, getBuffer, formatBytes } = require('./utils')


module.exports.processMessage = ctx => {
    const infoHash = tryParseTorrent(ctx.message.text);
    if (!infoHash) {
        ctx.reply('It\'s not a magnet link');
        return;
    }
    const magnet = ctx.message.text;

    const client = new WebTorrent();

    client.on('error', err => ctx.reply(err));

    client.add(magnet, { path: `${__dirname}/torrents/${ctx.chat.id}`}, async torrent => {
        torrent.on('error', function (err) {console.log(err)});

        let torrentSize = 0;
        torrent.files.forEach( file => {
            torrentSize += file.length
        });

        if (torrentSize > 50 * 1024 * 1024) {
            await ctx.reply("Torrent size can not be more than 50Mb");
            return;
        }

        let updateMessage = await ctx.telegram.sendMessage(ctx.chat.id, `${formatBytes(torrent.downloaded)} of ${formatBytes(torrentSize, 2)}`);

        const updateProgress = debounce( () => {
            const downloaded = formatBytes(torrent.downloaded, 2);
            const fullSize = formatBytes(torrentSize, 2);
            ctx.telegram.editMessageText(updateMessage.chat.id, updateMessage.message_id, null, `${(torrent.progress* 100).toFixed(0)}% ${downloaded} of ${fullSize}`);
        }, 200);

        torrent.on('download', () => updateProgress());

        torrent.on('done', async () => {
            await ctx.telegram.editMessageText(updateMessage.chat.id, updateMessage.message_id, null, `Torrent download completed. Sending...`);
            const promises = [];
            torrent.files.forEach(file => {
                promises.push(getBuffer(file, buf => ctx.replyWithDocument({source: buf, filename: file.name})));
            });
            await Promise.all(promises);
            await ctx.telegram.editMessageText(updateMessage.chat.id, updateMessage.message_id, null, `Done`);
            await client.remove(magnet, () => {
                fs.rmdir(`${__dirname}/torrents/${ctx.chat.id}`, { recursive: true }, (err) => {
                    if (err) {
                        throw err;
                    }
                });
            });
        });
    });

};

const tryParseTorrent = (torrent) => {
    try {
        return parseTorrent(torrent);
    }
    catch (e) {
        return null;
    }
}


