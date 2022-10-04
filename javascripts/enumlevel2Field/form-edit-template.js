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
  .find("select[name=subtype]:not(.initialized)")
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
        subtype: {
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
        3: "parentFieldName",
        7: "subtype"
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

yesWikiTypes = {
  ...yesWikiTypes,
  ...{
    enumlevel2checkboxfiche: {
      type: "enumlevel2",
      subtype: "checkboxfiche"
    },
    enumlevel2checkboxfichetags: {
      type: "enumlevel2",
      subtype: "checkboxfichetags"
    }
  }
};