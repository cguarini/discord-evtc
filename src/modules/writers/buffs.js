const {google} = require('googleapis');
const { getAuthToken} = require('./auth');
const config = require('../../../res/config.json');


async function writeBuffsToSheets(buffNameObj) {

    let auth = await getAuthToken();

    let sheets = google.sheets(
        {
            version : 'v4'
        }
    );

    //Parse buffNameObj into values array
    values = [];
    for(buffKey in buffNameObj) {
        let buff = buffNameObj[buffKey];
        values.push([buffKey, buff.name]);
    }

    sheets.spreadsheets.values.append({
        spreadsheetId : config.sheets.BuffMapSheetId,
        range : 'A2:B',
        valueInputOption : 'RAW',
        resource: {values},
        auth
    }, (err, result) => {
        if(err) {
            console.log(err)
        }
        else {
            console.log(result)
        }
    });
}

module.exports = {
    writeBuffsToSheets
}