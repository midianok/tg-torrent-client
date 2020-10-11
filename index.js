const { runApp } = require('./src/telegram');
const config = {
    token: process.env.BOT_TOKEN
}
runApp(config);
