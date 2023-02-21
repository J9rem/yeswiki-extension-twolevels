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

use YesWiki\Bazar\Field\SelectEntryField;
use YesWiki\Twolevels\Field\EnumLevel2Commons;

require_once('tools/twolevels/fields/EnumLevel2CommonsField.php');

/**
 * @Field({"enumlevel2listefiche"})
 */
class EnumLevel2SelectEntryField extends SelectEntryField implements EnumLevel2Commons
{
    use EnumLevel2CommonsTrait;
    /**
     * give the internal fieldtype
     * @return string
     */
    public function getInternalFieldType(): string
    {
        return 'listefiche';
    }
}
