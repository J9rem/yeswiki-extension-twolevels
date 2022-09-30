/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */


// when selecting between data source lists or forms, we need to populate again the listOfFormId select with the
// proper set of options

var updateEnum2LevelList = function (element) {
  $(element).addClass("initialized");
  var visibleSelect = $(element)
    .closest(".form-field")
    .find("select[name=listeOrFormId]");
  selectedValue = visibleSelect.val();
  visibleSelect.empty();
  let val = $(element).val();
  let type = val.match(/^(?:radio|checkbox|liste)fiche.*$/i) ? 'form' : 'list';
  var optionToAddToSelect = $(element)
    .closest(".form-field")
    .find("select[name=" + type + "Id] option");
  visibleSelect.append(new Option("", "", false));
  optionToAddToSelect.each(function () {
    var optionKey = $(this).attr("value");
    var optionLabel = $(this).text();
    var isSelected = optionKey == selectedValue;
    var newOption = new Option(optionLabel, optionKey, false, isSelected);
    visibleSelect.append(newOption);
  });
};
var initEnum2Level = function(){
  $(".enumlevel2-field")
  .find("select[name=enumSubtype]:not(.initialized)")
  .change(function(event){updateEnum2LevelList(event.target)})
  .trigger("change");
};

var selectConfWithoutSubtype2 = {...selectConf};
delete selectConfWithoutSubtype2.subtype2;

typeUserAttrs = {
  ...typeUserAttrs,
  ...{
    enumlevel2: {
      ...{
        parentFieldName: {
          label: _t('TWOLEVELS_ENUM_FIELD_PARENTFIELDNAME_LABEL'),
          value: ""
        },
        parentFormId: {
          label: _t('TWOLEVELS_ENUM_FIELD_PARENTFORMID_LABEL'),
          value: ""
        },
        enumSubtype: {
          label: _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_LABEL'),
          options: {
            "checkbox": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_CHECKBOX'),
            "radio": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_RADIO'),
            "liste": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_LISTE'),
            "checkboxtags": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_CHECKBOXTAGS'),
            "radiotags": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_RADIOTAGS'),
            "checkboxdragndrop": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_CHECKBOXDRAGNDROP'),
            "radiodragndrop": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_RADIODRAGNDROP'),
            "checkboxfiche": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_CHECKBOXFICHE'),
            "radiofiche": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_RADIOFICHE'),
            "listefiche": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_LISTEFICHE'),
            "checkboxfichetags": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_CHECKBOXFICHETAGS'),
            "radiofichetags": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_RADIOFICHETAGS'),
            "checkboxfichedragndrop": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_CHECKBOXFICHEDRAGNDROP'),
            "radiofichedragndrop": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_RADIOFICHEDRAGNDROP'),
          },
        }
      },
      ...selectConfWithoutSubtype2,
      ...{
        queries: {
          label: _t('BAZ_FORM_EDIT_QUERIES_LABEL'),
          value: "",
          placeholder: "ex. : checkboxfiche6=PageTag ; cf. https://yeswiki.net/?LierFormulairesEntreEux",
        },
      },
    },
  }
};

templates = {
  ...templates,
  ...{
    enumlevel2: function (field) {
      return { 
        field: `
          <div class="checkbox-group">
            <div class="formbuilder-checkbox">
              <input type="checkbox" id="${field.name}-preview-1" name="${field.name}" value="option-1" checked="checked"/>
              <label for="${field.name}-preview-1">Option 1</label>
              <input type="checkbox" id="${field.name}-preview-2" name="${field.name}" value="option-2" checked="checked"/>
              <label for="${field.name}-preview-2">Option 2</label>
            </div>
            <label>Deux niveaux</label>
          </div>
          ` ,
        onRender: function(){
          initEnum2Level();
          templateHelper.defineLabelHintForGroup(field,'parentFieldName',_t('TWOLEVELS_ENUM_FIELD_PARENTFIELDNAME_HINT'));
          templateHelper.defineLabelHintForGroup(field,'parentFormId',_t('TWOLEVELS_ENUM_FIELD_PARENTFORMID_HINT'));
        },
      };
    },
  }
};

yesWikiMapping = {
  ...yesWikiMapping,
  ...{
    enumlevel2: {
      ...lists,
      ...{
        7: "enumSubtype"
      }
    },
  }
};

fields.push({
    label: _t('TWOLEVELS_ENUM_FIELD_LABEL'),
    name: "enumlevel2",
    attrs: { type: "enumlevel2" },
    icon: '<i class="fas fa-list-ul"></i>',
  });

