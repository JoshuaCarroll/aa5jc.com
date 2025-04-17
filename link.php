<?php
/**
 * link.php
 * Controller for AllMon Link page.
 *
 * Responsibilities:
 *  - Validate query string (?nodes=1234,5678)
 *  - Load AllStar database and INI files
 *  - Prepare data structures used by the view
 *  - Render the view (link_view.php)
 */

declare(strict_types=1);
require '/var/www/html/allmon2/session.inc';

error_reporting(E_ALL);

// -----------------------------------------------------------------------------
// 1. Input validation
// -----------------------------------------------------------------------------
$nodesParam = filter_input(INPUT_GET, 'nodes', FILTER_SANITIZE_STRING) ?? '';
$nodes      = array_values(array_filter(array_map('trim', explode(',', $nodesParam))));

if (empty($nodes)) {
    http_response_code(400);
    die('Please provide a properly?formatted URI. e.g. link.php?nodes=1234 or link.php?nodes=1234,5678');
}

// -----------------------------------------------------------------------------
// 2. Load AllStar database
// -----------------------------------------------------------------------------
$astdbFile = '/var/log/asterisk/astdb.txt';
$astdb     = [];

if (is_readable($astdbFile)) {
    foreach (file($astdbFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $columns          = explode('|', trim($line));
        $key              = array_shift($columns);
        $astdb[$key]      = $columns;
    }
}

// -----------------------------------------------------------------------------
// 3. Load allmon INI for node metadata
// -----------------------------------------------------------------------------
$configFile = '/var/www/html/allmon.ini';
if (!is_readable($configFile)) {
    die('allmon.ini not found or not readable');
}
$config = parse_ini_file($configFile, true);

// Keep only nodes that really exist in the INI file
$nodes = array_values(array_filter($nodes, static function (string $n) use ($config): bool {
    return isset($config[$n]);
}));

if (empty($nodes)) {
    die('None of the requested nodes exist in allmon.ini');
}

// -----------------------------------------------------------------------------
// 4. Gather node info for the front?end
// -----------------------------------------------------------------------------
$nodeInfo = array_map(static function (string $node) use ($astdb): array {
    $info = $astdb[$node] ?? [];
    return [
        'id'          => $node,
        'description' => $info[1] ?? 'Node not in database',
        'location'    => $info[2] ?? '',
        'owner'       => $info[3] ?? '',
    ];
}, $nodes);

// -----------------------------------------------------------------------------
// 5. Render view
// -----------------------------------------------------------------------------
$viewData = [
    'nodes'     => $nodes,
    'astdb'     => $astdb,
    'nodeInfo'  => $nodeInfo,
];
require __DIR__ . '/link_view.php';
