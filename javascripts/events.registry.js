/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Event from './event.js'

/* data */
const eventsByName = {}

/* methods */
const add = (eventName, listener, once = false) => {
    if (typeof eventName === "string"){
        if (!(eventName in eventsByName)){
            eventsByName[eventName] = []
        }
        eventsByName[eventName].push(new Event(eventName, listener, once))
    }
}
const get = (eventName) => {
    return typeof eventName === "string" ? (eventsByName?.[eventName] ?? null) : null
}
const set = (eventName, events) => {
    if (typeof eventName === "string" && eventName in eventsByName) {
        eventsByName[eventName] = events
    }
}

export default {
    add,
    get,
    set
}