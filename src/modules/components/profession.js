const { accumulate } = require("./util");

async function getBuffGeneration(buffArray, id) {
    if(!buffArray) {
        return 0.0;
    }
    let buffObj = buffArray.find(element => element.id === id);

    if( buffObj === undefined) {
        return 0.0;
    }

    return buffObj.buffData[0].generation;
    
}

async function getBuffUptime(buffArray, id) {
    if(!buffArray) {
        return 0.0;
    }
    let buffObj = buffArray.find(element => element.id === id);

    if( buffObj === undefined) {
        return 0.0;
    }

    return buffObj.buffData[0].uptime;
}

async function getAvgCondiGeneration(targets, name, id) {

    let targetsHit = 0;
    let generation = 0.0;

    //Loop through each enemy target
    for(let i in targets) {
        let buffs = targets[i].buffs;
        //Loop through each debuff that enemy has
        for(let j in buffs) {

            //Match the debuff to the one generated by the name given
            let buff = buffs[j];
            if(buff.id === id) {
                let generated = buff.buffData[0].generated;
                if(name in generated) {
                    generation += generated[name];
                    targetsHit++;
                }
            }

        }
    }

    //average out generation and return
    return (targetsHit > 0 ? generation / targetsHit : 0);
}

async function getScrapperStats(scrapperArray) {

    
    //Return object
    let scrapperStats = {
        profession : "Scrapper",
        stats : []
    };

    if(!scrapperArray || scrapperArray === undefined) {
        scrapperArray = [];
    }

    //Parse stats from each player object in scrapper array
    for( let i in scrapperArray) {

        let player = scrapperArray[i];
        let playerStats = {};

        playerStats.name = player.name;
        playerStats.cleanses = player.support[0].condiCleanse + player.support[0].condiCleanseSelf;
        playerStats.superSpeed = await getBuffGeneration(player.groupBuffs, 5974);
        playerStats.protection = await getBuffGeneration(player.groupBuffs, 717)

        //Done parsing, add stats to main object
        scrapperStats.stats.push(playerStats);
    }

    return scrapperStats;
}

async function getFirebrandStats(firebrandArray) {

    
    //Return object
    let firebrandStats = {
        profession : "Firebrand",
        stats : []
    };

    if(!firebrandArray || firebrandArray === undefined) {
        firebrandArray = [];
    }

    //Parse stats from each player object in scrapper array
    for( let i in firebrandArray) {

        let player = firebrandArray[i];
        let playerStats = {};

        playerStats.name = player.name;
        playerStats.dodges = player.defenses[0].dodgeCount;
        playerStats.stab = await getBuffGeneration(player.groupBuffs, 1122);
        playerStats.aegis = await getBuffGeneration(player.groupBuffs, 743);
        playerStats.protection = await getBuffGeneration(player.groupBuffs, 717);
        playerStats.resistance = await getBuffGeneration(player.groupBuffs, 26980);

        //Done parsing, add stats to main object
        firebrandStats.stats.push(playerStats);
    }

    return firebrandStats;
}

async function getHeraldStats(heraldArray) {

    
    //Return object
    let heraldStats = {
        profession : "Herald",
        stats : []
    };

    if(!heraldArray || heraldArray === undefined) {
        heraldArray = [];
    }

    //Parse stats from each player object in scrapper array
    for( let i in heraldArray) { 

        let player = heraldArray[i];
        let playerStats = {};

        let offensiveStats = await accumulate(player.dpsTargets);

        playerStats.name = player.name;
        playerStats.damage = offensiveStats.damage;
        playerStats.fury = await getBuffGeneration(player.groupBuffs, 725);


        //Done parsing, add stats to main object
        heraldStats.stats.push(playerStats);
    }

    return heraldStats;
}

async function getSpellBreakerStats(sbArray, targets) {

    
    //Return object
    let sbStats = {
        profession : "Spell Breaker",
        stats : []
    };

    if(!sbArray || sbArray === undefined) {
        sbArray = [];
    }

    //Parse stats from each player object in scrapper array
    for( let i in sbArray) { 

        let player = sbArray[i];
        let playerStats = {};

        let offensiveStats = await accumulate(player.dpsTargets);

        playerStats.name = player.name;
        playerStats.damage = offensiveStats.damage;
        playerStats.strips = player.support[0].boonStrips;
        playerStats.immob = await getAvgCondiGeneration(targets, player.name, 727);


        //Done parsing, add stats to main object
        sbStats.stats.push(playerStats);
    }



    return sbStats;
}

async function getChronoStats(profArray, targets) {

    
    //Return object
    let profStats = {
        profession : "Chronomancer",
        stats : []
    };

    if(!profArray || profArray === undefined) {
        profArray = [];
    }

    //Parse stats from each player object in scrapper array
    for( let i in profArray) { 

        let player = profArray[i];
        let playerStats = {};

        playerStats.name = player.name;
        playerStats.strips = player.support[0].boonStrips;
        playerStats.interrupts = player.statsAll[0].interrupts;
        playerStats.slow = await getAvgCondiGeneration(targets, player.name, 26766);


        //Done parsing, add stats to main object
        profStats.stats.push(playerStats);
    }


    return profStats;
}

module.exports = {
    getScrapperStats,
    getFirebrandStats,
    getHeraldStats,
    getSpellBreakerStats,
    getChronoStats
}