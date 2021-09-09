const {google} = require('googleapis');
const { getAuthToken} = require('./auth');
const config = require('../../../res/config.json');

async function writeDebuffsToSheets(fightTs, raidId, fightId, debuffMap) {

    let auth = await getAuthToken();

    let sheets = google.sheets(
        {
            version : 'v4'
        }
    );

    //Parse buffNameObj into values array
    let values = [];
    for(debuffId in debuffMap) {
        let debuff = debuffMap[debuffId];

        for(playerName in debuff) {
            let generation = (debuff[playerName].generation / debuff[playerName].targetsHit);
            values.push([fightTs, raidId, fightId, debuffId, playerName, generation]);

        }
    }

    sheets.spreadsheets.values.append({
        spreadsheetId : config.sheets.DebuffsSheetId,
        range : 'A2:F',
        valueInputOption : 'RAW',
        resource: {values},
        auth
    }, (err, result) => {
        if(err) {
            console.log(err);
        }
        else {
            console.log(`Debuff Writing Status ${result.status} - ${result.statusText}`);
        }
    });
}

module.exports = {
    writeDebuffsToSheets
}