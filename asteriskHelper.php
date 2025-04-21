<?php

$AllstarNodeList = "/var/log/asterisk/astdb.txt";
$ConfigFile = "/var/www/config.ini";


// Load node list from Allstar database file
$astdb = array();
if (file_exists($AllstarNodeList)) {
   $fh = fopen($AllstarNodeList, "r");
   if (flock($fh, LOCK_SH)) {
      while (($line = fgets($fh)) !== false) {
         $arr = preg_split("/\|/", trim($line));
         $astdb[$arr[0]] = new AllstarNode($arr[0], $arr[1], $arr[2], $arr[3]);
      }
   }
   flock($fh, LOCK_UN);
   fclose($fh);
}

// Load configuration settings from config file
if (!file_exists($ConfigFile)) {
    die("Couldn't load ini file.\n");
}
$config = parse_ini_file($ConfigFile, true);

class AllstarNode {
   public $NodeNumber;
   public $Callsign;
   public $Frequency;
   public $ServerLocation;

   function __construct($nodeNumber = 0, $callsign = '', $frequency = '', $serverLocation = '') {
      $this->NodeNumber = $nodeNumber;
      $this->Callsign = $callsign;
      $this->Frequency = $frequency;
      $this->ServerLocation = $serverLocation;
    }
}

class Allstar {

   /// Reads output lines from Asterisk Manager Interface (AMI) and returns the lines
   /// that match the given action ID.
   /// @param resource $fp The file pointer to the AMI connection.
   /// @param string $actionID The action ID to match.
   /// @return string The response lines that match the action ID.
   /// @throws Exception If the connection to AMI fails or if the action ID is not found.
   public static function GetResponse($stream, $actionId) {
      while (TRUE) {
         $strLine = fgets($stream);

         # Looking for our actionID
         if ("ActionID: $actionId" == trim($strLine)) {
            $response = $strLine;
            while (TRUE) {
               $strLine = fgets($stream);

               if ($strLine != "\r\n") {
                  $response .= $strLine;
               } else {
                  return($response);
               }
            }
         }
      }
   }

   /// Connects to the Asterisk Manager Interface (AMI) using the provided host and port.
   /// @param string $host The host and port to connect to (e.g., "127.0.0.1:5038").
   /// @return resource The file pointer to the AMI connection.
   /// @throws Exception If the connection to AMI fails.
   public static function Connect($host) {
      // Set default port if not provided
      $arr = explode(":", $host);
      $ip = $arr[0];
      if (isset($arr[1])) {
         $port = $arr[1];
      } else {
         $port = 5038;
      }

      // Open a manager socket.
      $socketConnection = @fsockopen($ip, $port, $errno, $errstr, 5);
      return ($socketConnection);
   }

   /// Logs in to the Asterisk Manager Interface (AMI) using the provided username and password.
   /// @param resource $stream The file pointer to the AMI connection.
   /// @param string $user The username for AMI authentication.
   /// @param string $password The password for AMI authentication.
   /// @return bool TRUE if login is successful, FALSE otherwise.
   public static function Login($stream, $user, $password) {
      $actionID = $user . $password;
      fwrite($stream, "ACTION: LOGIN\r\nUSERNAME: $user\r\nSECRET: $password\r\nEVENTS: 0\r\nActionID: $actionID\r\n\r\n");
      $login = Allstar::GetResponse($stream, $actionID);

      // Check for successful login
      if (preg_match("/Authentication accepted/", $login) == 1) {
         return(TRUE);
      } else {
         return(FALSE);
      }
   }

      /// Gets informartion about a node based on its number in the Allstar Database.
   /// @param int $nodeNumber The node number to retrieve information for.
   public static function GetNodeInfo($nodeNumber, $node=array()) {
      global $astdb;
      
      // Build info string
      if (isset($astdb[$nodeNumber])) {
         $dbNode = $astdb[$nodeNumber];
         $info = $dbNode->Callsign . ' ' . $dbNode->Frequency . ' ' . $dbNode->ServerLocation;
      } elseif ($nodeNumber > 3000000) {
         $info = "Echolink";
      } elseif (!empty($node['ip'])) {
         if (strlen(trim($node['ip'])) > 3) {
               $info = '(' . $node['ip'] . ')';
         } else {
               $info = ' ';
         }
      } else {
         $info = ' ';
      }

      return $info;
   }

