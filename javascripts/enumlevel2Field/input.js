/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const enumlevel2Helper = {
    data: function(){
        return {
            levels2: {},
            entries: {},
            parents: {},
            forms: {},
            formsLoadedFunctions: []
        };
    },
    methods: {
        importElement: function(element){
            let propertyName = element.dataset.fieldPropertyname || '';
            let parentFieldName = element.dataset.fieldParentFieldname || '';
            if (propertyName.length > 0 && parentFieldName.length > 0){
                this.levels2[propertyName] = {parentFieldName};
                let field = this.findField(propertyName);
                if (field && typeof field == "object"){
                    this.levels2[propertyName].type = field.type;
                    this.levels2[propertyName].node = field.hasOwnProperty('node') ? field.node : null ;
                    this.levels2[propertyName].nodes = field.hasOwnProperty('nodes') ? field.nodes : null ;
                    this.levels2[propertyName].formId = field.formId ;
                    if (this.parents.hasOwnProperty(parentFieldName)){
                        this.levels2[propertyName].parentId = parentFieldName;
                        this.parents[parentFieldName].childrenIds.push(propertyName);
                    } else {
                        field = this.findField(parentFieldName);
                        if (field && typeof field == "object"){
                            this.parents[parentFieldName] = {
                                type: field.type,
                                node: field.hasOwnProperty('node') ? field.node : null,
                                nodes: field.hasOwnProperty('nodes') ? field.nodes : null,
                                formId: field.formId,
                                childrenIds: [propertyName]
                            }
                            this.levels2[propertyName].parentId = parentFieldName
                        }
                    }
                }
            }
        },
        extractFormIdForCheckox: function (classList){
            let formId = "";
            classList.forEach((className)=>{
                let match = className.match(/^group-checkbox-(?:checkboxfiche|enumlevel2)([0-9]*)[A-Za-z0-9_\-]+$/)
                if (match && match[1].length > 0){
                    formId = match[1]
                }
            });
            return formId;
        },
        findCheckbox: function(fieldName){
            let elements = document.querySelectorAll(`ul[class*="group-checkbox-"][class*="${fieldName}"],div[class*="group-checkbox-"][class*="${fieldName}"]`);
            if (!elements || elements.length == 0){
                return null;
            }
            let filteredElements = [];
            elements.forEach((item)=>{
                let filteredClasses = [];
                item.classList.forEach((className)=>{if(className.slice(-fieldName.length) == fieldName) filteredClasses.push(className)})
                if (filteredClasses.length > 0){
                    filteredElements.push(item);
                }
            });
            if (filteredElements.length == 0) return null
            let inputsNodes = []
            filteredElements.forEach((item)=>{
                let inputs = item.querySelectorAll('input[type=checkbox]');
                if (inputs && inputs.length > 0){
                    inputs.forEach((input)=>{
                        inputsNodes.push(input);
                    });
                }
            });
            return (inputsNodes.length == 0) ? null : {
                type: "checkbox",
                nodes: inputsNodes,
                formId: this.extractFormIdForCheckox(filteredElements[0].classList) // keep only the first one
            };
        },
        extractFormIdForCheckoxDragAndDrop: function (classList){
            let formId = "";
            classList.forEach((className)=>{
                let match = className.match(/^group-(?:checkboxfiche|enumlevel2)([0-9]*)[A-Za-z0-9_\-]+$/)
                if (match && match[1].length > 0){
                    formId = match[1]
                }
            });
            return formId;
        },
        findCheckboxDragAndDrop: function(fieldName){
            let elements = document.querySelectorAll(`ul.list-group[class*="group-"][class*="${fieldName}"]`);
            if (!elements || elements.length == 0){
                return null;
            }
            let filteredElements = [];
            elements.forEach((item)=>{
                let filteredClasses = [];
                item.classList.forEach((className)=>{if(className.slice(-fieldName.length) == fieldName) filteredClasses.push(className)})
                if (filteredClasses.length > 0){
                    filteredElements.push(item);
                }
            });
            if (filteredElements.length == 0) return null
            let inputsNodes = []
            filteredElements.forEach((item)=>{
                let inputs = item.querySelectorAll('input[type=checkbox]');
                if (inputs && inputs.length > 0){
                    inputs.forEach((input)=>{
                        inputsNodes.push(input);
                    });
                }
            });
            return (inputsNodes.length == 0) ? null : {
                type: "checkboxdraganddrop",
                nodes: inputsNodes,
                formId: this.extractFormIdForCheckoxDragAndDrop(filteredElements[0].classList) // keep only the first one
            };
        },
        extractFormIdForCheckoxTag: function (classList){
            let formId = "";
            classList.forEach((className)=>{
                let match = className.match(/^(?:radiofiche|checkboxfiche|enumlevel2)([0-9]*)[A-Za-z0-9_\-]+$/)
                if (match && match[1].length > 0){
                    formId = match[1]
                }
            });
            return formId;
        },
        findCheckboxTag: function(fieldName){            
            let elements = document.querySelectorAll(`input[class$=${fieldName}].yeswiki-input-entries`);
            return (!elements || elements.length == 0) ? null : {
                    type: "checkboxtag",
                    node: elements[0],
                    formId: this.extractFormIdForCheckox(filteredElements[0].classList) // keep only the first one
                };
        },
        extractFormIdForList: function (name){
            return ((name).match(/^(?:listefiche|enumlevel2)([0-9]*)[A-Za-z0-9_\-]+$/) || ["",""])[1];
        },
        findList: function(fieldName){
            let elements = document.querySelectorAll(`select[name$=${fieldName}]`);
            return (!elements || elements.length == 0)
                ? null
                : {
                    type: "select",
                    node: elements[0],
                    formId: this.extractFormIdForList(elements[0].getAttribute('name'))
                };
            },
        extractFormIdForRadio: function (name){
            return ((name).match(/^(?:radiofiche|enumlevel2)([0-9]*)[A-Za-z0-9_\-]+$/) || ["",""])[1];
        },
        findRadio: function(fieldName){
            let elements = document.querySelectorAll(`input[name$=${fieldName}][type=radio]`);
            if (!elements || elements.length == 0){
                return null;
            }
            let inputsNodes = [];
            elements.forEach((item)=>{
                inputsNodes.push(item);
            });
            return {
                    type: "radio",
                    nodes: inputsNodes,
                    formId: this.extractFormIdForRadio(elements[0].getAttribute('name'))
            };
        },
        findField: function(name){
            let field = this.findCheckbox(name) ||
                this.findCheckboxDragAndDrop(name) ||
                this.findCheckboxTag(name) ||
                this.findList(name) ||
                this.findRadio(name) ||
                null;
            return field;
        },
        getCheckboxValues: function (nodes){
            let values = [];
            nodes.forEach((node)=>{
                if (node.checked){
                    let name = node.getAttribute('name');
                    let value = name.match(/\[[A-Za-z0-9_-]+\]/)[0];
                    value = value.substr(1,value.length-2);
                    values.push(value);
                }
            });
            return values;
        },
        getCheckboxTagValues: function (node){
            let values = [];
            let value = node.value;
            if (value.trim() != ""){
                values = value.split(",");
            }
            return values;
        },
        getRadioValues: function (nodes){
            let values = [];
            nodes.forEach((node)=>{
                if (node.checked){
                    values.push(node.value);
                }
            });
            return values;
        },
        getSelectValues: function (node){
            let values = [];
            let value = node.value;
            if (value.length > 0){
                values.push(value)
            }
            return values;
        },
        getParentFieldNameValues: function(fieldData){
            switch (fieldData.type) {
                case "checkbox":
                case "checkboxdraganddrop":
                    return this.getCheckboxValues(fieldData.nodes);
                case "checkboxtag":
                    return this.getCheckboxTagValues(fieldData.node);
                case "radio":
                    return this.getRadioValues(fieldData.nodes);
                case "select":
                    return this.getSelectValues(fieldData.node);
                default:
                    break;
            }
            return [];
        },
        asyncGetForm: function (formId, successFunction){
            if (this.forms.hasOwnProperty(formId)){
                successFunction(this.forms[formId]);
            } else if (this.formsLoadedFunctions.hasOwnProperty(formId)) {
                // append success function to formsLoadedFunctions instead of start a new xhr
                this.formsLoadedFunctions[formId].push(successFunction);
            } else {
                this.formsLoadedFunctions[formId] = [successFunction];
                // 1. Create a new XMLHttpRequest object
                let xhr = new XMLHttpRequest();
                // 2. Configure it: GET-request
                xhr.open('GET',wiki.url(`?api/forms/${formId}`));
                // 3. Listen load
                xhr.onload = () =>{
                    if (xhr.status == 200){
                        let responseDecoded = JSON.parse(xhr.response);
                        if (responseDecoded && responseDecoded.hasOwnProperty('bn_id_nature') &&
                            responseDecoded.bn_id_nature == formId){
                            this.forms[formId] = responseDecoded;
                            this.formsLoadedFunctions[formId].forEach((funtionName)=>{funtionName(this.forms[formId])})
                        }
                    }
                }
                // 4. Send the request over the network
                xhr.send();
            }
        },
        appendChildrenFieldsPropertyNamestoParentForm: function(form,parentField){
            if (!form.hasOwnProperty('childrenFieldsPropertyNames')){
                form.childrenFieldsPropertyNames = {};
                parentField.childrenIds.forEach((childId)=>{
                    let childFormId = this.levels2[childId].formId;
                    // TODO manage Liste instead of formId
                    if (childFormId.length > 0){
                        let prepared = (Array.isArray(form.prepared))
                            ? form.prepared
                            : (
                                typeof form.prepared == "object"
                                ? Object.values(form.prepared)
                                : []
                            );

                        prepared.forEach((field)=> {
                            if (["checkbox","checkboxfiche","radio","radiofiche","liste","listefiche","enumlevel2"]
                                .includes(field.type) && field.linkedObjectName == childFormId){
                                if (!form.childrenFieldsPropertyNames.hasOwnProperty(childId)){
                                    form.childrenFieldsPropertyNames[childId] = {};
                                }
                                form.childrenFieldsPropertyNames[childId][field.propertyname] = field
                            }
                        });
                    }
                });
            }
        },
        asyncGetEntry: function (entryId,nextFunction){
            if (this.entries.hasOwnProperty(entryId)){
                nextFunction(this.entries[entryId]);
            } else {
                // 1. Create a new XMLHttpRequest object
                let xhr = new XMLHttpRequest();
                // 2. Configure it: GET-request
                xhr.open('GET',wiki.url(`?api/entries/json/${entryId}`));
                // 3. Listen load
                xhr.onload = () =>{
                    if (xhr.status == 200){
                        let responseDecoded = JSON.parse(xhr.response);
                        if (responseDecoded && typeof responseDecoded == "object"){
                            let firstValue = Object.values(responseDecoded)[0];
                            if (firstValue.hasOwnProperty('id_fiche') &&
                                firstValue.id_fiche == entryId){
                                this.entries[entryId] = firstValue;
                                nextFunction(this.entries[entryId]);
                            }
                        }
                    } else {
                        nextFunction(null);
                    }
                }
                // 4 .listen error
                xhr.onerror = () => {
                    nextFunction(null);
                };
                // 5. Send the request over the network
                xhr.send();
            }
        },
        asyncGetParentEntries: function(entriesIds,nextFunction){
            if (entriesIds.length == 0){
                nextFunction();
                return;
            }
            let restEntriesIds = [...entriesIds];
            let currentEntry = restEntriesIds.shift(restEntriesIds);
            if (!currentEntry ||currentEntry.length == 0){
                if (restEntriesIds.length == 0){
                    nextFunction();
                    return;
                } else {
                    this.asyncGetParentEntries(restEntriesIds,nextFunction)
                }
            }
            this.asyncGetEntry(currentEntry,() => {
                if (restEntriesIds.length == 0){
                    nextFunction();
                } else {
                    this.asyncGetParentEntries(restEntriesIds,nextFunction)
                }
            })
        },
        asyncGetAvailableSecondLevelsValues: function(parentForm,parentField,values,nextFunction){
            if (!parentForm.hasOwnProperty('childrenFieldsPropertyNames')){
                this.appendChildrenFieldsPropertyNamestoParentForm(parentForm,parentField);
            }
            this.asyncGetParentEntries(values,()=>{
                let secondLevelValues = {};
                parentField.childrenIds.forEach((childId)=>{
                    secondLevelValues[childId] = [];
                    if (parentForm.childrenFieldsPropertyNames.hasOwnProperty(childId)){
                        values.forEach((parentEntryId)=>{
                            if (this.entries.hasOwnProperty(parentEntryId)){
                                let parentEntry = this.entries[parentEntryId];
                                for (let propName in parentForm.childrenFieldsPropertyNames[childId]){
                                    if (parentEntry.hasOwnProperty(propName) && 
                                        typeof parentEntry[propName] == "string" && 
                                        parentEntry[propName].length > 0){ 
                                        parentEntry[propName].split(',').forEach((entryId)=>{
                                            if (!secondLevelValues[childId].includes(entryId)){
                                                secondLevelValues[childId].push(entryId);
                                            }
                                        })
                                        }
                                }
                            }
                        })
                    }
                });
                nextFunction(secondLevelValues);
            })
        },
        extractInputCheckboxValue: function(node){
            let name = node.getAttribute('name');
            let match = name.match(/\[[A-Za-z0-9_\-]+\]$/);
            if (!match) return ""
            return match[0].slice(1,-1);
        },
        updateSecondLevel: function(secondLevelValues){
            let nodesForWhatDispatchChangeEvent = [];
            for (const childId in secondLevelValues) {
                let field = this.levels2[childId];
                switch (field.type) {
                    case "checkbox":
                    case "checkboxdraganddrop":
                        field.nodes.forEach((node)=>{
                            let currentValue = this.extractInputCheckboxValue(node);
                            let baseNode = (field.type == "checkbox") ? node.parentNode.parentNode : node.parentNode
                            if (field.type == "checkboxdraganddrop"){
                                baseNode.classList.add('enumlevel2-baseNode')
                            }
                            if (secondLevelValues[childId].includes(currentValue)){
                                if (baseNode.classList.contains('enumlevel2-backup')){
                                    let oldValue = node.dataset.hasOwnProperty('wasChecked') && ([1,true,"true","1"].includes(node.dataset.wasChecked));
                                    nodesForWhatDispatchChangeEvent.push(node);
                                    baseNode.classList.remove('enumlevel2-backup');
                                    if (node.checked != oldValue){
                                        node.dispatchEvent(new Event("click"))
                                    }
                                }
                            } else if (!baseNode.classList.contains('enumlevel2-backup')) {
                                node.dataset.wasChecked = node.checked;
                                baseNode.classList.add('enumlevel2-backup');
                                if (node.checked){
                                    node.dispatchEvent(new Event("click"))
                                }
                            }
                        })
                        return;
                    case "checkboxtag":
                    case "radio":
                        let radioBtnToCheck = [];
                        field.nodes.forEach((node)=>{
                            let currentValue = node.value;
                            let baseNode = node.parentNode.parentNode;
                            if (secondLevelValues[childId].includes(currentValue)){
                                if (baseNode.classList.contains('enumlevel2-backup')){
                                    let oldValue = node.dataset.hasOwnProperty('wasChecked') && ([1,true,"true","1"].includes(node.dataset.wasChecked));
                                    baseNode.classList.remove('enumlevel2-backup');
                                    if (oldValue){
                                        radioBtnToCheck.push(node);
                                    }
                                } else if (node.checked){
                                    radioBtnToCheck.push(node);
                                }
                            } else if (!baseNode.classList.contains('enumlevel2-backup')) {
                                node.dataset.wasChecked = node.checked;
                                baseNode.classList.add('enumlevel2-backup');
                                if (node.checked){
                                    node.dispatchEvent(new Event("click"))
                                }
                            } else if (node.checked){
                                node.dispatchEvent(new Event("click"))

                            }
                        })
                        radioBtnToCheck.forEach((node,index)=>{
                            if (index == 0){
                                if (!node.checked){
                                    node.dispatchEvent(new Event("click"))
                                }
                            } else if (node.checked){
                                node.dispatchEvent(new Event("click"))
                            }
                        });
                        return;
                    case "select":
                        let selectOptionsToSelect = [];
                        let visiblesOptions = [];
                        let options = field.node.querySelectorAll('option') || [];
                        options.forEach((node)=>{
                            let currentValue = node.value;
                            let baseNode = node;
                            if (secondLevelValues[childId].includes(currentValue)){
                                visiblesOptions.push(node);
                                if (baseNode.classList.contains('enumlevel2-backup')){
                                    let oldValue = node.dataset.hasOwnProperty('wasChecked') && ([1,true,"true","1"].includes(node.dataset.wasChecked));
                                    baseNode.classList.remove('enumlevel2-backup');
                                    if (oldValue){
                                        selectOptionsToSelect.push(node);
                                    }
                                } else if (currentValue == field.node.value){
                                    selectOptionsToSelect.push(node);
                                }
                            } else if (!baseNode.classList.contains('enumlevel2-backup')) {
                                node.dataset.wasChecked = (currentValue == field.node.value);
                                baseNode.classList.add('enumlevel2-backup');
                            }
                        })
                        if (selectOptionsToSelect.length > 0){
                            field.node.value = selectOptionsToSelect[0].value;
                        } else if (visiblesOptions.length == 1) {
                            field.node.value = visiblesOptions[0].value;
                        } else {
                            field.node.value = "";
                        }
                    default:
                        break;
                }
            }
            let event = new Event("change");
            nodesForWhatDispatchChangeEvent.forEach((node)=>{node.dispatchEvent(event)});
        },
        updateChildren: function(parentField){
            if (parentField.formId.length > 0){
                let values = this.getParentFieldNameValues(parentField);
                this.asyncGetForm(parentField.formId,(form)=>{
                    this.asyncGetAvailableSecondLevelsValues(form,parentField,values,(secondLevelValues)=>{
                        this.updateSecondLevel(secondLevelValues);
                    });
                })
            }
        },
        resolveChange: function(parentFieldName){
            if (!this.parents.hasOwnProperty(parentFieldName)){
                return null;
            }
            this.updateChildren(this.parents[parentFieldName]);
        },
        registerTriggersOnParents: function(){
            for (const parentFieldName in this.parents){
                if (this.parents[parentFieldName].node){
                    this.parents[parentFieldName].node.onchange = () => {
                        this.resolveChange(parentFieldName);
                    };
                }
                if (this.parents[parentFieldName].nodes){
                    this.parents[parentFieldName].nodes.forEach((node)=>{
                        node.onchange = () => {
                            this.resolveChange(parentFieldName);
                        };
                    })
                }
            }
        },
        init: function(){
            let elements = document.querySelectorAll(".enum-two-level-data");
            if (elements && elements.length > 0){
                elements.forEach((element)=>this.importElement(element))
            }
            this.registerTriggersOnParents();
            // init
            for (const parentFieldName in this.parents){
                this.updateChildren(this.parents[parentFieldName]);
            }
        }
    },
    initData: function(){
        this.methods.parent = this;
        // init data -- not needed with VueJs
        let data = this.data();
        for(const key in data){
            this.methods[key] = data[key];
        }

    },
    mounted: function(){
        this.initData(); // not needed with VueJs
        this.methods.init(); // replace by this.init() in VueJs
    }
};

enumlevel2Helper.mounted();