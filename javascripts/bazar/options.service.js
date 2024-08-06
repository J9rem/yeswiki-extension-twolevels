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
import twoLevelsHelper from '../twolevels.js'
import fieldService from './field.service.js'
import filtersService from './filters.service.js'
import utils from './RootVueJsComponentUtil.js'

const updateSecondLevelValues = (value,filterId,filterOption,childField,parentField,secondLevelValues,associations) =>{
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

const createPromiseForForm = (promisesData, parentField, filterId, filterOption, childField, values, optionData, optionKey) => {
    formPromisesManager.createPromise(promisesData,{
        formId: parentField.linkedObjectId,
        processFormAsync: async (form)=>{
            return twoLevelsHelper.getAvailableSecondLevelsValues(form,parentField,values,optionData.options)
                .then(([secondLevelValues,formModified,associations])=>{
                    updateSecondLevelValues(optionKey,filterId,filterOption,childField,parentField,secondLevelValues,associations)
                    return [secondLevelValues,formModified,associations]
                })
        },
        getEntriesAsync: ()=>{
            return twoLevelsHelper.getParentEntries(values)
        },
        getEntriesLabel: `getting parentEntries for ${JSON.stringify(values)}`}
    )
}

const createPromiseForList = (promisesData, formIdData, parentField, filterId, filterOption, childField, values, optionData, optionKey) => {
    
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
                updateSecondLevelValues(optionKey, filterId, filterOption, childField, parentField, secondLevelValues,associations)
                return [secondLevelValues,formModified,associations]
            })
        },
        getEntriesAsync: ()=>{
            return allEntriesLoader.load(formId)
        },
        getEntriesLabel: `getting all entries of form ${formId}`})
}

const refreshOption = (filterId, filterOption,promisesData,root,optionData) => {
    const field = utils.getFieldFromRoot(root,filterId)
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
                    return utils.getFieldFromRoot(root,childField.parentFieldName)
                }
            )
            if (childField.parentId in optionData.parents){
                const parentField = optionData.parents[childField.parentId]
                parentField.secondLevelValues = {}
                const optionsAsEntries = Object.entries(parentField.field.options)
                for (let index = 0; index < optionsAsEntries.length; index++) {
                    const optionKey = optionsAsEntries[index][0]
                    const values = [optionKey]
                    const formIdData = fieldService.extractFormIdData(filterId,parentField,optionData)
                    if (fieldService.canGetSecondValuesByForm(parentField,formIdData)){
                        createPromiseForForm(promisesData, parentField, filterId, filterOption, childField, values, optionData, optionKey)
                    } else {
                        createPromiseForList(promisesData, formIdData, parentField, filterId, filterOption, childField, values, optionData, optionKey)
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
                    const filterPropName = filtersService.getFieldName(filter,filterOption)
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

export default {
    refreshOptionsAsync
}