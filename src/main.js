const Telegraf = require('telegraf');
const { processMessage } = require('./processMessage');

const runApp = async (config) => {
    const bot = new Telegraf(config.token);

    bot.start((ctx) => ctx.reply('Send me magnet url'));
    bot.help((ctx) => ctx.reply('Send me magnet url'));

    bot.on('text', ctx => processMessage(ctx));

    await bot.launch();
}

module.exports.runApp = runApp;

