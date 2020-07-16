let fs = require('fs');
let table = require('text-table');
const config = JSON.parse(fs.readFileSync('./res/config.json', 'utf8'));
const puppeteer = require('puppeteer');


//Hashmap that will hold player states
let playerStats = new Map();

/**
 * Adds the stats from the fight to the leaderboard.
 * @param {string} fp - pointer to the JSON file of parsed evtc log
 */
async function addFightToLeaderboard(fp) {
    //Read in JSON file
    let file = fs.readFileSync(fp);
    let fightStats = await JSON.parse(file);

    //Loop through each player in the fight
    await fightStats.players.forEach(  (player) => {

        //account id will act as our key, meaning it will merge anyone who character swaps.
        let accountId = player.account;

        //Check if key already exists, if it doesn't then add it.
        if( !(accountId in playerStats) ){
            //Create the initial stat object, which contains all the stats tracked for the leaderboard
            let statObj = {
                characters : [],
                totalActiveTime : 0,
                fightsParticipated : 0,
                damage : 0,
                cleanses : 0,
                strips : 0,
                stabUptime : 0,
                alacUptime : 0,
                dodges : 0,
                distance : 0,
                downs : 0,
                deaths : 0,
            };
            //Add initial object to map
            playerStats[accountId] = statObj;
        }

        //Retrieve stats from previouis fights for this player
        let statObj = playerStats[accountId];

        //Add character name if need be
        if( !(statObj.characters.includes(player.name)) ){
            statObj.characters.push(player.name);
        }

        //Parse out the offensive, defensive and support stats from JSON
        let offensiveStats = player.dpsTargets[0][0];
        let defensiveStats = player.defenses[0];
        let supportStats = player.support[0];
        let generalStats = player.statsAll[0];

        //Find buff uptime % 
        //Stability
        let buffUptimeArray = player.buffUptimes;
        let stability = buffUptimeArray.find( (buff) => {
            if(buff.id === 1122){
                return true;
            }
        })
        let stabUptime = (stability === undefined ? 0 : stability.buffData[0].uptime);
        //alacrity
        let alacrity = buffUptimeArray.find( (buff) => {
            if(buff.id === 30328){
                return true;
            }
        })
        let alacUptime = (alacrity === undefined ? 0 : alacrity.buffData[0].uptime);

        let activeTime = player.activeTimes[0];

        //Add current fight statistics to the previous fights
        statObj.totalActiveTime += activeTime
        statObj.fightsParticipated += 1;
        statObj.damage += offensiveStats.damage;
        statObj.cleanses += supportStats.condiCleanse + supportStats.condiCleanseSelf;
        statObj.strips += supportStats.boonStrips;
        statObj.stabUptime += activeTime * stabUptime;
        statObj.alacUptime += activeTime * alacUptime;
        statObj.dodges += defensiveStats.dodgeCount;
        statObj.distance += generalStats.stackDist * activeTime; // to average across all fights
        statObj.downs += defensiveStats.downCount;
        statObj.deaths += defensiveStats.deadCount;

        //Save statistics back to the map
        playerStats[accountId] = statObj;


    });    

}

/**
 * Returns the stat map object as an ascii table
 * Returns array of tables, as discord is limited to 2000 characters per mesage
 */
function getStatTable(cb) {

    //Create stat table header row
    let headers = ['Account', 'Characters', 'Fights', 'Damage', 'Cleanses', 'Strips', 'Stab', 'Alac', 'Dodges', 'Distance', 'Downs', 'Deaths'];

    //Add player statistics to stat table
    let players = [];
    for(accountId in playerStats){
        let statObj = playerStats[accountId];
        let charactersStr = '';
        for( i = 0; i < statObj.characters.length; i++){
            if(i > 0){
                charactersStr += ' , ';
            }
            charactersStr += statObj.characters[i];
        }
        let stats = [accountId, charactersStr, statObj.fightsParticipated,
             statObj.damage, statObj.cleanses, statObj.strips,
             (statObj.stabUptime / statObj.totalActiveTime).toFixed(2), (statObj.alacUptime / statObj.totalActiveTime).toFixed(2),
             statObj.dodges, Math.round((statObj.distance / statObj.totalActiveTime)),
             statObj.downs, statObj.deaths];
        players.push(stats);
    }

    //Sort by highest damage, up for debate
    players.sort( function(player1, player2){
        return  player2[3] - player1[3];
    })

    //Create array
    let tableArray = [headers];
    for( i = 0; i < players.length; i++){
        tableArray.push(players[i]);
    }

    //Create ascii table
    let statTable = table(
        tableArray,
        {align : [ 'l' , 'l' , 'l' , 'l' , 'l' , 'l' , 'l' , 'l' , 'l' , 'l', 'l', 'l' ]}
    );

    //Write backup to file
    fs.writeFile('./out/stat-table.txt', statTable, cb);

    return statTable;

}

/**
 * Returns an array of stat tables no larger than 1800 characters each
 */
function getSizedStatTables(cb){

    //Get the ASCII formatted stat table
    let statTable = getStatTable(cb);

    //Split it by newlines
    let tableArray = statTable.split('\n');

    //Maximum row length will be the header length
    let header = tableArray[0];
    let maxRowLength = header.length + 1;
    
    //Find amount of rows available per table
    const reserved = 50;//Reserved for discord messaging
    let dataSpace = 2000 - maxRowLength - reserved;//Chars available for data in each message
    let rowsPerMessage = (dataSpace / maxRowLength) - 1;//Rows per message, subtract header


    //Add rows to messages
    let messageArray = [];
    for(let i = 1; i < tableArray.length; i++){
        //Create a new message if previous one is full
        if(messageArray.length < Math.floor(i / rowsPerMessage) + 1){
            messageArray.push(header + '\n');
        }
        //Add row to message
        messageArray[Math.floor(i / rowsPerMessage)] += (tableArray[i] + '\n');
    }
    return messageArray;
}

async function screenshotStatTable(fp) {
    //Open HTML file in headless chrome browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('file:///' +  fp, {waitUntil: 'networkidle2'});
    await page.setViewport({
        width : 1200,
        height : 600,
        deviceScaleFactor : 1
    });
    await page.screenshot({path: 'out/stat-table.png'});
}

async function createStatScreenshot(){
    //Create ascii formatted table
    let statTable = await getStatTable();
    //Save to file
    //fs.writeFileSync('./out/leaderboard.txt', statTable);
    //Screenshot file in chromium
    await screenshotStatTable(config.OUTPUT_DIR + 'leaderboard.txt');
}

module.exports = {
    addFightToLeaderboard : addFightToLeaderboard,
    getStatTable : getStatTable,
    createStatScreenshot : createStatScreenshot,
    getSizedStatTables : getSizedStatTables,
}
