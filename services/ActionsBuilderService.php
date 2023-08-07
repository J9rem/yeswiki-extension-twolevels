<?php

/*
 * This file is part of the YesWiki Extension twolevels.
 *
 * Authors : see README.md file that was distributed with this source code.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

namespace YesWiki\Twolevels\Service;

use YesWiki\Aceditor\Service\ActionsBuilderService as AceditorActionsBuilderService;
use YesWiki\Core\Service\TemplateEngine;
use YesWiki\Wiki;

trait ActionsBuilderServiceCommon
{
    protected $previousData;
    protected $data;
    protected $parentActionsBuilderService;
    protected $renderer;
    protected $wiki;

    public function __construct(TemplateEngine $renderer, Wiki $wiki, $parentActionsBuilderService)
    {
        $this->data = null;
        $this->previousData = null;
        $this->parentActionsBuilderService = $parentActionsBuilderService;
        $this->renderer = $renderer;
        $this->wiki = $wiki;
    }

    public function setPreviousData(?array $data)
    {
        if (is_null($this->previousData)) {
            $this->previousData = is_array($data) ? $data : [];
            if ($this->parentActionsBuilderService && method_exists($this->parentActionsBuilderService, 'setPreviousData')) {
                $this->parentActionsBuilderService->setPreviousData($data);
            }
        }
    }

    // ---------------------
    // Data for the template
    // ---------------------
    public function getData()
    {
        if (is_null($this->data)) {
            if (!empty($this->parentActionsBuilderService)) {
                $this->data = $this->parentActionsBuilderService->getData();
            } else {
                $this->data = $this->previousData;
            }
            if (isset($this->data['action_groups']['bazarliste']['actions']['commons2']['properties'])) {
                $previousProperties = $this->data['action_groups']['bazarliste']['actions']['commons2']['properties'];
                $newProps = [];
                if ($previousProperties['facettes']) {
                    $newProps['facettes'] = $previousProperties['facettes'];
                }
                $newProps['intrafiltersmode'] = [
                    'label' => _t('TWOLEVELS_INTRAFILTERSMODE_LABEL'),
                    'hint' => _t('TWOLEVELS_INTRAFILTERSMODE_HINT'),
                    'type' => 'list',
                    'advanced' => true,
                    'default' => 'or',
                    'showOnlyFor' => [
                        'bazarliste',
                        'bazarcarto',
                        'bazarcalendar',
                        'bazarcard',
                        'bazartableau',
                        'bazarmapandtable',
                    ],
                    'options' => [
                        'or' => _t('TWOLEVELS_INTRAFILTERSMODE_OR'),
                        'and' => _t('TWOLEVELS_INTRAFILTERSMODE_AND')
                    ]
                ];
                $newProps['autohidefilter'] = [
                    'label' => _t('TWOLEVELS_AUTOHIDEFILTER_LABEL'),
                    'type' => 'checkbox',
                    'advanced' => true,
                    'default' => true,
                    'showOnlyFor' => [
                        'bazarliste',
                        'bazarcarto',
                        'bazarcalendar',
                        'bazarcard',
                        'bazartableau',
                        'bazarmapandtable',
                    ]
                ];
                $newProps['keepallparents'] = [
                    'label' => _t('TWOLEVELS_KEEPALLPARENTS_LABEL'),
                    'type' => 'checkbox',
                    'advanced' => true,
                    'default' => true,
                    'showOnlyFor' => [
                        'bazarliste',
                        'bazarcarto',
                        'bazarcalendar',
                        'bazarcard',
                        'bazartableau',
                        'bazarmapandtable',
                    ]
                ];
                foreach ($previousProperties as $key => $content) {
                    if ($key != 'facettes') {
                        $newProps[$key] = $content;
                    }
                }
                $this->data['action_groups']['bazarliste']['actions']['commons2']['properties'] = $newProps;
            }
        }
        return $this->data;
    }
}

if (class_exists(AceditorActionsBuilderService::class, false)) {
    class ActionsBuilderService extends AceditorActionsBuilderService
    {
        use ActionsBuilderServiceCommon;
    }
} else {
    class ActionsBuilderService
    {
        use ActionsBuilderServiceCommon;
    }
}