// transform a json object like "{ type: 'texte', name: 'bf_titre', label: 'Nom' .... }"
// into wiki text like "texte***bf_titre***Nom***255***255*** *** *** ***1***0***"
if (typeof formatJsonDataIntoWikiText == "undefined"){
  var formatJsonDataIntoWikiText = null;
}
formatJsonDataIntoWikiText = function(formData) {
  if (formData.length == 0) return null;
  var wikiText = "";

  for (var i = 0; i < formData.length; i++) {
    var wikiProps = {};
    var formElement = formData[i];
    var mapping = yesWikiMapping[formElement.type];

    for (var type in yesWikiTypes)
      if (
        formElement.type == yesWikiTypes[type].type &&
        (!formElement.subtype ||
          !yesWikiTypes[type].subtype ||
          formElement.subtype == yesWikiTypes[type].subtype) &&
        (!formElement.subtype2 ||
          formElement.subtype2 == yesWikiTypes[type].subtype2)
      ) {
        wikiProps[0] = type;
        break;
      }
    // for non mapped fields, we just keep the form type
    if (!wikiProps[0]) wikiProps[0] = formElement.type;
    
    // fix for url field which can be build with textField or urlField
    if (wikiProps[0]) wikiProps[0] = wikiProps[0].replace('_bis', '') 

    for (var key in mapping) {
      var property = mapping[key];
      if (property != "type") {
        var value = formElement[property];
        if (["required", "access"].indexOf(property) > -1)
          value = value ? "1" : "0";
        if (property == "label"){
          wikiProps[key] = removeBR(value).replace(/\n$/gm,"");
        } else {
          wikiProps[key] = value ;
        }
      }
    }
    // === customized part ====
    if (formElement.type == "enumlevel2") {
      wikiProps["3"] = `${formElement.parentFieldName || ''}|${formElement.parentFormId || ''}`;
    }
    // === end of customized part ====

    maxProp = Math.max.apply(Math, Object.keys(wikiProps));
    for (var j = 0; j <= maxProp; j++) {
      wikiText += wikiProps[j] || " ";
      wikiText += "***";
    }
    wikiText += "\n";
  }
  return wikiText;
}

// transform text with wiki text like "texte***bf_titre***Nom***255***255*** *** *** ***1***0***"
// into a json object "{ type: 'texte', name: 'bf_titre', label: 'Nom' .... }"
if (typeof parseWikiTextIntoJsonData == "undefined"){
  var parseWikiTextIntoJsonData = null;
}
parseWikiTextIntoJsonData= function(text) {
  var result = [];
  var text = text.trim();
  var textFields = text.split("\n");
  for (var i = 0; i < textFields.length; i++) {
    var textField = textFields[i];
    var fieldValues = textField.split("***");
    var fieldObject = {};
    if (fieldValues.length > 1) {
      var wikiType = fieldValues[0];
      var fieldType =
        wikiType in yesWikiTypes ? yesWikiTypes[wikiType].type : wikiType;
      // check that the fieldType really exists in our form builder
      if (!(fieldType in yesWikiMapping)) fieldType = "custom";

      var mapping = yesWikiMapping[fieldType];

      fieldObject["type"] = fieldType;
      fieldObject["subtype"] =
        wikiType in yesWikiTypes ? yesWikiTypes[wikiType].subtype : "";
      fieldObject["subtype2"] =
        wikiType in yesWikiTypes ? yesWikiTypes[wikiType].subtype2 : "";
      var start = fieldType == "custom" ? 0 : 1;
      for (var j = start; j < fieldValues.length; j++) {
        var value = fieldValues[j];
        var field = mapping && j in mapping ? mapping[j] : j;
        if (field == "required") value = value == "1" ? true : false;
        if (field){
          if (field == "read" || field == "write" || field == "comment"){
            fieldObject[field] = (value.trim() === "") ? [" * "] : value.split(',');
          } else {
            fieldObject[field] = value;
          }
        }
      }
      if (!fieldObject.label) {
        fieldObject.label = wikiType;
        for (var k = 0; k < fields.length; k++)
          if (fields[k].name == wikiType) fieldObject.label = fields[k].label;
      }
      
      // === customized part ====
      if (wikiType == "enumlevel2") {
        let options = (fieldValues[3] || '').split('|');
        fieldObject.parentFieldName = options[0] || '';
        fieldObject.parentFormId = options[1] || '';
      }
      // === end of customized part ====
      result.push(fieldObject);
    }
  }
  return result;
}