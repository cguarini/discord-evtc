const { returnBuffNameObj } = require('../processors/buffs');
const { getDebuffGeneration } = require('../Processors/debuffs');
const { writeBuffsToSheets } = require('../writers/buffs');
const { writeDebuffsToSheets } = require('../writers/debuffs');


async function persistDataToSheets(fightStats) {
    //let buffNameObj = await returnBuffNameObj(fightStats);
    let debuffGeneration = await getDebuffGeneration(fightStats.targets);
    writeDebuffsToSheets(fightStats.timeStart, debuffGeneration);
}

module.exports = {
    persistDataToSheets
}