var iconHeight = 30;
var iconWidth = 30;

var zoomLevel = 6;
if (screen.height == "480") {
	zoomLevel = 5;
}

var map = L.map("map").setView([34.7, -92.5], zoomLevel);

var tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var iconDisconnectedNode = L.divIcon({
	className: 'icon-antenna',
	iconAnchor: [iconWidth/2,iconHeight]
});

var iconReceiving = L.divIcon({
	className: 'icon-receiving',
	iconAnchor: [iconWidth/2,iconHeight]
});
var iconTransmitting = L.divIcon({
	className: 'icon-transmitting',
	iconAnchor: [iconWidth/2,iconHeight]
});

function newMarker(node, city, lat, lon) {
	return L.marker([lat, lon], {icon: iconDisconnectedNode}).addTo(map).bindPopup(city + "<br>" + "node " + node);;
}

function setStatus(node, status) {
	if (status == "transmitting") {
		try {
			eval("m"+node+".setIcon(iconTransmitting);");
		}
		catch {}
	}
	else if (status == "connected") {
		try {
			eval("m"+node+".setIcon(iconReceiving);");
		}
		catch {}
	}
}

function loadConnections(nodes) {
	const newData = {};
	const currentNodes = new Set();
	const existingNodes = new Set();

	// Build quick lookup of incoming nodes
	for (const node of nodes) {
		newData[node.node] = node;
		currentNodes.add(node.node);
	}

	if (!dataCache) dataCache = {};

	for (const cachedNode in dataCache) {
		existingNodes.add(cachedNode);
	}

	// 1. Fade out and remove nodes no longer in data
	for (const cachedNode of existingNodes) {
		if (!currentNodes.has(cachedNode)) {
			$("#t" + cachedNode).fadeOut(500, function () {
				$(this).remove();
			});

			try {
				map.removeLayer(window["m" + cachedNode]);
			} catch { }

			delete dataCache[cachedNode];
		}
	}

	// 2. Add/update nodes
	for (const node of nodes) {
		const id = node.node;
		const markerVar = "m" + id;
		const latValid = node.latitude != null && node.latitude !== 0;
		const lonValid = node.longitude != null && node.longitude !== 0;
		const safeTransmit = node.timeSinceTransmit ?? "∞";

		const $existingRow = $("#t" + id);

		// Add new node
		if (!$existingRow.length) {
			if (latValid && lonValid) {
				window[markerVar] = newMarker(id, node.location, node.latitude, node.longitude);
			}

			const $newRow = $(
				"<tr id='t" + id + "' style='display:none'>" +
				"<td>" + id + "</td>" +
				"<td>" + node.location + "</td>" +
				"<td>" + node.timeSpanConnected + "</td>" +
				"<td>" + safeTransmit + "</td>" +
				"</tr>"
			);

			$("#tbodyConnections").append($newRow);
			$newRow.fadeIn(500);
		}
		// Update existing node
		else {
			const $cells = $existingRow.children("td");
			if (
				$cells.eq(1).text() !== node.location ||
				$cells.eq(2).text() !== node.timeSpanConnected ||
				$cells.eq(3).text() !== safeTransmit
			) {
				$cells.eq(1).text(node.location);
				$cells.eq(2).text(node.timeSpanConnected);
				$cells.eq(3).text(safeTransmit);

				$existingRow.css("background-color", "#fff3cd").delay(50).animate({ backgroundColor: "#ffffff" }, 1000);
			}

			if (latValid && lonValid) {
				try {
					window[markerVar].setPopupContent(node.location + "<br>" + "node " + id);
				} catch { }
			}
		}

		setStatus(id, node.status);
		dataCache[id] = node;
	}

	// 3. Re-sort table rows alphabetically by node ID
	const rows = $("#tbodyConnections tr").get();
	rows.sort((a, b) => {
		const idA = $(a).children("td").eq(0).text().toUpperCase();
		const idB = $(b).children("td").eq(0).text().toUpperCase();
		return idA.localeCompare(idB);
	});
	$.each(rows, function (index, row) {
		$("#tbodyConnections").append(row);
	});
}



var dataCache = null;
function loadData() {
    $.getJSON("https://local.aa5jc.com/api/", function (data) {
        loadConnections(data);
    });
}


$(function () {
	setInterval(function () {
		loadData();
	}, 2000);
});