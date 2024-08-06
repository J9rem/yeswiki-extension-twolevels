/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Event from './event.prototype.js'
import Registry from './registry.prototype.js'

const registry = new Registry()

/* methods */
const add = (eventName, listener, once = false) => {
    registry.add(eventName, new Event(eventName, listener, once))
}
const get = (eventName) => {
    return registry.get(eventName)
}
const set = (eventName, events) => {
    registry.set(eventName, events)
}

export default {
    add,
    get,
    set
}