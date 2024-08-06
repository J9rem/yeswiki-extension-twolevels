/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import fieldService from './field.service.js'

const getFilterFromPropName = (filterName, filters) => {
    return !(filterName?.length > 0)
        ? null
        : (
            filterName in filters
            ? filterName
            : filters.reduce((previousFilter, filter) => {
                return previousFilter !== null
                    ? previousFilter
                    : (
                        (
                            filter?.propName == filterName
                            || (
                                filter?.propName?.slice(-filterName.length) == filterName
                                && filter?.propName?.slice(0,-filterName.length)?.match(/^(liste|radio|checkbox)(Liste\S+|\d+)/)
                            )
                        )
                        ? filter
                        : null
                    )
            }, null)
        )
}

const updateNbForEachFilter = (root,fieldName,availableEntriesForThisFilter) => {
    const filter = root.filters[fieldName]
    for (let option of (filter?.list ?? filter.nodes)) {
        if (typeof customCalculatebFromAvailableEntries == "function"){
            // allow usage of custom function if available
            root.$set(option,'nb',customCalculatebFromAvailableEntries(option,availableEntriesForThisFilter,root,fieldName))
        } else {
            root.$set(option,'nb',fieldService.getEntriesForThisField(availableEntriesForThisFilter,fieldName,(values)=>values.some((value)=>value == option.value)).length)
        }
        root.$set(option,'count', option.nb)
    }
}

export default {
    getFilterFromPropName,
    updateNbForEachFilter
}