<?php

/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace YesWiki\Twolevels\Field;

use Psr\Container\ContainerInterface;
use YesWiki\Bazar\Field\BazarField;
use YesWiki\Bazar\Field\EnumField;
use YesWiki\Bazar\Field\CheckboxEntryField;
use YesWiki\Bazar\Field\CheckboxField;
use YesWiki\Bazar\Field\CheckboxListField;
use YesWiki\Bazar\Field\RadioEntryField;
use YesWiki\Bazar\Field\RadioListField;
use YesWiki\Bazar\Field\SelectEntryField;
use YesWiki\Bazar\Field\SelectListField;
use YesWiki\Bazar\Service\EntryManager;
use YesWiki\Bazar\Service\FormManager;

interface EnumLevel2Commons
{
    public function getdisplayMethod();
    public function getParentFieldName();

    /**
    * give the internal fieldtype
    * @return string
    */
    public function getInternalFieldType(): string;
}

class EnumLevel2CommonsField
{
    // fake class to prevent FieldFactory to create errors

    // define xonst here because can not be define in trait

    public const FIELD_FIELDNAME = 3;
    public const FIELD_DISPLAY_METHOD = 7;
}

trait EnumLevel2CommonsTrait
{
    protected $associatingFormId;
    protected $associatingFieldId;
    protected $displayMethod ;
    protected $parentFieldName;

    public function __construct(array $values, ContainerInterface $services)
    {
        // set local properties
        $this->displayMethod = $values[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD];
        $explodedParam = explode('|', trim((
            !empty($values[EnumLevel2CommonsField::FIELD_FIELDNAME]) &&
            is_string($values[EnumLevel2CommonsField::FIELD_FIELDNAME])
        ) ? $values[EnumLevel2CommonsField::FIELD_FIELDNAME] : ''));
        $this->parentFieldName = $explodedParam[0] ?? '';
        $this->associatingFormId = $explodedParam[1] ?? '';
        $this->associatingFormId = (empty($this->associatingFormId) || intval($this->associatingFormId) < 1) ? '' : strval(intval($this->associatingFormId));

        // remove values which must not be passed to parent constructor
        $internalValues = $values;
        $internalValues[parent::FIELD_TYPE] = $this->getInternalFieldType();
        $internalValues[EnumLevel2CommonsField::FIELD_FIELDNAME] = "";
        $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] =
            (preg_match("/^{$internalValues[parent::FIELD_TYPE]}(tags|dragndrop)$/", $this->displayMethod, $matches))
            ? $matches[1]
            : "";

            
        $this->associatingFieldId = $explodedParam[2] ?? '';
        $this->associatingFieldId = (
            !empty($this->associatingFieldId) && 
            !empty($this->associatingFormId) && 
            substr($internalValues[parent::FIELD_TYPE],-5) == 'fiche' // current is form
        ) ? strval($this->associatingFieldId) : '';

        // construct with parent
        parent::__construct($internalValues, $services);

