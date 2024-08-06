/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import eventDispatcher from './eventDispatcher.service.js'

class WikiDataLoader {

    #eventPrefix
    #id
    #cacheName
    #testFunction
    #url

    /**
     * 
     * @param {string} url 
     * @param {string} id 
     * @param {string} eventPrefix 
     * @param {string} cacheName 
     * @param {function} testFunction
     * @throws {Error} if testFunction is not a function
     */
    constructor(
        url,
        id,
        eventPrefix,
        cacheName,
        testFunction) {
        this.#url = url
        this.#id = id
        this.#eventPrefix = eventPrefix
        this.#cacheName = cacheName
        this.#testFunction = testFunction
        if (typeof testFunction != "function"){
            throw new Error("'testFunction' should be a function")
        }
    }

    async load() {
        return await eventDispatcher.manageInternalEvents(
            this.#id,
            this.#eventPrefix,
            this.#cacheName,
            async ()=>{
                return fetch(this.#url)
                    .then((response)=>{
                        if (!response.ok){
                            throw `response not ok when fetching ${this.#url}`
                        } else {
                            return response.json()
                        }
                    })
                    .then((json)=>{
                        if (!this.#testFunction.call(this,json)){
                            throw 'response badly formatted'
                        }
                        return json
                    })
            }
        )
    }

    static assertIsRegularFormId(formId) {
        if (
            typeof formId != "string"
            || formId.length == 0
            || Number(formId) < 1
        ){
            throw `'formId' as parameter as 'getForm' should be a not empty string representing a postive integer`
        }
    }
}

export default WikiDataLoader