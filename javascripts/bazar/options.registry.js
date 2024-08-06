/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import Registry from '../registry.prototype.js'

const registry = new Registry()
const defaultOption =
    {
        options: {},
        parents: {}
    }

/* methods */
const getAndInitIfNeeded = (uuid) => {
    const stringifiedUUID = String(uuid)
    if (get(stringifiedUUID) === null) {
        // creation
        registry.add(stringifiedUUID, [])
        registry.set(stringifiedUUID, {...defaultOption})
    }
    return get(stringifiedUUID)
}

const get = (uuid) => {
    return registry.get(String(uuid))
}

const getOptions = (uuid) => {
    return registry.get(String(uuid))?.options ?? {}
}

const getParents = (uuid) => {
    return registry.get(String(uuid))?.parents ?? {}
}

export default {
    getAndInitIfNeeded,
    get,
    getOptions,
    getParents
}