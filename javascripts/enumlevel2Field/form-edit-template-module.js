/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import {selectConf,listsMapping} from '../../../bazar/presentation/javascripts/form-edit-template/fields/commons/attributes.js'
import templateHelper from '../../../bazar/presentation/javascripts/form-edit-template/fields/commons/render-helper.js'

window.formBuilderFields.enumlevel2 = getEnum2LevelField(selectConf,templateHelper,listsMapping)
