/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import twoLevelsHelper from '../twolevels.js'

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
            levels2: {},
            parents: {},
        }
    },
    methods: {
        blockCommon(field,className,callback){
            const parentBlock = (className == 'select')
                ? this.closest(field.node,['control-group',className])
                : (
                    field.nodes.length > 0
                    ? this.closest(field.nodes[0],['control-group',className])
                    : null
                )
            if (!(parentBlock === null)){
                callback(parentBlock)
            }
        },
        blockHide(field,className){
            this.blockCommon(field,className,(parentBlock)=>{
                parentBlock.classList.add('twolevels-select-hidden')
                parentBlock.style.display = 'none'
            })
        },
        blockShow(field,className){
            this.blockCommon(field,className,(parentBlock)=>{
                if (parentBlock.classList.contains('twolevels-select-hidden')){
                    parentBlock.classList.remove('twolevels-select-hidden')
                }
                parentBlock.style.display = null
            })
        },
        closest(node,classNames){
            let curParentNode = node
            for (let index = 0; index < 100; index++) {
                if (typeof curParentNode === 'undefined' || curParentNode === null 
                    || curParentNode.parentNode == undefined ||  typeof curParentNode.parentNode.classList == 'undefined'){
                    return null
                }
                curParentNode = curParentNode.parentNode
                if (classNames.length == 0 || classNames.every((e)=>curParentNode.classList.contains(e))){
                    return curParentNode
                }
            }
            return null
        },
        extractInputCheckboxValue(node){
            let name = node.getAttribute('name')
            let match = name.match(/\[[A-Za-z0-9_\-]+\]$/)
            if (!match) return ""
            return match[0].slice(1,-1)
        },
        extractLinkedObjects(){
            return Object.fromEntries(Object.entries(this.levels2).map(([k,v])=>[k,v.linkedObjectId]))
        },
        extractLinkedObjectIdForCheckox(node, mode = "group-checkbox-", type = "checkbox"){
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
        extractLinkedObjectIdForRadioOrListe(name, type){
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
        extractListOfAssociatingForms(fieldName,parentField){
            if (typeof fieldName != "string" || fieldName.length == 0){
                throw `'fiedlName' param in function 'extractListOfAssociatingForms' should be a not empty string, got '${JSON.stringify(fieldName)}'`
            }
            if (!('listOfAssociatingForms' in parentField)){
                let formsIds = []
                parentField.childrenIds.forEach((id)=>{
                    let associatingFormId = this.levels2[id].associatingFormId
                    if (associatingFormId.length > 0){
                        formsIds.push({childId:id,id:associatingFormId,isForm:this.levels2[id].isForm,wantedFieldId:this.levels2[id].associatingFieldId})
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
        getCheckboxTagValues(node){
            let values = []
            let value = node.value
            if (value.trim() != ""){
                values = value.split(",").map((val)=>String(val))
            }
            return values
        },
        getCheckboxValues(nodes){
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
        getRadioValues(nodes){
            let values = []
            nodes.forEach((node)=>{
                if (node.checked){
                    values.push(node.value)
                }
            })
            return values
        },
        getSelectValues(node){
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
            let associatingFieldId = element.dataset.fieldAssociatingFieldId || ''
            let isForm = ('isForm' in element.dataset) ? [1,'1',true,'true'].includes(element.dataset.isForm) : false
            if (propertyName.length > 0 && parentFieldName.length > 0){
                this.levels2[propertyName] = {parentFieldName,fieldName,associatingFormId,isForm,associatingFieldId}
                let field = this.findField(propertyName)
                if (field && typeof field == "object"){
                    this.levels2[propertyName].type = field.type
                    this.levels2[propertyName].node = 'node' in field ? field.node : null 
                    this.levels2[propertyName].nodes = 'nodes' in field ? field.nodes : null 
                    this.levels2[propertyName].linkedObjectId = field.linkedObjectId 
                    if (parentFieldName in this.parents){
                        this.levels2[propertyName].parentId = parentFieldName
                        this.parents[parentFieldName].childrenIds = [...this.parents[parentFieldName].childrenIds,propertyName]
                        this.parents[parentFieldName].isForm = ('isForm' in this.parents[parentFieldName])
                            ? this.parents[parentFieldName].isForm
                            : (associatingFormId.length == 0)
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
        updateCheckox(isInit,field,secondLevelValues,childId,nodesForWhatDispatchChangeEventInput){
            let visiblesOptions = []
            this.blockShow(field,'checkbox')
            let nodesForWhatDispatchChangeEvent = nodesForWhatDispatchChangeEventInput
            field.nodes.forEach((node)=>{
                let currentValue = this.extractInputCheckboxValue(node)
                let baseNode = (field.type == "checkbox") ? node.parentNode.parentNode : node.parentNode
                if (field.type == "checkboxdraganddrop"){
                    baseNode.classList.add('enumlevel2-baseNode')
                }
                if (secondLevelValues[childId].includes(currentValue)){
                    visiblesOptions.push(node)
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
            if (visiblesOptions.length == 0){
                this.blockHide(field,'checkbox')
            } else if (!isInit && visiblesOptions.length == 1 && !visiblesOptions[0].checked){
                visiblesOptions[0].dispatchEvent(new Event("click"))
                visiblesOptions[0].checked = true
            }
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
        async updateChildren(parentsFields, isInit = false){
            if (typeof parentsFields != "object"){
                throw "'parentsFields' should be an object with format 'fieldName' => field"
            } else {
                let promisesData = twoLevelsHelper.initPromisesData()
                for (let fieldName in parentsFields){
                    let parentField = parentsFields[fieldName]
                    if (parentField && parentField.linkedObjectId.length > 0){
                        let values = this.getParentFieldNameValues(parentField)
                        if (parentField.isForm){
                            twoLevelsHelper.createPromise(promisesData,{
                                formId: parentField.linkedObjectId,
                                processFormAsync: async (form)=>{
                                    return twoLevelsHelper.getAvailableSecondLevelsValues(form,parentField,values,this.extractLinkedObjects())
                                        .then(([secondLevelValues,formModified])=>{
                                            this.updateSecondLevel(secondLevelValues,isInit)
                                            return [secondLevelValues,formModified]
                                        })
                                },
                                getEntriesAsync: ()=>{
                                    return twoLevelsHelper.getParentEntries(values)
                                },
                                getEntriesLabel: `getting parentEntries for ${JSON.stringify(values)}`})
                        } else {
                            let formsIds = this.extractListOfAssociatingForms(fieldName,parentField)
                            for (let formIdData of formsIds){
                                const formId = formIdData.id
                                twoLevelsHelper.createPromise(promisesData,{
                                    formId,
                                    processFormAsync: async (form)=>{
                                        return twoLevelsHelper.getAvailableSecondLevelsValuesForLists(form,fieldName,parentField,values,formIdData,this.extractLinkedObjects())
                                        .then(([secondLevelValues,formModified])=>{
                                            this.updateSecondLevel(secondLevelValues,isInit)
                                            return [secondLevelValues,formModified]
                                        })
                                    },
                                    getEntriesAsync: ()=>{
                                        return twoLevelsHelper.getAllEntries(formId)
                                    },
                                    getEntriesLabel: `getting all entries of form ${formId}`})
                            }
                        }
                    }
                }
                return await twoLevelsHelper.resolvePromises(promisesData)
            }
        },
        updateRadio(field,secondLevelValues,childId){
            let visiblesOptions = []
            this.blockShow(field,'radio')
            let radioBtnToCheck = []
            let radioBtnToCheckBackup = []
            field.nodes.forEach((node)=>{
                let currentValue = node.value
                let baseNode = node.parentNode.parentNode
                if (secondLevelValues[childId].includes(currentValue)){
                    visiblesOptions.push(node)
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
            if (visiblesOptions.length == 0){
                this.blockHide(field,'radio')
            }
        },
        updateSecondLevel(secondLevelValues, isInit = false){
            let nodesForWhatDispatchChangeEvent = []
            for (const childId in secondLevelValues) {
                let field = this.levels2[childId]
                switch (field.type) {
                    case "checkbox":
                    case "checkboxdraganddrop":
                        nodesForWhatDispatchChangeEvent = this.updateCheckox(isInit,field,secondLevelValues,childId,nodesForWhatDispatchChangeEvent)
                        break
                    case "checkboxtag":
                        this.updateCheckoxTag(field,secondLevelValues,childId)
                        break 
                    case "radio":
                        this.updateRadio(field,secondLevelValues,childId)
                        break
                    case "select":
                        this.updateSelect(isInit,field,secondLevelValues,childId)
                    default:
                        break
                }
            }
            let event = new Event("change")
            nodesForWhatDispatchChangeEvent.forEach((node)=>{node.dispatchEvent(event)})
        },
        updateSelect(isInit,field,secondLevelValues,childId){
            let selectOptionsToSelect = []
            this.blockShow(field,'select')
            $(field.node).closest('.control-group.select').show()
            let visiblesOptions = []
            let options = field.node.querySelectorAll('option') || []
            options.forEach((node)=>{
                let currentValue = node.value
                let baseNode = node
                if (currentValue.length == '' || secondLevelValues[childId].includes(currentValue)){
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
            let notEmptyOptions = visiblesOptions.filter((e)=>e.value != '')
            if (!isInit && notEmptyOptions.length == 1) {
                field.node.value = notEmptyOptions[0].value
            } else if (selectOptionsToSelect.length > 0){
                field.node.value = selectOptionsToSelect[0].value
            } else {
                field.node.value = ""
            }
            if (notEmptyOptions.length == 0){
                this.blockHide(field,'select')
            }
        },
        async init(){
            let elements = document.querySelectorAll(".enum-two-level-data")
            if (elements && elements.length > 0){
                elements.forEach((element)=>this.importElement(element))
            }
            this.registerTriggersOnParents()
            // init
            return await this.updateChildren(this.parents, true)
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