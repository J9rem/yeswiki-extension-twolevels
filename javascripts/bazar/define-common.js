/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

if (Vue) {
    Vue.prototype.refreshedFiltersWithentries = function(entries,root){
        let modeThanOneCheckedFiltersName = [];
        for(let fieldName in root.filters) {
            for (let option of root.filters[fieldName].list) {
                if (option.checked) {
                    if (!modeThanOneCheckedFiltersName.includes(fieldName)){
                        modeThanOneCheckedFiltersName.push(fieldName)
                    }
                }
            }
        }
        for(let fieldName in root.filters) {
            let availableEntriesForThisFilter = root.searchedEntries;
            if (modeThanOneCheckedFiltersName.includes(fieldName)){
                modeThanOneCheckedFiltersName
                    .filter(fName=>fName!=fieldName)
                    .forEach((otherFieldName)=>{
                        availableEntriesForThisFilter = availableEntriesForThisFilter.filter(entry=>{
                            let entryValues = entry[otherFieldName]
                            if (!entryValues || typeof entryValues != "string") return
                            entryValues = entryValues.split(',');
                            for (let option of root.filters[otherFieldName].list) {
                                if (option.checked && entryValues.some(value => value == option.value)){
                                    return true
                                }
                            }
                            return false;
                        });
                });
            } else {
                availableEntriesForThisFilter = root.filteredEntries
            }
            for (let option of root.filters[fieldName].list) {
                option.nb = availableEntriesForThisFilter.filter(entry => {
                    let entryValues = entry[fieldName]
                    if (!entryValues || typeof entryValues != "string") return
                    entryValues = entryValues.split(',')
                    return entryValues.some(value => value == option.value)
                }).length
            }
        }
        return root.filters;
    };
}