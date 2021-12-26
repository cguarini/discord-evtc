const puppeteer = require('puppeteer');
const path = require('path');

async function screenshotReport(fp) {
    //Open HTML file in headless chrome browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let file = path.resolve(`${fp}`)
    
    await page.goto(`file:///${file}`, {waitUntil: 'networkidle2'});
    await page.setViewport({
        width : 1920,
        height : 1080,
        deviceScaleFactor : 1
    });
    //await page.screenshot({path: 'test/out.png'});
  
    //Screenshot damage
    await page.evaluate(() => {
        //Open the fight replay in the report
        document.getElementsByClassName("nav-link")[3].click();
    });
    //Screenshot the replay canvas
    await page.waitForSelector('#main-canvas');
    let element = await page.$('#main-canvas');
    await element.screenshot({path: '../../out/out-replay.png'});
  
    await browser.close();
  };

  screenshotReport('C:/Users/Chris/Documents/Guild%20Wars%202/addons/arcdps/arcdps.cbtlogs/WvW/20211223-215324_detailed_wvw_kill.html');