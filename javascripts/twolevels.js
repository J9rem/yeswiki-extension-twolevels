/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

let allEntriesCache = {}
let cache = {
    loadingAllEntries: [],
    loadingEntries: [],
    loadingForms: [],
    registeringCorrespondances: []
}
let correspondances = {}
let entries = {}
let eventsListeners = {}
let forms = {}

// event management 

const addEvent = (eventName, listener, once = false) => {
    if (typeof eventName == "string"){
        if (!(eventName in eventsListeners)){
            eventsListeners[eventName] = []
        }
        eventsListeners[eventName] = [
            ...eventsListeners[eventName],
            ...[{listener, once, triggered: false}]
        ]
    }
}
const addEventOnce = (eventName, listener) => {
    addEvent(eventName,listener,true)
}

const setEventTriggered = (eventName) => {
    if (typeof eventName == "string" && (eventName in eventsListeners)){
        eventsListeners[eventName] = eventsListeners[eventName].map((evenData)=>{
            evenData.triggered = true
            return evenData
        })
    }
}

const cleanEvent = (eventName)=>{
    eventsListeners[eventName] = eventsListeners[eventName].filter((eventData)=>{
        return !eventData.once || !eventData.triggered
    })
}

const dispatchEvent = (eventName, param = undefined)=>{
    if (typeof eventName == "string"){
        if (eventName in eventsListeners){
            eventsListeners[eventName].forEach((eventData,idx)=>{
                if (!eventData.once || !eventData.triggered){
                    eventsListeners[eventName][idx].triggered = true
                    if (param != undefined){
                        eventData.listener(param)
                    } else {
                        eventData.listener()
                    }
                }
            })
            cleanEvent(eventName)
        }
    }
}

// manage forms

const getPreparedFromForm = (form) => {
    return (Array.isArray(form.prepared))
    ? form.prepared
    : (
        typeof form.prepared == "object"
        ? Object.values(form.prepared)
        : []
    )
}

const appendChildrenFieldsPropertyNamestoParentForm = (form,parentField,linkedObjectIds,fromList = false) => {
    const formId = form.bn_id_nature
    if (!('childrenFieldsPropertyNames' in forms[formId])){
        forms[formId].childrenFieldsPropertyNames = {}
    }
    parentField.childrenIds.forEach((childId)=>{
        if (!(childId in forms[formId].childrenFieldsPropertyNames)){
            forms[formId].childrenFieldsPropertyNames[childId] = {}
            if (parentField.isForm
                || (childId in linkedObjectIds
                    && linkedObjectIds[childId].length > 0)){
                const wantedObjectName = (parentField.isForm && fromList) ? parentField.linkedObjectId : linkedObjectIds[childId]
                getPreparedFromForm(forms[formId]).forEach((field)=> {
                    if (["checkbox","checkboxfiche","radio","radiofiche","liste","listefiche","enumlevel2"]
                        .includes(field.type) && field.linkedObjectName == wantedObjectName){
                        forms[formId].childrenFieldsPropertyNames[childId][field.propertyname] = field
                    }
                })
            }
        }
    })
    return forms[formId]
}

const appendParentsFieldsPropertyNamestoParentForm = (form,fieldName,parentField) =>{
    const formId = form.bn_id_nature
    if (!('parentsFieldsPropertyNames' in forms[formId])){
        form.parentsFieldsPropertyNames = {}
    }

    if (fieldName && fieldName.length > 0 && 
        !(fieldName in forms[formId].parentsFieldsPropertyNames)){
            forms[formId].parentsFieldsPropertyNames[fieldName] = {}
        const isList = (type) => {
            return ["checkbox","radio","liste"].includes(type)
        }
        const isEntry = (type) => {
            return ["checkboxfiche","radiofiche","listefiche"].includes(type)
        }
        const isEnum2Level = (field,wantedType = '') => {
            return field.type == "enumlevel2" && (
                wantedType == '' || (
                    'displayMethod' in field && (
                    (wantedType == 'list')
                    ? isList(field.displayMethod)
                    : isEntry(field.displayMethod)
                ))
            )
        }
        const isEnum = (field) => {
            return isList(field.type) || isEntry(field.type) || isEnum2Level(field)
        }
        getPreparedFromForm(forms[formId]).forEach((field)=> {
            const isEnumList = isList(field.type) || isEnum2Level(field,'list')
            if ((isEnum(field) && field.linkedObjectName == parentField.linkedObjectId) ||
                (isEnumList && parentField.linkedObjectId.slice(0,field.linkedObjectName.length) == field.linkedObjectName)){
                    forms[formId].parentsFieldsPropertyNames[fieldName][field.propertyname] = field
            }
        })
    }
    return forms[formId]
}

