let fs = require('fs');
let table = require('text-table');
const { saveFightToDb } = require('./persistFights');
const config = JSON.parse(fs.readFileSync('./res/config.json', 'utf8'));

//Hashmap that will hold player states
let playerStats = new Map();

async function getPlayerStats(){
    return playerStats;
}

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
        playerList : [],
        enemyData : {},
        link : fightStats.uploadLinks[0],
        commander : ""
    };

    //Loop through each player in the fight
    await fightStats.players.forEach(  (player) => {

        //account id will act as our key, meaning it will merge anyone who character swaps.
        let accountId = player.account;

        //If player is commander, set fight commander
        if(player.hasCommanderTag){
            fightObj.commander = player.name;
        }

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
                fightTime : 0,
                killed : 0,
            };
            //Add initial object to map
            playerStats[accountId] = statObj;
        }

        //Retrieve stats from previouis fights for this player
        let statObj = playerStats[accountId];
        //Stats for this specific fight
        let fightStatObj = {};

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

        let deathTime = activeTime
        if(player.deathRecap != undefined){
            deathTime = player.deathRecap[0].deathTime;
        }

        //Create fight specific stats
        fightStatObj.account = accountId;
        fightStatObj.group = player.group;
        fightStatObj.character = player.name;
        fightStatObj.profession = player.profession;
        fightStatObj.totalActiveTime = activeTime;
        fightStatObj.fightsParticipated = 1;
        fightStatObj.damage = offensiveStats.damage;
        fightStatObj.cleanses = supportStats.condiCleanse + supportStats.condiCleanseSelf;
        fightStatObj.strips = supportStats.boonStrips;
        fightStatObj.stabUptime = stabUptime;
        fightStatObj.alacUptime = alacUptime;
        fightStatObj.dodges = defensiveStats.dodgeCount;
        fightStatObj.distance = generalStats.distToCom;
        fightStatObj.downs = defensiveStats.downCount;
        fightStatObj.deaths = defensiveStats.deadCount;
        fightStatObj.fightTime = deathTime;
        fightStatObj.killed = generalStats.killed;

        //Save fight specific stats
        fightObj.playerList.push(fightStatObj)

    
        //Add current fight statistics to the previous fights
        statObj.totalActiveTime += activeTime
        statObj.fightsParticipated += 1;
        statObj.damage += offensiveStats.damage;
        statObj.cleanses += supportStats.condiCleanse + supportStats.condiCleanseSelf;
        statObj.strips += supportStats.boonStrips;
        statObj.stabUptime += activeTime * stabUptime;
        statObj.alacUptime += activeTime * alacUptime;
        statObj.dodges += defensiveStats.dodgeCount;
        statObj.distance += (generalStats.distToCom * activeTime); // to average across all fights
        statObj.downs += defensiveStats.downCount;
        statObj.deaths += defensiveStats.deadCount;
        statObj.fightTime += deathTime;
        statObj.killed += generalStats.killed;

        //Save statistics back to the map
        playerStats[accountId] = statObj;
    });    

    //Save enemy fight data
    let enemyStats = fightStats.targets[0];
    let enemyDpsStats = enemyStats.dpsAll[0];
    let enemyGeneralStats = enemyStats.statsAll[0];
    fightObj.enemyData = {
        totalDamage : enemyDpsStats.damage,
        powerDamage : enemyDpsStats.powerDamage,
        powerDps : enemyDpsStats.powerDps,
        condiDamage : enemyDpsStats.condiDamage,
        condiDps : enemyDpsStats.condiDps,
        killed : enemyGeneralStats.killed,
        downed : enemyGeneralStats.downed,
    }

    saveFightToDb(fightObj);
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
    let playerList = fightObj.playerList;

    //sort players by stat descending
    playerList.sort( (player1, player2) => {
        return player2[stat] - player1[stat];
    });

    //Create table of top 5 players by stat desc
    let header = ['Name', 'Profession', title];
    let stripTable = [header];
    for(let i = 0; i < n && i < playerList.length; i++){
        let player = playerList[i];
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
    let playerList = fightObj.playerList;

    //sort players by stat descending
    playerList.sort( (player1, player2) => {
        return player2['damage'] - player1['damage'];
    });

    //Create table of top 5 players by stat desc
    let header = ['Name', 'Profession', 'Damage', 'Dps'];
    let stripTable = [header];
    for(let i = 0; i < n && i < playerList.length; i++){
        let player = playerList[i];
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
    let headers = ['', 'Kills', 'Deaths', 'K/D'];

    //Create data row
    //Get enemy info
    let enemy = fightObj.enemyData;
    //Get squad info
    let playerList = fightObj.playerList;
    let kills = 0;
    let deaths = 0;
    for(let i in playerList) {
        let player = playerList[i];
        kills += player.killed;
        deaths += player.deaths;
    }

    let squadStats = ['Squad', kills, deaths, (kills / deaths).toFixed(2)];

    let enemyStats = ['Enemies', enemy.killed, kills + '*', (enemy.killed / kills).toFixed(2) + '*'];

    
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
    let playerList = fightObj.playerList;

    //Loop through players, tallying stats
    for(let i = 0; i < playerList.length; i++) {
        let player = playerList[i];
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
    let tableArray = [['Gamers™', 'Damage', 'DPS', 'Cleanses', 'Strips', 'Downs', 'Deaths']];
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

module.exports = {
    addFightToLeaderboard : addFightToLeaderboard,
    getPlayerStats : getPlayerStats,
    getSquadTable : getSquadTable,
    getKDTable,
    getStatTable,
    getDamageTable
}