const puppeteer = require('puppeteer');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./res/config.json', 'utf8'));
const util = require('util');
const exec = util.promisify( require( 'child_process' ).exec);
const statTable = require('./stat-table');
const path = require('path');
const Discord = require('discord.js');
const { addFightToLeaderboard, getSquadTable, getKDTable, getStatTable, getDamageTable, getEnemyTable } = require('./fight-report');
const { getProfessionStats } = require('./profession-report');

const APP_ENV = config.env.APP_ENV;
const env = config.env[APP_ENV];

let raidStatsMessages = [];
let killsMessages = [];

async function runAsciiReport(filename, client) {
    //Parse the evtc file into HTML and JSON
    await parseEvtc(filename);
    let htmlFilename = filename.split('.')[0] + '_wvw_kill.html';
  
    //Run the JSON leaderboard parsing asynchronously
    let jsonFilename = ('./input/' + filename.split('.')[0] + '_detailed_wvw_kill.json');
    //Parse JSON to leaderboard and post fight stats
    addFightToLeaderboard(jsonFilename).then( async (fightObj) => {

      //Get fight-reports channel as outlined in config
      let reportChannel = await client.channels.fetch(env.DISCORD_CHANNEL_ID);
      let tableChannel = await client.channels.fetch(env.TABLE_CHANNEL_ID);

      let squadStats = statTable.getSizedStatTables(await statTable.getFriendlyTable(fightObj));

      //Create header
      let reportHeaderEmbed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setAuthor(fightObj.map)
        .setTitle('Fight Report')
        .setURL(fightObj.link)
        .setDescription(`${fightObj.duration} - Click link above for full report`)
        .addFields(
          {
            name : 'Squad Stats',
            value: `\`\`\`${statTable.getSizedStatTables(await getSquadTable(fightObj))}\`\`\``,
          },
          { 
            name: 'Enemy Stats', 
            value: `\`\`\`${statTable.getSizedStatTables(await getEnemyTable(fightObj))}\`\`\``,
            inline: true 
          },
          {
            name : 'Top Damage',
            value: `\`\`\`${statTable.getSizedStatTables(await getDamageTable(fightObj, 5))}\`\`\``,
          },
          {
            name : 'Top Cleansers',
            value: `\`\`\`${statTable.getSizedStatTables(await getStatTable(fightObj, 'cleanses', 'Cleanses', 5))}\`\`\``,
          },
          {
            name : 'Top Strips',
            value: `\`\`\`${statTable.getSizedStatTables(await getStatTable(fightObj, 'strips', 'Strips', 3))}\`\`\``,
          },
          {
            name : 'Kills/Deaths',
            value: `\`\`\`${statTable.getSizedStatTables(await getKDTable(fightObj))}\`\`\``
          },
        )
        .setTimestamp()
        .setFooter(`Commander ${fightObj.commander}`);

      reportChannel.send(reportHeaderEmbed);

      //Send Fight Stat Tables
      for(let i = 0; i < squadStats.length; i++){
        tableChannel.send(`\`\`\`${squadStats[i]}\`\`\``);
      }

      updateRaidStatsChannel(client);
      updateKillsChannel(client);
      runProfessionReport(client, fightObj.fullStats);

    });

  
}

async function updateRaidStatsChannel(client) {

  let channel = await client.channels.fetch(env.RAIDSTATS_CHANNEL_ID);

  //If first fight of the raid, send the header
  if(raidStatsMessages.length === 0) {
    let dt = new Date();
    channel.send(`***----- ${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()} ${dt.getHours()}:${dt.getMinutes()} -----***`)
  }
  else { //else delete messages from this raid before sending new ones.
    for(let i = 0; i < raidStatsMessages.length; i++) {
      raidStatsMessages[i].delete();
    }
    raidStatsMessages = [];
  }

  let statTables = statTable.getSizedStatTables(await statTable.getStatTable('Damage'));

  for( i = 0; i < statTables.length; i++){
    raidStatsMessages.push(await channel.send( '```' + statTables[i] + '```'));
  }

  let msg = await channel.send('', {
    files : [
      './out/stat-table.txt'
    ]
  });
  raidStatsMessages.push(msg)
}