const appendReverseChildrenFieldsPropertyNamestoParentForm = (form,parentField) => {
    const formId = form.bn_id_nature
    if (!('reverseChildrenFieldsPropertyNames' in forms[formId])){
        forms[formId].reverseChildrenFieldsPropertyNames = {}
    }
    parentField.childrenIds.forEach((childId)=>{
        if (!(childId in forms[formId].reverseChildrenFieldsPropertyNames)){
            forms[formId].reverseChildrenFieldsPropertyNames[childId] = {'id_fiche':'id_fiche'}
        }
    })
    return forms[formId]
}
const appendReverseParentsFieldsPropertyNamestoParentForm = (form,fieldName,parentField) =>{
    const formId = form.bn_id_nature
    if (!('reverseParentsFieldsPropertyNames' in forms[formId])){
        forms[formId].reverseParentsFieldsPropertyNames = {}
    }
    const childId = parentField.linkedObjectId
    if (childId.length > 0 && !(fieldName in forms[formId].reverseParentsFieldsPropertyNames)){
        forms[formId].reverseParentsFieldsPropertyNames[fieldName] = {}
        getPreparedFromForm(forms[formId]).forEach((field)=> {
            if (["checkbox","checkboxfiche","radio","radiofiche","liste","listefiche","enumlevel2"]
                .includes(field.type) && field.linkedObjectName == childId){
                    forms[formId].reverseParentsFieldsPropertyNames[fieldName][field.propertyname] = field
            }
        })
    }
    return forms[formId]
}

const appendToArrayIfInEntry = (entry,propName,currentArray,registerAssociation = null)=>{
    if (propName in entry && 
            typeof entry[propName] == "string" && 
            entry[propName].length > 0){ 
        entry[propName].split(',').forEach((value)=>{
            if (!currentArray.includes(value)){
                currentArray.push(value)
            }
            if (typeof registerAssociation === 'function'){
                registerAssociation(value)
            }
        })
    }
    return currentArray
}

const assertIsRegularFormId = (formId) => {
    if (typeof formId != "string" || formId.length == 0 || Number(formId) < 1){
        throw `'formId' as parameter as 'getForm' should be a not empty string representing a postive integer`
    }
}
const assertIsRegularEntryId = (entryId)=>{
    if (typeof entryId != "string" || entryId.length == 0 || String(Number(entryId)) === entryId){
        throw `'entryId' as parameter as 'assertIsRegularEntryId' should be a not empty string and not representing a form number`
    }
}

const extractLinkedObjects = (data) => {
    return Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.linkedObjectId]))
}

const formatChildField = (field) => {
    return {
        parentFieldName: field.parentFieldName || '',
        fieldName: field.name || '',
        associatingFormId: field.associatingFormId || '',
        associatingFieldId: field.associatingFieldId || '',
        isForm: (field.associatingFormId == field.linkedObjectName || !field.linkedObjectName.match(/^Liste/)),
        field,
        linkedObjectId: field.linkedObjectName || '',
        type: field.type || '',
        parentId: field.parentFieldName || '',
        propertyname: field.propertyname
    }
}

