/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import filtersService from './filters.service.js'
import utils from './RootVueJsComponentUtil.js'

const parentValueIsChecked = (parentValue,parentField,option)=>{
    return (parentValue in parentField.secondLevelValues)
        ? parentField.secondLevelValues[parentValue].includes(option.value)
        : false
}

const getParentValues = (parentFilter) => {
    return (parentFilter?.list ?? parentFilter?.nodes ?? [])
        .filter((option)=>option.checked)
        .map(option=>option.value)
}

const updateOptionsVisibility = (fieldName, optionData, root, nodes) => {
    if (fieldName in optionData.options){
        const childField = optionData.options[fieldName]
        const parentFilter = filtersService.getFilterFromPropName(childField?.parentId ?? '', root.filters)
        if (childField.parentId
            && childField.parentId.length > 0
            && childField.parentId in optionData.parents
            && parentFilter){
            const parentField = optionData.parents[childField.parentId]
            const parentValues = getParentValues(parentFilter)
            for (let index = 0; index < nodes.length; index++) {
                const option = nodes[index]
                option.hide = utils.canShowAnd(root)
                    ? !parentValues.every((parentValue)=>parentValueIsChecked(parentValue,parentField,option))
                    : !parentValues.some((parentValue)=>parentValueIsChecked(parentValue,parentField,option))
            }
        }
    }
}
const updateParentsVisibility = (fieldName, optionData, nodes) => {
    if (fieldName in optionData.parents){
        for (let index = 0; index < nodes.length; index++) {
            const option = nodes[index]
            option.forceShow = true
        }
    }
}

const updateVisibilityIfSublevel = (root) => {
    if (!utils.isSubLevel(root)){
        return
    }
    const optionData = utils.getOptionData(root)
    Object.entries(root.filters).forEach(([key,filter])=>{
        const fieldName = filter?.propName ?? key
        const nodes = filter?.list ?? filter.nodes
        updateOptionsVisibility(fieldName, optionData, root, nodes)
        updateParentsVisibility(fieldName, optionData, nodes)
    })
}

export default {
    updateVisibilityIfSublevel
}