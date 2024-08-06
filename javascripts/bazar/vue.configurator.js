/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import fieldService from './field.service.js'
import FilterLoadRoot from './FilterLoadRootComponent.js'
import filtersService from './filters.service.js'
import optionsManager from './options.service.js'
import utils from './RootVueJsComponentUtil.js'
import visibilityManager from './visibility.service.js'

const isDisplayedFilterOption = (filterOption,root) => {
    return root.params.autohidefilter === "false" // main param
        || (!utils.canShowAnd(root) && filterOption.checked) // display if checked in all case
        || (root.params.keepallparents !== "false" && filterOption.forceShow === true) // display if parentField of sublevel
        || (filterOption.hide !== true && (filterOption?.nb ?? filterOption.count) > 0) // hide or at least one element
}

const filterHasAtLeastOneOption = (filter,root) => {
    if (typeof window?.customfilterHasAtLeastOneOption == "function"){
        // allow usage of custom function if available
        return window.customfilterHasAtLeastOneOption(filter,root)
    } else {
        return (filter?.list ?? filter.nodes).some((filterOption)=>Vue.prototype.isDisplayedFilterOption(filterOption,root));
    }
}

const refreshedFiltersWithentries = (entries,root) => {
    optionsManager.refreshOptionsAsync(root)
    const modeThanOneCheckedFiltersName = utils.getChekedFilters(root)
    for(let fieldId in root.filters) {
        let availableEntriesForThisFilter = root.searchedEntries;
        if (root.params.template === "map"){
            availableEntriesForThisFilter = availableEntriesForThisFilter.filter(entry => entry.bf_latitude && entry.bf_longitude)
        }
        const fieldName = filtersService.getFieldName(root.filters[fieldId])
        if (modeThanOneCheckedFiltersName.includes(fieldName)){
            modeThanOneCheckedFiltersName
                .filter(fName=>fName!=fieldName)
                .forEach((otherFieldName)=>{
                    availableEntriesForThisFilter = fieldService.getEntriesForThisField(
                        availableEntriesForThisFilter,
                        otherFieldName,
                        (values)=>{
                            const filter = filtersService.getFilterFromPropName(otherFieldName, root.filters)
                            return (filter?.list ?? filter.nodes).some((option)=>option.checked && values.some(value=>value == option.value))
                        }
                    )
            });
        } else {
            availableEntriesForThisFilter = (root.params.template === "map")
                ? root.filteredEntries.filter(entry => entry.bf_latitude && entry.bf_longitude)
                : root.filteredEntries
        }
        availableEntriesForThisFilter = utils.filterEntriesSync(availableEntriesForThisFilter,root)
        filtersService.updateNbForEachFilter(root,fieldName,availableEntriesForThisFilter)
        visibilityManager.updateVisibilityIfSublevel(root)
    }
    return root.filters;
};

const init = () => {
    Vue.prototype.isDisplayedFilterOption = isDisplayedFilterOption
    Vue.prototype.filterHasAtLeastOneOption = filterHasAtLeastOneOption
    Vue.component('FilterLoadRoot', FilterLoadRoot)
    Vue.prototype.refreshedFiltersWithentries = refreshedFiltersWithentries
}

export default {
    init
}