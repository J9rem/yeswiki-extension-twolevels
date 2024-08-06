/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import eventsRegistry from './events.registry.js'
import Registry from './registry.prototype.js'

/** cache */
const registry = new Registry()

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

const dispatchEvent = (eventName, args = undefined) => {
    eventsRegistry.get(eventName)?.forEach((listener) => {
        listener.setTriggered(true)
        if (args != undefined){
            listener.getListener().apply(null,args)
        } else {
            listener.getListener().call(null)
        }
    })
    cleanEvent(eventName)
}

const resetLoading = (id,cacheName) => {
    registry.set(
        cacheName,
        registry.get(cacheName)?.filter((idToCheck) => idToCheck != id )
    )
}

const manageInternalEvents = async (id,eventPrefix,cacheName,asynFunc)=>{
    let p = new Promise((resolve,reject)=>{
        const readyName = `${eventPrefix}.${id}.ready`
        const errorName = `${eventPrefix}.${id}.error`
        addEventOnce(readyName,(...args)=>resolve(...args))
        addEventOnce(errorName,(e)=>reject(e))
        if (!(registry.get(cacheName)?.includes(id) ?? false)) {
            registry.add(cacheName, id)
            
            addEventOnce(errorName,() => resetLoading(id,cacheName))
            addEventOnce(readyName,() => resetLoading(id,cacheName))
            addEventOnce(readyName,()=>{
                triggerEvent(errorName)
            })
            asynFunc()
                .catch((e) => {
                    dispatchEvent(errorName,[e])
                })
                .then((...args)=>{
                    dispatchEvent(readyName, args)
                    return true
                })
                .catch((e)=>console.error(e))
        }
    })
    return await p
}

export default {
    manageInternalEvents
}
