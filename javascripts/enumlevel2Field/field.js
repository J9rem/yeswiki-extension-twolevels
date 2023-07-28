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

const extractFromSave = function(base){
    const dataToSave = $(base)
      .find("input[type=text][name=dataToSave]")
      .first()
      
    var results = {
      parentFieldName: '',
      associatingForm: '',
      associatingField: ''
    }
    if (dataToSave && dataToSave.length > 0){
        const value = dataToSave.val().split('|')
        results.parentFieldName = value[0] || ''
        results.associatingForm = value[1] || ''
        results.associatingField = value[2] || ''
    }
    return results
}

const prepareToSave = function(base){
    const dataToSave = $(base)
      .find("input[type=text][name=dataToSave]")
      .first()
    if (dataToSave && dataToSave.length > 0){
      var results = {
        parentFieldName: '',
        associatingForm: '',
        associatingField: ''
      }
      const associations = {
        parentFieldName: 'input[type=text]',
        associatingForm: 'select',
        associatingField: 'input[type=text]'
      }
      for (const key in associations) {
          const fieldForAssociation = $(base)
              .find(`${associations[key]}[name=${key}]`)
              .first()
          if (fieldForAssociation && fieldForAssociation.length > 0){
            results[key] = fieldForAssociation.val() || ''
          }
      }
      dataToSave.val(`${results.parentFieldName}|${results.associatingForm}|${results.associatingField}`)
    }
}

const updateFieldEnum2Level = function (element,type) {
    const base = $(element).closest(".enumlevel2-field.form-field")
    if (!$(element).hasClass("initialized")){
      $(element).addClass("initialized");
      var formSave = extractFromSave(base)
      $(element).val(formSave[type])
    } else {
      prepareToSave(base)
    }
}

const updateEnum2LevelList = function (element) {
    const base = $(element).closest(".enumlevel2-field.form-field")
    $(element).addClass("initialized");
    var visibleSelect = $(base)
      .find("select[name=listeOrFormId]");
    var selectedValue = visibleSelect.val();
    visibleSelect.empty();
    let val = $(element).val();
    let type = val.match(/^(?:radio|checkbox|liste)fiche.*$/i) ? 'form' : 'list';
    var optionToAddToSelect = $(base)
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
const toggleAssociatingField = (target)=>{
    const baseLocal = $(target).closest(".enumlevel2-field.form-field")
    const associatingField = $(baseLocal).find('.form-group.associatingField-wrap')
    const subType = $(baseLocal).find('.form-group.subtype-wrap select[name=subtype]')
    const subTypeVal = (subType && subType.length > 0) ? subType.val() : ''
    if (associatingField && associatingField.length>0){
      if (target.value.length == 0 || subTypeVal.slice(-5) != 'fiche'){
        associatingField.hide()
      } else {
        associatingField.show()
      }
    }
}
const initEnum2Level = function(){
    const base = $(".enumlevel2-field")
    const selectSubtype = base.find("select[name=subtype]:not(.initialized)")
    const selectAssociatingForm = base.find("select[name=associatingForm]:not(.initialized)")
    const textParentFieldName = base.find("input[type=text][name=parentFieldName]:not(.initialized)")
    const textAssociatingField = base.find("input[type=text][name=associatingField]:not(.initialized)")
  
    selectSubtype.change(function(event){
      updateEnum2LevelList(event.target)
      toggleAssociatingField(event.target)
    })
    selectAssociatingForm.change(function(event){
      updateFieldEnum2Level(event.target,'associatingForm')
      toggleAssociatingField(event.target)
    })
    textParentFieldName.change(function(event){updateFieldEnum2Level(event.target,'parentFieldName')})
    textAssociatingField.change(function(event){updateFieldEnum2Level(event.target,'associatingField')})
  
    selectSubtype.trigger("change")
    selectAssociatingForm.trigger("change")
    textParentFieldName.trigger("change")
    textAssociatingField.trigger("change")
};

function getEnum2LevelField(selectConf,templateHelper,listsMapping,formAndListIds){
  
    const selectConfLocal = {...selectConf}
    delete selectConfLocal.subtype2

    window.yesWikiTypes = {
        ...window.yesWikiTypes,
        ...{
          enumlevel2checkbox: {type: "enumlevel2",subtype: "checkbox"},
          enumlevel2checkboxdragndrop: {type: "enumlevel2",subtype: "checkboxdragndrop"},
          enumlevel2checkboxtags: {type: "enumlevel2",subtype: "checkboxtags"},
          enumlevel2checkboxfiche: {type: "enumlevel2",subtype: "checkboxfiche"},
          enumlevel2checkboxfichedragndrop: {type: "enumlevel2",subtype: "checkboxfichedragndrop"},
          enumlevel2checkboxfichetags: {type: "enumlevel2",subtype: "checkboxfichetags"},
          enumlevel2radio: {type: "enumlevel2",subtype: "radio"},
          enumlevel2radiotags: {type: "enumlevel2",subtype: "radiotags"},
          enumlevel2radiofiche: {type: "enumlevel2",subtype: "radiofiche"},
          enumlevel2radiofichetags: {type: "enumlevel2",subtype: "radiofichetags"},
          enumlevel2liste: {type: "enumlevel2",subtype: "liste"},
          enumlevel2listefiche: {type: "enumlevel2",subtype: "listefiche"}
        }
      }

    return {
        field: {
          label: _t('TWOLEVELS_ENUM_FIELD_LABEL'),
          name: "enumlevel2",
          attrs: { type: "enumlevel2", subtype:"checkbox" },
          icon: '<i class="fas fa-list-ul"></i>',
        },
        attributes: {
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
                  "checkboxfiche": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_CHECKBOXFICHE'),
                  "radiofiche": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_RADIOFICHE'),
                  "listefiche": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_LISTEFICHE'),
                  "checkboxfichetags": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_CHECKBOXFICHETAGS'),
                  "radiofichetags": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_RADIOFICHETAGS'),
                  "checkboxfichedragndrop": _t('TWOLEVELS_ENUM_FIELD_SUBTYPE_CHECKBOXFICHEDRAGNDROP'),
              },
            },
            associatingForm: {
              label: _t('TWOLEVELS_ENUM_FIELD_ASSOCIATING_FORMID_LABEL'),
              options: {...{"":""},...window.formAndListIds.forms},
            },
            associatingField: {
              label: _t('TWOLEVELS_ENUM_FIELD_ASSOCIATING_FIELDID_LABEL'),
              value: ''
            },
            dataToSave: {
              label: 'dataToSave',
              value: ''
            }
        },
        ...selectConfLocal,
        ...{
          listId: {
            label: '',
            options: { ...window.formAndListIds.lists }
          },
          formId: {
            label: '',
            options: { ...window.formAndListIds.forms }
          },
        },
        ...{
            queries: {
              label: _t('BAZ_FORM_EDIT_QUERIES_LABEL'),
              value: "",
              placeholder: "ex. : checkboxfiche6=PageTag ; cf. https://yeswiki.net/?LierFormulairesEntreEux",
            },
        }
        },
        attributesMapping: {
        ...listsMapping,
        ...{
            3: "dataToSave",
            7: "subtype"
        }
        },
        renderInput(field) {
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
                templateHelper.defineLabelHintForGroup(field,'associatingForm',_t('TWOLEVELS_ENUM_FIELD_ASSOCIATING_FORMID_HINT'));
              },
          };
        },
    }
}