/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Event {

    #listener
    #name
    #once
    #triggered

    constructor(name, listener, once = false) {
        this.#name = name
        this.#triggered = false
        this.#listener = typeof listener === 'function' ? listener : null
        this.#once = once === true
    }

    getListener(){
        return this.#listener
    }

    getName(){
        return this.#name
    }

    getOnce(){
        return this.#once
    }

    getTriggered(){
        return this.#triggered
    }

    setTriggered(newState){
        this.#triggered = newState === true
    }
}

export default Event