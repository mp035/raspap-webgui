<?php

set_include_path(get_include_path() . PATH_SEPARATOR . dirname(__FILE__) . '/../..');

require 'includes/csrf.php';
require_once 'includes/config.php';
require_once 'includes/defaults.php';
require_once 'includes/functions.php';
require_once 'includes/wifi_functions.php';

$networks = [];
$network  = null;
$ssid     = null;

knownWifiStations($networks);
nearbyWifiStations($networks, !isset($_REQUEST["refresh"]));
nearbyWifiStations($networks, false);
connectedWifiStations($networks);
sortNetworksByRSSI($networks);

echo json_encode(compact('networks'));

?>