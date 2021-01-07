<template>
  <!--div id="olMapDiv" :style="{'left': left, 'top': top}" style="z-index:0;position:fixed;right:0;bottom:0;border: 1px solid #ccc"></div-->
  <div
    fill-height
    id="olMapDiv"
    :style="{'left': left, 'top': top}"
    style="z-index:0;right:0;bottom:0;border: 1px solid #ccc; height:100%; width:100%;"
  >
    <div ref="popupContainer" class="ol-popup">
      <a href="#" @click.prevent="closePopUp" class="ol-popup-closer"></a>
      <div v-if="selectedOtherLog">
        <p>
          {{this.dateOnly(new Date(selectedOtherLog.started_at * 1000))}}
          <br />
          {{selectedOtherLog.chart_type}}
        </p>
        <p v-if="selectedOtherLog.comments">{{selectedOtherLog.comments}}</p>
        <v-btn @click="$router.push('/log/' + selectedOtherLog.id)">View Chart</v-btn>
      </div>
    </div>

    <v-snackbar
      class="mt-4"
      v-model="activePointMoved"
      color="primary"
      :absolute="true"
      top
      :timeout="0"
    >
      The log location has been changed.
      <v-btn color="secondary" @click="activePointSaved">Save</v-btn>
      <v-btn color="secondary" @click="undoActiveLogMoved">Undo</v-btn>
    </v-snackbar>
  </div>
</template>


<script>
// mp035 require open layers
import "ol/ol.css";
import Map from "ol/Map.js";
import View from "ol/View.js";
import { Draw, Modify, Snap, Select, Translate } from "ol/interaction.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";
import { OSM, XYZ, Vector as VectorSource } from "ol/source.js";
import {
  Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
  Text,
  Icon
} from "ol/style.js";
//import KML from 'ol/format/KML.js';  // now unused, was used for loading local kml from files stored on server.
import Polygon from "ol/geom/Polygon";
import Point from "ol/geom/Point";
import Feature from "ol/Feature";
import Overlay from "ol/Overlay.js";
import Collection from "ol/Collection";
import { getDistance } from "ol/sphere";
import { transform, toLonLat } from "ol/proj";
import { defaults as defaultControls, Control } from "ol/control";
import { click, pointerMove, altKeyOnly } from "ol/events/condition";
import TileState from "ol/TileState";

// bring in api details from our app
import apiEndpoints from "../mixins/api-endpoints";
import apiRequest from "../mixins/api-request";
import geoFunctions from "../mixins/geo-functions"
import formatDate from "../mixins/format-date";

function createText(content, offsetX, offsetY) {
  return new Text({
    //textAlign: undefined,
    //textBaseline: undefined,
    font: "12px sans-serif",
    text: content,
    fill: new Fill({ color: "black" }),
    stroke: new Stroke({ color: "black", width: 0.5 }),
    offsetX: offsetX,
    offsetY: offsetY,
    placement: "point"
    //maxAngle: maxAngle,
    //overflow: overflow,
    //rotation: rotation
  });
}

function createMarkerStyle(iconSrc) {
  // TODO: KEEP
  return new Style({
    image: new Icon(
      /** @type {module:ol/style/Icon~Options} */ ({
        //anchor: [0.5, 46],
        anchor: [0.5, 0.5],
        anchorOrigin: "bottom-left",
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        src: iconSrc
      })
    )
  });
}

var markerStyleCurrent = createMarkerStyle("/img/chart-icon-green.svg");
var markerStyleOther = createMarkerStyle("/img/chart-icon.svg");
var markerStyleSelected = createMarkerStyle("/img/chart-icon-green-yellow.svg");

function createMarker(location, style) {
  // TODO: KEEP
  var iconFeature = new Feature({
    geometry: new Point(location)
  });

  iconFeature.setStyle(style);

  return iconFeature;
}

function createPointDragInteraction(pointFeature) {
  let translate = new Translate({
    features: new Collection([pointFeature])
  });
  return translate;
}

