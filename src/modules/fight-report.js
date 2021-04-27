let fs = require('fs');
let table = require('text-table');
const { addPlayerToSquadStats } = require('./components/squad');
const { getTargetStats } = require('./components/target');
const { saveFightToDb } = require('./persistFights');
const config = JSON.parse(fs.readFileSync('./res/config.json', 'utf8'));

/**
 * Adds the stats from the fight to the leaderboard.
 * @param {string} fp - pointer to the JSON file of parsed evtc log
 */
async function addFightToLeaderboard(fp) {
    //Read in JSON file
    let file = fs.readFileSync(fp);
    let fightStats = await JSON.parse(file);

    let fightObj = {
        map : fightStats.fightName,
        duration : fightStats.duration,
        squadList : [],
        targetData : {},
        link : fightStats.uploadLinks[0],
        commander : "",
        fullStats : fightStats
    };

    //Loop through each player in the fight
    await fightStats.players.forEach( async (player) => {

        //If player is commander, set fight commander
        if(player.hasCommanderTag){
            fightObj.commander = player.name;
        }
        let fightStatObj = await addPlayerToSquadStats(player);
        fightObj.squadList.push(fightStatObj);

    });

    //Save enemy fight data
    fightObj.targetData = await getTargetStats(fightStats);

    //Save the fight in the database, if the database is enabled.
    if(config.db.enabled){
        saveFightToDb(fightObj);
    }

    return fightObj;

}

async function breakPlayersIntoGroups(playerStats) {

    //Sort players by group order
    playerStats.sort((player1, player2) => {
        return player2.group - player1.group;
    });

    let groups = []
    let currentGroup = 0;
    //Loop through each player, adding them to their respective group array
    for(let i = 0; i < playerStats.length; i++){

        let player = playerStats[i];

        if(player.group > currentGroup) {
            currentGroup = player.group;
        }
    }
}

/**
 * Return the top n (or less depending on squad size) players 
 * sorted by stat desc as an ASCII table
 * @param {*} fightObj 
 */
async function getStatTable(fightObj, stat, title, n) {

    //retrieve list of friendly players for this fight
    let squadList = fightObj.squadList;

    //sort players by stat descending
    squadList.sort( (player1, player2) => {
        return player2[stat] - player1[stat];
    });

    //Create table of top 5 players by stat desc
    let header = ['Name', 'Profession', title];
    let stripTable = [header];
    for(let i = 0; i < n && i < squadList.length; i++){
        let player = squadList[i];
        stripTable.push([player.character, player.profession, player[stat]]);
    }

    let asciiTable = table(
        stripTable,
        {align : [ 'l' , 'l' , 'l' ]}
    );

    return asciiTable;

}

/**
 * Return the top n (or less depending on squad size) players 
 * sorted by stat desc as an ASCII table
 * @param {*} fightObj 
 */
async function getDamageTable(fightObj, n) {

    //retrieve list of friendly players for this fight
    let squadList = fightObj.squadList;

    //sort players by stat descending
    squadList.sort( (player1, player2) => {
        return player2['damage'] - player1['damage'];
    });

    //Create table of top 5 players by stat desc
    let header = ['Name', 'Profession', 'Damage', 'Dps'];
    let stripTable = [header];
    for(let i = 0; i < n && i < squadList.length; i++){
        let player = squadList[i];
        stripTable.push([player.character, player.profession, player['damage'], 
            Math.round(player.damage /(player.totalActiveTime / 1000))]);
    }

    let asciiTable = table(
        stripTable,
        {align : [ 'l' , 'l' , 'l' ]}
    );

    return asciiTable;

}

async function getKDTable(fightObj) {
    //Create table headers
    let headers = ['','Downed', 'Killed', 'Deaths', 'Conv', 'K/D'];

    //Create data row
    //Get enemy info
    let enemy = fightObj.targetData;
    //Get squad info
    let squadList = fightObj.squadList;
    let killed = 0;
    let deaths = 0;
    let downed = 0;
    for(let i in squadList) {
        let player = squadList[i];
        killed += player.killed;
        deaths += player.deaths;
        downed += player.downed;
    }

    let squadStats = ['Squad', enemy.downCount, enemy.deaths, deaths, (killed / downed).toFixed(2), (killed / deaths).toFixed(2)];

    let enemyStats = ['Enemies', enemy.downed, enemy.killed, enemy.deaths, (enemy.killed / enemy.downed).toFixed(2), (enemy.killed / enemy.deaths).toFixed(2)];

    
    let tableArray = [headers, squadStats, enemyStats]
    //Create ascii table
    let statTable = table(
        tableArray,
        {align : [ 'l', 'l' , 'l' , 'l' , 'l' , 'l', 'l' ]}
    );

    return statTable;
}


async function getSquadTable(fightObj) {

    //Object containing all relevant information from player obj
    let squadStats = {
        playerCount : 0,
        activeTime : 0,
        damage : 0,
        cleanses : 0,
        strips : 0,
        downs : 0,
        killed : 0,
        deaths : 0
    };
    let squadList = fightObj.squadList;

    //Loop through players, tallying stats
    for(let i = 0; i < squadList.length; i++) {
        let player = squadList[i];
        squadStats.playerCount += 1;
        if(player.fightTime > squadStats.activeTime){
            squadStats.activeTime = player.fightTime;
        }
        squadStats.damage += player.damage;
        squadStats.cleanses += player.cleanses;
        squadStats.strips += player.strips;
        squadStats.downs += player.downs;
        squadStats.killed += player.killed;
        squadStats.deaths += player.deaths;
    }

    //Create array of table rows, include the header
    let tableArray = [['Players', 'Damage', 'DPS', 'Cleanses', 'Strips', 'Downs', 'Deaths']];
    //Add stats
    tableArray.push([squadStats.playerCount, squadStats.damage, 
        Math.round(squadStats.damage / (squadStats.activeTime / 1000)), squadStats.cleanses, 
        squadStats.strips, squadStats.downs, squadStats.deaths]);
    
    let asciiTable = table(
        tableArray,
        {align : [ 'l' , 'l' , 'l', 'l', 'l', 'l', 'l', 'l' ]}
    );

    return asciiTable;
}

async function getEnemyTable(fightObj) {

    //Create table headers
    let headers = ['Count', 'Total Dmg', 'Power DPS', 'Condi DPS'];

    //Create data row
    let targets = fightObj.targetData;
    let targetStats = [targets.count, targets.totalDamage, targets.powerDps, targets.condiDps];
    
    let tableArray = [headers, targetStats]
    //Create ascii table
    let statTable = table(
        tableArray,
        {align : [ 'l', 'l' , 'l' , 'l' , 'l' , 'l']}
    );

    return statTable;
}

module.exports = {
    addFightToLeaderboard : addFightToLeaderboard,
    getSquadTable : getSquadTable,
    getKDTable,
    getStatTable,
    getDamageTable,
    getEnemyTable
}