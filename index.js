const { runApp } = require('./src/main');
const config = {
    token: process.env.BOT_TOKEN
}
runApp(config);