        // reset size
        $this->size = null;
    }

    // Render the edit view of the field. Check ACLS first
    public function renderInputIfPermitted($entry)
    {
        return $this->render("@bazar/inputs/enum-level2.twig", [])
            .parent::renderInputIfPermitted($entry);
    }

    // Format input values before save
    public function formatValuesBeforeSaveIfEditable($entry, bool $isCreation = false)
    {
        // filter on authorized values according to parent level values
        $parentField = $this->getParentField($entry);
        if (!empty($parentField)) {
            $values = $this->getFieldValues($this, $entry);
            $parentValues = $this->getFieldValues($parentField, $entry);
            if (!empty($this->getAssociatingFormId())) {
                $formId = $this->formatFormId($this->getLinkedObjectName());
                $associatingFormId = $this->formatFormId($this->getAssociatingFormId());
                if (!empty($formId) && $formId == $associatingFormId){
                    $availableValues = $this->getAvailableChildrenValuesReverseFromForm($parentValues, $parentField->getLinkedObjectName());
                } else {
                    $availableValues = $this->getAvailableChildrenValuesFromLists($parentValues, $parentField->getLinkedObjectName());
                }
            } else {
                $childFields = $this->getChildrenFields($parentField, $this->getLinkedObjectName());
                $availableValues = $this->getAvailableChildrenValues($parentValues, $childFields);
            }
            $values = array_filter($values, function ($value) use ($availableValues) {
                return in_array($value, $availableValues);
            });
            $previousEntry = $entry;
            if ($this instanceof CheckboxField) {
                $entry[$this->getPropertyName()] = empty($values) ? [] : array_combine($values, array_fill(0, count($values), "1"));
            } else {
                $entry[$this->getPropertyName()] = (empty($values) || empty($values[0])) ? "" : $values[0];
            }
        } else {
            // unset value if parent not found
            $entry[$this->getPropertyName()] = "";
        }
        return parent::formatValuesBeforeSaveIfEditable($entry, $isCreation);
    }

    protected function getParentField($entry): ?EnumField
    {
        $parentFieldName = $this->getParentFieldName();
        if (empty($parentFieldName)) {
            return null;
        }
        $formId = $this->formatFormId($entry['id_typeannonce'] ?? '');
        $formManager = $this->getService(FormManager::class);
        return empty($formId) ? null : $formManager->findFieldFromNameOrPropertyName($parentFieldName, $formId);
    }

    protected function formatFormId($formId): string
    {
        if (empty($formId) || !is_scalar($formId) || (strval($formId) != strval(intval($formId)))) {
            return "";
        }
        $formManager = $this->getService(FormManager::class);
        $form = $formManager->getOne($formId);
        return empty($form) ? "" : strval($formId);
    }

    protected function getFieldValues(EnumField $field, $entry): array
    {
        if ($field instanceof CheckboxField) {
            $values = $field->getValues($entry);
        } else {
            $value = $field->getValue($entry);
            $value = is_scalar($value) ? strval($value) : "";
            $values = ($value == "") ? [] : [$value];
        }
        return $values;
    }

    protected function getChildrenFields(EnumField $parentField, string $linkedObjectName): array
    {
        $parentFormId = $this->formatFormId($parentField->getLinkedObjectName());
        $fields = [];
        if (!empty($parentFormId)) {
            $formManager = $this->getService(FormManager::class);
            $form = $formManager->getOne($parentFormId);
            foreach ($form['prepared'] as $field) {
                if ($field instanceof EnumField && $field->getLinkedObjectName() == $linkedObjectName && $field->getPropertyName() !== "") {
                    $fields[] = $field;
                }
            }
        }
        return $fields;
    }

    protected function getAvailableChildrenValues(array $parentValues, array $childFields): array
    {
        $entryManager = $this->getService(EntryManager::class);
        $availableValues = [];
        foreach ($parentValues as $entryId) {
            if (!empty($entryId)) {
                $entry = $entryManager->getOne($entryId);
                if (!empty($entry)) {
                    foreach ($childFields as $field) {
                        $childValue = $entry[$field->getPropertyName()] ?? "";
                        $newValues = empty($childValue) ? [] : array_filter(explode(',', $childValue));
                        foreach ($newValues as $value) {
                            if (!in_array($value, $availableValues)) {
                                $availableValues[] = $value;
                            }
                        }
                    }
                }
            }
        }
        return $availableValues;
    }

    protected function getAvailableChildrenValuesFromLists(array $parentValues, string $parentLinkedObjectName): array
    {
        $availableValues = [];
        $associatingFormId = $this->formatFormId($this->getAssociatingFormId());
        if (!empty($associatingFormId)) {
            $formManager = $this->getService(FormManager::class);
            $form = $formManager->getOne($associatingFormId);
            $fields = [];
            foreach ($form['prepared'] as $field) {
                if ($field instanceof EnumField && $field->getLinkedObjectName() == $parentLinkedObjectName && $field->getPropertyName() !== "") {
                    $fields[] = $field;
                    break;
                }
            }
            if (!empty($fields)) {
                $parentField = $fields[0];
                $linkedObjectName = $this->getLinkedObjectName();
                $fields = [];
                foreach ($form['prepared'] as $field) {
                    if ($field instanceof EnumField && $field->getLinkedObjectName() == $linkedObjectName && $field->getPropertyName() !== "") {
                        $fields[] = $field;
                        break;
                    }
                }
                if (!empty($fields)) {
                    $childField = $fields[0];
                    $entryManager = $this->getService(EntryManager::class);
                    $entries = $entryManager->search([
                        'formsIds' => [$associatingFormId],
                        'queries' => [
                            $parentField->getPropertyName() => implode(',', $parentValues)
                        ]
                    ]);
                    if (!empty($entries)) {
                        foreach ($entries as $entry) {
                            $parentValuesInEntry = $this->getFieldValues($parentField, $entry);
                            if (count(array_filter($parentValues, function ($v) use ($parentValuesInEntry) {
                                return in_array($v, $parentValuesInEntry);
                            }))>0) {
                                $childrenValuesInEntry = $this->getFieldValues($childField, $entry);
                                foreach ($childrenValuesInEntry as $value) {
                                    if (!in_array($value, $availableValues)) {
                                        $availableValues[] = $value;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return $availableValues;
    }

    protected function getAvailableChildrenValuesReverseFromForm(array $parentValues, string $parentLinkedObjectName): array
    {
        $availableValues = [];
        $associatingFormId = $this->formatFormId($this->getAssociatingFormId());
        if (!empty($associatingFormId)) {
            $formManager = $this->getService(FormManager::class);
            $form = $formManager->getOne($associatingFormId);
            $fields = [];
            foreach ($form['prepared'] as $field) {
                if ($field instanceof EnumField && $field->getLinkedObjectName() == $parentLinkedObjectName && $field->getPropertyName() !== "") {
                    if (!empty($this->associatingFieldId) && $this->associatingFieldId == $field->getName()){
                        $fields = [$field];
                        break;
                    }
                    $fields[] = $field;
                }
            }
            if (!empty($fields)) {
                $childField = $fields[0];
                $entryManager = $this->getService(EntryManager::class);
                $entries = $entryManager->search([
                    'formsIds' => [$associatingFormId],
                    'queries' => [
                        $childField->getPropertyName() => implode(',', $parentValues)
                    ]
                ]);
                if (!empty($entries)) {
                    $availableValues= array_map(function($entry){
                        return $entry['id_fiche'];
                    },$entries);
                }
            }
        }

        return $availableValues;
    }

    public function getdisplayMethod()
    {
        return $this->displayMethod;
    }
    public function getParentFieldName()
    {
        return $this->parentFieldName;
    }
    public function getAssociatingFormId()
    {
        return $this->associatingFormId;
    }
    public function getAssociatingFieldId()
    {
        return $this->associatingFieldId;
    }
    // ====

    #[\ReturnTypeWillChange]
    public function jsonSerialize()
    {
        $data = parent::jsonSerialize();
        $data['displayMethod'] = $this->getdisplayMethod();
        $data['parentFieldName'] = $this->getParentFieldName();
        $data['associatingFormId'] = $this->getAssociatingFormId();
        $data['associatingFieldId'] = $this->getAssociatingFieldId();
        return $data;
    }
}
