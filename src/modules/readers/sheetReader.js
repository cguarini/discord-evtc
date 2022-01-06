const { returnBuffNameObj } = require('../processors/buffs');
const { getDebuffGeneration } = require('../Processors/debuffs');
const { writeBuffsToSheets } = require('../writers/buffs');
const { writeDebuffsToSheets } = require('../writers/debuffs');
const {getRaidId} = require('../persistFights');
const config = require('../../../res/config.json');


let raidId = null;
let fightId = -1;

async function persistDataToSheets(fightObj) {

    if(config.sheets.enabled) {

        let fightStats = fightObj.fullStats;

        //Populate the raid id, if needed
        raidId = (raidId === null ? await getRaidId() : raidId);
        //Increment the fight id
        fightId++;

        //let buffNameObj = await returnBuffNameObj(fightStats);
        let debuffGeneration = await getDebuffGeneration(fightStats.targets);
        writeDebuffsToSheets(fightStats.timeStart, raidId, fightId, debuffGeneration);
        
    }
}

module.exports = {
    persistDataToSheets
}