const puppeteer = require('puppeteer');
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('./res/config.json', 'utf8'));
const util = require('util');
const exec = util.promisify( require( 'child_process' ).exec);

async function runReport(filename, cb) {
  await parseToHTML(filename);
  htmlFilename = filename.split('.')[0] + '_wvw_kill.html';
  await screenshotReport(htmlFilename);
  cb(htmlFilename);
}

//Uses GW2EI to parse the .evtc file to an html report
async function parseToHTML(filename) {
  let command = config.PARSER_EXE + ' -p -c ' + config.PARSER_CONF + ' ' + config.LOG_SAVE_PATH + '\\' + filename;
  let {stdout, stderr} = await exec(command);
  console.log(stdout);
  console.log(stderr);
}

async function screenshotReport(fp) {
  //Open HTML file in headless chrome browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file:///' + config.HTML_WATCH_DIR +'/' + fp, {waitUntil: 'networkidle2'});
  await page.setViewport({
      width : 1920,
      height : 1080,
      deviceScaleFactor : 1
  })
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
  parseToHTML : parseToHTML,
  screenshotReport : screenshotReport,
}