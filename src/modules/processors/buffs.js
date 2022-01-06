
/**
 * Parses fightstats to return a JSON map of buff Id and name.
 * @param {*} fightStats 
 */
 async function returnBuffNameObj(fightStats) {

    let buffMapKeys = Object.keys(fightStats.buffMap);
    let buffNames = {};
    for(let i = 0; i < buffMapKeys.length; i++) {

        let buff = fightStats.buffMap[buffMapKeys[i]];

        let buffId = buffMapKeys[i].substring(1); //strip away first character to get id

        buffNames[buffId] = {
            'name' : buff.name
        };
    }

    return buffNames;

}

module.exports = {
    returnBuffNameObj
}