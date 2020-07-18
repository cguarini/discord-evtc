const puppeteer = require('puppeteer');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./res/config.json', 'utf8'));
const util = require('util');
const exec = util.promisify( require( 'child_process' ).exec);
const statTable = require('./stat-table');
const path = require('path');
const { getEnemyTable } = require('./stat-table');

async function runAsciiReport(filename, postFightStatsHeader, postSquadStats, postEnemyStats, postHtml) {
    //Parse the evtc file into HTML and JSON
    await parseEvtc(filename);
    let htmlFilename = filename.split('.')[0] + '_wvw_kill.html';
  
    //Run the JSON leaderboard parsing asynchronously
    let jsonFilename = ('./input/' + filename.split('.')[0] + '_wvw_kill.json');
    //Parse JSON to leaderboard and post fight stats
    statTable.addFightToLeaderboard(jsonFilename).then( async (fightObj) => {

      //Post header message
      await postFightStatsHeader(fightObj);

      //Post friendly and enemy stats
      await postSquadStats(statTable.getSizedStatTables(await statTable.getFriendlyTable(fightObj)));
      await postEnemyStats(statTable.getSizedStatTables(await statTable.getEnemyTable(fightObj)));

    }).then( () => {
      //Post html report
      postHtml(htmlFilename)
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