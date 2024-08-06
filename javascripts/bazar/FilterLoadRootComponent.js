/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import utils from './RootVueJsComponentUtil.js'

export default {
    props: ['root'],
    data: function(){
        return {
            actions: {
                filteredEntries: 'updateFilteredEntries',
                params: 'processParams'
            },
            unwatcher: {}
        };
    },
    methods: {
        processParams: function(){
            this.unwatcher.params();
            if (utils.canShowAnd(this.root)){
                this.registerWatcher('filteredEntries');
            }
        },
        registerWatcher: function(varname){
            if (varname in this.actions && typeof this[this.actions[varname]] == "function"){
                this.unwatcher[varname] = this.root.$watch(varname,()=>(this[this.actions[varname]])())
            }
        },
        updateFilteredEntries: function(){
            if (Object.keys(this.root.computedFilters).length > 0){
                const results = utils.filterEntriesSync(this.root.searchedEntries,this.root)
                this.unwatcher.filteredEntries();
                this.root.filteredEntries = results
                this.registerWatcher('filteredEntries');
                this.root.paginateEntries();
            }
        }
    },
    mounted(){
        this.registerWatcher('params');
    },
    template: `
    <span v-show="false"></span>
    `
}