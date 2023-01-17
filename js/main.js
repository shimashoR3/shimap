/* eslint-disable no-undef */
/**
 * control layers outside the map
 */

// config map
let config = {
  minZoom: 16,
  maxZoom: 18,
  zoomSnap: 0,
  zoomDelta: 1,
};
// magnification with which the map will start
const zoom = 16;
// co-ordinates
const lat = 34.83016;
const lng = 138.17338;

// calling map
const map = L.map("map", config).setView([lat, lng], zoom);
	
// Used to load and display tile layers on the map
// Most tile servers require attribution, which you can set under `Layer`
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// ------------------------------------------------------------

// async function to load geojson
async function fetchData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
  }
}


// center map on the clicked marker
function clickZoom(e) {
  map.setView(e.target.getLatLng(), config.maxZoom);
}

let geojsonOpts = {
    
  pointToLayer: function (feature, latlng) {
    const { lat, lng } = latlng;
    const { name, logo, description } = feature.properties.info;

    const logoImg = logo
      ? `<div class="info-logo"><img src="${logo}"></div>`
      : "";
  
    const descriptionText = description
      ? `<div class="info-description">${description}</div>`
      : "";
  
    const infoButton = `<div class="info-button"><button>詳しく見る</button></div>`;
    const template = `
      <div class="info-shop">
        ${logoImg}
        <div>
          <h1 class="info-name">${name}</h1>
          ${descriptionText}
          ${infoButton}
        </div>
      </div>`;
    
    const marker = L.marker([lng, lat], {
      icon: L.divIcon({
        className: romeji[feature.properties.area],
        iconSize: L.point(16, 16),
        html: feature.properties.area[0].toUpperCase(),
        popupAnchor: [3, -5],
      }),
      "marker-options-id": feature.properties.info.name,
    },
    
    )
    .bindPopup(template)
    // .on("click", )
    .on("click", function(e) {
      clickZoom(e)
      
      const infoButton = document.querySelector(".info-button");

      infoButton.addEventListener("click", () => {
        showSidebarWidthText(e.target.options["marker-options-id"]);
    
        // add comment to sodebar depending on marker id
        function showSidebarWidthText(id) {
          if (feature.properties.info.name === id) {
            document.body.classList.add("active-sidebar");
            addContentToSidebar(feature.properties);
          }
        }
      });
    });

    return marker
  },
};



const layersContainer = document.querySelector(".layers");

const layersButton = "all layers";

const nihongo = {
  "all layers": "すべて",
  "east": "東エリア",
  "west": "西エリア",
  "center": "中央エリア"
};

const romeji = {
  "東エリア": "east",
  "西エリア": "west",
  "中央エリア": "center"
}

function generateButton(name) {
  const id = name === layersButton ? "all-layers" : name;

  const templateLayer = `
    <li class="layer-element">
      <label for="${id}">
        <input type="checkbox" id="${id}" name="item" class="item" value="${name}" checked>
        <span>${nihongo[name]}</span>
      </label>
    </li>
  `;

  layersContainer.insertAdjacentHTML("beforeend", templateLayer);
}

generateButton(layersButton);

// add data to geoJSON layer and add to LayerGroup
const arrayLayers = ["center", "west", "east"];
const markers = L.markerClusterGroup();

arrayLayers.map((json) => {
  const sortData = [];
  
  generateButton(json);
  fetchData('https://script.google.com/macros/s/AKfycbxHDEECJob3nsZF3txfsKLx-eey-xKe8NmGZn_FRIQgFmZNOZBcnLVKfHvS-lVhRBOWxw/exec').then((data) => {
    data.map( obj => {
      if (obj.properties.area == nihongo[json]) {
        sortData.push(obj)
      }
    })
    const markers = L.markerClusterGroup();

    window["layer_" + json] = markers.addLayer(L.geoJSON({type: "FeatureCollection",features: sortData}, geojsonOpts));
    map.addLayer(markers)

  })

});
document.addEventListener("click", (e) => {
  const target = e.target;

  const itemInput = target.closest(".item");

  if (!itemInput) return;

  showHideLayer(target);
});

function showHideLayer(target) {
  if (target.id === "all-layers") {
    arrayLayers.map((json) => {
      checkedType(json, target.checked);
    });
  } else {
    checkedType(target.id, target.checked);
  }

  const checkedBoxes = document.querySelectorAll("input[name=item]:checked");

  document.querySelector("#all-layers").checked =
    checkedBoxes.length <= 3 ? false : true;
}

function checkedType(id, type) {
  map[type ? "addLayer" : "removeLayer"](window["layer_" + id]);

  map.fitBounds(window[["layer_" + id]].getBounds(), { padding: [50, 50] });

  document.querySelector(`#${id}`).checked = type;
}

const buttonClose = document.querySelector(".close-button");

// --------------------------------------------------
// close when click esc
document.addEventListener("keydown", function (event) {
  // close sidebar when press esc
  if (event.key === "Escape") {
    closeSidebar();
  }
});

// close sidebar when click on close button
buttonClose.addEventListener("click", () => {
  // close sidebar when click on close button
  closeSidebar();
});

// --------------------------------------------------
// close sidebar

function closeSidebar() {
  // remove class active-sidebar
  document.body.classList.remove("active-sidebar");

  // bounds map to default
  //boundsMap();
}

// --------------------------------------------------
// add content to sidebar

function addContentToSidebar(marker) {
  const { name, description, address, phone_number, holiday} = marker.info;
  const {category, area } = marker;

  // create sidebar content
  const sidebarTemplate = `
    <article class="sidebar-content">
      <h1>${name}</h1>
      <div class="marker-id"></div>
      <div class="info-content">
        <div class="info-description">${description}</div>
        <div class="info-description">${address}</div>
        <div class="info-description">${phone_number}</div>
        <div class="info-description">${holiday}</div>
        <div class="info-description">${category}</div>
        <div class="info-description">${area}</div>
      </div>
    </article>
  `;

  const sidebar = document.querySelector(".sidebar");
  const sidebarContent = document.querySelector(".sidebar-content");

  // always remove content before adding new one
  sidebarContent?.remove();

  // add content to sidebar
  sidebar.insertAdjacentHTML("beforeend", sidebarTemplate);

  // set bounds depending on marker coords
  //boundsMap(coords);
}

// --------------------------------------------------
// bounds map when sidebar is open
function boundsMap(coords) {
  const sidebar = document.querySelector(".sidebar").offsetWidth;

  const marker = L.marker(coords);
  const group = L.featureGroup([marker]);

  // bounds depending on whether we have a marker or not
  const bounds = coords ? group.getBounds() : groupBounds.getBounds();

  // set bounds of map depending on sidebar
  // width and feature group bounds
  map.fitBounds(bounds, {
    paddingTopLeft: [coords ? sidebar : 0, 10],
  });
}