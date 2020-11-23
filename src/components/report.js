const puppeteer = require('puppeteer');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./res/config.json', 'utf8'));
const util = require('util');
const exec = util.promisify( require( 'child_process' ).exec);
const statTable = require('./stat-table');
const path = require('path');
const Discord = require('discord.js');
const { addFightToLeaderboard, getSquadTable, getKDTable, getStatTable, getDamageTable } = require('./fight-report');


async function runAsciiReport(filename, client) {
    //Parse the evtc file into HTML and JSON
    await parseEvtc(filename);
    let htmlFilename = filename.split('.')[0] + '_wvw_kill.html';
  
    //Run the JSON leaderboard parsing asynchronously
    let jsonFilename = ('./input/' + filename.split('.')[0] + '_wvw_kill.json');
    //Parse JSON to leaderboard and post fight stats
    addFightToLeaderboard(jsonFilename).then( async (fightObj) => {

      //Get fight-reports channel as outlined in config
      let reportChannel = await client.channels.fetch(config.DISCORD_CHANNEL_ID);
      let tableChannel = await client.channels.fetch(config.TABLE_CHANNEL_ID);

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
            value: `\`\`\`${statTable.getSizedStatTables(await statTable.getEnemyTable(fightObj))}\`\`\``,
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
            value: `\`\`\`${statTable.getSizedStatTables(await getKDTable(fightObj))}\`\`\`
                    > * Minimum enemy deaths, estimated by squad kills`,
          },
        )
        .setTimestamp()
        .setFooter(`Commander ${fightObj.commander}`);

      reportChannel.send(reportHeaderEmbed);

      //Send Stat Tables
      for(let i = 0; i < squadStats.length; i++){
        tableChannel.send(`\`\`\`${squadStats[i]}\`\`\``);
      }


      

    });
  
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