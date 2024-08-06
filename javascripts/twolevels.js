/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import eventDispatcher from './eventDispatcher.service.js'
import allEntriesLoader from './allEntriesLoader.service.js'
import entryLoader from './entryLoader.service.js'

let correspondances = {}
let parentEntries = {}

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
    if (!('childrenFieldsPropertyNames' in form)){
        form.childrenFieldsPropertyNames = {}
    }
    parentField.childrenIds.forEach((childId)=>{
        if (!(childId in form.childrenFieldsPropertyNames)){
            form.childrenFieldsPropertyNames[childId] = {}
            if (parentField.isForm
                || (childId in linkedObjectIds
                    && linkedObjectIds[childId].length > 0)){
                const wantedObjectName = (parentField.isForm && fromList) ? parentField.linkedObjectId : linkedObjectIds[childId]
                getPreparedFromForm(form).forEach((field)=> {
                    if (["checkbox","checkboxfiche","radio","radiofiche","liste","listefiche","enumlevel2"]
                        .includes(field.type) && field.linkedObjectName == wantedObjectName){
                        form.childrenFieldsPropertyNames[childId][field.propertyname] = field
                        const oldName = `${field.type}${field.linkedObjectName}`
                        if (field.propertyname.slice(0,oldName.length) !== oldName){
                            form.childrenFieldsPropertyNames[childId][field.propertyname].oldName = oldName + field.name
                        }
                    }
                })
            }
        }
    })
    return form
}

const appendParentsFieldsPropertyNamestoParentForm = (form,fieldName,parentField) =>{
    if (!('parentsFieldsPropertyNames' in form)){
        form.parentsFieldsPropertyNames = {}
    }

    if (fieldName && fieldName.length > 0 && 
        !(fieldName in form.parentsFieldsPropertyNames)){
            form.parentsFieldsPropertyNames[fieldName] = {}
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
        getPreparedFromForm(form).forEach((field)=> {
            const isEnumList = isList(field.type) || isEnum2Level(field,'list')
            if ((isEnum(field) && field.linkedObjectName == parentField.linkedObjectId) ||
                (isEnumList && parentField.linkedObjectId.slice(0,field.linkedObjectName.length) == field.linkedObjectName)){
                    form.parentsFieldsPropertyNames[fieldName][field.propertyname] = field
                    const oldName = `${field.type}${field.linkedObjectName}`
                    if (field.propertyname.slice(0,oldName.length) !== oldName){
                        form.parentsFieldsPropertyNames[fieldName][field.propertyname].oldName = oldName + field.name
                    }
            }
        })
    }
    return form
}

const appendReverseChildrenFieldsPropertyNamestoParentForm = (form,parentField) => {
    if (!('reverseChildrenFieldsPropertyNames' in form)){
        form.reverseChildrenFieldsPropertyNames = {}
    }
    parentField.childrenIds.forEach((childId)=>{
        if (!(childId in form.reverseChildrenFieldsPropertyNames)){
            form.reverseChildrenFieldsPropertyNames[childId] = {'id_fiche':'id_fiche'}
        }
    })
    return form
}
const appendReverseParentsFieldsPropertyNamestoParentForm = (form,fieldName,parentField) =>{
    if (!('reverseParentsFieldsPropertyNames' in form)){
        form.reverseParentsFieldsPropertyNames = {}
    }
    const childId = parentField.linkedObjectId
    if (childId.length > 0 && !(fieldName in form.reverseParentsFieldsPropertyNames)){
        form.reverseParentsFieldsPropertyNames[fieldName] = {}
        getPreparedFromForm(form).forEach((field)=> {
            if (["checkbox","checkboxfiche","radio","radiofiche","liste","listefiche","enumlevel2"]
                .includes(field.type) && field.linkedObjectName == childId){
                    form.reverseParentsFieldsPropertyNames[fieldName][field.propertyname] = field
                    const oldName = `${field.type}${field.linkedObjectName}${field.name}`
                    if (oldName?.length > field.propertyname?.length){
                        form.reverseParentsFieldsPropertyNames[fieldName][field.propertyname].oldName = oldName
                    }
            }
        })
    }
    return form
}

