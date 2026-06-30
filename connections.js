const howOftenToUpdateNodes = 70; // seconds
const howOftenToUpdateWeather = 60; // seconds
const mapCenter = [34.7, -92.5]; // Default to Arkansas

const markerNamePrefix = 'm';
const tableRowNamePrefix = 't';
const iconHeight = 30;
const iconWidth = 30;

let mapZoomLevel = 7;
if (screen.height === 480) {
    mapZoomLevel = 5;
}

const mapObjects = {
    markers: new Map(),
    lines: new Map()
};

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
});

function loadWeatherRadar() {
    status('Loading weather radar...');
    var nexrad = new L.tileLayer.wms("http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi", {
        layers: 'nexrad-n0r',
        format: 'image/png',
        transparent: true,
        attribution: "Weather data &copy; 2015 IEM Nexrad"
    }).addTo(map);
    status();
}

function loadWeatherAlerts() {
    status('Loading weather alerts...');
	const geoJsonUrl = 'https://api.weather.gov/alerts/active?status=actual&message_type=alert,update&area=MO,TN,MS,LA,TX,OK,AR&urgency=Immediate&severity=Extreme,Severe';
	$.getJSON(geoJsonUrl, geojsonData => {
		L.geoJSON(geojsonData, {
			onEachFeature(feature, layer) {
				if (feature.properties && feature.properties.headline && feature.properties.event) {
					layer.bindPopup(feature.properties.headline).bindTooltip(feature.properties.event, wxTooltipOptions);
				}
			},
			style: getWeatherStyle
		}).addTo(map);

		setTimeout(loadWeatherAlerts, howOftenToUpdateWeather * 1000);
	});
    status();
}

function getWeatherStyle(feature) {
	if (!feature || !feature.properties) {
		return {};
	}

	const color = weatherStyleMap[feature.properties.event];
	return color ? { color } : {};
}

function loadAllstarConnections() {
    status('Loading AllStarLink connections...');
	const geoJsonUrl = 'https://hub.aa5jc.com/allmon3/netmap.php?format=geojson';
	$.getJSON(geoJsonUrl, geojsonData => {
		$('#tbodyConnections').empty();

		L.geoJSON(geojsonData, {
			pointToLayer: addMarker
		}).addTo(map);

		setTimeout(loadAllstarConnections, howOftenToUpdateNodes * 1000);
	});
    status();
}

const iconPin = L.divIcon({
    iconSize: [iconWidth, iconHeight],
	iconAnchor: [iconWidth / 2, iconHeight],
	popupAnchor: [0, -1 * iconHeight]
});

function addMarker(feature) {
	if (!feature || !feature.properties || !feature.properties.lat || !feature.properties.lon) {
		return;
	}

    const markerIcon = Object.create(iconPin);

    var markerColor = "#ffffff"; // Default color for markers
    var typeLabel = "Node"; // Default label for markers

    switch (feature.properties.type) {
        case 'asl':
            markerIcon.className = "iconPinGreen"; // Green for AllStarLink nodes
            typeLabel = "AllStarLink";
            break;
        case 'echolink':
            markerIcon.className = "iconPinBlue"; // Blue for EchoLink nodes
            typeLabel = "EchoLink";
            break;
        case 'repeater':
            markerIcon.className = "iconPinYellow"; // Yellow for repeater nodes
            typeLabel = "Repeater";
            break;
        default:
            markerIcon.className = "iconPinRed"; // Red for other types of nodes
    }

	const { node, lat, lon, desc, type } = feature.properties;
	const markerName = `${markerNamePrefix}${node}`;

	if (!mapObjects.markers.has(markerName)) {
		const popupContent = `<b>${typeLabel} ${node}</b><br>${desc}`;
		const marker = L.marker([lat, lon], markerIcon).bindPopup(popupContent).bindTooltip(`${typeLabel} ${node}`, nodeTooltipOptions);

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
		return L.divIcon({ html: cluster.getChildCount(), className: 'icon-receiving', iconSize: L.point(iconWidth, iconHeight) });
	}
});
map.addLayer(markerCluster);

L.maplibreGL({
	style: 'https://tiles.openfreemap.org/styles/dark'
}).addTo(map);