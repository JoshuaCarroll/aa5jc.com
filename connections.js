const howOftenToUpdateNodes = 70; // seconds
const howOftenToUpdateWeather = 60; // seconds
const mapCenter = [34.7, -92.5]; // Default to Arkansas

const markerNamePrefix = 'm';
const tableRowNamePrefix = 't';
const iconHeight = 45;
const iconWidth = 45;

let mapZoomLevel = 7;
if (screen.height === 480) {
    mapZoomLevel = 5;
}

const mapObjects = {
    markers: new Map(),
    lines: new Map(),
    repeaterMarkers: new Map()
};

let connectedAllStarNodes = new Set();
let repeaterList = [];
let radarLayer = null;
let weatherWarningsLayer = null;
let repeaterLayer = null;
let contextMenu = null;

const iconOptions = {
    iconAnchor: [iconWidth / 2, iconHeight],
    popupAnchor: [0, -iconHeight]
};

const wxTooltipOptions = {
	 direction: 'top',
	 offset: [0, 0]
};

const nodeTooltipOptions = {
	 direction: 'top',
	 offset: [0, -iconHeight - 5]
};

const weatherStyleMap = {
    'Tsunami Warning': '#FD6347',
    'Tornado Warning': '#FF0000',
    'Extreme Wind Warning': '#FF8C00',
    'Severe Thunderstorm Warning': '#FFA500',
    'Flash Flood Warning': '#8B0000',
    'Flash Flood Statement': '#8B0000',
    'Severe Weather Statement': '#00FFFF',
    'Shelter In Place Warning': '#FA8072',
    'Evacuation Immediate': '#7FFF00',
    'Civil Danger Warning': '#FFB6C1',
    'Nuclear Power Plant Warning': '#4B0082',
    'Radiological Hazard Warning': '#4B0082',
    'Hazardous Materials Warning': '#4B0082',
    'Fire Warning': '#A0522D',
    'Civil Emergency Message': '#FFB6C1',
    'Law Enforcement Warning': '#C0C0C0',
    'Storm Surge Warning': '#B524F7',
    'Hurricane Force Wind Warning': '#CD5C5C',
    'Hurricane Warning': '#DC143C',
    'Typhoon Warning': '#DC143C',
    'Special Marine Warning': '#FFA500',
    'Blizzard Warning': '#FF4500',
    'Snow Squall Warning': '#C71585',
    'Ice Storm Warning': '#8B008B',
    'Heavy Freezing Spray Warning': '#00BFFF',
    'Winter Storm Warning': '#FF69B4',
    'Lake Effect Snow Warning': '#008B8B',
    'Dust Storm Warning': '#FFE4C4',
    'Blowing Dust Warning': '#FFE4C4',
    'High Wind Warning': '#DAA520',
    'Tropical Storm Warning': '#B22222',
    'Storm Warning': '#9400D3',
    'Tsunami Advisory': '#D2691E',
    'Tsunami Watch': '#FF00FF',
    'Avalanche Warning': '#1E90FF',
    'Earthquake Warning': '#8B4513',
    'Volcano Warning': '#2F4F4F',
    'Ashfall Warning': '#A9A9A9',
    'Flood Warning': '#00FF00',
    'Coastal Flood Warning': '#228B22',
    'Lakeshore Flood Warning': '#228B22',
    'Ashfall Advisory': '#696969',
    'High Surf Warning': '#228B22',
    'Extreme Heat Warning': '#C71585',
    'Tornado Watch': '#FFFF00',
    'Severe Thunderstorm Watch': '#DB7093',
    'Flash Flood Watch': '#2E8B57',
    'Gale Warning': '#DDA0DD',
    'Flood Statement': '#00FF00',
    'Extreme Cold Warning': '#0000FF',
    'Freeze Warning': '#483D8B',
    'Red Flag Warning': '#FF1493',
    'Storm Surge Watch': '#DB7FF7',
    'Hurricane Watch': '#FF00FF',
    'Hurricane Force Wind Watch': '#9932CC',
    'Typhoon Watch': '#FF00FF',
    'Tropical Storm Watch': '#F08080',
    'Storm Watch': '#FFE4B5',
    'Tropical Cyclone Local Statement': '#FFE4B5',
    'Winter Weather Advisory': '#7B68EE',
    'Avalanche Advisory': '#CD853F',
    'Cold Weather Advisory': '#AFEEEE',
    'Heat Advisory': '#FF7F50',
    'Flood Advisory': '#00FF7F',
    'Coastal Flood Advisory': '#7CFC00',
    'Lakeshore Flood Advisory': '#7CFC00',
    'High Surf Advisory': '#BA55D3',
    'Dense Fog Advisory': '#708090',
    'Dense Smoke Advisory': '#F0E68C',
    'Small Craft Advisory': '#D8BFD8',
    'Brisk Wind Advisory': '#D8BFD8',
    'Hazardous Seas Warning': '#D8BFD8',
    'Dust Advisory': '#BDB76B',
    'Blowing Dust Advisory': '#BDB76B',
    'Lake Wind Advisory': '#D2B48C',
    'Wind Advisory': '#D2B48C',
    'Frost Advisory': '#6495ED',
    'Freezing Fog Advisory': '#008080',
    'Freezing Spray Advisory': '#00BFFF',
    'Low Water Advisory': '#A52A2A',
    'Local Area Emergency': '#C0C0C0',
    'Winter Storm Watch': '#4682B4',
    'Rip Current Statement': '#40E0D0',
    'Beach Hazards Statement': '#40E0D0',
    'Gale Watch': '#FFC0CB',
    'Avalanche Watch': '#F4A460',
    'Hazardous Seas Watch': '#483D8B',
    'Heavy Freezing Spray Watch': '#BC8F8F',
    'Flood Watch': '#2E8B57',
    'Coastal Flood Watch': '#66CDAA',
    'Lakeshore Flood Watch': '#66CDAA',
    'High Wind Watch': '#B8860B',
    'Extreme Heat Watch': '#800000',
    'Extreme Cold Watch': '#5F9EA0',
    'Freeze Watch': '#00FFFF',
    'Fire Weather Watch': '#FFDEAD',
    'Extreme Fire Danger': '#E9967A',
    '911 Telephone Outage': '#C0C0C0',
    'Coastal Flood Statement': '#6B8E23',
    'Lakeshore Flood Statement': '#6B8E23',
    'Special Weather Statement': '#FFE4B5',
    'Marine Weather Statement': '#FFDAB9',
    'Air Quality Alert': '#808080',
    'Air Stagnation Advisory': '#808080',
    'Hazardous Weather Outlook': '#EEE8AA',
    'Hydrologic Outlook': '#90EE90',
    'Short Term Forecast': '#98FB98',
    'Administrative Message': '#C0C0C0',
    'Test': '#F0FFFF',
    'Child Abduction Emergency': '#FFFFFF',
    'Blue Alert': '#FFFFFF'
};

