/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

if (Vue) {
    const canShowAnd = (root) => {
        return (typeof root.params.intrafiltersmode === 'string')
           && ['and','sublevel'].includes(root.params.intrafiltersmode)
    }

    const filterEntriesSync = (entries,root) => {
        if (!canShowAnd(root)){
            return entries
        }
        let results = entries
        for(const filterId in root.computedFilters) {
            results = results.filter(entry => {
                if (!(filterId in entry) || typeof entry[filterId] != "string"){
                    return false
                }
                return root.computedFilters[filterId].every((value)=>entry[filterId].split(',').includes(value));
            })
        }
        return results
    }

    const getEntriesForThisField = (entries,fieldName,test) => {
        return entries.filter(entry => {
            let entryValues = entry[fieldName]
            if (!entryValues || typeof entryValues != "string"){
                return
            }
            entryValues = entryValues.split(',')
            return entryValues.some(value => test(value))
        })
    }

    const updateNbForEachFilter = (root,fieldName,availableEntriesForThisFilter) => {
        for (let option of root.filters[fieldName].list) {
            if (typeof customCalculatebFromAvailableEntries == "function"){
                // allow usage of custom function if available
                option.nb = customCalculatebFromAvailableEntries(option,availableEntriesForThisFilter,root,fieldName)
            } else {
                option.nb = getEntriesForThisField(availableEntriesForThisFilter,fieldName,(value)=>value == option.value).length
            }
        }
    }

    const getCheckedFiltersWithMoreThanOne = (root) => {
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
        return modeThanOneCheckedFiltersName
    }

    Vue.prototype.isDisplayedFilterOption = function(filterOption,root){
        return root.params.autohidefilter === "false" ||
            (!canShowAnd(root) && filterOption.checked) 
            || filterOption.nb > 0
        ;
    }
    Vue.prototype.filterHasAtLeastOneOption = function(filter,root){
        if (typeof customfilterHasAtLeastOneOption == "function"){
            // allow usage of custom function if available
            return customfilterHasAtLeastOneOption(filter,root)
        } else {
            return filter.list.some((filterOption)=>Vue.prototype.isDisplayedFilterOption(filterOption,root));
        }
    }
    Vue.component('FilterLoadRoot', {
        props: ['root'],
        data: function(){
            return {
                actions: {
                    filteredEntries: 'updateFilteredEntries',
                    params: 'processParams'
                },
                unwatcher: {}
            };
        },
        methods: {
            processParams: function(){
                this.unwatcher.params();
                if (canShowAnd(this.root)){
                    this.registerWatcher('filteredEntries');
                }
            },
            registerWatcher: function(varname){
                if (varname in this.actions && typeof this[this.actions[varname]] == "function"){
                    this.unwatcher[varname] = this.root.$watch(varname,()=>(this[this.actions[varname]])())
                }
            },
            updateFilteredEntries: function(){
                if (Object.keys(this.root.computedFilters).length > 0){
                    const results = filterEntriesSync(this.root.searchedEntries,this.root)
                    this.unwatcher.filteredEntries();
                    this.root.filteredEntries = results
                    this.registerWatcher('filteredEntries');
                    this.root.paginateEntries();
                }
            }
        },
        mounted(){
            this.registerWatcher('params');
        },
        template: `
        <span v-show="false"></span>
        `
    });
    Vue.prototype.refreshedFiltersWithentries = function(entries,root){
        const modeThanOneCheckedFiltersName = getCheckedFiltersWithMoreThanOne(root)
        for(let fieldName in root.filters) {
            let availableEntriesForThisFilter = root.searchedEntries;
            if (root.params.template === "map"){
                availableEntriesForThisFilter = availableEntriesForThisFilter.filter(entry => entry.bf_latitude && entry.bf_longitude)
            }
            if (modeThanOneCheckedFiltersName.includes(fieldName)){
                modeThanOneCheckedFiltersName
                    .filter(fName=>fName!=fieldName)
                    .forEach((otherFieldName)=>{
                        availableEntriesForThisFilter = getEntriesForThisField(availableEntriesForThisFilter,fieldName,(value)=>{
                            return root.filters[otherFieldName].list.some((option)=>option.checked && value == option.value)
                        })
                });
            } else {
                availableEntriesForThisFilter = (root.params.template === "map")
                    ? root.filteredEntries.filter(entry => entry.bf_latitude && entry.bf_longitude)
                    : root.filteredEntries
            }
            availableEntriesForThisFilter = filterEntriesSync(availableEntriesForThisFilter,root)
            updateNbForEachFilter(root,fieldName,availableEntriesForThisFilter)
        }
        return root.filters;
    };
}