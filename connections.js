console.clear();

var markerNamePrefix = "m";
var tableRowNamePrefix = "t";
var lineNamePrefix = "link-";

var howOftenToUpdateNodes = 30000; // milliseconds
var howOftenToUpdateKeyedNodes = 1500; // milliseconds

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

	// Give the nodes a moment to load before checking for active transmitters
	setTimeout(async () => {
		checkActiveTransmitters();
	}, 15);
});


function loadData() {
	$.getJSON("https://local.aa5jc.com/api/asl", function (nodes) {

		addOrUpdateNodes(nodes);

		// Clear old markers that are no longer in the data
		for (const key in nodeCache) {
			if (!nodes.hasOwnProperty(key)) {
				removeNode(key);
			}
		}

        // Draw lines between nodes
		for (const key in nodes) {
			// if this node has links, draw them
			if (nodes[key] && nodes[key].data && nodes[key].data.links) {
				for (const link of nodes[key].data.links) {
					const targetNode = nodes[link];
					if (targetNode) {
						connectNodes(nodes[key], targetNode);
					}
				}
			}
		}

        // Update the cache with the latest data
		nodeCache = nodes;

		$("#divLoadingContainer").hide();

		// Set up periodic updates
		setTimeout(function () {
			loadData();
		}, howOftenToUpdateNodes);
	});
}

function addOrUpdateNodes(nodes) {
	// Clear the table body before adding new rows
	$("#tbodyConnections").empty();

	for (const key in nodes) {
		addOrUpdateNode(nodes[key]);
	}
}

function addOrUpdateNode(node) {
	if (!node || !node.server || !node.server.location || !node.server.latitude || !node.server.logitude) 
		return; // Skip if node data is incomplete

	const nodeNumber = node.name;
	const markerName = markerNamePrefix + nodeNumber;

	const latValid = node.server.latitude != null && node.server.latitude != 0;
	const lonValid = node.server.logitude != null && node.server.logitude != 0;

	// If it's a private node, skip it
    if (nodeNumber < 2000) {
        return;
    }

	if (latValid && lonValid) {
		if (!mapObjects.markers.get(markerName)) {
			mapObjects.markers.set(markerName, newMarker(nodeNumber, node.server.location, node.server.latitude, node.server.logitude));
		}
	}
	else {
		console.warn("Node " + nodeNumber + " has invalid coordinates: (" + node.server.latitude + ", " + node.server.logitude + ")");
	}

	var nodeTone = node.node_tone != "" ? " (" + node.node_tone + ")" : "";

	$("#tbodyConnections").append(
		"<tr id='" + tableRowNamePrefix + nodeNumber + "'>"
		+ "  <td><a href='https://stats.allstarlink.org/stats/" + nodeNumber + "' target='_blank'>" + nodeNumber + "</a></td>"
		+ "  <td><a href='https://www.qrz.com/db/" + node.user_ID + "' target='_blank'>" + node.user_ID + "</a></td>"
		+ "  <td>" + node.server.location + "</td>"
		+ "  <td>" + node.node_frequency + nodeTone + "</td>"
		+ "</tr>"
	);
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
	
	// Remove any lines associated with this node
	deleteLines(nodeNumber);
}

function connectNodes(nodeA, nodeB) {
	// Ensure both nodes are valid
	if (!nodeA || !nodeA.server || !nodeB || !nodeB.server) {
		return;
	}

	const pointA = [nodeA.server.latitude, nodeA.server.logitude];
	const pointB = [nodeB.server.latitude, nodeB.server.logitude];
	const lineName = getLineKey(nodeA.name, nodeB.name);

	// Check if the line already exists
	if (!mapObjects.lines.get(lineName)) {
		newLine(lineName, pointA, pointB);
	}
}

// _____ Keyed node functions _____
function SetNodeReceiving(nodeNumber) {
	const markerName = markerNamePrefix + nodeNumber;
	if (mapObjects.markers.get(markerName)) {
		mapObjects.markers.get(markerName).setIcon(iconReceiving);
		$("#" + tableRowNamePrefix + nodeNumber).removeClass("cell-transmitting");
	}
				
	// Remove the item from the activeTransmittersCache array
	activeTransmittersCache.splice(activeTransmittersCache.indexOf(nodeNumber), 1);
}

function SetNodeTransmitting(nodeNumber) {
	const markerName = markerNamePrefix + nodeNumber;
	var marker = mapObjects.markers.get(markerName);
	marker.setIcon(iconTransmitting);
	$("#" + tableRowNamePrefix + nodeNumber).addClass("cell-transmitting");

	if ($('#chkZoomToTransmitter').is(':checked')) {
		map.flyTo(marker._latlng);
	}
}

async function checkActiveTransmitters() {
	$.getJSON("https://local.aa5jc.com/api/transmitting", function (transmittingNodes) {

		var activeNodes = [];

		for (const key in transmittingNodes) {
			if (nodeCache.hasOwnProperty(key)) {
				activeNodes.push(key); // Collect the node numbers of active transmitters in our network
			}
		}

		console.debug('Active transmitters: ', activeNodes);

		// Set the icon for each newly receiving node
		for (const nodeNumber of activeTransmittersCache) {
			if (activeNodes.indexOf(nodeNumber) == -1) {
				// The node is no longer transmitting, so we set its icon to receiving
				SetNodeReceiving(nodeNumber);
			}
		}

		if (activeNodes.length) {
			// Set the icon for each newly transmitting node
			for (const nodeNumber of activeNodes) {
				const markerName = markerNamePrefix + nodeNumber;
				if (mapObjects.markers.get(markerName)) { // Check if the marker exists
					if (activeTransmittersCache.indexOf(nodeNumber) != -1) {
						SetNodeTransmitting(nodeNumber);
					}
				}
				else {
					console.warn("Node " + nodeNumber + " is transmitting but does not have a marker on the map.");
				}
			}
		}

		activeTransmittersCache = activeNodes; // Update the cache with the latest active nodes

		// Set up the next check
		setTimeout(async () => {
			checkActiveTransmitters();
		}, howOftenToUpdateKeyedNodes);
	});
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
	const marker = L.marker([lat, lon], { icon: iconDisconnectedNode }).addTo(map).bindPopup(city + "<br>" + "node " + nodeNumber);
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