const formatParentField = (parentsContainer,childField,findFieldFunction) => {
    if (childField.parentId.length > 0){
        if (!(childField.parentId in parentsContainer)){
            if (typeof findFieldFunction === 'function'){
                const field = findFieldFunction()
                if (typeof field === "object" && field !== null && Object.keys(field).length > 0 && 'propertyname' in field){
                    if (!(field.propertyname in parentsContainer)){
                        parentsContainer[field.propertyname] = {
                            type: field.type,
                            node: 'node' in field ? field.node : null,
                            nodes: 'nodes' in field ? field.nodes : null,
                            linkedObjectId: field.linkedObjectName ?? field.linkedObjectId,
                            childrenIds: [],
                            field
                        }
                        parentsContainer[field.propertyname].isForm = !parentsContainer[field.propertyname].linkedObjectId.match(/^Liste/)
                    }
                    childField.parentId = field.propertyname
                }
            }
        }
        if (childField.parentId in parentsContainer){
            const parentField = parentsContainer[childField.parentId]
            if (!parentField.childrenIds.includes(childField.propertyname)){
                parentField.childrenIds.push(childField.propertyname)
            }
        }
    }
}

const manageInternalEvents = async(id,eventPrefix,loadingCacheName,asynFunc)=>{
    let p = new Promise((resolve,reject)=>{
        addEventOnce(`${eventPrefix}.${id}.ready`,()=>resolve())
        addEventOnce(`${eventPrefix}.${id}.error`,(e)=>reject(e))
        if (!cache[loadingCacheName].includes(id)){
            cache[loadingCacheName] = [...cache[loadingCacheName],id]
            let resettingLoadingForms = ()=>{
                cache[loadingCacheName] = cache[loadingCacheName].filter((idToCheck)=>idToCheck!=id)
            }
            addEventOnce(`${eventPrefix}.${id}.error`,resettingLoadingForms)
            addEventOnce(`${eventPrefix}.${id}.ready`,resettingLoadingForms)
            addEventOnce(`${eventPrefix}.${id}.ready`,()=>{
                setEventTriggered(`${eventPrefix}.${id}.error`)
            })
            asynFunc()
                .then((...args)=>{
                    dispatchEvent(`${eventPrefix}.${id}.ready`)
                    return Promise.resolve(...args)
                })
                .catch((e)=>{dispatchEvent(`${eventPrefix}.${id}.error`,e)})
        }
    })
    return await p.then((...args)=>Promise.resolve(...args))
}

const getData = async (url,id,eventPrefix,loadingCacheName,testFunction) => {
    if (typeof testFunction != "function"){
        throw "'testFunction' should be a function"
    }
    return await manageInternalEvents(id,eventPrefix,loadingCacheName,async ()=>{
        return fetch(url)
            .then((response)=>{
                if (!response.ok){
                    throw `response not ok when fetching ${url}`
                } else {
                    return response.json()
                }
            })
            .then((responseDecoded)=>{
                if (!testFunction(responseDecoded)){
                    throw 'response badly formatted'
                }
                return responseDecoded
            })
    }).then((form)=>{return form})
}

const getAllEntries = async (formId) => {
    assertIsRegularFormId(formId)
    if (formId in allEntriesCache){
        return allEntriesCache[formId]
    } else {
        return await getData(wiki.url(`?api/forms/${formId}/entries`),formId,'getAllEntries','loadingAllEntries',(responseDecoded)=>{
                if (typeof responseDecoded == "object"||
                    Array.isArray(responseDecoded)){
                        
                    let entriesInt = (typeof responseDecoded == "object")
                        ? Object.values(responseDecoded)
                        : responseDecoded
                    entriesInt = entriesInt.filter((e)=>{
                        return typeof e.id_fiche === "string" &&
                            typeof e.id_typeannonce === "string" &&
                            typeof e.bf_titre === "string"
                    })
                    entriesInt.forEach((e)=>{
                        if (!(e.id_fiche in entries)){
                            entries[e.id_fiche] = e
                        }
                    })
                    allEntriesCache[formId] = entriesInt
                    return true
                } else {
                    return false
                }
            }).then(()=>{
                if (formId in allEntriesCache){
                    return allEntriesCache[formId]
                } else {
                    throw `allEntriesCache '${formId}' not found in 'allEntriesCache (${JSON.stringify(Object.keys(allEntriesCache))})`
                }
            })
            .catch((e)=>{throw `error when getting all Entries for '${formId}'`+(e!=undefined ? ` : ${(e)}`:'')})
    }
}

