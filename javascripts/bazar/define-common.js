/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import twoLevelsHelper from '../twolevels.js'

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

    const refreshOptionCache = {
        options: {},
        parents: {},
        levels2: {}
    }
    const getSanitizedIds = (root) => {
        if (!('ids' in refreshOptionCache)){
            refreshOptionCache.ids = (typeof root.params.id === 'string'
             ? root.params.id.split(',')
             : root.params.id).filter((id)=>(typeof id === 'string') && String(Number(id)) === String(id) && Number(id) > 0)
        }
        return refreshOptionCache.ids
    }
    const findField = async (searchedPropertyName,root) => {
        const formsIds = getSanitizedIds(root)
        let form = null
        let field = null
        // async some
        for (let index = 0; index < formsIds.length; index++) {
            if (form === null){
                form = await twoLevelsHelper.getForm(formsIds[index]).catch((e)=>{
                    console.error(e)
                    return {}
                })
                if (!('prepared' in form)){
                    form = null
                } else {
                    if (!form.prepared.some((fieldFromForm)=>{
                        if (field === null && 'propertyname' in fieldFromForm && fieldFromForm.propertyname == searchedPropertyName){
                            field = fieldFromForm
                        }
                        return (field !== null)
                    })){
                        form = null
                    }
                }
            }
        }
        return {field,form}
    }
    const registerParent = (field,form) => {
        if (!(field.parentFieldName in refreshOptionCache.parents)){
            let searchField = null
            form.prepared.some((fieldFromForm)=>{
                if ('propertyname' in fieldFromForm 
                    && (fieldFromForm.propertyname === field.parentFieldName
                     || fieldFromForm.name === field.parentFieldName)){
                    searchField = fieldFromForm
                    return true
                }
                return false
            })
            refreshOptionCache.parents[field.parentFieldName] = {
                field: searchField,
                childrenIds: [],
                type: searchField.type ?? '',
                linkedObjectId: searchField.linkedObjectName ?? '',
                secondLevelValues:{}
            }
        }
        const fieldData = refreshOptionCache.parents[field.parentFieldName]
        if (!fieldData.childrenIds.includes(field.propertyname)){
            fieldData.childrenIds.push(field.propertyname)
        }
        return fieldData
    }
    const extractFormIdData = (fieldName,parentField) => {
        if (!('listOfAssociatingForms' in parentField)){
            parentField.listOfAssociatingForms = {}
        }
        parentField.childrenIds.forEach((id)=>{
            if (!(id in parentField.listOfAssociatingForms)){
                let associatingFormId = refreshOptionCache.options[id].associatingFormId
                if (associatingFormId.length > 0){
                    parentField.listOfAssociatingForms[id] = {
                        childId:id,
                        id:associatingFormId,
                        isForm:refreshOptionCache.options[id].isForm,
                        wantedFieldId:refreshOptionCache.options[id].associatingFieldId
                    }
                }
            }
        })
        return parentField.listOfAssociatingForms[fieldName]
    }
    const refreshOptionAsync = async (filterOption,root) => {
        try {
            if (root.params.intrafiltersmode === 'sublevel'){
                if (!(filterOption.name in refreshOptionCache.options)){
                    // start refresh
                    refreshOptionCache.options[filterOption.name] = {
                        status: 'refreshing',
                        linkedObjectId: '',
                        associations: {}
                    }
                    const fieldData = refreshOptionCache.options[filterOption.name]
                    const {field,form} = await findField(filterOption.name,root)
                    if (field !== null){
                        fieldData.field = field
                        fieldData.type = field.type
                        fieldData.linkedObjectId = field.linkedObjectName
                        if ('parentFieldName' in field && field.parentFieldName.length > 0){
                            fieldData.associatingFormId = field.associatingFormId
                            fieldData.associatingFieldId = field.associatingFieldId
                            fieldData.isForm = (field.associatingFormId.length === 0)
                            const parentField = registerParent(field,form)
                            if (parentField.field){
                                fieldData.parentId = parentField.field.propertyname
                                const optionsAsEntries = Object.entries(parentField.field.options)
                                for (let index = 0; index < optionsAsEntries.length; index++) {
                                    const optionKey = optionsAsEntries[index][0]
                                    // const optionVal = optionsAsEntries[index][1]
                                    const [secondLevelValues,,associations] = (field.type.match(/fiche$/))
                                        ? await twoLevelsHelper.getAvailableSecondLevelsValues(form,parentField,[optionKey],refreshOptionCache.options)
                                        : await twoLevelsHelper.getAvailableSecondLevelsValuesForLists(
                                            form,
                                            parentField.field.propertyname,
                                            parentField,
                                            [optionKey],
                                            extractFormIdData(filterOption.name,parentField),
                                            refreshOptionCache.options
                                        )
                                    parentField.secondLevelValues[filterOption.name] = secondLevelValues[filterOption.name]
                                    Object.entries(associations[filterOption.name]).forEach(([val,parentValue])=>{
                                        if (!(val in fieldData.associations)){
                                            fieldData.associations[val] = []
                                        }
                                        if (!fieldData.associations[val].includes(parentValue)){
                                            fieldData.associations[val].push(parentValue)
                                        }
                                    })
                                    // todo refresh entries if somethinf changes
                                }
                            }
                        }
                    }
                    fieldData.status = 'done'
                }
            }
        } catch (error) {
            console.error(error)
        }
    }

    Vue.prototype.isDisplayedFilterOption = function(filterOption,root){
        refreshOptionAsync(filterOption,root)
        return root.params.autohidefilter === "false" ||
            (!canShowAnd(root) && filterOption.checked) 
            || (filterOption.hide !== true && filterOption.nb > 0)
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
            // todo update filter visibility according to sublevel
        }
        return root.filters;
    };
}