const { accumulate } = require("./util");

//Hashmap that will hold squad states
let squadStats = new Map();

async function getSquadStats(){
    return squadStats;
}

async function addPlayerToSquadStats(player) {
    
    //account id will act as our key, meaning it will merge anyone who character swaps.
    let accountId = player.account;

    //Check if key already exists, if it doesn't then add it.
    if( !(accountId in squadStats) ){
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
            protUptime : 0,
            dodges : 0,
            distance : 0,
            downs : 0,
            deaths : 0,
            fightTime : 0,
            killed : 0,
            downed : 0,
        };
        //Add initial object to map
        squadStats[accountId] = statObj;
    }

    //Retrieve stats from previouis fights for this player
    let statObj = squadStats[accountId];
    //Stats for this specific fight
    let fightStatObj = {};

    //Add character name if need be
    if( !(statObj.characters.includes(player.name)) ){
        statObj.characters.push(player.name);
    }

    //Parse out the offensive, defensive and support stats from JSON
    let offensiveStats = await accumulate(player.dpsTargets);
    let targetStats = await accumulate(player.statsTargets);
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
    });
    let stabUptime = (stability === undefined ? 0 : stability.buffData[0].uptime);
    
    //alacrity
    let alacrity = buffUptimeArray.find( (buff) => {
        if(buff.id === 30328){
            return true;
        }
    });
    let alacUptime = (alacrity === undefined ? 0 : alacrity.buffData[0].uptime);

    //Protection
    let protection = buffUptimeArray.find( (buff) => {
        if(buff.id === 717) {
            return true;
        }
    });
    let protUptime = (protection === undefined ? 0 : protection.buffData[0].uptime);


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
    fightStatObj.protUptime = protUptime;
    fightStatObj.dodges = defensiveStats.dodgeCount;
    fightStatObj.distance = generalStats.distToCom;
    fightStatObj.downs = defensiveStats.downCount;
    fightStatObj.deaths = defensiveStats.deadCount;
    fightStatObj.fightTime = deathTime;
    fightStatObj.killed = targetStats.killed;
    fightStatObj.downed = targetStats.downed;

    //Add current fight statistics to the previous fights
    statObj.totalActiveTime += activeTime
    statObj.fightsParticipated += 1;
    statObj.damage += offensiveStats.damage;
    statObj.cleanses += supportStats.condiCleanse + supportStats.condiCleanseSelf;
    statObj.strips += supportStats.boonStrips;
    statObj.stabUptime += activeTime * stabUptime;
    statObj.alacUptime += activeTime * alacUptime;
    statObj.protUptime += activeTime * protUptime;
    statObj.dodges += defensiveStats.dodgeCount;
    statObj.distance += (generalStats.distToCom * activeTime); // to average across all fights
    statObj.downs += defensiveStats.downCount;
    statObj.deaths += defensiveStats.deadCount;
    statObj.fightTime += deathTime;
    statObj.killed += targetStats.killed;
    statObj.downed += targetStats.downed;

    //Save statistics back to the map
    squadStats[accountId] = statObj;

    return fightStatObj;
}

module.exports = {
    getSquadStats,
    addPlayerToSquadStats
}