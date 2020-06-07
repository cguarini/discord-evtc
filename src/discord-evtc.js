const puppeteer = require('puppeteer');

(async () => {
  //Open HTML file in headless chrome browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('file:///C:/Workspace/discord-evtc/test/med-example.html', {waitUntil: 'networkidle2'});
  await page.setViewport({
      width : 1920,
      height : 1080,
      deviceScaleFactor : 1
  })

  //Screenshot damage
  await page.evaluate(() => {
    document.getElementsByClassName("ei-header")[0].style.cssText = 'display : none !important'; //Remove header
    document.getElementById("actors").style.cssText = 'display : none !important'; //Remove list of players
  });
  await page.screenshot({path: 'test/out-damage.png'});

  //Screenshot support
  await page.evaluate(() => {
    document.getElementsByClassName("nav-link")[9].click(); //Switch to support view
  });
  await page.screenshot({path: 'test/out-support.png'});


  await browser.close();
})();