$(function () {
	loadAllstarConnections();
	loadWeatherRadar();
	loadWeatherAlerts();
	loadRepeaterList();
});

function loadWeatherRadar() {
    status('Loading weather radar...');
    if (!radarLayer) {
        radarLayer = new L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
            layers: 'nexrad-n0r',
            format: 'image/png',
            transparent: true,
            attribution: "Weather data &copy; 2015 IEM Nexrad",
            opacity: 0.7
        });
    }

    if (!map.hasLayer(radarLayer)) {
        radarLayer.addTo(map);
    }
    status();
}

function loadWeatherAlerts() {
    status('Loading weather alerts...');
	const geoJsonUrl = 'https://api.weather.gov/alerts/active?status=actual&message_type=alert,update&area=MO,TN,MS,LA,TX,OK,AR&urgency=Immediate&severity=Extreme,Severe';
	$.getJSON(geoJsonUrl, geojsonData => {
		if (!weatherWarningsLayer) {
			weatherWarningsLayer = L.layerGroup().addTo(map);
		}

		weatherWarningsLayer.clearLayers();
		L.geoJSON(geojsonData, {
			onEachFeature(feature, layer) {
				if (feature.properties && feature.properties.headline && feature.properties.event) {
					layer.bindPopup(feature.properties.headline).bindTooltip(feature.properties.event, wxTooltipOptions);
				}
			},
			style: getWeatherStyle
		}).addTo(weatherWarningsLayer);

		setTimeout(loadWeatherAlerts, howOftenToUpdateWeather * 1000);
	});
    status();
}

function getWeatherStyle(feature) {
	if (!feature || !feature.properties) {
		return {};
	}

	const color = weatherStyleMap[feature.properties.event];

	return color ? { color, opacity: 0.7, fillColor: color, fillOpacity: 0.25 } : {};
}

