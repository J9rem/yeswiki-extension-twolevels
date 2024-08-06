/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

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

const canGetSecondValuesByForm = (parentField,formIdData) => {
    const res = parentField.isForm && (
            !(formIdData?.id?.length > 0) // no associatingForm => form
            || String(formIdData?.id) === String(parentField.linkedObjectId) // same as form for primary level
        )
    return res
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

export default {
    canGetSecondValuesByForm,
    extractFormIdData,
    getEntriesForThisField
}