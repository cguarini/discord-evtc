const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const chokidar = require('chokidar');
const config = JSON.parse(fs.readFileSync('./res/config.json', 'utf8'));
const report = require('./modules/report');
const statTable = require('./modules/stat-table');
const { getStatTable } = require('./modules/stat-table');

const APP_ENV = config.env.APP_ENV;
const env = config.env[APP_ENV];

const DISCORD_TOKEN = env.DISCORD_TOKEN;
let processedFiles = new Map();
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});
client.login(DISCORD_TOKEN);

//Print leaderboards when message is sent
client.on('message', async (message) => {

  //Split messages into parameters
  let params = message.content.split(' ');
  let sortStr = 'damage';//default search to damage

  if(params.length > 1){
    sortStr = params[1];
  }

  //Display table of accumulated raid stats
  if (params[0] === '!raidStats') {

    let statTables = statTable.getSizedStatTables(await getStatTable(sortStr, () => {
      message.channel.send('', {
        files : [
          './out/stat-table.txt'
        ]
      })
    }));

    for( i = 0; i < statTables.length; i++){
      message.channel.send( '```' + statTables[i] + '```');
    }

  }

  if (params[0] === '!killStats') {
    let reportHeaderEmbed = new Discord.MessageEmbed()
        .setColor('#FB512D')
        .setTitle('Kill Stats')
        .addFields(
          {
            name : 'K/D Table',
            value: `\`\`\`${statTable.getSizedStatTables(await statTable.getKillStats())}\`\`\``,
          }
        )
        .setTimestamp()

        message.channel.send(reportHeaderEmbed);

  }

});


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
    report.runAsciiReport(filename, client);
  }

});


