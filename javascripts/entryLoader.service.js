/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import WikiDataLoader from './wikiDataLoader.prototype.js'

/** data */
const entriesCache = {}

/** methods */
/**
 * @param {Object} responseDecoded 
 */
const entryTestFunction = (responseDecoded) => {
    if (responseDecoded && typeof responseDecoded == "object"){
        let firstValue = Object.values(responseDecoded)[0]
        if ('id_fiche' in firstValue &&
            firstValue.id_fiche == entryId){
            return true
        } else {
            return false
        }
    } else {
        return false
    }
}

/**
 * 
 * @param {String} entryId 
 */
const assertIsRegularEntryId = (entryId)=>{
    if (
        typeof entryId != "string"
        || entryId.length == 0
        || String(Number(entryId)) === entryId) {
        throw `'entryId' as parameter as 'assertIsRegularEntryId' should be a not empty string and not representing a form number`
    }
}

/**
 * @param {string} id 
 */
const load = async (id) => {
    assertIsRegularEntryId(id)
    if (id in entriesCache){
        return entriesCache[id]
    } else {
        return await (new WikiDataLoader(
            wiki.url(`?api/entries/json/${id}`),
            id,
            'getEntry',
            'loadingEntries',
            entryTestFunction
        )).load()
           .then((entry)=>{
                entriesCache[id] = entry
                return entry
            }) 
            .catch((e)=>{
                throw new Error(
                    `error when getting entry '${id}'`,
                    {cause:e}
                )
            })
    }
}

export default {
    load
}