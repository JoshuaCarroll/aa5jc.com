<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>AllMon – Link Manager</title>
    <meta name="robots" content="noindex, nofollow">

    <!-- Styles -->
    <link rel="stylesheet" href="allmon.css">
    <link rel="stylesheet" href="jquery-ui.css">
    <link rel="stylesheet" href="link_map.css">

    <!-- Libraries -->
    <script src="jquery-3.3.1.min.js"></script>
    <script src="jquery-ui.min.js"></script>

    <style>
        /* Move legacy inline styles here if desired */
        .blinkyContainer {position:fixed;bottom:0;right:0;padding:4px;}
        #blinky {display:none;background:#222;color:#fff;padding:2px 6px;font-size:0.8rem;}
    </style>
</head>
<body>
    <a id="loginlink" href="#">Manager login</a>

    <div id="connect_form" style="display:none;"></div>

    <div id="test_area"></div>

    <table id="status_table" class="statusTable">
        <colgroup>
            <col span="1"><col span="1"><col span="1"><col span="1"><col span="1">
        </colgroup>
        <thead>
            <tr><th>Node</th><th>Node&nbsp;Info</th><th>Link</th><th>Direction</th><th>Connected</th><th>Mode</th></tr>
        </thead>
        <tbody>
            <tr><td colspan="6">Waiting</td></tr>
        </tbody>
    </table>

    <div id="map"></div>

    <div class="blinkyContainer"><div id="blinky">WORKING</div></div>
    <div id="log"></div>

    <!-- Backend data bootstrap -->
    <script>
        const SESSION_LOGGED_IN = <?php echo json_encode($_SESSION['loggedin'] ?? false); ?>;
        const NODES             = <?php echo json_encode($viewData['nodes']); ?>;
        const ASTDB             = <?php echo json_encode($viewData['astdb']); ?>;
    </script>

    <!-- Full client logic -->
    <script src="link.js"></script>
</body>
</html>
