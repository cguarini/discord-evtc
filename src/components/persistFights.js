const sql = require('mssql');
const config = require('../../res/config.json');

let currentRaidId = null;

/**
 * Creates a new raid in the database and returns the raid id
 */
async function createNewRaid() {

    //Open connection to global pool and insert raid
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

/**
 * Creates a new fight after a log is parsed
 * @param {*} fightObj 
 */
async function createFight(fightObj) {

    //Set fightdate to current date, will need for finding fightId later
    let raidId = await getRaidId();

    //Open connection to global pool and insert fight
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

/**
 * Creates a row for this player for this fight
 * @param {*} FightId - Id of created fight
 * @param {*} fightStatObj - Player stat object for fight
 */
async function createPlayer(FightId, fightStatObj) {

    //Open connection to global pool and insert player for fight
    let pool = await sql.connect(config.db);
    await pool.request()
        .input('in_accountName', sql.VarChar, fightStatObj.account)
        .input('in_fightId', sql.Int, FightId)
        .input('in_characterName', sql.VarChar, fightStatObj.character)
        .input('in_profession', sql.VarChar, fightStatObj.profession)
        .input('in_squadGroup', sql.Int, fightStatObj.group)
        .input('in_activeTime', sql.Int, fightStatObj.totalActiveTime)
        .input('in_damage', sql.Int, fightStatObj.damage)
        .input('in_cleanses', sql.Int, fightStatObj.cleanses)
        .input('in_strips', sql.Int, fightStatObj.strips)
        .input('in_stability', sql.Int, fightStatObj.stabUptime)
        .input('in_dodges', sql.Int, fightStatObj.dodges)
        .input('in_distance', sql.Int, fightStatObj.distance)
        .input('in_downs', sql.Int, fightStatObj.downs)
        .input('in_deaths', sql.Int, fightStatObj.deaths)
        .input('in_fightTime', sql.Int, fightStatObj.fightTime)
        .query('INSERT INTO PlayerStats\
                (AccountName, FightId, CharacterName, Profession, SquadGroup, ActiveTime, Damage,\
                    Cleanses, Strips, Stability, Dodges, Distance, Downs, Deaths, FightTime)\
                VALUES (@in_accountName, @in_fightId, @in_characterName, @in_profession, @in_squadGroup, @in_activeTime,\
                    @in_damage, @in_cleanses, @in_strips, @in_stability, @in_dodges, @in_distance,\
                    @in_downs, @in_deaths, @in_fightTime);');
}

async function createEnemyStats(FightId, enemyData) {

    //Open connection to global pool and insert enemy data
    let pool = await sql.connect(config.db);
    await pool.request()
        .input('in_fightId', sql.Int, FightId)
        .input('in_totalDamage', sql.Int, enemyData.totalDamage)
        .input('in_powerDamage', sql.Int, enemyData.powerDamage)
        .input('in_powerDps', sql.Int, enemyData.powerDps)
        .input('in_condiDamage', sql.Int, enemyData.condiDamage)
        .input('in_condiDps', sql.Int, enemyData.condiDps)
        .query('INSERT INTO EnemyStats\
                (FightId, TotalDamage, PowerDamage, PowerDps, ConditionDamage, ConditionDps)\
                VALUES (@in_fightId, @in_totalDamage, @in_powerDamage, @in_powerDps, @in_condiDamage,\
                    @in_condiDps);')
}

async function saveFightToDb(fightObj) {
    try {
        //Create fight, which will also create the raid if it doesn't exist
        let fightId = await createFight(fightObj);

        //Create enemy stats in parallel to player stats
        createEnemyStats(fightId, fightObj.enemyData);
        for(let i = 0; i < fightObj.playerList.length; i++) {
            let fightStatObj = fightObj.playerList[i];
            createPlayer(fightId, fightStatObj);
        }

    }
    catch(error) {
        console.log(error);
    }
}

module.exports = {
    saveFightToDb : saveFightToDb,

}