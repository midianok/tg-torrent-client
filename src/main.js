const Telegraf = require('telegraf');
const { processMessage } = require('./processMessage');

const runApp = async (config) => {
    const bot = new Telegraf(config.token);

    bot.start((ctx) => ctx.reply('Send me magnet url'));
    bot.help((ctx) => ctx.reply('Send me magnet url'));

    bot.on('text', async ctx =>  {
        const updateMessage = await ctx.telegram.sendMessage(ctx.chat.id, `Starting...`);

        const onUpdate = (progress, downloaded, fullSize) => ctx.telegram.editMessageText(updateMessage.chat.id, updateMessage.message_id, null, `${progress}% ${downloaded} of ${fullSize}`);

        const pushFile = (buffer, filename) => ctx.replyWithDocument({source: buffer, filename: filename});

        const onDownloadComplete = () => ctx.telegram.editMessageText(updateMessage.chat.id, updateMessage.message_id, null, "Torrent download completed. Sending...");

        const onDone = () => ctx.telegram.editMessageText(updateMessage.chat.id, updateMessage.message_id, null, "Done");

        const onError = err => ctx.telegram.editMessageText(updateMessage.chat.id, updateMessage.message_id, null, err);

        const torrentDir = `${__dirname}/torrents/${ctx.chat.id}`;

        processMessage(ctx.message.text, torrentDir, onUpdate, pushFile, onDownloadComplete, onDone, onError);
    });

    await bot.launch();
}

module.exports.runApp = runApp;

