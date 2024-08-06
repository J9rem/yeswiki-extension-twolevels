/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const canShowAnd = (root) => {
    return (root.params.intrafiltersmode === 'and')
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

export default {
    canShowAnd,
    filterEntriesSync
}