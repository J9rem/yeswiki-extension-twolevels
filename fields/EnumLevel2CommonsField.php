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
    protected $displayMethod ;
    protected $parentFieldName;

    public function __construct(array $values, ContainerInterface $services)
    {
        // set local properties
        $this->displayMethod = $values[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD];
        $this->parentFieldName = trim((
            !empty($values[EnumLevel2CommonsField::FIELD_FIELDNAME]) &&
            is_string($values[EnumLevel2CommonsField::FIELD_FIELDNAME])
        ) ? $values[EnumLevel2CommonsField::FIELD_FIELDNAME] : '');

        // remove values which must not be passed to parent constructor
        $internalValues = $values;
        $internalValues[parent::FIELD_TYPE] = $this->getInternalFieldType();
        $internalValues[EnumLevel2CommonsField::FIELD_FIELDNAME] = "";
        $internalValues[EnumLevel2CommonsField::FIELD_DISPLAY_METHOD] =
            (preg_match("/^{$internalValues[parent::FIELD_TYPE]}(tags|dragndrop)$/", $this->displayMethod, $matches))
            ? $matches[1]
            : "";

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
    public function formatValuesBeforeSave($entry)
    {
        // TODO filter on authorized values according to level 1
        return parent::formatValuesBeforeSave($entry);
    }

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
        $data = parent::jsonSerialize();
        $data['displayMethod'] = $this->getdisplayMethod();
        $data['parentFieldName'] = $this->getParentFieldName();
        return $data;
    }
}
