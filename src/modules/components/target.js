
const { accumulate } = require("./util");

let persistentTargetStats = {};

async function getPersistentTargetStats() {
    return persistentTargetStats;
}

/**
 * Parses fight stats for target (enemy) data (damage, downs, deaths, kills, etc...)
 * @param {*} fightStats - JSON of the fight read into memory
 */
async function getTargetStats(fightStats) {
    
    //Retrieve list of targets from JSON, filter out the dummy target
    let targets = fightStats.targets.filter( (target) => 
        target.name !== "Dummy WvW Agent"
    );

    let targetData = {
        fights : 1,
        count : 0,
        totalDamage : 0,
        powerDamage : 0,
        powerDps : 0,
        condiDamage : 0,
        condiDps : 0,
        killed : 0, //killed by targets
        downed : 0, //downed by targets
        downCount : 0, //targets that were downed
        deaths : 0 //targets that died
    }

    await targets.forEach( (target) => {
        let dpsAll = target.dpsAll[0];
        let statsAll = target.statsAll[0];
        let defenses = target.defenses[0];

        targetData.count++;
        targetData.totalDamage += dpsAll.damage;
        targetData.powerDamage += dpsAll.powerDamage;
        targetData.powerDps += dpsAll.powerDps;
        targetData.condiDamage += dpsAll.condiDamage;
        targetData.condiDps += dpsAll.condiDps;
        targetData.killed += statsAll.killed;
        targetData.downed += statsAll.downed;

        //Parser bug, does not provide down/dead count, must extrapolate from duration
        //Check in the future if this is fixed. Will not account for multiple downs/deaths
        targetData.downCount += (defenses.downDuration > 0 ? 1 : 0);
        targetData.deaths += (defenses.deadDuration > 0 ? 1 : 0);

    });

    persistentTargetStats = await accumulate([[persistentTargetStats],[targetData]]);
    return targetData;
}

module.exports = {
    getTargetStats,
    getPersistentTargetStats
}