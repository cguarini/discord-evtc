let fs = require('fs');
let table = require('text-table');
const config = JSON.parse(fs.readFileSync('./res/config.json', 'utf8'));

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

        //Save statistics back to the map
        playerStats[accountId] = statObj;
    });    

    //Save enemy fight data
    let enemyStats = fightStats.targets[0];
    let enemyDpsStats = enemyStats.dpsAll[0]
    fightObj.enemyData = {
        totalDamage : enemyDpsStats.damage,
        powerDamage : enemyDpsStats.powerDamage,
        powerDps : enemyDpsStats.powerDps,
        condiDamage : enemyDpsStats.condiDamage,
        condiDps : enemyDpsStats.condiDps
    }

    return fightObj;

}