/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import allEntriesLoader from '../allEntriesLoader.service.js'
import formPromisesManager from '../formPromises.service.js'
import FilterLoadRoot from './FilterLoadRootComponent.js'
import twoLevelsHelper from '../twolevels.js'
import utils from './RootVueJsComponentUtil.js'

if (Vue) {

    const getEntriesForThisField = (entries,fieldName,test) => {
        return entries.filter(entry => {
            let entryValues = entry[fieldName]
            if (!entryValues || typeof entryValues != "string"){
                return
            }
            entryValues = entryValues.split(',')
            return test(entryValues)
        })
    }

    const getFieldFormRoot = (root,fieldName) => {
        if ('formFields' in root 
            && typeof root.formFields === 'object'
            && Object.keys(root.formFields).length > 0){
            if (fieldName in root.formFields){
                return root.formFields[fieldName]
            }
            for (const key in root.formFields) {
                if (Object.hasOwnProperty.call(root.formFields, key)) {
                    const field = root.formFields[key];
                    if ('name' in field && (
                                field.name === fieldName
                                || field.name === ('' + field.type + field.linkedObjectName + fieldName)
                            )
                        ){
                        return field
                    }
                }
            }
        }
        return null
    }

    const updateNbForEachFilter = (root,fieldName,availableEntriesForThisFilter) => {
        const filter = root.filters[fieldName]
        for (let option of (filter?.list ?? filter.nodes)) {
            if (typeof customCalculatebFromAvailableEntries == "function"){
                // allow usage of custom function if available
                root.$set(option,'nb',customCalculatebFromAvailableEntries(option,availableEntriesForThisFilter,root,fieldName))
            } else {
                root.$set(option,'nb',getEntriesForThisField(availableEntriesForThisFilter,fieldName,(values)=>values.some((value)=>value == option.value)).length)
            }
            root.$set(option,'count', option.nb)
        }
    }

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

    const updateVisibilityIfSublevel = (root) => {
        if (!utils.isSubLevel(root)){
            return
        }
        const optionData = utils.getOptionData(root)
        Object.entries(root.filters).forEach(([key,filter])=>{
            const fieldName = filter?.propName ?? key
            if (fieldName in optionData.options){
                const childField = optionData.options[fieldName]
                const parentFilter = getFilterFromPropName(childField?.parentId ?? '', root.filters)
                if (childField.parentId
                    && childField.parentId.length > 0
                    && childField.parentId in optionData.parents
                    && parentFilter){
                    const parentField = optionData.parents[childField.parentId]
                    const parentValues = (parentFilter?.list ?? parentFilter?.nodes ?? []).filter((option)=>option.checked).map(option=>option.value)
                    const parentValueIsChecked = (parentValue,option)=>{
                        return (parentValue in parentField.secondLevelValues)
                            ? parentField.secondLevelValues[parentValue].includes(option.value)
                            : false
                    }
                    for (let index = 0; index < (filter?.list ?? filter.nodes).length; index++) {
                        const option = (filter?.list ?? filter.nodes)[index]
                        option.hide = utils.canShowAnd(root)
                            ? !parentValues.every((parentValue)=>parentValueIsChecked(parentValue,option))
                            : !parentValues.some((parentValue)=>parentValueIsChecked(parentValue,option))
                    }
                }
            }
            if (fieldName in optionData.parents){
                for (let index = 0; index < (filter?.list ?? filter.nodes).length; index++) {
                    const option = (filter?.list ?? filter.nodes)[index]
                    option.forceShow = true
                }
            }
        })
    }

    const getCheckedFiltersWithMoreThanOne = (root) => {
        let modeThanOneCheckedFiltersName = [];
        for(let fieldName in root.filters) {
            const filter = root.filters[fieldName]
            for (let option of (filter?.list ?? filter.nodes)) {
                if (option.checked) {
                    if (!modeThanOneCheckedFiltersName.includes(fieldName)){
                        modeThanOneCheckedFiltersName.push(fieldName)
                    }
                }
            }
        }
        return modeThanOneCheckedFiltersName
    }

    const extractFormIdData = (fieldName,parentField,optionData) => {
        if (!('listOfAssociatingForms' in parentField)){
            parentField.listOfAssociatingForms = {}
        }
        parentField.childrenIds.forEach((id)=>{
            if (!(id in parentField.listOfAssociatingForms)){
                let associatingFormId = optionData.options[id].associatingFormId
                if (associatingFormId.length > 0){
                    parentField.listOfAssociatingForms[id] = {
                        childId:id,
                        id:associatingFormId,
                        isForm:optionData.options[id].isForm,
                        wantedFieldId:optionData.options[id].associatingFieldId
                    }
                }
            }
        })
        return parentField.listOfAssociatingForms?.[fieldName]
    }
    const updateSecondLevelValues = (value,filterId,filterOption,childField,parentField,secondLevelValues,formModified,associations) =>{
        const propName = filterOption?.name ?? filterId
        parentField.secondLevelValues[value] = secondLevelValues[propName]
        Object.entries(associations[propName]).forEach(([val,parentValue])=>{
            if (!(val in childField.associations)){
                childField.associations[val] = []
            }
            if (!childField.associations[val].includes(parentValue)){
                childField.associations[val].push(parentValue)
            }
        })
    }
    const canGetSecondValuesByForm = (parentField,formIdData) => {
        const res = parentField.isForm && (
                !(formIdData?.id?.length > 0) // no associatingForm => form
                || String(formIdData?.id) === String(parentField.linkedObjectId) // same as form for primary level
            )
        return res
    }

    const refreshOption = (filterId, filterOption,promisesData,root,optionData) => {
        const field = getFieldFormRoot(root,filterId)
        if (field !== null && Object.keys(field).length > 0
            && !(filterId in optionData.options)){
            // start refresh
            optionData.options[filterId] = {
                status: 'refreshing',
                linkedObjectId: '',
                associations: {}
            }
            optionData.options[filterId] = {
                ...optionData.options[filterId],
                ...twoLevelsHelper.formatChildField(field)
            }
            const childField = optionData.options[filterId]
            if ('parentFieldName' in childField && childField.parentFieldName.length > 0){
                twoLevelsHelper.formatParentField(
                    optionData.parents,
                    childField,
                    ()=>{
                        return getFieldFormRoot(root,childField.parentFieldName)
                    }
                )
                if (childField.parentId in optionData.parents){
                    const parentField = optionData.parents[childField.parentId]
                    parentField.secondLevelValues = {}
                    const optionsAsEntries = Object.entries(parentField.field.options)
                    for (let index = 0; index < optionsAsEntries.length; index++) {
                        const optionKey = optionsAsEntries[index][0]
                        const values = [optionKey]
                        const formIdData = extractFormIdData(filterId,parentField,optionData)
                        if (canGetSecondValuesByForm(parentField,formIdData)){
                            formPromisesManager.createPromise(promisesData,{
                                formId: parentField.linkedObjectId,
                                processFormAsync: async (form)=>{
                                    return twoLevelsHelper.getAvailableSecondLevelsValues(form,parentField,values,optionData.options)
                                        .then(([secondLevelValues,formModified,associations])=>{
                                            updateSecondLevelValues(optionKey,filterId,filterOption,childField,parentField,secondLevelValues,formModified,associations)
                                            return [secondLevelValues,formModified,associations]
                                        })
                                },
                                getEntriesAsync: ()=>{
                                    return twoLevelsHelper.getParentEntries(values)
                                },
                                getEntriesLabel: `getting parentEntries for ${JSON.stringify(values)}`}
                            )
                        } else {
                            const formId = formIdData.id
                            formPromisesManager.createPromise(promisesData,{
                                formId,
                                processFormAsync: async (form)=>{
                                    return twoLevelsHelper.getAvailableSecondLevelsValuesForLists(
                                        form,
                                        parentField.field.propertyname,
                                        parentField,
                                        values,
                                        formIdData,
                                        optionData.options,
                                        formIdData.isForm && formId === childField.linkedObjectId
                                    )
                                    .then(([secondLevelValues,formModified,associations])=>{
                                        updateSecondLevelValues(optionKey,filterId,filterOption,childField,parentField,secondLevelValues,formModified,associations)
                                        return [secondLevelValues,formModified,associations]
                                    })
                                },
                                getEntriesAsync: ()=>{
                                    return allEntriesLoader.load(formId)
                                },
                                getEntriesLabel: `getting all entries of form ${formId}`})
                        }
                    }
                }
            }
        }
    }
    const refreshOptionsAsync = async (root) => {
        try {
            const optionData = utils.getOptionData(root)
            if (!utils.isSubLevel(root)
                || Object.keys(optionData?.options ?? null).length > 0){
                return
            }
            const filters = root.filters // TODO check if get computedFilters
            let promisesData = formPromisesManager.initPromisesData()
            for (const filterId in filters) {
                if (Object.hasOwnProperty.call(filters, filterId)) {
                    const filter = filters[filterId];
                    (filter?.list ?? filter?.nodes).forEach((filterOption)=>{
                        const filterPropName = filterOption?.name ?? filter.propName
                        if (!(filterPropName in optionData.options)){
                            refreshOption(filterPropName,filterOption,promisesData,root,optionData)
                        }
                    })
                }
            }
            if (promisesData.promises.length > 0){
                await formPromisesManager.resolvePromises(promisesData)
                // something could have changes
                // trigger update entries
                root.filteredEntries = [...root.filteredEntries]
            }
            
            Object.keys(optionData.options).forEach((k)=>{
                optionData.options[k].status = 'done'
                // todo only update the right ones
            })

        } catch (error) {
            console.error(error)
        }
    }

    Vue.prototype.isDisplayedFilterOption = function(filterOption,root){
        return root.params.autohidefilter === "false" // main param
            || (!utils.canShowAnd(root) && filterOption.checked) // display if checked in all case
            || (root.params.keepallparents !== "false" && filterOption.forceShow === true) // display if parentField of sublevel
            || (filterOption.hide !== true && (filterOption?.nb ?? filterOption.count) > 0) // hide or at least one element
    }
    Vue.prototype.filterHasAtLeastOneOption = function(filter,root){
        if (typeof customfilterHasAtLeastOneOption == "function"){
            // allow usage of custom function if available
            return customfilterHasAtLeastOneOption(filter,root)
        } else {
            return (filter?.list ?? filter.nodes).some((filterOption)=>Vue.prototype.isDisplayedFilterOption(filterOption,root));
        }
    }
    Vue.component('FilterLoadRoot', FilterLoadRoot);
    Vue.prototype.refreshedFiltersWithentries = function(entries,root){
        refreshOptionsAsync(root)
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
                        availableEntriesForThisFilter = getEntriesForThisField(
                            availableEntriesForThisFilter,
                            otherFieldName,
                            (values)=>{
                                const filter = root.filters[otherFieldName]
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
            updateNbForEachFilter(root,fieldName,availableEntriesForThisFilter)
            updateVisibilityIfSublevel(root)
        }
        return root.filters;
    };
}