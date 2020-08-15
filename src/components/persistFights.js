const sql = require('mssql');
const config = require('../../res/config.json');

let currentRaidId = null;

/**
 * Creates a new raid in the database and returns the raid id
 */
async function createNewRaid() {

    let pool = await sql.connect(config.db);
    let results = await pool.request()
        .input('in_raidDate', sql.DateTime2, new Date() )
        .query('INSERT INTO Raid (RaidDate)\
                VALUES (@in_raidDate);\
                SELECT SCOPE_IDENTITY() AS RaidId;');
    return results.recordset[0].RaidId;
}

/**
 * Returns the current raid id
 * If Id is null, it will use the create function to create a new raid
 */
async function getRaidId() {
    if(currentRaidId === null){
        currentRaidId = await createNewRaid();
    }
    return currentRaidId;
}

async function createFight(fightObj) {

    //Set fightdate to current date, will need for finding fightId later
    let raidId = await getRaidId();

    let pool = await sql.connect(config.db);
    let results = await pool.request()
        .input('in_raidId', sql.Int, raidId)
        .input('in_map', sql.VarChar, fightObj.map)
        .input('in_commander', sql.VarChar, fightObj.commander)
        .input('in_duration', sql.VarChar, fightObj.duration)
        .input('in_link', sql.VarChar, fightObj.link)
        .input('in_fightDate', sql.DateTime2, new Date())
        .query('INSERT INTO Fight (RaidId, Map, Commander, Duration, Link, FightDate)\
                VALUES (@in_raidId, @in_map, @in_commander, @in_duration, @in_link, @in_fightDate);\
                SELECT SCOPE_IDENTITY() as FightId;');
    return results.recordset[0].FightId;
}

async function saveFightToDb(fightObj) {
    try {
        let pool = await sql.connect(config.db);
        let result = await pool.request()
            .query("SELECT * FROM Raid");
        console.log(result);
    }
    catch(error) {
        console.log(error);
    }
}

createNewRaid();