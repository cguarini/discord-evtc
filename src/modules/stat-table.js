let fs = require('fs');
let table = require('text-table');
const config = JSON.parse(fs.readFileSync('./res/config.json', 'utf8'));
const puppeteer = require('puppeteer');
const { getSquadStats } = require('./components/squad');
const { getPersistentTargetStats } = require('./components/target');
const target = require('./components/target');

/**
 * Transforms the given fightObj into a stat table.
 * @param {*} fightObj 
 * @param {*} sortStr 
 */
async function getFriendlyTable(fightObj, sortStr) {

    //Create stat table header row
    let headers = ['Character', 'DPS', 'Damage', 'Cleanses', 'Strips', 'Stab', 'Prot', 'Dodges', 'Distance', 'Downs', 'Deaths', 'Time'];
    
    let playerStats = [];
    //Loop through each player
    for(let i = 0; i < fightObj.squadList.length; i++){
        let player = fightObj.squadList[i];
        let stats = [ player.character, 
            Math.round(player.damage / (player.totalActiveTime / 1000)),
            player.damage, player.cleanses, player.strips,
            player.stabUptime.toFixed(2), player.protUptime.toFixed(2),
            player.dodges, Math.round(player.distance),
            player.downs, player.deaths, `${Math.floor((player.fightTime / 1000) / 60)}m ${Math.round((player.fightTime / 1000)) % 60}s`];
        
        playerStats.push(stats);
    }

    let sortIndex = 2; //default to damage sorting
    if(!(sortStr === undefined)) {
        //Determine which column we're sorting by
        for(let i = 0; i < headers.length; i++){
            if(headers[i].toUpperCase().includes(sortStr.toUpperCase())){
                sortIndex = i;
                break;
            }
        }
    }

    //Sort table by chosen column
    playerStats.sort( function(player1, player2){
        //Separate sorting between numbers and strings
        if(isNaN(player1[sortIndex])){
            return player1[sortIndex].toUpperCase().localeCompare(player2[sortIndex].toUpperCase());
        }
        return  player2[sortIndex] - player1[sortIndex];
    })

    //Create array
    let tableArray = [headers];
    for( i = 0; i < playerStats.length; i++){
        tableArray.push(playerStats[i]);
    }

    //Create ascii table
    let statTable = table(
        tableArray,
        {align : [ 'l' , 'l' , 'l' , 'l' , 'l' , 'l' , 'l' , 'l', 'l' ]}
    );

    return statTable;
}

async function getKillStats() {

    //Create table headers
    let headers = ['', 'Avg Size', 'Downed', 'Killed', 'Deaths', 'Conv', 'K/D'];

    let targetStats = await getPersistentTargetStats();

    //Create data row
    //Get squad info
    let squadList = await getSquadStats();
    let killed = 0;
    let deaths = 0;
    let downed = 0;
    let fightsParticipated = 0;
    let count = 0;
    for(let i in squadList) {
        let player = squadList[i];
        killed += player.killed;
        deaths += player.deaths;
        downed += player.downed;
        fightsParticipated += player.fightsParticipated;
        count++;
    }

    downed = (targetStats.downCount > downed ? targetStats.downCount : downed);
    killed = (targetStats.deaths > killed ? targetStats.deaths : killed);

    let squadStats = ['Squad', Math.round(fightsParticipated / targetStats.fights), downed, killed, deaths, (killed / downed).toFixed(2), (killed / deaths).toFixed(2)];
    let enemyStats = ['Enemy', Math.round(targetStats.count / targetStats.fights), targetStats.downed, targetStats.killed, killed, (targetStats.killed / targetStats.downed).toFixed(2), (targetStats.killed / killed).toFixed(2)]

    
    let tableArray = [headers, squadStats, enemyStats]
    //Create ascii table
    let statTable = table(
        tableArray,
        {align : [ 'l', 'l' , 'l', 'l', 'l', 'l', 'l' ]}
    );

    return statTable;
}

/**
 * Returns the stat map object as an ascii table
 * Returns array of tables, as discord is limited to 2000 characters per mesage
 */
async function getStatTable(sortStr) {

    //Create stat table header row
    let headers = ['Account', 'Characters', 'Prof', 'Fights', 'DPS', 'Damage', 'Cleanses', 'Strips', 'Stab', 'Prot', 'Dodges', 'Downs', 'Deaths'];

    //Add player statistics to stat table
    let players = [];
    let squadStats = await getSquadStats();
    for(accountId in squadStats){
        let statObj = squadStats[accountId];
        let charactersStr = '';
        //Report last two characters
        for( i = statObj.characters.length - 1; ((i > statObj.characters.length - 3) && i >= 0); i--){
            if(i < statObj.characters.length - 1){
                charactersStr += ' , ';
            }
            charactersStr += statObj.characters[i];
        }

        if(charactersStr.length > 25) {
            charactersStr = charactersStr.slice(0,25) + '...';
        }
        let stats =  [accountId, charactersStr, statObj.profession, statObj.fightsParticipated,
             Math.round(statObj.damage /(statObj.totalActiveTime / 1000)),
             statObj.damage, statObj.cleanses, statObj.strips,
             (statObj.stabUptime / statObj.totalActiveTime).toFixed(2), (statObj.protUptime / statObj.totalActiveTime).toFixed(2),
             statObj.dodges, statObj.downs, statObj.deaths];
        players.push(stats);
    }

    let sortIndex = 3;//Default to dps
    //Determine which column we're sorting by
    for(let i = 0; i < headers.length; i++){
        if(headers[i].toUpperCase().includes(sortStr.toUpperCase())){
            sortIndex = i;
            break;
        }
    }

    //Sort table by chosen column
    players.sort( function(player1, player2){
        //Separate sorting between numbers and strings
        if(isNaN(player1[sortIndex])){
            return player1[sortIndex].toUpperCase().localeCompare(player2[sortIndex].toUpperCase());
        }
        return  player2[sortIndex] - player1[sortIndex];
    })

    //Create array
    let tableArray = [headers];
    for( i = 0; i < players.length; i++){
        tableArray.push(players[i]);
    }

    //Create ascii table
    let statTable = table(
        tableArray,
        {align : [ 'l' , 'l' , 'l' , 'l' , 'l' , 'l' , 'l' , 'l' , 'l', 'l', 'l', 'l' ]}
    );

    //Write backup to file
    fs.writeFile('./out/stat-table.txt', statTable, () => {});

    return statTable;

}

/**
 * Returns an array of stat tables no larger than 1800 characters each
 */
function getSizedStatTables(statTable){

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
    for(let i = 0; i < tableArray.length; i++){
        //Create a new message if previous one is full
        if(messageArray.length < Math.floor(i / rowsPerMessage) + 1){
            messageArray.push('');
        }
        //Add row to message
        messageArray[Math.floor(i / rowsPerMessage)] += (tableArray[i] + '\n');
    }
    return messageArray;
}



module.exports = {
    getFriendlyTable,
    getStatTable,
    getSizedStatTables,
    getKillStats
}
