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
const allEntriesCache = {}

/** methods */
/**
 * @param {Object} responseDecoded 
 */
const allEntriesTestFunction = (responseDecoded) => {
    return (typeof responseDecoded == "object"
        || Array.isArray(responseDecoded))
}


    /**
     * @param {string} id 
     */
const load = async (id) => {
    WikiDataLoader.assertIsRegularFormId(id)
    if (id in allEntriesCache){
        return allEntriesCache[id]
    } else {
        return await (new WikiDataLoader(
            wiki.url(`?api/forms/${id}/entries`),
            id,
            'getAllEntries',
            'loadingAllEntries',
            allEntriesTestFunction
        )).load()
           .then((entries)=>{
            const entriesToSave = 
                Object.fromEntries(
                    (typeof entries == "object" ? Object.values(entries) : entries)
                    .filter((e)=>{
                        return typeof e.id_fiche === "string" &&
                            typeof e.id_typeannonce === "string" &&
                            typeof e.bf_titre === "string"
                    }).map((e)=>[e.id_fiche,e])
                )
                allEntriesCache[id] = entriesToSave
                return entriesToSave
           }) 
            .catch((e)=>{
                throw new Error(
                    `error when getting all Entries for form '${id}'`,
                    {cause:e}
                )
            })
    }
}

export default {
    load
}