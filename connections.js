console.clear();

var markerNamePrefix = "m";
var lineNamePrefix = "l";

var howOftenToUpdateNodes = 10000; // milliseconds
var howOftenToUpdateKeyedNodes = 3000; // milliseconds

var iconHeight = 30;
var iconWidth = 30;

var zoomLevel = 6;
if (screen.height == "480") {
	zoomLevel = 5;
}

var nodeCache = {};
var activeTransmittersCache = [];

$(function () {
	setInterval(function () {
		loadData();
	}, howOftenToUpdateNodes);
});

function loadData() {
    console.debug("Loading data...");
	$.getJSON("https://local.aa5jc.com/api/asl", function (nodes) {

		AddOrUpdateNodes(nodes);

		// Clear old markers that are no longer in the data
		for (const key in nodeCache) {
			if (!nodes.hasOwnProperty(key)) {
				const marker = window[markerNamePrefix + nodeCache[key].name];
				if (marker instanceof L.Marker) {
					map.removeLayer(marker);
					delete window[markerName];
				}
			}
		}

		// Remove polylines that are no longer needed

        // Draw lines between nodes
		for (const key in nodes) {
			// if this node has links, draw them
			if (nodes[key].data.links) {
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
	});
}

function AddOrUpdateNodes(nodes) {
	// Clear the table body before adding new rows
	$("#tbodyConnections").empty();

	for (const key in nodes) {
		AddOrUpdateNode(nodes[key]);
	}
}

function AddOrUpdateNode(node) {
	console.debug("Adding or updating node: " + node.name);

	const nodeNumber = node.name;
	const markerName = markerNamePrefix + nodeNumber;

	const latValid = node.server.latitude != null && node.server.latitude != 0;
	const lonValid = node.server.logitude != null && node.server.logitude != 0;

	// If it's a private node, skip it
    if (nodeNumber < 2000) {
        return;
    }

	if (latValid && lonValid) {
		window[markerName] = newMarker(nodeNumber, node.server.location, node.server.latitude, node.server.logitude);
	}
	else {
		console.warn("Node " + nodeNumber + " has invalid coordinates: (" + node.server.logitude + ", " + node.server.logitude + ")");
	}

	$("#tbodyConnections").append(
		"<tr id='t" + nodeNumber + "'><td>" + nodeNumber + "</td><td>" + node.user_ID + " - " + node.server.location + "</td><td>" + " " + "</td><td>" + " " + "</td></tr>"
	);
}

function connectNodes(nodeA, nodeB) {
	// Ensure both nodes are valid
	if (!nodeA || !nodeB) {
		console.error("Invalid nodes provided for connection.");
		return;
	}
	const pointA = [nodeA.server.latitude, nodeA.server.logitude];
	const pointB = [nodeB.server.latitude, nodeB.server.logitude];
	const lineName = lineNamePrefix + nodeA.name + "_" + nodeB.name;
	const reverseLineName = lineNamePrefix + nodeB.name + "_" + nodeA.name;
	// Check if the line already exists
	if (!window[lineName] && !window[reverseLineName]) {
		window[lineName] = newLine(pointA, pointB, { color: 'blue', weight: 2 });
	}
}

// _____ Keyed node functions _____
async function checkActiveTransmitters(nodes) {
  const keyedList = await fetchKeyedNodes(); 
  return nodes.filter(n => keyedList.includes(n.name));
}

setInterval(async () => {
	$.getJSON("https://local.aa5jc.com/api/transmitting", function (activeNodes) {
		if (activeNodes.length) {
			console.log('Active transmitters: ', activeNodes);

			// Set the icon for each newly receiving node
			for (const nodeNumber of activeTransmittersCache) {
		
				var indexOfActiveNode = activeNodes.indexOf(nodeNumber);

				if (indexOfActiveNode == -1) {
					// The node is no longer active, so we set its icon to receiving
					const markerName = markerNamePrefix + nodeNumber;
					window[markerName].setIcon(iconReceiving);

					// Remove the item from the activeTransmittersCache array
					activeTransmittersCache.splice(indexOfActiveNode, 1);
				}
			}
		}

		// Set the icon for each newly active node
		for (const node of activeNodes) {
			const nodeNumber = node.name;
			const markerName = markerNamePrefix + nodeNumber;
			if (window[markerName]) {
				// If the marker already exists, update its icon
				if (!activeTransmittersCache.includes(nodeNumber)) {
					// If the node is not already in the activeTransmittersCache, add it
					activeTransmittersCache.push(nodeNumber);
					window[markerName].setIcon(iconTransmitting);
				}
			}
		}
	});
}, howOftenToUpdateKeyedNodes);

// _____ Leaflet Map Functions _____

var map = L.map("map").setView([34.7, -92.5], zoomLevel);

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

function newLine(pointA, pointB, options = {}) {
	// Ensure pointA and pointB are arrays in [lat, lng] format
	const latlngs = [pointA, pointB];

	// Draw the line with optional styling
	const line = L.polyline(latlngs, {
		color: options.color || 'white',
		weight: options.weight || 3,
		opacity: options.opacity || 0.7,
		dashArray: options.dashArray || null
	});

	line.addTo(map);
	return line; // Return the line if you want to manipulate it later
}