const getEntry = async (entryId) => {
    assertIsRegularEntryId(entryId)
    if (entryId in entries){
        return entries[entryId]
    } else {
        return await getData(wiki.url(`?api/entries/json/${entryId}`),entryId,'getEntry','loadingEntries',(responseDecoded)=>{
                if (responseDecoded && typeof responseDecoded == "object"){
                    let firstValue = Object.values(responseDecoded)[0]
                    if ('id_fiche' in firstValue &&
                        firstValue.id_fiche == entryId){
                        entries[entryId] = firstValue
                        return true
                    } else {
                        return false
                    }
                } else {
                    return false
                }
            }).then(()=>{
                if (entryId in entries){
                    return entries[entryId]
                } else {
                    throw `entryId '${entryId}' not found in 'entries (${JSON.stringify(Object.keys(entries))})`
                }
            })
            .catch((e)=>{throw `error when getting entry '${entryId}'`+(e!=undefined ? ` : ${(e)}`:'')})
    }
}

const getParentEntries = async (entriesIds)=>{
    if (entriesIds.length == 0){
        return []
    }
    let promises = []
    let promisesLabel = []
    for (let entryId of entriesIds){
        promises.push(
            new Promise((resolve,reject)=>{
                getEntry(entryId).then((entry)=>{
                    resolve(entry)
                })
                .catch((e)=>{
                    reject(e)
                })
            })
        )
        promisesLabel.push(`getting entry ${entryId}`)
    }
    return await Promise.allSettled(promises).then((promisesStatus)=>{
        promisesStatus.forEach((p,idx)=>{
            if (p.status != "fulfilled"){
                console.warn(`error : ${p.reason} (when ${promisesLabel[idx]})`)
            }
        })
        return promisesStatus.filter((p)=>p.status=="fulfilled").map((p)=>p.value)
    })
}
const getAvailableSecondLevelsValues = async (parentForm,parentField,values,linkedObjectIdsCache) =>{
    parentForm = appendChildrenFieldsPropertyNamestoParentForm(parentForm,parentField,extractLinkedObjects(linkedObjectIdsCache),false)
    return await getParentEntries(values).then(()=>{
        let secondLevelValues = {}
        let associations = {}
        parentField.childrenIds.forEach((childId)=>{
            secondLevelValues[childId] = []
            associations[childId] = []
            if (childId in parentForm.childrenFieldsPropertyNames){
                values.forEach((parentEntryId)=>{
                    if (parentEntryId in entries){
                        let parentEntry = entries[parentEntryId]
                        for (let propName in parentForm.childrenFieldsPropertyNames[childId]){
                            secondLevelValues[childId] = appendToArrayIfInEntry(parentEntry,propName,secondLevelValues[childId],(value)=>{
                                if (!(value in associations[childId])){
                                    associations[childId][value] = []
                                }
                                if (!associations[childId][value].includes(parentEntryId)){
                                    associations[childId][value].push(parentEntryId)
                                }
                            })
                        }
                    }
                })
            }
        })
        return [secondLevelValues,parentForm,associations]
    })
}


const registerCorrespondances = async (formId,fieldName,asyncFunc)=>{
    if (formId in correspondances && fieldName in correspondances[formId]){
        return correspondances[formId][fieldName]
    }
    return await manageInternalEvents(`${formId}-${fieldName}`,'registerCorrespondances','registeringCorrespondances',asyncFunc).then((...args)=>{
        if (formId in correspondances){
            if (fieldName in correspondances[formId]){
                return correspondances[formId][fieldName]
            } else {
                throw `correspondances[${formId}] should contain key '${fieldName}'at this state !`
            }
        } else {
            throw `correspondances should contain key '${formId}'at this state !`
        }
    })
}

