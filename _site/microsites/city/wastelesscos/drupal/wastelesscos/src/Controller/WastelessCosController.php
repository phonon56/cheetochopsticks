<?php

namespace Drupal\wastelesscos\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Renders the WastelessCOS landing page.
 *
 * The page chrome (skip link, site utility nav, breadcrumb, footer) is
 * supplied by the active theme. This controller returns only the page
 * content region.
 */
class WastelessCosController extends ControllerBase {

  /**
   * Builds the page render array.
   *
   * @return array
   *   Renderable page.
   */
  public function page(): array {
    return [
      '#theme' => 'wastelesscos_page',
      '#stats' => [
        ['value' => '16%',        'label' => 'diverted from landfill today'],
        ['value' => '37%',        'label' => 'community goal by 2045'],
        ['value' => '~9,000 lbs', 'label' => 'of waste sorted to build the plan'],
      ],
      '#attached' => [
        'library' => [
          'wastelesscos/fonts',
          'wastelesscos/wastelesscos',
        ],
      ],
      '#cache' => [
        'tags' => ['wastelesscos:page'],
        'max-age' => 86400,
      ],
    ];
  }

}
