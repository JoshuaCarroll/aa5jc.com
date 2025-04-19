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

      /// Gets informartion about a node based on its number.
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
}