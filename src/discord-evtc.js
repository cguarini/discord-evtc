const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const chokidar = require('chokidar');
const config = JSON.parse(fs.readFileSync('./res/config.json', 'utf8'));
const report = require('./components/report');

const DISCORD_TOKEN = config.DISCORD_TOKEN;
let processedFiles = new Map();
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
client.login(DISCORD_TOKEN);



//Watch the log directory, waiting for arcdps to dump log files
chokidar.watch(config.EVTC_WATCH_DIR, {
  awaitWriteFinish : true,
  ignoreInitial :  true
}).on('add', async (path) => {

  console.log(path);
  let pathArray = path.split('\\');
  let filename = pathArray[pathArray.length - 1];
  console.log(filename);

  //Make sure we haven't already processed this file
  if (!(filename in processedFiles)) {
    processedFiles.set(filename, true);
    report.runReport(filename, (htmlFilename) => {

      client.channels.fetch(config.DISCORD_CHANNEL_ID).then( channel => {
        channel.send("Reports for Last Fight at " + new Date(), {
          files : [
            "./out/out-damage.png",
            "./out/out-support.png",
            "./input/" + htmlFilename,
          ]
        });

      })
      
    });
  }

});