function loadAllstarConnections() {
    status('Loading AllStarLink connections...');
	const geoJsonUrl = 'https://hub.aa5jc.com/allmon3/netmap.php?format=geojson';
	$.getJSON(geoJsonUrl, geojsonData => {
		$('#tbodyConnections').empty();

		connectedAllStarNodes = new Set();
		if (geojsonData && Array.isArray(geojsonData.features)) {
			geojsonData.features.forEach(feature => {
				if (feature && feature.properties && feature.properties.node) {
					connectedAllStarNodes.add(String(feature.properties.node));
				}
			});
		}

		L.geoJSON(geojsonData, {
			pointToLayer: addMarker,
            attribution: "Repeater data powered by <a href='https://github.com/JoshuaCarroll/allmon3-netmap'>NetMap</a>, <a href='https://www.allstarlink.org/'>AllStarLink</a>",
		}).addTo(map);

		updateRepeaterMarkers();
		setTimeout(loadAllstarConnections, howOftenToUpdateNodes * 1000);
	});
    status();
}

function getMarkerIcon(type) {
    let className = "iconPinRed";

    switch (type) {
        case 'asl':
            className = "iconPinGreen";
            break;
        case 'echolink':
            className = "iconPinBlue";
            break;
        case 'repeater':
            className = "iconPinYellow";
            break;
    }

    return L.divIcon({
        className,
        iconAnchor: [iconWidth / 2, iconHeight],
        popupAnchor: [0, -iconHeight]
    });
}

function getRepeaterMarkerIcon(isConnected) {
    return L.divIcon({
        className: isConnected ? 'iconPinRepeaterConnected' : 'iconPinRepeaterDisconnected',
        iconAnchor: [iconWidth / 2, iconHeight],
        popupAnchor: [0, -iconHeight]
    });
}

function loadRepeaterList() {
    if (repeaterList.length) {
        updateRepeaterMarkers();
        return;
    }

    $.getJSON('repeater-list.json', data => {
        repeaterList = Array.isArray(data) ? data : [];
        updateRepeaterMarkers();
    });
}

function updateRepeaterMarkers() {
    if (!repeaterLayer) {
        repeaterLayer = L.layerGroup().addTo(map);
    }

    repeaterList.forEach(repeater => {
        if (!repeater || !repeater.latitude || !repeater.longitude) {
            return;
        }

        const markerName = `repeater-${repeater.callsign}`;
        const isConnected = Boolean(repeater.allstarNode && connectedAllStarNodes.has(String(repeater.allstarNode)));
        let marker = mapObjects.repeaterMarkers.get(markerName);

        if (!marker) {
            const popupContent = `
<b>${repeater.callsign}</b><br>
Freq: ${repeater.frequency || 'n/a'}<br>
Offset: ${repeater.offset || 'n/a'}<br>
Tone: ${repeater.tone || 'n/a'}<br>
City: ${repeater.city || 'n/a'}, ${repeater.state || 'n/a'}<br>
AllStar Node: ${repeater.allstarNode || 'n/a'}
`;
            marker = L.marker([repeater.latitude, repeater.longitude], {
                icon: getRepeaterMarkerIcon(isConnected)
            }).bindPopup(popupContent).bindTooltip(`${repeater.callsign} (${repeater.frequency || 'n/a'})`, nodeTooltipOptions);

            repeaterLayer.addLayer(marker);
            mapObjects.repeaterMarkers.set(markerName, marker);
        } else {
            marker.setIcon(getRepeaterMarkerIcon(isConnected));
        }
    });
}

function addMarker(feature) {
	if (!feature || !feature.properties || !feature.properties.lat || !feature.properties.lon) {
		return;
	}

    const markerIcon = getMarkerIcon(feature.properties.type);
    var typeLabel = "Node"; // Default label for markers

    switch (feature.properties.type) {
        case 'asl':
            typeLabel = "AllStarLink";
            break;
        case 'echolink':
            typeLabel = "EchoLink";
            break;
        case 'repeater':
            typeLabel = "Repeater";
            break;
    }

	const { node, lat, lon, desc } = feature.properties;
	const markerName = `${markerNamePrefix}${node}`;

	if (!mapObjects.markers.has(markerName)) {
		const popupContent = `<b>${typeLabel} ${node}</b><br>${desc}`;
		const marker = L.marker([lat, lon], { icon: markerIcon }).bindPopup(popupContent).bindTooltip(`${typeLabel} ${node}`, nodeTooltipOptions);

		markerCluster.addLayer(marker);
		mapObjects.markers.set(markerName, marker);
	}

	$('#tbodyConnections').append(newTableRow(feature.properties));
}

