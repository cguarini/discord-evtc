/**
 * Accumulates all objects in an array down to one object
 * @param {*} objArray 
 */
async function accumulate(objArray) {

    let obj = (objArray.length === 0 ? {} : objArray[0][0]);

    for(let i = 1; i < objArray.length; i++) {
        for(let key in objArray[i][0]){
            if(!(key in obj)) {
                obj[key] = objArray[i][0][key];
                continue;
            }
            obj[key] += objArray[i][0][key];
        }
    }

    return obj;
}

module.exports = {
    accumulate
}