   // Get status for this $node
   function NodeStatus($socketConnection, $node)
   {
      $actionRand = mt_rand();    # Asterisk Manger Interface an actionID so we can find our own response

      $actionID = 'xstat'.$actionRand;
      if ((fwrite($socketConnection, "ACTION: RptStatus\r\nCOMMAND: XStat\r\nNODE: $node\r\nActionID: $actionID\r\n\r\n")) !== false) {
         // Get RptStatus
         $rptStatus = Allstar::GetResponse($socketConnection, $actionID);
      } else {
         $data['status'] = 'XStat() failed!';
         echo 'data: '.json_encode($data)."\n\n";
         ob_flush();
         flush();
      }

      // format of Conn lines: Node# isKeyed lastKeySecAgo lastUnkeySecAgo
      $actionID = 'sawstat'.$actionRand;
      if ((fwrite($socketConnection,
               "ACTION: RptStatus\r\nCOMMAND: SawStat\r\nNODE: $node\r\nActionID: $actionID\r\n\r\n")) !== false) {
         // Get RptStatus
         $sawStatus = Allstar::GetResponse($socketConnection, $actionID);
      } else {
         $data['status'] = 'sawStat failed!';
         echo 'data: '.json_encode($data)."\n\n";
         ob_flush();
         flush();
      }

      // Parse this $node. Retuns an array of currently connected nodes
      $current = parseNode($rptStatus, $sawStatus);

      return ($current);
   }

   
   private function sortNodes($nodes)
   {
       $arr = array();
       $never_heard = array();
       $sortedNodes = array();
   
       // build an array of heard and unheard
       foreach ($nodes as $nodeNum => $row) {
           if ($row['last_keyed'] == '-1') {
               $never_heard[$nodeNum] = 'Never heard';
           } else {
               $arr[$nodeNum] = $row['last_keyed'];
           }
       }
   
       // Sort nodes that have been heard
       if (count($arr) > 0) {
           asort($arr, SORT_NUMERIC);
       }
   
       // Add in nodes that have not been heard
       if (count($never_heard) > 0) {
           ksort($never_heard, SORT_NUMERIC);
           foreach ($never_heard as $nodeNum => $row) {
               $arr[$nodeNum] = $row;
           }
       }
   
       // Build sorted node array
       foreach ($arr as $nodeNum => $row) {
           // Build last_keyed string. Converts seconds to hours, minutes, seconds.
           if ($nodes[$nodeNum]['last_keyed'] > -1) {
               $t = $nodes[$nodeNum]['last_keyed'];
               $h = floor($t / 3600);
               $m = floor(($t / 60) % 60);
               $s = $t % 60;
               $nodes[$nodeNum]['last_keyed'] = sprintf("%03d:%02d:%02d", $h, $m, $s);
           } else {
               $nodes[$nodeNum]['last_keyed'] = "Never";
           }
   
           $sortedNodes[$nodeNum] = $nodes[$nodeNum];
       }
   
       return ($sortedNodes);
   }
   
   /// Parses the RptStatus and SawStat output to extract node information.
   /// @param string $rptStatus The RptStatus output from Asterisk.
   /// @param string $sawStatus The SawStat output from Asterisk.
   /// @return array An array of currently connected nodes with their information.
   private function parseNode($rptStatus, $sawStatus)
   {
       $curNodes = array();
       $links = array();
       $conns = array();
   
       // Parse 'rptStat Conn:' lines.
       $lines = explode("\n", $rptStatus);
       foreach ($lines as $line) {
           if (preg_match('/Conn: (.*)/', $line, $matches)) {
               $arr = preg_split("/\s+/", trim($matches[1]));
               if (is_numeric($arr[0]) && $arr[0] > 3000000) {
                   // no ip when echolink
                   $conns[] = array($arr[0], "", $arr[1], $arr[2], $arr[3], $arr[4]);
               } else {
                   $conns[] = $arr;
               }
           }
       }
   
       // Parse 'sawStat Conn:' lines.
       $keyups = array();
       $lines = explode("\n", $sawStatus);
       foreach ($lines as $line) {
           if (preg_match('/Conn: (.*)/', $line, $matches)) {
               $arr = preg_split("/\s+/", trim($matches[1]));
               $keyups[$arr[0]] = array('node' => $arr[0], 'isKeyed' => $arr[1], 'keyed' => $arr[2], 'unkeyed' => $arr[3]);
           }
       }
   
       // Parse 'LinkedNodes:' line.
       if (preg_match("/LinkedNodes: (.*)/", $rptStatus, $matches)) {
           $longRangeLinks = preg_split("/, /", trim($matches[1]));
       }
       foreach ($longRangeLinks as $line) {
           $n = substr($line, 1);
           $modes[$n]['mode'] = substr($line, 0, 1);
       }
   
       // Pull above arrays together into $curNodes
       if (count($conns) > 0) {
           // Local connects
           foreach ($conns as $node) {
               $n = $node[0];
               $curNodes[$n]['node'] = $node[0];
               $curNodes[$n]['info'] = Allstar::GetNodeInfo($node[0]);
               $curNodes[$n]['ip'] = $node[1];
               $curNodes[$n]['direction'] = $node[3];
               $curNodes[$n]['elapsed'] = $node[4];
               $curNodes[$n]['link'] = @$node[5];
               $curNodes[$n]['keyed'] = 'n/a';
               $curNodes[$n]['last_keyed'] = 'n/a';
   
               // Get mode
               if (isset($modes[$n])) {
                   $curNodes[$n]['mode'] = $modes[$n]['mode'];
               } else {
                   $curNodes[$n]['mode'] = 'Local Monitor';
               }
               $n++;
           }
   
           // Pullin keyed
           foreach ($keyups as $node => $arr) {
               if ($arr['isKeyed'] == 1) {
                   $curNodes[$node]['keyed'] = 'yes';
               } else {
                   $curNodes[$node]['keyed'] = 'no';
               }
               $curNodes[$node]['last_keyed'] = $arr['keyed'];
           }
   
   
           // Long range links
      global $arrLongRangeLinks;
           for ($x = 0; $x < count($longRangeLinks); $x++) {
                   $nodeNum=substr($longRangeLinks[$x], 1);
                   if (!isset($curNodes[$nodeNum])) {
                           $arrLongRangeLinks[$nodeNum]['node'] = $nodeNum;
                           $arrLongRangeLinks[$nodeNum]['info'] = Allstar::GetNodeInfo($nodeNum);
                           $arrLongRangeLinks[$nodeNum]['mode'] = substr($longRangeLinks[$x], 0, 1);
                           $arrLongRangeLinks[$nodeNum]['remote'] = "true";
                   }
           }
   
       }
   
       return $curNodes;
   }
   
}

