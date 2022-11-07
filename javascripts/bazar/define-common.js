/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

if (Vue) {
    if (!Vue.prototype.twolevelswatcheractivated){
        Vue.prototype.twolevelswatcheractivated = false;
        Vue.prototype.twolevelstriggerwatcher = true;
    }
    Vue.prototype.filterHasAtLeastOneOption = function(filter){
        return filter.list.some((filterOption)=>filterOption.nb>0);
    }
    Vue.prototype.refreshedFiltersWithentries = function(entries,root){
        if (root.params.intrafiltersmode === "and"){
            if (!Vue.prototype.twolevelswatcheractivated){
                Vue.prototype.twolevelswatcheractivated = true;
                let updateFilteredEntries = function (root){
                    if (Vue.prototype.twolevelstriggerwatcher){
                        Vue.prototype.twolevelstriggerwatcher = false;
                        let result = root.searchedEntries
                            for(const filterId in root.computedFilters) {
                                result = result.filter(entry => {
                                    if (!entry[filterId] || typeof entry[filterId] != "string") return false
                                    return entry[filterId].split(',').every(value => {
                                        return root.computedFilters[filterId].includes(value)
                                    }) && root.computedFilters[filterId].length == entry[filterId].split(',').length
                                })
                        }
                        root.filteredEntries = result
                        root.paginateEntries();
                    }
                    root.$nextTick(()=>{
                        Vue.prototype.twolevelstriggerwatcher = true;
                    })
                };
                // set watcher
                root.$watch('filteredEntries',()=>{
                    updateFilteredEntries(root);
                });
            }
        }
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
            if (root.params.template === "map"){
                availableEntriesForThisFilter = availableEntriesForThisFilter.filter(entry => entry.bf_latitude && entry.bf_longitude)
            }
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
                availableEntriesForThisFilter = (root.params.template === "map")
                    ? root.filteredEntries.filter(entry => entry.bf_latitude && entry.bf_longitude)
                    : root.filteredEntries
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