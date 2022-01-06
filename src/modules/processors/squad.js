let fightStatsObj = require('../../../input/20210805-224220_detailed_wvw_kill.json');
const { accumulate } = require('../components/util');
/**
 * Create stats obj for each player in the squad
 * @param {*} fightStatsObj 
 */
async function getSquadStatsObj(fightStatsObj) {

    let squadStatsArray = fightStatsObj.players;

    squadStatsObj = {}
    for(playerIndex in squadStatsArray){

        let player = squadStatsArray[playerIndex];
        playerStatsObj = {
            account : player.account,
            name : player.name,
            group : player.group,
            profession : player.profession,
            ...await accumulate(player.dpsTargets),
            ...await accumulate(player.statsTargets),
            ...player.statsAll[0],
            ...player.defenses[0],
            ...player.support[0],
            hasCommanderTag : player.hasCommanderTag,
            activeTime : player.activeTimes[0]

        }
        squadStatsObj[player.account] = playerStatsObj;
    }
    console.log(squadStatsObj);
    return squadStatsObj;
}

getSquadStatsObj(fightStatsObj);