const getCorrespondancesCommon = async ({associatingForm,fieldName,getParentsAndChildren}) =>{
    if (associatingForm.bn_id_nature in correspondances && fieldName in correspondances[associatingForm.bn_id_nature]){
        return correspondances[associatingForm.bn_id_nature][fieldName]
    } else {
        return await getAllEntries(associatingForm.bn_id_nature)
            .then((entries)=>registerCorrespondances(associatingForm.bn_id_nature,fieldName,async ()=>{
                    let entries = allEntriesCache[associatingForm.bn_id_nature] || []
                    if (entries.length == 0){
                        console.log(`entries should not be empty`)
                    }
                    let correspondancesInt = 
                        (associatingForm.bn_id_nature in correspondances && 
                            fieldName in correspondances[associatingForm.bn_id_nature])
                        ? correspondances[associatingForm.bn_id_nature][fieldName]
                        : []
                    entries.forEach((e)=>{
                        let tmp = {
                            parents: [],
                            children: {}
                        }
                        getParentsAndChildren(tmp,e)
                        tmp.parents.forEach((p)=>{
                            if (!(p in correspondancesInt)){
                                correspondancesInt[p] = {}
                            }
                            for (const childId in tmp.children) {
                                if (!(childId in correspondancesInt[p])){
                                    correspondancesInt[p][childId] = []
                                }
                                tmp.children[childId].forEach((val)=>{
                                    if (!correspondancesInt[p][childId].includes(val)){
                                        correspondancesInt[p][childId] = [...correspondancesInt[p][childId],val]
                                    }
                                })
                            }
                            
                        })
                    })
                    if (!(associatingForm.bn_id_nature in correspondances)){
                        correspondances[associatingForm.bn_id_nature] = {}
                    }
                    correspondances[associatingForm.bn_id_nature][fieldName] = correspondancesInt
                    return correspondancesInt
                })
            )
    }
}

const getCorrespondances = async (associatingForm,fieldName) => {
    return await getCorrespondancesCommon({
        associatingForm,
        fieldName,
        getParentsAndChildren:(tmp,entry)=>{
            for (const propertyName in associatingForm.parentsFieldsPropertyNames[fieldName]) {
                tmp.parents = appendToArrayIfInEntry(entry,propertyName,tmp.parents)
            }
            for (const childId in associatingForm.childrenFieldsPropertyNames) {
                tmp.children[childId] = []
                for (const propertyName in associatingForm.childrenFieldsPropertyNames[childId]) {
                    tmp.children[childId] = appendToArrayIfInEntry(entry,propertyName,tmp.children[childId])
                }
            }
        }
    })
}
const getCorrespondancesReverse = async (associatingForm,fieldName,wantedFieldId = '',wantedchildId = '')=>{
    
    return await getCorrespondancesCommon({
        associatingForm,
        fieldName,
        getParentsAndChildren:(tmp,entry)=>{
            if (typeof wantedFieldId == 'string' && wantedFieldId.length > 0){
                const foundFields = Object.keys(associatingForm.reverseParentsFieldsPropertyNames[fieldName]).filter((k)=>{
                    return k == wantedFieldId || associatingForm.reverseParentsFieldsPropertyNames[fieldName][k].name == wantedFieldId
                })
                foundFields.forEach((k)=>{
                    tmp.parents = appendToArrayIfInEntry(entry,k,tmp.parents)
                })
            } else {
                for (const propertyName in associatingForm.reverseParentsFieldsPropertyNames[fieldName]) {
                    tmp.parents = appendToArrayIfInEntry(entry,propertyName,tmp.parents)
                }
            }
            
            let wantedIds = Object.keys(associatingForm.reverseChildrenFieldsPropertyNames)
            if (typeof wantedchildId == 'string' && wantedchildId.length > 0 && wantedIds.includes(wantedchildId)){
                wantedIds = [wantedchildId]
            }
            wantedIds.forEach((childId)=>{
                tmp.children[childId] = []
                for (const propertyName in associatingForm.reverseChildrenFieldsPropertyNames[childId]) {
                    tmp.children[childId] = appendToArrayIfInEntry(entry,propertyName,tmp.children[childId])
                }
            })
        }
    })
}
const getAvailableSecondLevelsValuesForLists = async (associatingForm,fieldName,parentField,values,formData,linkedObjectIdsCache)=>{
    const reverseMode = formData.isForm
    let correspondances = null
    let propNames = {}
    if (!reverseMode){
        associatingForm = appendChildrenFieldsPropertyNamestoParentForm(associatingForm,parentField,extractLinkedObjects(linkedObjectIdsCache),true)
        associatingForm = appendParentsFieldsPropertyNamestoParentForm(associatingForm,fieldName,parentField)
        correspondances = await getCorrespondances(associatingForm,fieldName,parentField)
        propNames = associatingForm.childrenFieldsPropertyNames
    } else {
        associatingForm = appendReverseParentsFieldsPropertyNamestoParentForm(associatingForm,fieldName,parentField)
        associatingForm = appendReverseChildrenFieldsPropertyNamestoParentForm(associatingForm,parentField)
        correspondances = await getCorrespondancesReverse(associatingForm,fieldName,formData.wantedFieldId,formData.childId)
        propNames = associatingForm.reverseChildrenFieldsPropertyNames
    }
    let secondLevelValues = {}
    let associations = {}
    parentField.childrenIds.forEach((childId)=>{
        if (formData.childId == childId){
            secondLevelValues[childId] = []
            associations[childId] = {}
            if (childId in propNames){
                values.forEach((parentValue)=>{
                    if (parentValue in correspondances && childId in correspondances[parentValue]){
                        const childValues = correspondances[parentValue][childId]
                        secondLevelValues[childId] = [
                                ...secondLevelValues[childId],
                                ...childValues
                            ]
                            childValues.forEach((value)=>{
                            if (!(value in associations[childId])){
                                associations[childId][value] = []
                            }
                            if (!associations[childId][value].includes(parentValue)){
                                associations[childId][value].push(parentValue)
                            }
                        })
                    }
                })
            }
        }
    })
    return [secondLevelValues,associatingForm,associations]
}

