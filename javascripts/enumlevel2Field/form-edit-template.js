/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

(function(){
  var field = getEnum2LevelField(selectConf,templateHelper,lists)
  window.typeUserAttrs = {
    ...window.typeUserAttrs,
    ...{
      [field.field.name]: field.attributes
    }
  }
  window.templates = {
    ...window.templates,
    ...{
      [field.field.name]: field.renderInput
    }
  }
  window.yesWikiMapping = {
    ...window.yesWikiMapping,
    ...{
      [field.field.name]: field.attributesMapping
    }
  }
  window.fields.push(field.field)
})()
