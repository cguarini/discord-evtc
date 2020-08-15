const sql = require('mssql');
const config = require('../../res/config.json');

let currentRaidId = null;

/**
 * Creates a new raid in the database and returns the raid id
 */
async function createNewRaid() {

    //Current date time, which is when the raid started
    let raidDate = new Date();

    let pool = await sql.connect(config.db);
    await pool.request()
        .input('in_raidDate', sql.DateTime2, raidDate )
        .query('INSERT INTO Raid (RaidDate)\
                VALUES (@in_raidDate)');

    let result = await pool.request()
        .input('in_raidDate', sql.DateTime2, raidDate)
        .query('SELECT RaidId FROM RAID\
                WHERE RaidDate = @in_raidDate');
    return result.recordset[0].RaidId;
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