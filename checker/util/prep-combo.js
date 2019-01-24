module.exports.PrepareCombos = (comboBuff) => {
    let combos = comboBuff.toString().split(/\r?\n/g) //split by line
    
    //filter combo
    combos = combos.filter(combo =>{
        //email:pass combo filter out without '@'
        if(combo.indexOf('@') == -1 ){
            return false;
        }
        //filter out without ':' or ';'
        if(combo.indexOf(':') > -1){
            return true;
        }else if (combo.indexOf(';') > -1){
            return true;
        }
        return false;
    })

    // Remove duplicates
    combos = Array.from(new Set(combos));
    return combos;
}

// Domain filter
module.exports.FilterCombos = (combo, filters) => {
    combo = combo.filter(combo => {
        //look for filter words in combo
        for (var i = 0; i < filters.length; i++) {
            let tempCombo = combo.toLowerCase();
            //combo contains a filter word
            if ((tempCombo.indexOf(filters[i]) > -1)) {
                return false;
            }
        } //combo does not contain filter
        return true;
    })
    return combo;
}