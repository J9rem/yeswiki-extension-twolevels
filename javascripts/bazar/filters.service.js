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

const getFieldName = (filter, filterOption = null) => {
    return filterOption?.name ?? filter?.propName ?? filter?.list?.[0]?.name ?? null
}

const updateNbForEachFilter = (root,fieldName,availableEntriesForThisFilter) => {
    const filter = getFilterFromPropName(fieldName,root.filters)
    for (let option of (filter?.list ?? filter.nodes)) {
        const nb = (typeof window?.customCalculatebFromAvailableEntries == "function")
            // allow usage of custom function if available
            ? window.customCalculatebFromAvailableEntries(option,availableEntriesForThisFilter,root,fieldName)
            : fieldService.getEntriesForThisField(
                    availableEntriesForThisFilter,
                    fieldName,
                    (values) => values.some((value)=>value == option.value)
                ).length
        if ('nb' in option) {
            // prevent infinite loop
            if (option.nb != nb) {
                option.nb = nb
            }
        } else {
            root.$set(option,'nb',nb)
        }
        if ('count' in option) {
            // prevent infinite loop
            if (option.count != nb) {
                option.count = nb
            }
        } else {
            root.$set(option,'count', nb)
        }
    }
}

export default {
    getFieldName,
    getFilterFromPropName,
    updateNbForEachFilter
}