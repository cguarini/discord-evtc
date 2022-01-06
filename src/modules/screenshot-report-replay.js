const puppeteer = require('puppeteer');
const path = require('path');

async function screenshotReportReplay(fp) {
    //Open HTML file in headless chrome browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let file = path.resolve(`${fp}`)

    console.log(fp)
    console.log(file)
    
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
    await element.screenshot({path: './out/out-replay.png'});
  
    await browser.close();
  };

module.exports = {
    screenshotReportReplay
}