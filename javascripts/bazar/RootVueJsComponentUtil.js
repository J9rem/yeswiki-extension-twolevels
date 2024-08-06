/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import optionRegistry from './options.registry.js'

const canShowAnd = (root) => {
    return (root.params.intrafiltersmode === 'and')
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


let isSubLevelCache = null
const isSubLevel = (root) => {
    if (isSubLevelCache === null){
        if (Object.keys(root.formFields).length === 0){
            return false
        }
        isSubLevelCache = Object.values(root.formFields).some((field)=>('parentFieldName' in field && 'associatingFormId' in field))
    }
    return isSubLevelCache
}

const getUuid = (root) => root?._uid ?? 'unknown'

const getOptionData = (root) => {
    const uuid = getUuid(root)
    return optionRegistry.getAndInitIfNeeded(uuid)
}

export default {
    canShowAnd,
    filterEntriesSync,
    getOptionData,
    isSubLevel
}