async function updateKillsChannel(client) {

  let channel = await client.channels.fetch(env.KILLS_CHANNEL_ID);

  //If first fight of the raid, send the header
  if(killsMessages.length === 0) {
    let dt = new Date();
    channel.send(`***----- ${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()} ${dt.getHours()}:${dt.getMinutes()} -----***`)
  }
  else { //else delete messages from this raid before sending new ones.
    for(let i = 0; i < killsMessages.length; i++) {
      killsMessages[i].delete();
    }
    killsMessages = [];
  }
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

  killsMessages.push(await channel.send(reportHeaderEmbed));
}

async function runProfessionReport(client, fullStats) {

  let channel = await client.channels.fetch(env.PROFESSION_CHANNEL_ID);

  let professionStats = await getProfessionStats(fullStats);

  //Create header
  let reportHeaderEmbed = new Discord.MessageEmbed()
  .addFields(
    {
      name : 'Scrapper Stats',
      value: `\`\`\`${professionStats['scrappers']}\`\`\``,
    },
    {
      name : 'Firebrand Stats',
      value: `\`\`\`${professionStats['firebrands']}\`\`\``,
    },
    {
      name : 'Herald Stats',
      value: `\`\`\`${professionStats['heralds']}\`\`\``,
    },
    {
      name : 'Spellbreaker Stats',
      value: `\`\`\`${professionStats['spellBreakers']}\`\`\``,
    },
    {
      name : 'Chrono Stats',
      value: `\`\`\`${professionStats['chronos']}\`\`\``,
    },
  )
  .setTimestamp();

  channel.send(reportHeaderEmbed);
}


async function runReport(filename, cb) {

  //Parse the evtc file into HTML and JSON
  await parseEvtc(filename);
  let htmlFilename = filename.split('.')[0] + '_wvw_kill.html';

  //Run the JSON leaderboard parsing asynchronously
  let jsonFilename = ('./input/' + filename.split('.')[0] + '_wvw_kill.json');
  statTable.addFightToLeaderboard(jsonFilename);

  //Screenshot the html report and run the callback function
  await screenshotReport(htmlFilename);
  cb(htmlFilename);
}

//Uses GW2EI to parse the .evtc file to an html report and JSON log
async function parseEvtc(filename) {
  let command = config.PARSER_EXE + ' -p -c ' + config.PARSER_CONF + ' ' + config.LOG_SAVE_PATH + '\\' + filename;
  let {stdout, stderr} = await exec(command);
  console.log(stdout);
  console.log(stderr);
}

async function screenshotReport(fp) {
  //Open HTML file in headless chrome browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let file = path.resolve(`./${config.HTML_WATCH_DIR}/${fp}`)
  
  await page.goto(`file:///${file}`, {waitUntil: 'networkidle2'});
  await page.setViewport({
      width : 1920,
      height : 1080,
      deviceScaleFactor : 1
  });
  //await page.screenshot({path: 'test/out.png'});

  //Screenshot damage
  await page.evaluate(() => {
    document.getElementsByClassName("ei-header")[0].style.cssText = 'display : none !important'; //Remove header
    document.getElementById("actors").style.cssText = 'display : none !important'; //Remove list of players
  });
  await page.screenshot({path: 'out/out-damage.png'});

  //Screenshot support
  await page.evaluate(() => {
    document.getElementsByClassName("nav-link")[9].click(); //Switch to support view
  });
  await page.screenshot({path: 'out/out-support.png'});


  await browser.close();
};

module.exports = {
  runReport : runReport,
  parseEvtc : parseEvtc,
  screenshotReport : screenshotReport,
  runAsciiReport : runAsciiReport,
}