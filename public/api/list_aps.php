<?php

require_once "common.php"; // must be first.

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

// turn the newtorks object into a numerically keyed array
// so that order is maintained by javascript.
$netlist = [];
array_walk($networks, function($value, $key) use (&$netlist){
  $value['SSID'] = $key;
  $netlist[] = $value;
});

echo json_encode(['networks'=>$netlist]);

?>