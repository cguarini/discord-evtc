const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./res/config.json', 'utf8'));
const report = require('./components/report');

const DISCORD_TOKEN = config.DISCORD_TOKEN;
let processedFiles = new Map();
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
client.login(DISCORD_TOKEN);



fs.watch(config.EVTC_WATCH_DIR, async (eventType, filename) => {

  //Make sure we haven't already processed this file
  if (!(filename in processedFiles) && eventType === 'rename') {
    processedFiles.set(filename, true);
    report.runReport(filename);
  }

});


