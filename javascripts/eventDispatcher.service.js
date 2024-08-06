/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import eventsRegistry from './events.registry.js'

/** data */

const events = {}

/** methods */

const addEvent = (eventName, listener, once = false) => {
    eventsRegistry.add(eventName,listener,once)
}
const addEventOnce = (eventName, listener) => {
    addEvent(eventName,listener,true)
}

const triggerEvent = (eventName) => {
    eventsRegistry.get(eventName)?.forEach((listener) => {
        listener.setTriggered(true)
    })
}

const cleanEvent = (eventName) => {
    eventsRegistry.set(
        eventName,
        eventsRegistry.get(eventName)?.filter(
            (listener) => {
                return !listener.getOnce() || !listener.getTriggered()
            }
        )
    )
}

const dispatchEvent = (eventName, param = undefined) => {
    
    eventsRegistry.get(eventName)?.forEach((listener) => {
        listener.setTriggered(true)
        if (param != undefined){
            listener.getListener()(param)
        } else {
            listener.getListener()()
        }
    })
    cleanEvent(eventName)
}

export default {
    addEventOnce,
    dispatchEvent
}