function removeMarker(nodeNumber) {
	const markerName = `${markerNamePrefix}${nodeNumber}`;
	const marker = mapObjects.markers.get(markerName);

	if (!marker) {
		return;
	}

	if (marker instanceof L.Marker) {
		markerCluster.removeLayer(marker);
	}

	mapObjects.markers.delete(markerName);
}

function newTableRow({ node, callsign, desc }) {
	return `
<tr id='${tableRowNamePrefix}${node}'>
  <td><a href='https://stats.allstarlink.org/stats/${node}' target='_blank'>${node}</a></td>
  <td><a href='https://www.qrz.com/db/${callsign}' target='_blank'>${callsign}</a></td>
  <td>${desc}</td>
</tr>`;
}

function status(message) {
    
    // Write the message to the debug console only if the message is not empty
    if (message) {
        console.debug(message);
        $('#statusBar').text(message);
    }
    else {
        $('#statusBar').text("");
    }
}
// _____ Leaflet Map Functions ____________________________________________________________________________________________________________

// Initialize the map
var map = L.map("map", { maxZoom: 18 }).setView(mapCenter, mapZoomLevel);

// Initialize the marker cluster group
// This facilitates clustering of markers on the map for better visualization and performance.
var markerCluster = L.markerClusterGroup({
	spiderfyOnMaxZoom: true,
	showCoverageOnHover: false,
	zoomToBoundsOnClick: true,
	animate: true,
	animateAddingMarkers: true,
	maxClusterRadius: 15,
	iconCreateFunction: function (cluster) {
		return L.divIcon({ html: cluster.getChildCount(), className: 'iconPinBlue', iconSize: L.point(iconWidth, iconHeight) });
	}
});
map.addLayer(markerCluster);

map.on('contextmenu', onMapContextMenu);
map.on('click', hideContextMenu);

L.maplibreGL({
	style: 'https://tiles.openfreemap.org/styles/dark'
}).addTo(map);

function onMapContextMenu(event) {
    if (contextMenu) {
        hideContextMenu();
    }

    const menu = L.DomUtil.create('div', 'map-context-menu');
    menu.innerHTML = `
        <div class="context-menu-title">Map Layers</div>
        <label><input type="checkbox" data-layer="radar" checked> Radar</label>
        <label><input type="checkbox" data-layer="weather" checked> Weather warnings</label>
        <label><input type="checkbox" data-layer="repeaters" checked> Repeaters</label>
        <label><input type="checkbox" data-layer="nodes" checked> Nodes</label>
    `;

    const menuItems = menu.querySelectorAll('input[data-layer]');
    menuItems.forEach(item => {
        item.checked = isLayerVisible(item.getAttribute('data-layer'));
        item.addEventListener('change', function () {
            toggleLayerVisibility(this.getAttribute('data-layer'), this.checked);
        });
    });

    const mapContainer = document.getElementById('map');
    mapContainer.appendChild(menu);

    const point = map.latLngToContainerPoint(event.latlng);
    const left = Math.min(Math.max(point.x + 10, 10), mapContainer.clientWidth - 180);
    const top = Math.min(Math.max(point.y + 10, 10), mapContainer.clientHeight - 140);

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    contextMenu = menu;

    L.DomEvent.preventDefault(event);
    L.DomEvent.stopPropagation(event);
}

function hideContextMenu() {
    if (contextMenu && contextMenu.parentNode) {
        contextMenu.parentNode.removeChild(contextMenu);
    }
    contextMenu = null;
}

function isLayerVisible(layerName) {
    switch (layerName) {
        case 'radar':
            return radarLayer ? map.hasLayer(radarLayer) : false;
        case 'weather':
            return weatherWarningsLayer ? map.hasLayer(weatherWarningsLayer) : false;
        case 'repeaters':
            return repeaterLayer ? map.hasLayer(repeaterLayer) : false;
        case 'nodes':
            return map.hasLayer(markerCluster);
        default:
            return true;
    }
}

function toggleLayerVisibility(layerName, isVisible) {
    switch (layerName) {
        case 'radar':
            if (radarLayer) {
                isVisible ? radarLayer.addTo(map) : map.removeLayer(radarLayer);
            }
            break;
        case 'weather':
            if (weatherWarningsLayer) {
                isVisible ? weatherWarningsLayer.addTo(map) : map.removeLayer(weatherWarningsLayer);
            }
            break;
        case 'repeaters':
            if (repeaterLayer) {
                isVisible ? repeaterLayer.addTo(map) : map.removeLayer(repeaterLayer);
            }
            break;
        case 'nodes':
            isVisible ? markerCluster.addTo(map) : map.removeLayer(markerCluster);
            break;
    }
}
