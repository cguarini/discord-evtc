let table = require('text-table');
const { getScrapperStats, getFirebrandStats, getHeraldStats, getSpellBreakerStats, getChronoStats } = require("./components/profession");
const { getSquadStats } = require("./components/squad");

/**
 * Filter squad stats into professions and parse the data we want.
 */
async function getProfessionStats(fullStats) {
    //Get squad stats to parse profession stats from
    let squadStats = fullStats.players;

    //Filter squad into professions
    let professionMap = new Map();
    for(let i in squadStats) {

        let player = squadStats[i];
        //Create profession array if it does not exist
        if(!(player.profession in professionMap)) {
            professionMap[player.profession] = [];
        }
        //Add player to profession array
        professionMap[player.profession].push(player);

    }



    let scrappers = await getScrapperStats(professionMap['Scrapper']);
    let firebrands = await getFirebrandStats(professionMap['Firebrand']);
    let heralds = await getHeraldStats(professionMap['Herald']);
    let spellBreakers = await getSpellBreakerStats(professionMap['Spellbreaker'], fullStats.targets);
    let chronos = await getChronoStats(professionMap['Chronomancer'], fullStats.targets);

    let tableMap = {};
    tableMap.scrappers = await getScrapperTable(scrappers);
    tableMap.firebrands = await getFirebrandTable(firebrands);
    tableMap.heralds = await getHeraldTable(heralds);
    tableMap.spellBreakers = await getSpellBreakerTable(spellBreakers);
    tableMap.chronos = await getChronoTable(chronos);
    return tableMap;
   
}

/**
 * Return formatted scrapper table
 * @param {*} scrapperStats - profession stats object 
 * @returns 
 */
async function getScrapperTable(scrapperStats) {

    //Create table headers
    let headers = ['Name', 'Cleanses', 'Sup Spd', 'Prot'];
    //Create data row
    let profArrray = scrapperStats.stats;
    let profTable = [headers];
    for(let i = 0;  i < profArrray.length; i++){
        let player = profArrray[i];
        profTable.push([player.name, player.cleanses, player.superSpeed.toFixed(2), 
            player.protection.toFixed(2)]);
    }

    //Create ascii table
    let statTable = table(
        profTable,
        {align : [ 'l', 'l' , 'l' , 'l', 'l']}
    );

    return statTable;
}

/**
 * Return formatted scrapper table
 * @param {*} firebrandStats - profession stats object 
 * @returns 
 */
 async function getFirebrandTable(firebrandStats) {

    //Create table headers
    let headers = ['Name', 'Dodges', 'Stab', 'Aegis', 'Prot', 'Resist'];
    //Create data row
    let profArrray = firebrandStats.stats;
    let profTable = [headers];
    for(let i = 0;  i < profArrray.length; i++){
        let player = profArrray[i];
        profTable.push([player.name, player.dodges, player.stab.toFixed(2),
                player.aegis.toFixed(2), player.protection.toFixed(2),
                player.resistance.toFixed(2)]);
    }

    //Create ascii table
    let statTable = table(
        profTable,
        {align : [ 'l', 'l' , 'l' , 'l', 'l']}
    );

    return statTable;
}

/**
 * Return formatted scrapper table
 * @param {*} profStats - profession stats object 
 * @returns 
 */
 async function getHeraldTable(profStats) {

    //Create table headers
    let headers = ['Name', 'Damage', 'Fury'];
    //Create data row
    let profArrray = profStats.stats;
    let profTable = [headers];
    for(let i = 0;  i < profArrray.length; i++){
        let player = profArrray[i];
        profTable.push([player.name, player.damage, player.fury.toFixed(2)]);
    }

    //Create ascii table
    let statTable = table(
        profTable,
        {align : [ 'l', 'l' , 'l']}
    );

    return statTable;
}

/**
 * Return formatted scrapper table
 * @param {*} profStats - profession stats object 
 * @returns 
 */
 async function getSpellBreakerTable(profStats) {

    //Create table headers
    let headers = ['Name', 'Damage', 'Strips', 'Immob'];
    //Create data row
    let profArrray = profStats.stats;
    let profTable = [headers];
    for(let i = 0;  i < profArrray.length; i++){
        let player = profArrray[i];
        profTable.push([player.name, player.damage, player.strips, player.immob.toFixed(2)]);
    }

    //Create ascii table
    let statTable = table(
        profTable,
        {align : [ 'l', 'l' , 'l', 'l']}
    );

    return statTable;
}

/**
 * Return formatted scrapper table
 * @param {*} profStats - profession stats object 
 * @returns 
 */
 async function getChronoTable(profStats) {

    //Create table headers
    let headers = ['Name', 'Strips', 'Interrupts', 'Slow'];
    //Create data row
    let profArrray = profStats.stats;
    let profTable = [headers];
    for(let i = 0;  i < profArrray.length; i++){
        let player = profArrray[i];
        profTable.push([player.name, player.strips, player.interrupts, player.slow.toFixed(2)]);
    }

    //Create ascii table
    let statTable = table(
        profTable,
        {align : [ 'l', 'l' , 'l', 'l']}
    );

    return statTable;
}

module.exports = {
    getProfessionStats
}