<?php
// only required for debugging, or if you want to use the 
// api from somewehere else.  Is set to allow CORS from localhost on any port and subdomain.
if (preg_match("/^(https?:\/\/(?:.+\.)?localhost(?::\d{1,5})?).*$/", $_SERVER['HTTP_ORIGIN']) === 1)
  header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
  
  

// adjust the include path so that all of the upper level
// include files can be found.
set_include_path(get_include_path() . PATH_SEPARATOR . dirname(__FILE__) . '/../..');

?>
