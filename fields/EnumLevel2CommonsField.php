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
use YesWiki\Bazar\Field\CheckboxEntryField;
use YesWiki\Bazar\Field\CheckboxListField;
use YesWiki\Bazar\Field\RadioEntryField;
use YesWiki\Bazar\Field\RadioListField;
use YesWiki\Bazar\Field\SelectEntryField;
use YesWiki\Bazar\Field\SelectListField;

interface EnumLevel2Commons
{
    public function getdisplayMethod();
    public function getParentFieldName();
}

class EnumLevel2CommonsField
{
    // fake class to prevent FieldFactory to create errors

    public const FIELD_FIELDNAME = 3;
    public const FIELD_DISPLAY_METHOD = 7;
}

trait EnumLevel2CommonsTrait
{
    public function __construct(array $values, ContainerInterface $services)
    {
        parent::__construct($values, $services);
        $this->size = null;
        $this->displayMethod = $values[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD];
        $this->parentFieldName = trim(!empty($values[EnumLevel2CommonsField::FIELD_FIELDNAME]) && is_string($values[EnumLevel2CommonsField::FIELD_FIELDNAME]) ? $values[EnumLevel2CommonsField::FIELD_FIELDNAME] : '');
        $internalValues = $values;
        $internalValues[EnumLevel2CommonsField::FIELD_FIELDNAME] = "";
        switch ($this->displayMethod) {
            case 'checkbox':
                $internalValues[parent::FIELD_TYPE] = "checkbox";
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "";
                $this->internalField = new CheckboxListField($internalValues, $services);
                break;
            case 'checkboxtags':
                $internalValues[parent::FIELD_TYPE] = "checkbox";
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "tags";
                $this->internalField = new CheckboxListField($internalValues, $services);
                break;
            case 'checkboxdragndrop':
                $internalValues[parent::FIELD_TYPE] = "checkbox";
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "dragndrop";
                $this->internalField = new CheckboxListField($internalValues, $services);
                break;
            case 'checkboxfiche':
                $internalValues[parent::FIELD_TYPE] = "checkboxfiche";
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "";
                $this->internalField = new CheckboxEntryField($internalValues, $services);
                break;
            case 'checkboxfichetags':
                $internalValues[parent::FIELD_TYPE] = "checkboxfiche";
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "tags";
                $this->internalField = new CheckboxEntryField($internalValues, $services);
                break;
            case 'checkboxfichedragndrop':
                $internalValues[parent::FIELD_TYPE] = "checkboxfiche";
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "dragndrop";
                $this->internalField = new CheckboxEntryField($internalValues, $services);
                break;
            case 'radio':
                $internalValues[parent::FIELD_TYPE] = "radio";
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "";
                $this->internalField = new RadioListField($internalValues, $services);
                break;
            case 'radiotags':
                $internalValues[parent::FIELD_TYPE] = "radiotags";
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "tags";
                $this->internalField = new RadioListField($internalValues, $services);
                break;
            case 'radiodragndrop':
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "dragndrop";
                $this->internalField = new RadioListField($internalValues, $services);
                break;
            case 'radiofiche':
                $internalValues[parent::FIELD_TYPE] = "radiofiche";
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "";
                $this->internalField = new RadioEntryField($internalValues, $services);
                break;
            case 'radiofichetags':
                $internalValues[parent::FIELD_TYPE] = "radiofiche";
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "tags";
                $this->internalField = new RadioEntryField($internalValues, $services);
                break;
            case 'radiofichedragndrop':
                $internalValues[parent::FIELD_TYPE] = "radiofiche";
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "dragndrop";
                $this->internalField = new RadioEntryField($internalValues, $services);
                break;
            case 'liste':
                $internalValues[parent::FIELD_TYPE] = "liste";
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "";
                $this->internalField = new SelectListField($internalValues, $services);
                break;
            case 'listefiche':
                $internalValues[parent::FIELD_TYPE] = "listefiche";
                $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] = "";
                $this->internalField = new SelectEntryField($internalValues, $services);
                break;

            default:
                $this->internalField = null;
                break;
        }
    }

    /**
     * Render the edit view of the field. Check ACLS first
     * @param array|null $entry
     * @param string|null $userNameForRendering username to render the field, if empty uses connected user
     * @return string|null $html
     */
    public function renderStaticIfPermitted($entry, ?string $userNameForRendering = null)
    {
        if (!$this->internalField) {
            return '';
        }
        return $this->internalField->renderStaticIfPermitted($entry, $userNameForRendering);
    }

    // Render the edit view of the field. Check ACLS first
    public function renderInputIfPermitted($entry)
    {
        if (!$this->internalField) {
            // TODO add warning
            return '';
        }
        // TODO find first level field and associated form to use it for input render
        return $this->render("@bazar/inputs/enum-level2.twig", [])
            .$this->internalField->renderInputIfPermitted($entry);
    }

    public function formatValuesBeforeSaveIfEditable($entry, bool $isCreation = false)
    {
        if (!$this->internalField) {
            return null;
        }
        // TODO filter on authorized values according to level 1
        return $this->internalField->formatValuesBeforeSaveIfEditable($entry, $isCreation);
    }

    // Format input values before save
    public function formatValuesBeforeSave($entry)
    {
        return $this->internalField->formatValuesBeforeSaveIfEditable($entry);
    }

    // HELPERS
    /**
     * Return true if we are if reading is allowed for the field
     * @param array|null $entry
     * @param string|null $userNameForRendering username to render the field, if empty uses connected user
     * @return bool
     */
    public function canRead($entry, ?string $userNameForRendering = null)
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->canRead($entry, $userNameForRendering);
    }

    /* Return true if we are if editing is allowed for the field */
    public function canEdit($entry, bool $isCreation = false)
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->canEdit($entry, $isCreation);
    }

    // EnumField proxy

    public function loadOptionsFromList()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->loadOptionsFromList();
    }

    public function loadOptionsFromJson()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->loadOptionsFromJson();
    }

    public function loadOptionsFromEntries()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->loadOptionsFromEntries();
    }

    public function getLinkedObjectName()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->getLinkedObjectName();
    }

    // GETTERS

    public function getPropertyName()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->getPropertyName();
    }

    public function getName()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->getName();
    }

    public function getLabel()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->getLabel();
    }

    public function getSize()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->getSize();
    }

    public function getMaxChars()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->getMaxChars();
    }

    public function getDefault()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->getDefault();
    }

    public function isRequired(): bool
    {
        if (!$this->internalField) {
            return false;
        }
        return $this->internalField->isRequired();
    }

    public function getSearchable()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->getSearchable();
    }

    public function getHint()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->getHint();
    }

    public function getReadAccess()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->getReadAccess();
    }

    public function getWriteAccess()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->getWriteAccess();
    }

    public function getSemanticPredicate()
    {
        if (!$this->internalField) {
            return null;
        }
        return $this->internalField->getSemanticPredicate();
    }

    // not proxy

    public function getdisplayMethod()
    {
        return $this->displayMethod;
    }
    public function getParentFieldName()
    {
        return $this->parentFieldName;
    }
    // ====

    #[\ReturnTypeWillChange]
    public function jsonSerialize()
    {
        if (!$this->internalField) {
            return [
                'id' => parent::getPropertyName(),
                'propertyname' => parent::getPropertyName(),
                'label' => parent::getLabel(),
                'name' => parent::getName(),
                'type' => parent::getType(),
                'default' => parent::getDefault(),
                'searchable' => parent::getSearchable(),
                'required' => parent::isRequired(),
                'helper' => parent::getHint(),
                'read_acl' => parent::getReadAccess(),
                'write_acl' => parent::getWriteAccess(),
                'sem_type' => parent::getSemanticPredicate(),
                'displayMethod' => $this->getdisplayMethod(),
                'parentFieldName' => $this->getParentFieldName()
                ];
        } else {
            $internalFieldData = $this->internalField->jsonSerialize();
            $internalFieldData['displayMethod'] = $this->getdisplayMethod();
            $internalFieldData['parentFieldName'] = $this->getParentFieldName();
            return $internalFieldData;
        }
    }
}
