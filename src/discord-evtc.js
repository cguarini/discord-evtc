const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const chokidar = require('chokidar');
const config = JSON.parse(fs.readFileSync('./res/config.json', 'utf8'));
const report = require('./components/report');
const statTable = require('./components/stat-table');
const { getStatTable } = require('./components/stat-table');


const DISCORD_TOKEN = config.DISCORD_TOKEN;
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

    let statTables = statTable.getSizedStatTables(getStatTable(sortStr, () => {
      message.channel.send('', {
        files : [
          './out/stat-table.txt'
        ]
      })
    }));

    for( i = 0; i < statTables.length; i++){
      str = `Stat Table ${i + 1} of ${statTables.length}\n`
      message.channel.send(str + '```' + statTables[i] + '```')
    }

  }

});

async function postSquadStatTable(statTables) {

  let channel = await client.channels.fetch(config.DISCORD_CHANNEL_ID);

  for( i = 0; i < statTables.length; i++){
    str = `Squad Stat Table ${i + 1} of ${statTables.length}\n`
    channel.send(str + '```' + statTables[i] + '```')
  }
}

async function postEnemyStatTable(statTables) {
  let channel = await client.channels.fetch(config.DISCORD_CHANNEL_ID);

  for( i = 0; i < statTables.length; i++){
    str = `Stats for Enemy Players as a whole.\n`
    channel.send(str + '```' + statTables[i] + '```')
  }
}

async function postHtml(htmlFilename) {
  client.channels.fetch(config.DISCORD_CHANNEL_ID).then( channel => {
    channel.send("", {
      files : [
        "./input/" + htmlFilename,
      ]
    });
  });
}

async function postFightStatsHeader(fightObj) {
  client.channels.fetch(config.DISCORD_CHANNEL_ID).then( channel => {
    let header = `Reports for fight on ${fightObj.map} lasting ${fightObj.duration}`
    channel.send(header);
  });
}

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
    report.runAsciiReport(filename, postFightStatsHeader, postSquadStatTable, postEnemyStatTable, postHtml);
  }

});