export default {
  mixins: [apiEndpoints, apiRequest, formatDate, geoFunctions],
  props: {
    top: String,
    left: String,
    interactionType: String, // the current interaction type for the map.
    interactionSnap: {
      type: Boolean,
      default: false
    },
  },
  data() {
    return {
      activeLogFeature: null, // TODO: Keep
      lastViewVersion: null,
      tileLayers: [], // the different tile layers for the map (satelite, road etc.)
      hereLayers: [], // the different HERE layers for the map (satelite, road etc.)
      updatedCoordinates: { latitude: null, longitude: null },
      olSource: null,
      olActiveSource: null,
      olVectorLayer: null,
      olActiveVectorLayer: null,
      olMap: null,
      popUpOverlay: null,
      popUpOverlayCoordinates: undefined,
      selectedOtherLog: null
    };
  },
  mounted() {
    this.setupOlMap();
    this.zoomToFitSource(false);
  },

  methods: {
    addOtherLogMarkersToSource: function(activeLog) {
      // TODO: KEEP

      // clear old log locations if they exist
      this.olSource.clear();

      if (activeLog && activeLog.nearby) {
        activeLog.nearby.forEach(log => {
          let location = transform(
            [log.longitude, log.latitude],
            "EPSG:4326",
            "EPSG:3857"
          );
          var feature = createMarker(location, markerStyleOther);
          feature.setId(log.id);
          this.olSource.addFeature(feature);
        });
      }
    },

    createActiveLogLocation: function(location) {
      // TODO: KEEP
      location = transform(
        [location.longitude, location.latitude],
        "EPSG:4326",
        "EPSG:3857"
      );
      if (!this.activeLogFeature) {
        this.activeLogFeature = createMarker(location, markerStyleCurrent);
        this.olActiveSource.addFeature(this.activeLogFeature);
        this.activeLogTranslate = createPointDragInteraction(
          this.activeLogFeature
        );
        this.olMap.addInteraction(this.activeLogTranslate);
        this.activeLogTranslate.on("translateend", e => {
          console.log("CHANGED!!!!");
          let coords = e.features
            .getArray()[0]
            .getGeometry()
            .clone()
            .transform("EPSG:3857", "EPSG:4326")
            .getCoordinates();
          this.updatedCoordinates = {
            longitude: coords[0],
            latitude: coords[1]
          };
          this.$emit(
            "activeLogMoved",
            e.features
              .getArray()[0]
              .getGeometry()
              .clone()
              .transform("EPSG:3857", "EPSG:4326")
              .getCoordinates()
          );
        });
      } else {
        this.activeLogFeature.getGeometry().setCoordinates(location);
      }
      this.$emit(
        "activeLogMoved",
        this.activeLogFeature
          .getGeometry()
          .clone()
          .transform("EPSG:3857", "EPSG:4326")
          .getCoordinates()
      );
    },


    removeActiveLogMarker: function() {
      // TODO: KEEP
      this.olMap.removeInteraction(this.activeLogTranslate);
      this.olSource.removeFeature(this.activeLogFeature);
    },

    zoomToFitSource(animate = true) {
      // zoom to fit map
      if (this.olActiveSource.getFeatures().length < 1) {
        // no data, so nothing to zoom to.
        return;
      }

      var extent = this.olActiveSource.getExtent();
      //var extent = this.activeLogFeature.getGeometry();

      var options = {
        size: this.olMap.getSize(),
        maxZoom: 18
      };

      if (animate) {
        options.duration = 1000;
      }

      this.olMap.getView().fit(extent, options);
    },


    setOlSnapInteraction: function(enabled) {
      this.olMap.removeInteraction(this.olSnapInteraction);
      if (enabled) {
        this.olSnapInteraction = new Snap({ source: this.olSource });
        this.olMap.addInteraction(this.olSnapInteraction);
      }
    },


    setOlInteraction: function(interactionType) {
      // remove the old interaction
      this.olMap.removeInteraction(this.currentOlInteraction);

      // some interactions (move/modify) coexist with the select interaction
      // for ease of use, so we handle it separately
      this.olMap.removeInteraction(this.olSelectInteraction);

      // the select interaction on its own
      if (interactionType == "Select") {
        this.currentOlInteraction = this.olSelectInteraction;
        this.olMap.addInteraction(this.currentOlInteraction);
      } else if (interactionType == "Move") {
        this.currentOlInteraction = new Translate({
          //features: new Collection([pointFeature])
          features: this.olSelectInteraction.getFeatures()
        });
        this.currentOlInteraction.on("translateend", e => {
          e.features.forEach(feature => {
            if (feature.propertyInfo) {
              var storeObj = this.$store.getters.featureById(
                feature.propertyInfo
              );
              //storeObj.structureModified = true;
              Vue.set(storeObj, "structureModified", true);
              (storeObj.geometry || storeObj.location).coordinates = feature
                .getGeometry()
                .clone()
                .transform("EPSG:3857", "EPSG:4326")
                .getCoordinates();
              this.$store.commit("feature", storeObj);
              feature.setStyle(this.createStyle(feature.propertyInfo));
            }
          });
          this.$emit("translateend", e.features);
        });

        this.olMap.addInteraction(this.currentOlInteraction);
        this.olMap.addInteraction(this.olSelectInteraction);
      } else if (interactionType == "Modify") {
        //this.currentOlInteraction = new Modify({source: this.olSource});
        this.currentOlInteraction = new Modify({
          features: this.olSelectInteraction.getFeatures()
        });

        this.currentOlInteraction.on("modifyend", e => {
          // remove duplicate points from polygon, and mark features as modified.
          e.features.forEach(feature => {
            let remPoints = [];
            let coords = feature.getGeometry().getCoordinates()[0];
            coords.forEach((coord, idx) => {
              if (idx > 0) {
                let lastCoord = transform(
                  coords[idx - 1],
                  "EPSG:3857",
                  "EPSG:4326"
                );
                coord = transform(coord, "EPSG:3857", "EPSG:4326");
                let dist = getDistance(coord, lastCoord);
                if (dist < 1) {
                  if (idx == coords.length - 1) {
                    // if last point is the same as previous point, we need to remove previous point
                    remPoints.push(idx - 1);
                  } else {
                    // otherwise this point should be removed
                    remPoints.push(idx);
                  }
                }
              }
            });
            remPoints.sort(function(a, b) {
              return b - a;
            }); // sort descending
            for (var i = 0; i < remPoints.length; i++) {
              if (coords.length <= 4) break;
              if (remPoints[i] < coords.length) {
                coords.splice(remPoints[i], 1);
              }
            }
            feature.getGeometry().setCoordinates([coords]);

            if (feature.propertyInfo) {
              var storeObj = this.$store.getters.featureById(
                feature.propertyInfo
              );
              //storeObj.structureModified = true;
              Vue.set(storeObj, "structureModified", true);
              storeObj.geometry.coordinates = feature
                .getGeometry()
                .clone()
                .transform("EPSG:3857", "EPSG:4326")
                .getCoordinates();
              this.$store.commit("feature", storeObj);
              feature.setStyle(this.createStyle(feature.propertyInfo));
            }
          });
          // after the polygon is cleaned, emit an event to indicate the modify is complete
          this.$emit("modifyend", e.features);
        });
        // modify and select coexist for ease of use.
        this.olMap.addInteraction(this.currentOlInteraction);
        this.olMap.addInteraction(this.olSelectInteraction);
      } else {
        // polygon etc.
        this.clearOlMapSelection();
        this.currentOlInteraction = new Draw({
          source: this.olSource,
          type: interactionType
        });

        this.currentOlInteraction.on("drawend", event => {
          var feature = event.feature;
          this.$emit("drawend", event.feature);
        });
        this.olMap.addInteraction(this.currentOlInteraction);
      }

      // the snap feature needs to be recreated whenever source or interaction is changed
      // so recreate it here if required
      this.setOlSnapInteraction(this.interactionSnap);
    },


    createUrl(tpl, layerDesc) {
      return tpl
        .replace("{base}", layerDesc.base)
        .replace("{type}", layerDesc.type)
        .replace("{scheme}", layerDesc.scheme)
        .replace("{app_id}", layerDesc.app_id)
        .replace("{app_code}", layerDesc.app_code);
    },


    arrayBufferToBase64(buffer) {
      var binary = "";
      var bytes = [].slice.call(new Uint8Array(buffer));

      bytes.forEach(b => (binary += String.fromCharCode(b)));

      return window.btoa(binary);
    },


    createHereMapsLayers() {
      var appId = window.HERE_APP_ID;
      var appCode = window.HERE_APP_CODE;
      this.hereLayers = [
        {
          base: "base",
          type: "maptile",
          scheme: "normal.day",
          app_id: appId,
          app_code: appCode
        },
        {
          base: "base",
          type: "maptile",
          scheme: "normal.day.transit",
          app_id: appId,
          app_code: appCode
        },
        {
          base: "base",
          type: "maptile",
          scheme: "pedestrian.day",
          app_id: appId,
          app_code: appCode
        },
        {
          base: "aerial",
          type: "maptile",
          scheme: "terrain.day",
          app_id: appId,
          app_code: appCode
        },
        {
          base: "aerial",
          type: "maptile",
          scheme: "satellite.day",
          app_id: appId,
          app_code: appCode
        },
        {
          base: "aerial",
          type: "maptile",
          scheme: "hybrid.day",
          app_id: appId,
          app_code: appCode
        }
      ];
      let urlTpl =
        "https://{1-4}.{base}.maps.ls.hereapi.com" +
        "/{type}/2.1/maptile/newest/{scheme}/{z}/{x}/{y}/256/png";

      this.tileLayers = [];
      var i, ii;
      for (i = 0, ii = this.hereLayers.length; i < ii; ++i) {
        var layerDesc = this.hereLayers[i];
        this.tileLayers.push(
          new TileLayer({
            visible: false,
            preload: Infinity,
            source: new XYZ({
              url: this.createUrl(urlTpl, layerDesc),

              tileLoadFunction: (imageTile, src) => {
                if (imageTile.getTileCoord()[0] > 20){
                  // here maps tiles do not support zoom levels greater than 20,
                  // so go straight to error state without fetching.
                  imageTile.setState(TileState.ERROR);
                  return;
                }

                this.getMapToken().then(token => {

                  let headers = { Authorization: "Bearer " + token };

                  var options = {
                    method: "GET",
                    headers: headers
                  };

                  return fetch(src, options)
                    .then(r => r.arrayBuffer())
                    .then(binaryBody => {
                      var data =
                        "data:image/png;base64," +
                        this.arrayBufferToBase64(binaryBody);
                      imageTile.getImage().src = data;
                    })
                    .catch(ex => {
                      console.error(
                        "Exception in promise of map tile fetch stage:"
                      );
                      console.error(ex);
                      // set the tile state to error:
                      imageTile.setState(TileState.ERROR);
                    });
                });
              }
            })
          })
        );
      }
    },


    onLogSelect(e) {
      console.log("Log Select!!!!");

      if (e.target.getFeatures().getLength() == 1) {
        let featureId = e.target
          .getFeatures()
          .item(0)
          .getId();
        this.selectedOtherLog = this.logData.nearby.find(
          val => val.id === featureId
        );

        this.popUpOverlayCoordinates = e.target
          .getFeatures()
          .item(0)
          .getGeometry()
          .getCoordinates();
      } else {
        this.selectedOtherLog = null;
        this.popUpOverlayCoordinates = undefined;
      }
    },


    closePopUp(evt) {
      this.olSelectInteraction.getFeatures().clear();
      this.popUpOverlayCoordinates = undefined;
      evt.target.blur();
    },


    setupOlMap() {
      // if the map does not exist, then
      // create it (otherwise this function just renders the markers)
      if (!this.olMap) {
        this.createHereMapsLayers();

        /* removed OSM layers in favour of HERE Maps (above)
                var raster = new TileLayer({
                    source: new OSM(),
                });
                this.tileLayers.push(raster);
                */

        // the vector source for the active log
        this.olActiveSource = new VectorSource();
        this.olActiveVectorLayer = new VectorLayer({
          source: this.olActiveSource
        });

        // the vector source for other logs
        this.olSource = new VectorSource();
        this.olVectorLayer = new VectorLayer({
          source: this.olSource
        });

        // create a layer select control

        //Create array of options to be added
        var array = [
          ["normal.day", "Normal"],
          ["normal.day.transit", "Transit"],
          ["pedestrian.day", "Pedestrian"],
          ["terrain.day", "Terrain"],
          ["satellite.day", "Satellite"],
          ["hybrid.day", "Hybrid"]
        ];

        //Create and append select list
        var selectList = document.createElement("select");
        selectList.id = "mySelect";

        //Create and append the options
        for (var i = 0; i < array.length; i++) {
          var option = document.createElement("option");
          option.value = array[i][0];
          option.text = array[i][1];
          selectList.appendChild(option);
        }

        var element = document.createElement("div");
        element.className = "ol-layer-select ol-unselectable ol-control";
        element.appendChild(selectList);

        var onSchemeSelectChange = () => {
          var scheme = selectList.value;
          this.setScheme(scheme);
        };
        selectList.addEventListener("change", onSchemeSelectChange);

        var layerSelectControl = new Control({
          element: element
        });

        /**
         * Create an overlay to anchor the popup to the map.
         */
        this.popUpOverlay = new Overlay({
          element: this.$refs.popupContainer,
          autoPan: true,
          autoPanAnimation: {
            duration: 250
          }
        });

        this.olMap = new Map({
          layers: [
            ...this.tileLayers,
            this.olVectorLayer,
            this.olActiveVectorLayer
          ],
          controls: defaultControls().extend([layerSelectControl]),
          target: "olMapDiv",
          view: new View({
            //center: [-11000000, 4600000],
            center: transform([133.7751, -25.2744], "EPSG:4326", "EPSG:3857"),
            zoom: 4
          }),
          overlays: [this.popUpOverlay]
        });

        /**
         * DEBUG: Add a click handler to the map to render the popup.
         */
        /*
                this.olMap.on('singleclick', (evt) => {
                    var coordinate = evt.coordinate;
                    console.log(coordinate);
                    //var hdms = toStringHDMS(toLonLat(coordinate));
                    var hdms = toLonLat(coordinate);

                    this.$refs.popupContent.innerHTML = '<p>You clicked here:</p><code>' + hdms +
                        '</code>';
                    this.popUpOverlay.setPosition(coordinate);
                });
                */

        // setp the interaction for selecting of
        // other logs only once.  It never needs adjusting
        // because it filters by layer
        this.olSelectInteraction = new Select({
          layers: [this.olVectorLayer],
          //style:markerStyleSelected,
          style: markerStyleOther,
          condition: click
        });
        this.olSelectInteraction.on("select", this.onLogSelect);
        this.olMap.addInteraction(this.olSelectInteraction);

        // set the initial map scheme
        onSchemeSelectChange();
      }

      // render the active log if the coordinates are set
      // and immediately center the view over
      if (this.activeLogLocation) {
        this.createActiveLogLocation(this.activeLogLocation);
      }

      if (this.logData) {
        this.addOtherLogMarkersToSource(this.logData);
      }
    },


    setScheme(scheme) {
      for (var i = 0; i < this.hereLayers.length; ++i) {
        this.tileLayers[i].setVisible(this.hereLayers[i].scheme === scheme);
      }
    },


    undoActiveLogMoved(evt) {
      this.updatedCoordinates = { latitude: null, longitude: null };
      this.createActiveLogLocation(this.activeLogLocation);
      this.zoomToFitSource();
    },


    activePointSaved(evt) {
      this.$emit("saveActivePoint", this.updatedCoordinates);
    }


  },
  computed: {
    activeLogLocation() {
      // debug:
      // return {latitude:  -27.9736143, longitude:  153.3883880};

      if (
        this.$store.state.log &&
        this.$store.state.log.latitude &&
        this.$store.state.log.longitude
      ) {
        return {
          latitude: this.$store.state.log.latitude,
          longitude: this.$store.state.log.longitude
        };
      }
      return null;
    },
    activePointMoved() {
      return (
        (this.updatedCoordinates.longitude !== null ||
          this.updatedCoordinates.latitude !== null) &&
        (this.updatedCoordinates.longitude !==
          this.$store.state.log.longitude ||
          this.updatedCoordinates.latitude !== this.$store.state.log.latitude)
      );
    },
    logData() {
      return this.$store.state.log || {};
    }
  },
  watch: {
    logData: {
      handler: function(newVal /*oldval does not work on deep watches*/) {
        this.addOtherLogMarkersToSource(newVal);
      },
      deep: true
    },
    viewVersion() {
      this.zoomToFitSource();
    },
    activeLogLocation: function(newVal, oldVal) {
      console.log("Active log location changed.", newVal);
      this.updatedCoordinates = { latitude: null, longitude: null };
      if (newVal) {
        this.createActiveLogLocation(newVal);
        this.zoomToFitSource();
      } else {
        this.removeActiveLogMarker();
      }
    },
    popUpOverlayCoordinates(newVal) {
      this.popUpOverlay.setPosition(newVal);
    }
  }
};
</script>

<style>
/* css for the tile layer select control */
.ol-layer-select {
  top: 0.5em;
  left: 3em;
}
.ol-layer-select > select {
  padding-left: 10px;
  background-color: rgba(0, 60, 136, 0.5);
  color: white;
}
.ol-touch .ol-layer-select {
  /*top: 80px;*/

  /*move control away from the zoom controls for easier tapping on touch screens*/
  left: 6em;
}

/* css for the popup bubble */
.ol-popup {
  position: absolute;
  background-color: white;
  -webkit-filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2));
  filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2));
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  left: -50px;
  min-width: 280px;
}
.ol-popup:after,
.ol-popup:before {
  top: 100%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}
.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  left: 48px;
  margin-left: -10px;
}
.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}
.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
}
.ol-popup-closer:after {
  content: "✖";
}
</style>

