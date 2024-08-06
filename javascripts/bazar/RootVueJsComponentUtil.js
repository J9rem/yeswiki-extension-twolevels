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

const searchFieldByName = (fieldName,fields) => {
    for (const key in fields) {
        if (Object.hasOwnProperty.call(fields, key)) {
            const field = fields[key];
            if ('name' in field && (
                        field.name === fieldName
                        || field.name === ('' + field.type + field.linkedObjectName + fieldName)
                    )
                ){
                return field
            }
        }
    }
    return null
}

const getFieldFromRoot = (root,fieldName) => {
    if ('formFields' in root 
        && typeof root.formFields === 'object'
        && Object.keys(root.formFields).length > 0){
        if (fieldName in root.formFields){
            return root.formFields[fieldName]
        }
        return searchFieldByName(fieldName, root.formFields)
    }
    return null
}

const pushIfNotPresent = (value,data) => {
    if (!data.a.includes(value)){
        data.a.push(value)
    }
}

const getChekedFilters = (root) => {
    let filters = [];
    for(let fieldName in root.filters) {
        const filter = root.filters[fieldName]
        for (let option of (filter?.list ?? filter.nodes)) {
            if (option.checked) {
                pushIfNotPresent(fieldName,{a:filters})
            }
        }
    }
    return filters
}

export default {
    canShowAnd,
    filterEntriesSync,
    getChekedFilters,
    getFieldFromRoot,
    getOptionData,
    isSubLevel,
    pushIfNotPresent
}