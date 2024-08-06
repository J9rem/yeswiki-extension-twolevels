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
const forms = {}

/** methods */
/**
 * @param {Object} responseDecoded 
 */
const formTestFunction = (id, responseDecoded) => {
    if (responseDecoded
        && 'bn_id_nature' in responseDecoded
        && responseDecoded.bn_id_nature == id){
        return true
    } else {
        return false
    }
}


    /**
     * @param {string} id 
     */
const load = async (id) => {
    WikiDataLoader.assertIsRegularFormId(id)
    if (id in forms){
        return forms[id]
    } else {
        return await (new WikiDataLoader(
            wiki.url(`?api/forms/${id}`),
            id,
            'getForm',
            'loadingForms',
            (json) => formTestFunction(id,json)
        )).load()
           .then((form)=>{
                forms[id] = form
                return form
           }) 
            .catch((e)=>{
                throw new Error(
                    `error when getting form '${id}'`,
                    {cause:e}
                )
            })
    }
}

export default {
    load
}