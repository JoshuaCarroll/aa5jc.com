console.clear();

var markerNamePrefix = "m";
var tableRowNamePrefix = "t";

var howOftenToUpdateNodes = 60000; // milliseconds

var iconHeight = 30;
var iconWidth = 30;

var lineColors = ['#F7BD5A','#FFCC99','#FFFF33','#FFFF9C','#CD6363','#FF9C00','#CC99CC','#ff9f63','#646DCC','#9C9CFF','#FF9C00','#3399FF','#99CCFF','#ED884C','#FFFFCC','#B1957A','#F5ED00','#DDFFFF'];

var mapZoomLevel = 7;
if (screen.height == "480") {
	zoomLevel = 5;
}

var mapCenter = [34.7, -92.5]; // Default to Arkansas

// ____________________________________________________________________________________________________________

var numberOfLinesCreated = 0;
var nodeCache = {};
var activeTransmittersCache = [];
const mapObjects = {
    markers: new Map(),
    lines: new Map()
};

$(function () {
	loadData();
});


function loadData() {
	$.getJSON("https://hub.aa5jc.com/allmon3/nodestatus.php", function (data) {
		console.debug("Loaded data: ", data);
		
		updateNodeTable(data.nodes);

		$("#divLoadingContainer").hide();
		nodeCache = data.nodes;  // Update the cache with the latest data

		// Set up periodic updates
		setTimeout(function () {
			loadData();
		}, howOftenToUpdateNodes);
	});
}

function updateMap(nodes) {
	// Remove markers that are no longer in the data
	for (const key in nodeCache) {
		if (!nodes.hasOwnProperty(key)) {
			removeNode(key);
		}
	}

	// Add markers for new nodes
	for (const key in nodes) {
		if (!nodeCache.hasOwnProperty(key)) {
			addNode(nodes[key]);
		}
	}
}

function updateNodeTable(nodes) {
	// Clear the table body
	$("#tbodyConnections").empty();

	for (const key in nodes) {
		const node = nodes[key];
		console.debug("Adding node to table: ", node);
		$("#tbodyConnections").append(
			"<tr id='" + tableRowNamePrefix + node.node + "'>"
			+ "  <td><a href='https://stats.allstarlink.org/stats/" + node.node + "' target='_blank'>" + node.node + "</a></td>"
			+ "  <td><a href='https://www.qrz.com/db/" + node.callsign + "' target='_blank'>" + node.callsign + "</a></td>"
			+ "  <td>" + node.desc + "</td>"
			+ "</tr>"
		);
	}
}

function addNode(node) {
	if (!node || !node.lat || !node.lon) 
		return; // Skip if node data is incomplete

	const nodeNumber = node.node;
	const markerName = markerNamePrefix + nodeNumber;

	const latValid = node.lat != null && node.lat != 0;
	const lonValid = node.lon != null && node.lon != 0;

	// If it's a private node, skip it
    if (nodeNumber < 2000) {
        return;
    }

	if (latValid && lonValid) {
		if (!mapObjects.markers.get(markerName)) {
			mapObjects.markers.set(markerName, newMarker(nodeNumber, node.desc, node.lat, node.lon));
		}
	}
	else {
		console.warn("Node " + nodeNumber + " has invalid coordinates: (" + node.lat + ", " + node.lon + ")");
	}

	var nodeTone = node.node_tone != "" ? " (" + node.node_tone + ")" : "";


}

function removeNode(nodeNumber) {
	const markerName = markerNamePrefix + nodeNumber;
	const marker = mapObjects.markers.get(markerName);

	if (marker) {
		if (marker instanceof L.Marker) {
			map.removeLayer(marker);
		}

		mapObjects.markers.delete(markerName);
	}
}


// _____ Leaflet Map Functions ____________________________________________________________________________________________________________

var map = L.map("map").setView(mapCenter, mapZoomLevel);

var tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var iconDisconnectedNode = L.divIcon({
	className: 'icon-antenna',
	iconAnchor: [iconWidth / 2, iconHeight],
	popupAnchor: [0, -1 * iconHeight]
});

var iconReceiving = L.divIcon({
	className: 'icon-receiving',
	iconAnchor: [iconWidth / 2, iconHeight],
	popupAnchor: [0, -1 * iconHeight]
});

var iconTransmitting = L.divIcon({
	className: 'icon-transmitting',
	iconAnchor: [iconWidth / 2, iconHeight],
	popupAnchor: [0, -1 * iconHeight]
});

function newMarker(nodeNumber, city, lat, lon) {
	console.debug("Creating new marker for node: " + nodeNumber + " at " + city + " (" + lat + ", " + lon + ")");
	const marker = L.marker([lat, lon], { icon: iconReceiving }).addTo(map).bindPopup(city + "<br>" + "node " + nodeNumber);
    return marker;
}

function newLine(lineKey, pointA, pointB, options = {}) {
	// Ensure pointA and pointB are arrays in [lat, lng] format
	const latlngs = [pointA, pointB];

	// Draw the line with optional styling
	const line = L.polyline(latlngs, {
		color: options.color || getNextColor(),
		weight: options.weight || 3,
		opacity: options.opacity || 0.7,
		dashArray: options.dashArray || null
	});
	line.addTo(map);

	mapObjects.lines.set(lineKey, line);

	return line; // Return the line if you want to manipulate it later
}

function getNextColor() {
	// Cycle through the line colors
	const color = lineColors[numberOfLinesCreated % lineColors.length];
	numberOfLinesCreated++;
	return color;
}

function deleteLines(nodeNumber) {
	for (const [key, line] of mapObjects.lines.entries()) {
		if (key.includes('-' + nodeNumber + '-')) {
			map.removeLayer(line);
			mapObjects.lines.delete(key);
		}
	}
}

function getLineKey(a, b) {
    return '-' + [a, b].sort().join('-') + '-'; // e.g., "-472350-65017-"
}