<?php

namespace Drupal\dais_calendar\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Renders the Dais civic calendar landing page.
 *
 * The page chrome (site header, breadcrumb, footer) is supplied by the
 * active theme. This controller returns only the content region.
 *
 * Event data lives in js/dais-calendar.js. When the City wires this up
 * to live feeds (Legistar, BoCC, EPC dev-plan review, Accela, PPRBD,
 * procurement, etc.), the controller becomes the place to fetch + cache
 * and pass the EVENTS array through #attached.drupalSettings.
 */
class DaisCalendarController extends ControllerBase {

  /**
   * Builds the page render array.
   */
  public function page(): array {
    return [
      '#theme' => 'dais_calendar_page',
      '#attached' => [
        'library' => [
          'dais_calendar/fonts',
          'dais_calendar/dais_calendar',
        ],
      ],
      '#cache' => [
        'tags' => ['dais_calendar:page'],
        'max-age' => 1800,
      ],
    ];
  }

}
