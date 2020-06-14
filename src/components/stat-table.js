let fs = require('fs');
let table = require('text-table');

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
    fightStats.players.forEach( async (player) => {

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
                downs : 0,
                deaths : 0,
            };
            //Add initial object to map
            playerStats[accountId] = statObj;
        }

        //Retrieve stats from previouis fights for this player
        let statObj = playerStats[accountId];

        //Add character name if need be
        if( !(player.name in statObj.characters) ){
            statObj.characters.push(player.name);
        }

        //Parse out the offensive, defensive and support stats from JSON
        let offensiveStats = player.dpsAll[0];
        let defensiveStats = player.defenses[0];
        let supportStats = player.support[0];

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
        statObj.downs += defensiveStats.downCount;
        statObj.deaths += defensiveStats.deadCount;

        //Save statistics back to the map
        playerStats[accountId] = statObj;

    });

}



addFightToLeaderboard('./input/test_wvw_kill.json');