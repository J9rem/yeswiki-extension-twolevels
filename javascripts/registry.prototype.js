/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

class Registry {
    #cache

    constructor(){
        this.#cache = {}
    }

    add(name, value) {
        if (typeof name === "string"){
            if (!(name in this.#cache)){
                this.#cache[name] = []
            }
            this.#cache[name].push(value)
        }
    }

    get(name) {
        return typeof name === "string" ? (this.#cache?.[name] ?? null) : null
    }
    
    set(name, value) {
        if (typeof name === "string" && name in this.#cache) {
            this.#cache[name] = value
        }
    }
}

export default Registry
