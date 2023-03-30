/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

// create a new Event `propChange`
document.addEventListener('DOMContentLoaded',()=>{
    jQuery(function(){
        var _oldPropFunction = jQuery.fn.prop
        jQuery.fn.extend({prop: function( prop, val ) {
            // Only trigger events when property is being changed
            if ( val !== undefined ) {
                this.trigger( 'propChange', [prop, val] );     // before change listener
                var oldVal = this.prop( prop );                // Get old Value
                var ret = _oldPropFunction.call( this, prop, val );    // Update Property
                this.trigger( 'propChanged', [prop, oldVal] ); // after change listener
                return ret
            }
            return _oldPropFunction.call( this, prop )
        }})
    })
})

const enumlevel2Helper = {
    data(){
        return {
            allEntriesCache: {},
            correspondances: {},
            levels2: {},
            entries: {},
            eventsListeners: {},
            parents: {},
            forms: {},
            loadingAllEntries: [],
            loadingEntries: [],
            loadingForms: [],
            registeringCorrespondances: []
        }
    },
    methods: {
        addEvent(eventName, listener, once = false){
            if (typeof eventName == "string"){
                if (!(eventName in this.eventsListeners)){
                    this.eventsListeners[eventName] = []
                }
                this.eventsListeners[eventName] = [
                    ...this.eventsListeners[eventName],
                    ...[{listener, once, triggered: false}]
                ]
            }
        },
        addEventOnce(eventName, listener){
            this.addEvent(eventName,listener,true)
        },
        appendChildrenFieldsPropertyNamestoParentForm(form,parentField){
            if (!('childrenFieldsPropertyNames' in form)){
                form.childrenFieldsPropertyNames = {}
            }
            parentField.childrenIds.forEach((childId)=>{
                if (!(childId in form.childrenFieldsPropertyNames)){
                    form.childrenFieldsPropertyNames[childId] = {}
                    let childLinkedObjectId= this.levels2[childId].linkedObjectId
                    if (childLinkedObjectId.length > 0){
                        let prepared = (Array.isArray(form.prepared))
                            ? form.prepared
                            : (
                                typeof form.prepared == "object"
                                ? Object.values(form.prepared)
                                : []
                            )
    
                        prepared.forEach((field)=> {
                            if (["checkbox","checkboxfiche","radio","radiofiche","liste","listefiche","enumlevel2"]
                                .includes(field.type) && field.linkedObjectName == childLinkedObjectId){
                                form.childrenFieldsPropertyNames[childId][field.propertyname] = field
                            }
                        })
                    }
                }
            })
            return form
        },
        appendParentsFieldsPropertyNamestoParentForm(form,fieldName,parentField){
            if (!('parentsFieldsPropertyNames' in form)){
                form.parentsFieldsPropertyNames = {}
            }

            if (fieldName && fieldName.length > 0 && 
                !(fieldName in form.parentsFieldsPropertyNames)){
                form.parentsFieldsPropertyNames[fieldName] = {}
                let prepared = (Array.isArray(form.prepared))
                    ? form.prepared
                    : (
                        typeof form.prepared == "object"
                        ? Object.values(form.prepared)
                        : []
                    )
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
                prepared.forEach((field)=> {
                    const isEnumList = isList(field.type) || isEnum2Level(field,'list')
                    if ((isEnum(field) && field.linkedObjectName == parentField.linkedObjectId) ||
                        (isEnumList && parentField.linkedObjectId.slice(0,field.linkedObjectName.length) == field.linkedObjectName)){
                        form.parentsFieldsPropertyNames[fieldName][field.propertyname] = field
                    }
                })
            }
            return form
        },
        appendToArrayIfInEntry: function (entry,propName,currentArray){
            if (propName in entry && 
                    typeof entry[propName] == "string" && 
                    entry[propName].length > 0){ 
                entry[propName].split(',').forEach((value)=>{
                    if (!currentArray.includes(value)){
                        currentArray.push(value)
                    }
                })
            }
            return currentArray
        },
        assertIsRegularFormId: function (formId){
            if (typeof formId != "string" || formId.length == 0 || Number(formId) < 1){
                throw `'formId' as parameter as 'getForm' should be a not empty string representing a postive integer`
            }
        },
        assertIsRegularEntryId: function (entryId){
            if (typeof entryId != "string" || entryId.length == 0 || String(Number(entryId)) === entryId){
                throw `'entryId' as parameter as 'assertIsRegularEntryId' should be a not empty string and not representing a form number`
            }
        },
        cleanEvent: function (eventName){
            this.eventsListeners[eventName] = this.eventsListeners[eventName].filter((eventData)=>{
                return !eventData.once || !eventData.triggered
            })
        },
        dispatchEvent: function (eventName, param = undefined){
            if (typeof eventName == "string"){
                if (eventName in this.eventsListeners){
                    this.eventsListeners[eventName].forEach((eventData,idx)=>{
                        if (!eventData.once || !eventData.triggered){
                            this.eventsListeners[eventName][idx].triggered = true
                            if (param != undefined){
                                eventData.listener(param)
                            } else {
                                eventData.listener()
                            }
                        }
                    })
                    this.cleanEvent(eventName)
                }
            }
        },
        extractInputCheckboxValue(node){
            let name = node.getAttribute('name')
            let match = name.match(/\[[A-Za-z0-9_\-]+\]$/)
            if (!match) return ""
            return match[0].slice(1,-1)
        },
        extractLinkedObjectIdForCheckox: function (node, mode = "group-checkbox-", type = "checkbox"){
            let linkedObjectId = ""
            let fieldPropertyName = ""
            node.classList.forEach((className)=>{
                let match = className.match(new RegExp(`^${mode}((?:${type}fiche[0-9]*|${type}Liste[A-Za-z0-9\-_]+)[A-Za-z0-9_\\-]*)$`))
                if (match && match[1].length > 0){
                    fieldPropertyName = match[1] 
                }
            })
            if (fieldPropertyName.length > 0){
                let fieldName = "[A-Za-z0-9_\\-]*"
                if (fieldPropertyName in this.levels2
                    && this.levels2[fieldPropertyName].fieldName.length > 0){
                    fieldName = this.levels2[fieldPropertyName].fieldName
                }
                
                let match = fieldPropertyName.match(new RegExp(`^(?:${type}fiche([0-9]*)|${type}(Liste[A-Za-z0-9\-_]+))${fieldName}$`))
                if (match && ((match[1] && match[1].length > 0) || (match[2] && match[2].length > 0))){
                    linkedObjectId = match[1] ?? match[2]
                }
            }
            return linkedObjectId
        },
        extractLinkedObjectIdForRadioOrListe: function (name, type){
            let linkedObjectId = ""
            if (name.length > 0){
                let fieldName = "[A-Za-z0-9_\\-]*"
                if (name in this.levels2 
                    && this.levels2[name].fieldName.length > 0){
                    fieldName = this.levels2[name].fieldName
                }
                let match = name.match(new RegExp(`^(?:${type}fiche([0-9]*)|${type}(Liste[A-Za-z0-9\-_]+))${fieldName}$`))
                if (match && ((match[1] && match[1].length > 0) || (match[2] && match[2].length > 0))){
                    linkedObjectId = match[1] ?? match[2]
                }
            }
            return linkedObjectId
        },
        extractListOfAssociatingForms: function (fieldName,parentField){
            if (typeof fieldName != "string" || fieldName.length == 0){
                throw `'fiedlName' param in function 'extractListOfAssociatingForms' should be a not empty string, got '${JSON.stringify(fieldName)}'`
            }
            if (!('listOfAssociatingForms' in parentField)){
                let formsIds = []
                parentField.childrenIds.forEach((id)=>{
                    let associatingFormId = this.levels2[id].associatingFormId
                    if (associatingFormId.length > 0){
                        formsIds.push(associatingFormId)
                    }
                })
                
                this.parents[fieldName].listOfAssociatingForms = formsIds
            }
            return this.parents[fieldName].listOfAssociatingForms
        },
        findCheckbox(fieldName){
            let elements = document.querySelectorAll(`ul[class*="group-checkbox-"][class*="${fieldName}"],div[class*="group-checkbox-"][class*="${fieldName}"]`)
            if (!elements || elements.length == 0){
                return null
            }
            let filteredElements = []
            elements.forEach((item)=>{
                let filteredClasses = []
                item.classList.forEach((className)=>{if(className.slice(-fieldName.length) == fieldName) filteredClasses.push(className)})
                if (filteredClasses.length > 0){
                    filteredElements.push(item)
                }
            })
            if (filteredElements.length == 0) return null
            let inputsNodes = []
            filteredElements.forEach((item)=>{
                let inputs = item.querySelectorAll('input[type=checkbox]')
                if (inputs && inputs.length > 0){
                    inputs.forEach((input)=>{
                        inputsNodes.push(input)
                    })
                }
            })
            return (inputsNodes.length == 0) ? null : {
                type: "checkbox",
                nodes: inputsNodes,
                linkedObjectId: this.extractLinkedObjectIdForCheckox(filteredElements[0]) // keep only the first one
            }
        },
        findCheckboxDragAndDrop(fieldName){
            let elements = document.querySelectorAll(`ul.list-group[class*="group-"][class*="${fieldName}"]`)
            if (!elements || elements.length == 0){
                return null
            }
            let filteredElements = []
            elements.forEach((item)=>{
                let filteredClasses = []
                item.classList.forEach((className)=>{if(className.slice(-fieldName.length) == fieldName) filteredClasses.push(className)})
                if (filteredClasses.length > 0){
                    filteredElements.push(item)
                }
            })
            if (filteredElements.length == 0) return null
            let inputsNodes = []
            filteredElements.forEach((item)=>{
                let inputs = item.querySelectorAll('input[type=checkbox]')
                if (inputs && inputs.length > 0){
                    inputs.forEach((input)=>{
                        inputsNodes.push(input)
                    })
                }
            })
            return (inputsNodes.length == 0) ? null : {
                type: "checkboxdraganddrop",
                nodes: inputsNodes,
                linkedObjectId: this.extractLinkedObjectIdForCheckox(filteredElements[0],"group-") // keep only the first one
            }
        },
        findCheckboxTag(fieldName){            
            let elements = document.querySelectorAll(`input[class$=${fieldName}].yeswiki-input-entries`)
            if (!elements || elements.length == 0) return null
            let linkedObjectId = this.extractLinkedObjectIdForCheckox(elements[0],"yeswiki-input-entries"); // keep only the first one
            if (!linkedObjectId || linkedObjectId.length == 0){
                linkedObjectId = this.extractLinkedObjectIdForCheckox(elements[0],"yeswiki-input-entries","radio"); // keep only the first one
            }
            return {
                    type: "checkboxtag",
                    node: elements[0],
                    linkedObjectId: linkedObjectId
                }
        },     
        findField(name,associatingFormId = ""){
            let field = this.findCheckbox(name) ||
                this.findCheckboxDragAndDrop(name) ||
                this.findCheckboxTag(name) ||
                this.findList(name) ||
                this.findRadio(name) ||
                null
            if (associatingFormId.length > 0){
                field.linkedObjectId = field.linkedObjectId.replace(new RegExp(`${name}$`),'')
            }
            return field
        },
        findList(fieldName){
            let elements = document.querySelectorAll(`select[name$=${fieldName}]`)
            return (!elements || elements.length == 0)
                ? null
                : {
                    type: "select",
                    node: elements[0],
                    linkedObjectId: this.extractLinkedObjectIdForRadioOrListe(elements[0].getAttribute('name'),"liste")
                }
        },
        findRadio(fieldName){
            let elements = document.querySelectorAll(`input[name$=${fieldName}][type=radio]`)
            if (!elements || elements.length == 0){
                return null
            }
            let inputsNodes = []
            elements.forEach((item)=>{
                inputsNodes.push(item)
            })
            return {
                    type: "radio",
                    nodes: inputsNodes,
                    linkedObjectId: this.extractLinkedObjectIdForRadioOrListe(elements[0].getAttribute('name'),"radio")
            }
        },
        getAllEntries: async function (formId){
            this.assertIsRegularFormId(formId)
            if (formId in this.allEntriesCache){
                return this.allEntriesCache[formId]
            } else {
                return await this.getData(wiki.url(`?api/forms/${formId}/entries`),formId,'getAllEntries','loadingAllEntries',(responseDecoded)=>{
                        if (typeof responseDecoded == "object"||
                            Array.isArray(responseDecoded)){
                                
                            let entries = (typeof responseDecoded == "object")
                                ? Object.values(responseDecoded)
                                : responseDecoded
                            entries = entries.filter((e)=>{
                                return typeof e.id_fiche === "string" &&
                                    typeof e.id_typeannonce === "string" &&
                                    typeof e.bf_titre === "string"
                            })
                            entries.forEach((e)=>{
                                if (!(e.id_fiche in this.entries)){
                                    this.entries[e.id_fiche] = e
                                }
                            })
                            this.allEntriesCache[formId] = entries
                            return true
                        } else {
                            return false
                        }
                    }).then(()=>{
                        if (formId in this.allEntriesCache){
                            return this.allEntriesCache[formId]
                        } else {
                            throw `allEntriesCache '${formId}' not found in 'this.allEntriesCache (${JSON.stringify(Object.keys(this.allEntriesCache))})`
                        }
                    })
                    .catch((e)=>{throw `error when getting all Entries for '${formId}'`+(e!=undefined ? ` : ${(e)}`:'')})
            }
        },
        async getAvailableSecondLevelsValues(parentForm,parentField,values){
            parentForm = this.appendChildrenFieldsPropertyNamestoParentForm(parentForm,parentField)
            return await this.getParentEntries(values).then(()=>{
                let secondLevelValues = {}
                parentField.childrenIds.forEach((childId)=>{
                    secondLevelValues[childId] = []
                    if (childId in parentForm.childrenFieldsPropertyNames){
                        values.forEach((parentEntryId)=>{
                            if (parentEntryId in this.entries){
                                let parentEntry = this.entries[parentEntryId]
                                for (let propName in parentForm.childrenFieldsPropertyNames[childId]){
                                    secondLevelValues[childId] = this.appendToArrayIfInEntry(parentEntry,propName,secondLevelValues[childId])
                                }
                            }
                        })
                    }
                })
                return [secondLevelValues,parentForm]
            })
        },
        async getAvailableSecondLevelsValuesForLists(associatingForm,fieldName,parentField,values){
            associatingForm = this.appendChildrenFieldsPropertyNamestoParentForm(associatingForm,parentField)
            associatingForm = this.appendParentsFieldsPropertyNamestoParentForm(associatingForm,fieldName,parentField)
            let correspondances = await this.getCorrespondances(associatingForm,fieldName,parentField)
            let secondLevelValues = {}
            parentField.childrenIds.forEach((childId)=>{
                secondLevelValues[childId] = []
                if (childId in associatingForm.childrenFieldsPropertyNames){
                    values.forEach((parentValue)=>{
                        if (parentValue in correspondances && childId in correspondances[parentValue]){
                            secondLevelValues[childId] = [
                                    ...secondLevelValues[childId],
                                    ...correspondances[parentValue][childId]
                                ]
                        }
                    })
                }
            })
            return secondLevelValues
        },
        getCheckboxTagValues: function (node){
            let values = []
            let value = node.value
            if (value.trim() != ""){
                values = value.split(",").map((val)=>String(val))
            }
            return values
        },
        getCheckboxValues: function (nodes){
            let values = []
            nodes.forEach((node)=>{
                if (node.checked){
                    let name = node.getAttribute('name')
                    let value = name.match(/\[[A-Za-z0-9_-]+\]/)[0]
                    value = value.substr(1,value.length-2)
                    values.push(value)
                }
            })
            return values
        },
        async getCorrespondances(associatingForm,fieldName){
            if (associatingForm.bn_id_nature in this.correspondances){
                return this.correspondances[associatingForm.bn_id_nature]
            } else {
                return await this.getAllEntries(associatingForm.bn_id_nature)
                    .then((entries)=>this.registerCorrespondances(associatingForm.bn_id_nature,async ()=>{
                            let entries = this.allEntriesCache[associatingForm.bn_id_nature] || []
                            if (entries.length == 0){
                                console.log(`entries should not be empty`)
                            }
                            let correspondances = {}
                            entries.forEach((e)=>{
                                let tmp = {
                                    parents: [],
                                    children: {}
                                }
                                for (const propertyName in associatingForm.parentsFieldsPropertyNames[fieldName]) {
                                    tmp.parents = this.appendToArrayIfInEntry(e,propertyName,tmp.parents)
                                }
                                for (const childId in associatingForm.childrenFieldsPropertyNames) {
                                    tmp.children[childId] = []
                                    for (const propertyName in associatingForm.childrenFieldsPropertyNames[childId]) {
                                        tmp.children[childId] = this.appendToArrayIfInEntry(e,propertyName,tmp.children[childId])
                                    }
                                }
                                tmp.parents.forEach((p)=>{
                                    if (!(p in correspondances)){
                                        correspondances[p] = {}
                                    }
                                    for (const childId in tmp.children) {
                                        if (!(childId in correspondances[p])){
                                            correspondances[p][childId] = []
                                        }
                                        tmp.children[childId].forEach((val)=>{
                                            if (!correspondances[p][childId].includes(val)){
                                                correspondances[p][childId] = [...correspondances[p][childId],val]
                                            }
                                        })
                                    }
                                    
                                })
                            })
                            this.correspondances[associatingForm.bn_id_nature] = correspondances
                            return correspondances
                        })
                    )
            }
        },
        async getData(url,id,eventPrefix,loadingCacheName,testFunction){
            if (typeof testFunction != "function"){
                throw "'testFunction' should be a function"
            }
            return await this.manageInternalEvents(id,eventPrefix,loadingCacheName,async ()=>{
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
        },
        getEntry: async function (entryId){
            this.assertIsRegularEntryId(entryId)
            if (entryId in this.entries){
                return this.entries[entryId]
            } else {
                return await this.getData(wiki.url(`?api/entries/json/${entryId}`),entryId,'getEntry','loadingEntries',(responseDecoded)=>{
                        if (responseDecoded && typeof responseDecoded == "object"){
                            let firstValue = Object.values(responseDecoded)[0]
                            if ('id_fiche' in firstValue &&
                                firstValue.id_fiche == entryId){
                                this.entries[entryId] = firstValue
                                return true
                            } else {
                                return false
                            }
                        } else {
                            return false
                        }
                    }).then(()=>{
                        if (entryId in this.entries){
                            return this.entries[entryId]
                        } else {
                            throw `entryId '${entryId}' not found in 'this.entries (${JSON.stringify(Object.keys(this.entries))})`
                        }
                    })
                    .catch((e)=>{throw `error when getting entry '${entryId}'`+(e!=undefined ? ` : ${(e)}`:'')})
            }
        },
        getForm: async function (formId){
            this.assertIsRegularFormId(formId)
            if (formId in this.forms){
                return this.forms[formId]
            } else {
                return await this.getData(wiki.url(`?api/forms/${formId}`),formId,'getForm','loadingForms',(responseDecoded)=>{
                        if (responseDecoded && ('bn_id_nature' in responseDecoded) &&
                            responseDecoded.bn_id_nature == formId){
                            this.forms[formId] = responseDecoded
                            return true
                        } else {
                            return false
                        }
                    }).then(()=>{
                        if (formId in this.forms){
                            return this.forms[formId]
                        } else {
                            throw `formId '${formId}' not found in 'this.forms (${JSON.stringify(Object.keys(this.forms))})`
                        }
                    })
                    .catch((e)=>{throw `error when getting form '${formId}'`+(e!=undefined ? ` : ${(e)}`:'')})
            }
        },
        async getParentEntries(entriesIds){
            if (entriesIds.length == 0){
                return []
            }
            let promises = []
            let promisesLabel = []
            for (let entryId of entriesIds){
                promises.push(
                    new Promise((resolve,reject)=>{
                        this.getEntry(entryId).then((entry)=>{
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
        },
        getParentFieldNameValues(fieldData){
            switch (fieldData.type) {
                case "checkbox":
                case "checkboxdraganddrop":
                    return this.getCheckboxValues(fieldData.nodes)
                case "checkboxtag":
                    return this.getCheckboxTagValues(fieldData.node)
                case "radio":
                    return this.getRadioValues(fieldData.nodes)
                case "select":
                    return this.getSelectValues(fieldData.node)
                default:
                    break
            }
            return []
        },
        getRadioValues: function (nodes){
            let values = []
            nodes.forEach((node)=>{
                if (node.checked){
                    values.push(node.value)
                }
            })
            return values
        },
        getSelectValues: function (node){
            let values = []
            let value = node.value
            if (value.length > 0){
                values.push(value)
            }
            return values
        },
        importElement(element){
            let propertyName = element.dataset.fieldPropertyname || ''
            let parentFieldName = element.dataset.fieldParentFieldname || ''
            let fieldName = element.dataset.fieldName || ''
            let associatingFormId = element.dataset.fieldAssociatingFormId || ''
            if (propertyName.length > 0 && parentFieldName.length > 0){
                this.levels2[propertyName] = {parentFieldName,fieldName,associatingFormId}
                let field = this.findField(propertyName)
                if (field && typeof field == "object"){
                    this.levels2[propertyName].type = field.type
                    this.levels2[propertyName].node = 'node' in field ? field.node : null 
                    this.levels2[propertyName].nodes = 'nodes' in field ? field.nodes : null 
                    this.levels2[propertyName].linkedObjectId = field.linkedObjectId 
                    if (parentFieldName in this.parents){
                        this.levels2[propertyName].parentId = parentFieldName
                        this.parents[parentFieldName].childrenIds = [...this.parents[parentFieldName].childrenIds,propertyName]
                        this.parents[parentFieldName].isForm = !(
                                !this.parents[parentFieldName].isForm || 
                                (associatingFormId.length == 0)
                            )
                    } else {
                        field = this.findField(parentFieldName,associatingFormId)
                        if (field && typeof field == "object"){
                            this.parents[parentFieldName] = {
                                type: field.type,
                                node: 'node' in field ? field.node : null,
                                nodes: 'nodes' in field ? field.nodes : null,
                                linkedObjectId: field.linkedObjectId,
                                childrenIds: [propertyName],
                                isForm: (associatingFormId.length == 0),
                            }
                            this.levels2[propertyName].parentId = parentFieldName
                        }
                    }
                }
            }
        },
        async manageInternalEvents(id,eventPrefix,loadingCacheName,asynFunc){
            let p = new Promise((resolve,reject)=>{
                this.addEventOnce(`${eventPrefix}.${id}.ready`,()=>resolve())
                this.addEventOnce(`${eventPrefix}.${id}.error`,(e)=>reject(e))
                if (!this[loadingCacheName].includes(id)){
                    this[loadingCacheName] = [...this[loadingCacheName],id]
                    let resettingLoadingForms = ()=>{
                        this[loadingCacheName] = this[loadingCacheName].filter((idToCheck)=>idToCheck!=id)
                    }
                    this.addEventOnce(`${eventPrefix}.${id}.error`,resettingLoadingForms)
                    this.addEventOnce(`${eventPrefix}.${id}.ready`,resettingLoadingForms)
                    this.addEventOnce(`${eventPrefix}.${id}.ready`,()=>{
                        this.setEventTriggered(`${eventPrefix}.${id}.error`)
                    })
                    asynFunc()
                        .then((...args)=>{
                            this.dispatchEvent(`${eventPrefix}.${id}.ready`)
                            return Promise.resolve(...args)
                        })
                        .catch((e)=>{this.dispatchEvent(`${eventPrefix}.${id}.error`,e)})
                }
            })
            return await p.then((...args)=>Promise.resolve(...args))
        },
        async registerCorrespondances(formId,asyncFunc){
            if (formId in this.correspondances){
                return this.correspondances[formId]
            }
            return await this.manageInternalEvents(formId,'registerCorrespondances','registeringCorrespondances',asyncFunc).then((...args)=>{
                if (formId in this.correspondances){
                    return this.correspondances[formId]
                } else {
                    throw `this.correspondances should contain key '${formId}'at this state !`
                }
            })
        },
        registerTriggerForChecbox(node,parentFieldName) {
            if (jQuery && 
                node.tagName === 'INPUT' && 
                node.hasAttribute('type') &&
                node.getAttribute('type') === 'checkbox'){
                $(node).on('propChanged',()=>{
                    this.resolveChange(parentFieldName)
                })
            }
        },
        registerTriggersOnParents(){
            for (const parentFieldName in this.parents){
                if (this.parents[parentFieldName].node){
                    this.parents[parentFieldName].node.onchange = () => {
                        this.resolveChange(parentFieldName)
                    }
                    this.registerTriggerForChecbox(this.parents[parentFieldName].node,parentFieldName)
                }
                if (this.parents[parentFieldName].nodes){
                    this.parents[parentFieldName].nodes.forEach((node)=>{
                        node.onchange = () => {
                            this.resolveChange(parentFieldName)
                        }
                        this.registerTriggerForChecbox(node,parentFieldName)
                    })
                }
            }
        },
        async resolveChange(parentFieldName){
            if (!(parentFieldName in this.parents)){
                return null
            }
            return await this.updateChildren({[parentFieldName]:this.parents[parentFieldName]})
        },
        setEventTriggered: function (eventName){
            if (typeof eventName == "string" && (eventName in this.eventsListeners)){
                this.eventsListeners[eventName] = this.eventsListeners[eventName].map((evenData)=>{
                    evenData.triggered = true
                    return evenData
                })
            }
        },
        updateCheckox(field,secondLevelValues,childId,nodesForWhatDispatchChangeEventInput){
            let nodesForWhatDispatchChangeEvent = nodesForWhatDispatchChangeEventInput
            field.nodes.forEach((node)=>{
                let currentValue = this.extractInputCheckboxValue(node)
                let baseNode = (field.type == "checkbox") ? node.parentNode.parentNode : node.parentNode
                if (field.type == "checkboxdraganddrop"){
                    baseNode.classList.add('enumlevel2-baseNode')
                }
                if (secondLevelValues[childId].includes(currentValue)){
                    if (baseNode.classList.contains('enumlevel2-backup')){
                        let oldValue = 'wasChecked' in node.dataset && ([1,true,"true","1"].includes(node.dataset.wasChecked))
                        nodesForWhatDispatchChangeEvent.push(node)
                        baseNode.classList.remove('enumlevel2-backup')
                        if (node.checked != oldValue){
                            node.dispatchEvent(new Event("click"))
                            node.checked = oldValue
                        }
                    }
                } else if (!baseNode.classList.contains('enumlevel2-backup')) {
                    node.dataset.wasChecked = node.checked
                    baseNode.classList.add('enumlevel2-backup')
                    if (node.checked){
                        node.dispatchEvent(new Event("click"))
                        node.checked = false
                    }
                }
            })
            return nodesForWhatDispatchChangeEvent
        },
        updateCheckoxTag(field,secondLevelValues,childId){
            let $node = $(field.node)
            let tagsInput = $node.tagsinput()
            if (tagsInput && Array.isArray(tagsInput) && tagsInput.length > 0){
                tagsInput = tagsInput[0]
                let tagsInputCurrentOptions = tagsInput.options
                let currentAvailableValues = (
                    tagsInputCurrentOptions.typeahead && 
                    typeof tagsInputCurrentOptions.typeahead.source == "function"
                ) ? tagsInputCurrentOptions.typeahead.source() : []
                if (!Array.isArray(currentAvailableValues)){
                    currentAvailableValues = []
                }
                let defaultAvailableValues = currentAvailableValues
                if (!('defaultAvailableValues' in field.node.dataset)){
                    field.node.dataset.defaultAvailableValues = JSON.stringify(defaultAvailableValues)
                } else {
                    defaultAvailableValues = JSON.parse(field.node.dataset.defaultAvailableValues)
                }
                let selectedValues = $node.val()
                selectedValues = (selectedValues == "") ? [] : selectedValues.split(",")
                selectedValues.map((val)=>{String(val)})
                let backupSelectedValues = 
                    'backupSelectedValues' in field.node.dataset
                    ? JSON.parse(field.node.dataset.backupSelectedValues)
                    : []
                let newValuesIds = []
                let newValues = {}
                for (let key in defaultAvailableValues){
                    let currentValue = String(defaultAvailableValues[key].id)
                    if (secondLevelValues[childId].includes(currentValue)){
                        if (!newValuesIds.includes(currentValue)){
                            newValuesIds.push(currentValue)
                            newValues[currentValue] = defaultAvailableValues[key]
                        }
                        if (backupSelectedValues.includes(currentValue)){
                            backupSelectedValues = backupSelectedValues.filter((val)=>val!=currentValue)
                            if (!selectedValues.includes(currentValue)){
                                selectedValues.push(currentValue)
                            }
                        }
                    } else if (selectedValues.includes(currentValue)){
                        selectedValues = selectedValues.filter((val)=>val!=currentValue)
                        if (!backupSelectedValues.includes(currentValue)){
                            backupSelectedValues.push(currentValue)
                        }
                    }
                }
                // reset tagsinput
                $node.tagsinput('destroy')
                let newoptions = {
                    itemValue: 'id',
                    itemText: 'title',
                    typeahead: {
                        afterSelect(val) { $node.tagsinput('input').val(""); },
                        source: Object.values(newValues),
                        autoSelect: false,
                    },
                    freeInput: false,
                    confirmKeys: [13, 186, 188]
                }
                if (childId.match(/^radio.*/)){
                    newoptions.maxTags = 1
                    if (selectedValues.length > 0){
                        let firstValue = selectedValues.shift()
                        selectedValues.forEach((val)=>{
                            if (!backupSelectedValues.includes(val)){
                                backupSelectedValues.push(val)
                            }
                        })
                        selectedValues = [firstValue]
                    }
                }
                $node.tagsinput(newoptions)
                selectedValues.forEach((val)=>{
                    if (val in newValues){
                        $node.tagsinput('add',newValues[val])
                    }
                })
                field.node.dataset.backupSelectedValues = JSON.stringify(backupSelectedValues)
            }
        },
        async updateChildren(parentsFields){
            if (typeof parentsFields != "object"){
                throw "'parentsFields' should be an object with format 'fieldName' => field"
            } else {
                let promises = []
                let promisesLabel = []
                for (let fieldName in parentsFields){
                    let parentField = parentsFields[fieldName]
                    if (parentField && parentField.linkedObjectId.length > 0){
                        let values = this.getParentFieldNameValues(parentField)
                        if (parentField.isForm){
                            promises.push(
                                new Promise((resolve,reject)=>{
                                    this.getForm(parentField.linkedObjectId).then((form)=>{
                                        this.getAvailableSecondLevelsValues(form,parentField,values).then(([secondLevelValues,formInt])=>{
                                            this.updateSecondLevel(secondLevelValues)
                                            resolve(formInt)
                                        })
                                        .catch((e)=>reject(e))
                                    })
                                    .catch((e)=>{
                                        reject(e)
                                    })
                                })
                            )
                            promisesLabel.push(`getting form ${parentField.linkedObjectId}`)
                            // start getting entries in parallel of form
                            promises.push(
                                new Promise((resolve,reject)=>{
                                    this.getParentEntries(values).then((entries)=>{
                                        resolve(entries)
                                    })
                                    .catch((e)=>{
                                        reject(e)
                                    })
                                })
                            )
                            promisesLabel.push(`getting parentEntries for ${JSON.stringify(values)}`)
                        } else {
                            let formsIds = this.extractListOfAssociatingForms(fieldName,parentField)
                            for (let formId of formsIds){
                                promises.push(
                                    new Promise((resolve,reject)=>{
                                        this.getForm(formId).then((form)=>{
                                            this.getAvailableSecondLevelsValuesForLists(form,fieldName,parentField,values).then((secondLevelValues)=>{
                                                this.updateSecondLevel(secondLevelValues)
                                                resolve(form)
                                            })
                                            .catch((e)=>reject(e))
                                        })
                                        .catch((e)=>{
                                            reject(e)
                                        })
                                    })
                                )
                                promisesLabel.push(`getting form ${formId}`)
                                // start getting entries in parallel of form
                                promises.push(
                                    new Promise((resolve,reject)=>{
                                        this.getAllEntries(formId).then((entries)=>{
                                            resolve(entries)
                                        })
                                        .catch((e)=>{
                                            reject(e)
                                        })
                                    })
                                )
                                promisesLabel.push(`getting all entries of form ${formId}`)
                            }
                        }
                    }
                }
                return await Promise.allSettled(promises).then((promisesStatus)=>{
                    promisesStatus.forEach((p,idx)=>{
                        if (p.status != "fulfilled"){
                            console.warn(`error : ${p.reason} (when ${promisesLabel[idx]})`)
                        }
                    })
                    return promisesStatus
                })
            }
        },
        updateRadio(field,secondLevelValues,childId){
            let radioBtnToCheck = []
            let radioBtnToCheckBackup = []
            field.nodes.forEach((node)=>{
                let currentValue = node.value
                let baseNode = node.parentNode.parentNode
                if (secondLevelValues[childId].includes(currentValue)){
                    let oldValue = ('wasChecked' in node.dataset && ([1,true,"true","1"].includes(node.dataset.wasChecked))) ||
                        (!('wasChecked' in node.dataset) && node.dataset.default)
                    if (baseNode.classList.contains('enumlevel2-backup')){
                        baseNode.classList.remove('enumlevel2-backup')
                        if (oldValue){
                            radioBtnToCheck.push(node)
                        }
                    } else if (node.checked){
                        radioBtnToCheck.push(node)
                    } else if (oldValue){
                        radioBtnToCheckBackup.push(node)
                    }
                } else if (!baseNode.classList.contains('enumlevel2-backup')) {
                    node.dataset.wasChecked = node.checked
                    baseNode.classList.add('enumlevel2-backup')
                    if (node.checked){
                        node.checked = false
                        node.dispatchEvent(new Event("click"))
                    }
                } else if (node.checked){
                    node.checked = false
                    node.dispatchEvent(new Event("click"))
                }
            })
            if (radioBtnToCheck.length > 0){
                radioBtnToCheck.forEach((node,index)=>{
                    if (index == 0){
                        if (!node.checked){
                            node.dispatchEvent(new Event("click"))
                            node.checked = true
                        }
                    } else if (node.checked){
                        node.checked = false
                        node.dispatchEvent(new Event("click"))
                    }
                })
                radioBtnToCheckBackup.forEach((node,index)=>{
                    if (node.checked){
                        node.checked = false
                        node.dispatchEvent(new Event("click"))
                    }
                })
            } else {
                radioBtnToCheckBackup.forEach((node,index)=>{
                    if (index == 0){
                        if (!node.checked){
                            node.dispatchEvent(new Event("click"))
                            node.checked = true
                        }
                    } else if (node.checked){
                        node.checked = false
                        node.dispatchEvent(new Event("click"))
                    }
                })
            }
        },
        updateSecondLevel(secondLevelValues){
            let nodesForWhatDispatchChangeEvent = []
            for (const childId in secondLevelValues) {
                let field = this.levels2[childId]
                switch (field.type) {
                    case "checkbox":
                    case "checkboxdraganddrop":
                        nodesForWhatDispatchChangeEvent = this.updateCheckox(field,secondLevelValues,childId,nodesForWhatDispatchChangeEvent)
                        return
                    case "checkboxtag":
                        this.updateCheckoxTag(field,secondLevelValues,childId)
                        return 
                    case "radio":
                        this.updateRadio(field,secondLevelValues,childId)
                        return
                    case "select":
                        this.updateSelect(field,secondLevelValues,childId)
                    default:
                        break
                }
            }
            let event = new Event("change")
            nodesForWhatDispatchChangeEvent.forEach((node)=>{node.dispatchEvent(event)})
        },
        updateSelect(field,secondLevelValues,childId){
            let selectOptionsToSelect = []
            let visiblesOptions = []
            let options = field.node.querySelectorAll('option') || []
            options.forEach((node)=>{
                let currentValue = node.value
                let baseNode = node
                if (secondLevelValues[childId].includes(currentValue)){
                    visiblesOptions.push(node)
                    if (baseNode.classList.contains('enumlevel2-backup')){
                        let oldValue = 'wasChecked' in node.dataset && ([1,true,"true","1"].includes(node.dataset.wasChecked))
                        baseNode.classList.remove('enumlevel2-backup')
                        if (oldValue){
                            selectOptionsToSelect.push(node)
                        }
                    } else if (currentValue == field.node.value){
                        selectOptionsToSelect.push(node)
                    }
                } else if (!baseNode.classList.contains('enumlevel2-backup')) {
                    node.dataset.wasChecked = (currentValue == field.node.value)
                    baseNode.classList.add('enumlevel2-backup')
                }
            })
            if (selectOptionsToSelect.length > 0){
                field.node.value = selectOptionsToSelect[0].value
            } else if (visiblesOptions.length == 1) {
                field.node.value = visiblesOptions[0].value
            } else {
                field.node.value = ""
            }
        },
        async init(){
            let elements = document.querySelectorAll(".enum-two-level-data")
            if (elements && elements.length > 0){
                elements.forEach((element)=>this.importElement(element))
            }
            this.registerTriggersOnParents()
            // init
            return await this.updateChildren(this.parents)
        }
    },
    initData(){
        this.methods.parent = this
        // init data -- not needed with VueJs
        let data = this.data()
        for(const key in data){
            this.methods[key] = data[key]
        }

    },
    mounted(){
        this.initData(); // not needed with VueJs
        this.methods.init(); // replace by this.init() in VueJs
    }
}

enumlevel2Helper.mounted();