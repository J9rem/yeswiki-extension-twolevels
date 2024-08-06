/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

const getFilterFromPropName = (filterName, filters) => {
    return !(filterName?.length > 0)
        ? null
        : (
            filterName in filters
            ? filterName
            : filters.reduce((previousFilter, filter) => {
                return previousFilter !== null
                    ? previousFilter
                    : (
                        (
                            filter?.propName == filterName
                            || (
                                filter?.propName?.slice(-filterName.length) == filterName
                                && filter?.propName?.slice(0,-filterName.length)?.match(/^(liste|radio|checkbox)(Liste\S+|\d+)/)
                            )
                        )
                        ? filter
                        : null
                    )
            }, null)
        )
}

export default {
    getFilterFromPropName
}