const getForm = async (formId) => {
    assertIsRegularFormId(formId)
    if (formId in forms){
        return forms[formId]
    } else {
        return await getData(wiki.url(`?api/forms/${formId}`),formId,'getForm','loadingForms',(responseDecoded)=>{
                if (responseDecoded && ('bn_id_nature' in responseDecoded) &&
                    responseDecoded.bn_id_nature == formId){
                    forms[formId] = responseDecoded
                    return true
                } else {
                    return false
                }
            }).then(()=>{
                if (formId in forms){
                    return forms[formId]
                } else {
                    throw `formId '${formId}' not found in 'forms (${JSON.stringify(Object.keys(forms))})`
                }
            })
            .catch((e)=>{throw `error when getting form '${formId}'`+(e!=undefined ? ` : ${(e)}`:'')})
    }
}

// manage promise
const initPromisesData = () => {
    return {
        promises: [],
        promisesLabel: []
    }
}

const createPromise = (promisesData,{formId,processFormAsync,getEntriesAsync,getEntriesLabel}) => {
    // get form
    promisesData.promises.push(new Promise((resolve,reject)=>{
        getForm(formId).then((form)=>{
            processFormAsync(form).then(([,formModified,])=>{
                resolve(formModified)
            })
            .catch((e)=>reject(e))
        })
        .catch((e)=>{
            reject(e)
        })
    }))
    promisesData.promisesLabel.push(`getting form ${formId}`)
    // start getting entries in parallel of form
    promisesData.promises.push(
        new Promise((resolve,reject)=>{
            getEntriesAsync().then((entries)=>{
                resolve(entries)
            })
            .catch((e)=>{
                reject(e)
            })
        })
    )
    promisesData.promisesLabel.push(getEntriesLabel)
}

const resolvePromises = async (promisesData) => {
    return await Promise.allSettled(promisesData.promises).then((promisesStatus)=>{
        promisesStatus.forEach((p,idx)=>{
            if (p.status != "fulfilled"){
                console.warn(`error : ${p.reason} (when ${promisesData.promisesLabel[idx]})`)
                console.error({error:p.reason})
            }
        })
        return promisesStatus
    })
}

export default {
    createPromise,
    formatChildField,
    formatParentField,
    getAllEntries,
    getAvailableSecondLevelsValues,
    getAvailableSecondLevelsValuesForLists,
    getParentEntries,
    initPromisesData,
    resolvePromises
}