const appendToArrayIfInEntry = (entry,propName,currentArray,oldPropName = '',registerAssociation = null)=>{
    const sanitizedPropName = propName in entry ? propName : oldPropName
    if (sanitizedPropName in entry && 
            typeof entry[sanitizedPropName] == "string" && 
            entry[sanitizedPropName].length > 0){ 
        entry[sanitizedPropName].split(',').forEach((value)=>{
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

const getParentEntries = async (entriesIds)=>{
    if (entriesIds.length == 0){
        return []
    }
    let promises = []
    let promisesLabel = []
    for (let entryId of entriesIds){
        promises.push(
            new Promise((resolve,reject)=>{
                entryLoader.load(entryId).then((entry)=>{
                    parentEntries[entryId] = entry
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
                        let parentEntry = parentEntries[parentEntryId]
                        for (let propName in parentForm.childrenFieldsPropertyNames[childId]){
                            secondLevelValues[childId] = appendToArrayIfInEntry(
                                parentEntry,
                                propName,
                                secondLevelValues[childId],
                                parentForm.childrenFieldsPropertyNames[childId][propName]?.oldName ?? '',
                                (value)=>{
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
    return await eventDispatcher.manageInternalEvents(`${formId}-${fieldName}`,'registerCorrespondances','registeringCorrespondances',asyncFunc).then((...args)=>{
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
        return await allEntriesLoader.load(associatingForm.bn_id_nature)
            .then((entries)=>registerCorrespondances(associatingForm.bn_id_nature,fieldName,async ()=>{
                    if (Object.keys(entries).length == 0){
                        console.log(`entries should not be empty`)
                    }
                    let correspondancesInt = 
                        (associatingForm.bn_id_nature in correspondances && 
                            fieldName in correspondances[associatingForm.bn_id_nature])
                        ? correspondances[associatingForm.bn_id_nature][fieldName]
                        : []
                    Object.values(entries).forEach((e)=>{
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
                tmp.parents = appendToArrayIfInEntry(
                    entry,
                    propertyName,
                    tmp.parents,
                    associatingForm.parentsFieldsPropertyNames[fieldName][propertyName]?.oldName ?? ''
                )
            }
            for (const childId in associatingForm.childrenFieldsPropertyNames) {
                tmp.children[childId] = []
                for (const propertyName in associatingForm.childrenFieldsPropertyNames[childId]) {
                    tmp.children[childId] = appendToArrayIfInEntry(
                        entry,
                        propertyName,
                        tmp.children[childId],
                        associatingForm.childrenFieldsPropertyNames[childId][propertyName]?.oldName ?? ''
                    )
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
                    tmp.parents = appendToArrayIfInEntry(
                        entry,
                        k,
                        tmp.parents,
                        foundFields[k]?.oldName ?? ''
                    )
                })
            } else {
                for (const propertyName in associatingForm.reverseParentsFieldsPropertyNames[fieldName]) {
                    tmp.parents = appendToArrayIfInEntry(
                        entry,
                        propertyName,
                        tmp.parents,
                        associatingForm.reverseParentsFieldsPropertyNames[fieldName][propertyName]?.oldName ?? ''
                    )
                }
            }
            
            let wantedIds = Object.keys(associatingForm.reverseChildrenFieldsPropertyNames)
            if (typeof wantedchildId == 'string' && wantedchildId.length > 0 && wantedIds.includes(wantedchildId)){
                wantedIds = [wantedchildId]
            }
            wantedIds.forEach((childId)=>{
                tmp.children[childId] = []
                for (const propertyName in associatingForm.reverseChildrenFieldsPropertyNames[childId]) {
                    tmp.children[childId] = appendToArrayIfInEntry(
                        entry,
                        propertyName,
                        tmp.children[childId],
                        associatingForm.reverseChildrenFieldsPropertyNames[childId][propertyName]?.oldName ?? ''
                    )
                }
            })
        }
    })
}
const getAvailableSecondLevelsValuesForLists = async (associatingForm,fieldName,parentField,values,formData,linkedObjectIdsCache,reverseMode)=>{
    let correspondances = null
    let propNames = {}
    if (!reverseMode){
        associatingForm = appendChildrenFieldsPropertyNamestoParentForm(associatingForm,parentField,extractLinkedObjects(linkedObjectIdsCache),reverseMode)
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

export default {
    formatChildField,
    formatParentField,
    getAvailableSecondLevelsValues,
    getAvailableSecondLevelsValuesForLists,
    getParentEntries
}