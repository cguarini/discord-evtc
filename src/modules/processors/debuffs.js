
/**
 * Return average conditions generated on targets
 * @param {*} targets
 * @returns 
 */
async function getDebuffGeneration(targets) {

    let buffsObj = {};

    //Loop through each enemy target
    for(let i in targets) {
        let buffs = targets[i].buffs;
        //Loop through each debuff that enemy has
        for(let j in buffs) {
            let buff = buffs[j];

            //debuff hasn't been found yet, add as new object
            if(!buffsObj[buff.id]){
                buffsObj[buff.id] = {};
            }

            buffObj = buffsObj[buff.id];

            //Record debuff generation by each player
            let generated = buff.buffData[0].generated;
            for(let k in generated) {
                if(k in buffObj){
                    buffObj[k].generation += generated[k];
                    buffObj[k].targetsHit += 1;
                }
                else {
                    buffObj[k] = {
                        'generation' : generated[k],
                        'targetsHit' : 1
                    }
                }
            }
            

        }
    }

    return buffsObj;
}

module.exports = {
    getDebuffGeneration
}