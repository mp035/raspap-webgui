<template>
  <div
    style="width:calc(100% - 45px);height:100%;position:relative;margin-left:45px;"
    ref="containerDiv"
    v-show="isVisible"
  >
    <div id="dg" ref="graphDiv" style="width:100%;height:100%;"></div>
    <v-card
      v-if="legendVisible && realHighlightedRow"
      outlined
      ref="legendDiv"
      class="pa-2"
      style="position:absolute; top:5px; right:5px; background-color:rgba(255,255,255,0.9);"
    >
      <span v-for="(columnName, idx) in currentGroup.columns" :key="idx">
        <span v-if="idx == 0">
          {{fullDateTime(realHighlightedRow[idx])}}
          <br />
        </span>
        <span v-else>
          <b>
            <span :style="{color: currentGroup.series[columnName].color}">{{columnName}}</span>
          </b>
          :&#160;{{realHighlightedRow[idx] && realHighlightedRow[idx].toFixed(currentGroup.precision[idx-1])}} {{currentGroup.units[idx-1]}}
          <br />
        </span>
      </span>

      <v-btn
        color="secondary"
        class="pr-0"
        text
        @click="legendVisible=false"
        style="position:absolute; bottom:5px; right:5px;"
      >
        <v-icon>mdi-close-thick</v-icon>
      </v-btn>
    </v-card>
    <v-card
      v-else-if="realHighlightedRow"
      outlined
      ref="legendDiv"
      class="pa-0"
      style="position:absolute; top:5px; right:5px; background-color:rgba(255,255,255,0.9);"
    >
      <v-btn color="secondary" class="pa-0 ma-0" text @click="legendVisible=true" min-width="36px">
        <v-icon>mdi-arrow-expand-down</v-icon>
      </v-btn>
    </v-card>

    <div style="position:absolute; left:-40px; top:5px">
      <v-tooltip right v-model="showTooltips">
        <template v-slot:activator="{on}">
          <v-btn
            small
            fab
            dark
            outlined
            color="secondary"
            v-on="on"
            @click="showTooltips = !showTooltips"
          >
            <v-icon dark>mdi-help</v-icon>
          </v-btn>
        </template>
        <span>Tap or hover this button to show and hide the tooltip hints</span>
      </v-tooltip>
    </div>
    <div style="position:absolute; left:-40px; top:60px" v-if="model && currentGroup">
      <v-menu offset-x v-model="showTraceMenu" :close-on-content-click="false">
        <template v-slot:activator="{}">
          <v-tooltip right v-model="showTooltips">
            <template v-slot:activator="{}">
              <v-btn small fab light color="primary" @click="showTraceMenu=!showTraceMenu">
                <v-icon dark>mdi-cogs</v-icon>
              </v-btn>
            </template>
            <span>Show or hide traces, and switch between different graph types</span>
          </v-tooltip>
        </template>
        <v-card outlined class="pa-2">
          <v-menu offset-y>
            <template v-slot:activator="{ on }">
              <v-btn color="secondary" dark v-on="on">
                {{currentGroup.title}}
                <v-icon>mdi-menu-down</v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                v-for="item in model.availableGroups"
                :key="item.index"
                @click="onGroupChange(item.index)"
              >
                <v-list-item-title>{{ item.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <v-btn color="secondary" class="pr-0" text @click="showTraceMenu=false">
            <v-icon>mdi-close-thick</v-icon>
          </v-btn>
          <v-layout>
            <v-checkbox
              v-for="(item, index) in currentGroup.columns.slice(1)"
              :key="index"
              v-model="currentGroup.visibility[index]"
              :label="item"
              class="mr-8"
            ></v-checkbox>
          </v-layout>
        </v-card>
      </v-menu>
    </div>

    <div style="position:absolute; left:-40px; top:115px">
      <v-tooltip right v-if="limitBarOutOfRange" v-model="showTooltips">
        <template v-slot:activator="{}">
          <v-btn small fab dark color="secondary" @click="onGetLimitBarClick">
            <v-icon dark>mdi-arrow-collapse-vertical</v-icon>
          </v-btn>
        </template>
        <span>Bring both limit bars into view</span>
      </v-tooltip>
      <v-tooltip right v-else v-model="showTooltips">
        <template v-slot:activator="{}">
          <v-btn small fab dark @click="onHideLimitBarClick">
            <v-icon light>mdi-arrow-vertical-lock</v-icon>
          </v-btn>
        </template>
        <span>Hide both limit bars</span>
      </v-tooltip>
    </div>
    <div style="position:absolute; left:-40px; top:170px">
      <v-tooltip right v-model="showTooltips">
        <template v-slot:activator="{}">
          <v-btn
            small
            fab
            dark
            color="blue"
            @click="()=>{dygraph.resetZoom(); compileAndApplyReadings(dygraph);}"
          >
            <v-icon dark>mdi-eye-circle</v-icon>
          </v-btn>
        </template>
        <span>Zoom out to view the entire graph</span>
      </v-tooltip>
    </div>
    <div style="position:absolute; left:-40px; top:225px">
      <v-tooltip right v-if="showButtonVisible" v-model="showTooltips">
        <template v-slot:activator="{}">
          <v-btn small fab dark color="primary" @click="$emit('showClicked')">
            <v-icon dark>mdi-eye-plus</v-icon>
          </v-btn>
        </template>
        <span>Show the second chart pane</span>
      </v-tooltip>
      <v-tooltip right v-else-if="hideButtonVisible" v-model="showTooltips">
        <template v-slot:activator="{}">
          <v-btn small fab dark color="error" @click="$emit('hideClicked')">
            <v-icon light>mdi-eye-off</v-icon>
          </v-btn>
        </template>
        <span>Hide this chart</span>
      </v-tooltip>
    </div>

    <v-dialog v-model="showLimitDialog" width="500">
      <v-card>
        <v-card-title class="text-center pa-4 primary secondary--text text--darken-3">
          <v-row justify="center">
            <span class="text-uppercase text-center font-weight-light">
              <span class="font-weight-medium">Limit Bar Value</span>
            </span>
          </v-row>
        </v-card-title>
        <v-form @submit.prevent="limitInputSubmitHandler">
          <v-card-actions class="mt-4 mb-0 pb-0 text-center">
            <v-text-field
              label="Value"
              type="number"
              v-model="limitEditValue"
              ref="limitFormInput"
              @focus="$event.target.select()"
            ></v-text-field>
          </v-card-actions>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" class="secondary--text text--darken-3" type="submit">Ok</v-btn>
            <v-btn @click="showLimitDialog = false" type="button">Cancel</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import Dygraph from "../dygraphs/src/dygraph";
import formatDate from "../mixins/format-date";
import usbRequest from "../mixins/usb-request";

function removeElementsByClass(className) {
  var elements = document.getElementsByClassName(className);
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0]);
  }
}

function getEventCanvasCoords(event, g) {
  if (event.touches && event.touches.length == 1) {
    // this is a valid single touch event
    event = event.touches[0];
  }
  var pos = Dygraph.findPos(g.graphDiv);
  var canvasx = Dygraph.pageX(event) - pos.x;
  var canvasy = Dygraph.pageY(event) - pos.y;
  return [canvasx, canvasy];
}

function getEventDataCoords(event, g) {
  var canvasPoint = getEventCanvasCoords(event, g);
  return g.toDataCoords(canvasPoint[0], canvasPoint[1]);
}

function eventIsOnLimitBar(event, g) {
  if (g.limitBars) {
    for (var i = 0; i < g.limitBars.length; i++) {
      var x = g.xAxisRange()[0];
      var y = g.limitBars[i];
      var limitBarCanvasY = g.toDomCoords(x, y)[1];
      var clickCanvasY = getEventCanvasCoords(event, g)[1];
      if (Math.abs(limitBarCanvasY - clickCanvasY) < 10) {
        return i;
      }
    }
  }
  return false;
}

function pointIsInRect(point, rect) {
  return (
    point[0] > rect.x &&
    point[0] < rect.x + rect.width &&
    point[1] > rect.y &&
    point[1] < rect.y + rect.height
  );
}

function getNearestRowForX(g, xVal) {
  var low = 0,
    high = g.numRows() - 1;

  while (low <= high) {
    var idx = (high + low) >> 1;
    var x = g.getValue(idx, 0);
    if (x < xVal) {
      low = idx + 1;
    } else if (x > xVal) {
      high = idx - 1;
    } else {
      return idx;
    }
  }

  return idx;
}

// ==================== VUE INSTANCE STARTS HERE =====================

export default {
  mixins: [formatDate, usbRequest],
  props: {
    isVisible: {
      type: Boolean,
      default: true,
    },
    modelVersion: Number,
    model: Object,
    height: String,
    controlIndex: {
      type: Number,
      default: 0,
    },
    highlightPos: null,
    dateWindow: {
      type: Array,
      default: [],
    },
    hideButtonVisible: {
      type: Boolean,
      default: false,
    },
    showButtonVisible: {
      type: Boolean,
      default: false,
    },
    /*
    legendVisible: {
      type: Boolean,
      default: true
    }
    */
  },
  data() {
    return {
      legendVisible: true,
      lastCompiledDateWindow: [null, null],
      newDateWindow: [],
      newDateWindowTimer: null,
      realHighlightedRow: null,
      dygraph: null,
      highLightTimer: null,
      limitBarCanvas: null,
      limitBarContext: null,
      legendDivInterval: null, // always hold a global handle to the interval function that moves the legend div.
      legendRightMargin: 5,
      legendLeftMargin: 0,
      limitBarColor: "red",
      showTooltips: false,
      showLimitDialog: false,
      showTraceMenu: false,
      interactionModel: {
        willDestroyContextMyself: true,
        mousedown: (event, g, context) => {
          // register a mouseup event handler on the window
          // so that we re-compile the data even if the
          // user drags off of the edge of the canvas.
          var windowMouseUp = e => {
            window.setTimeout(() => {
              this.compileAndApplyReadings(g);
            });
            window.removeEventListener('mouseup', windowMouseUp);
          };
          window.addEventListener('mouseup', windowMouseUp);


          if (!this.handleLimitInteractionStart(event, g, context)) {
            return Dygraph.defaultInteractionModel.mousedown(event, g, context);
          }
        },
        mousemove: (event, g, context) => {
          this.handleLimitInteractionMove(event, g, context);
        },
        mouseup: (event, g, context) => {
          g.draggingLimitBars = false;
          //Dygraph.defaultInteractionModel.mouseup(event, g, context);
        },
        mouseout: (event, g, context) => {
          g.draggingLimitBars = false;
          //Dygraph.defaultInteractionModel.mouseout(event, g, context);
        },
        dblclick: (event, g, context) => {
          Dygraph.defaultInteractionModel.dblclick(event, g, context);
        },
        mousewheel: (event, g, context) => {
          //Dygraph.defaultInteractionModel.mousewheel(event, g, context);
        },
        touchstart: (event, g, context) => {
          if (
            event.touches.length == 1 &&
            this.handleLimitInteractionStart(event, g, context)
          ) {
            // event is a limit bar interaction, so don't go ahead with the rest of the operation.
            return;
          }

          //Dygraph.defaultInteractionModel.touchstart(event, g, context);
          // -------------------------------------------------------------------
          event.preventDefault(); // touch browsers are all nice.
          if (event.touches.length > 1) {
            // If the user ever puts two fingers down, it's not a double tap.
            context.startTimeForDoubleTapMs = null;
          }

          var touches = [];
          for (var i = 0; i < event.touches.length; i++) {
            var t = event.touches[i];
            // we dispense with 'dragGetX_' because all touchBrowsers support pageX
            touches.push({
              pageX: t.pageX,
              pageY: t.pageY,
              dataX: g.toDataXCoord(t.pageX),
              dataY: g.toDataYCoord(t.pageY),
              // identifier: t.identifier
            });
          }
          context.initialTouches = touches;

          if (touches.length == 1) {
            // This is just a swipe.
            context.initialPinchCenter = touches[0];
            context.touchDirections = { x: true, y: true };
          } else if (touches.length >= 2) {
            // It's become a pinch!
            // In case there are 3+ touches, we ignore all but the "first" two.

            // only screen coordinates can be averaged (data coords could be log scale).
            context.initialPinchCenter = {
              pageX: 0.5 * (touches[0].pageX + touches[1].pageX),
              pageY: 0.5 * (touches[0].pageY + touches[1].pageY),

              // TODO(danvk): remove
              dataX: 0.5 * (touches[0].dataX + touches[1].dataX),
              dataY: 0.5 * (touches[0].dataY + touches[1].dataY),
            };

            // Make pinches in a 45-degree swath around either axis 1-dimensional zooms.
            var initialAngle =
              (180 / Math.PI) *
              Math.atan2(
                context.initialPinchCenter.pageY - touches[0].pageY,
                touches[0].pageX - context.initialPinchCenter.pageX
              );

            // use symmetry to get it into the first quadrant.
            initialAngle = Math.abs(initialAngle);
            if (initialAngle > 90) initialAngle = 90 - initialAngle;

            context.touchDirections = {
              x: initialAngle < 90 - 45 / 2,
              y: initialAngle > 45 / 2,
            };
          }

          // save the full x & y ranges.
          context.initialRange = {
            x: g.xAxisRange(),
            y: g.yAxisRange(),
          };
          // -------------------------------------------------------------------
        },
        touchmove: (event, g, context) => {
          if (
            event.touches.length == 1 &&
            this.handleLimitInteractionMove(event, g, context)
          ) {
            // event is a limit bar interaction, so don't go ahead with the rest of the operation.
            return;
          }

          //Dygraph.defaultInteractionModel.touchmove(event, g, context);
          // -------------------------------------------------------------------

          var i,
            touches = [];
          for (i = 0; i < event.touches.length; i++) {
            var t = event.touches[i];
            touches.push({
              pageX: t.pageX,
              pageY: t.pageY,
            });
          }
          var initialTouches = context.initialTouches;

          var c_now;

          // old and new centers.
          var c_init = context.initialPinchCenter;
          if (touches.length == 1) {
            c_now = touches[0];
          } else {
            c_now = {
              pageX: 0.5 * (touches[0].pageX + touches[1].pageX),
              pageY: 0.5 * (touches[0].pageY + touches[1].pageY),
            };
          }

          // this is the "swipe" component
          // we toss it out for now, but could use it in the future.
          var swipe = {
            pageX: c_now.pageX - c_init.pageX,
            pageY: c_now.pageY - c_init.pageY,
          };
          var dataWidth = context.initialRange.x[1] - context.initialRange.x[0];
          var dataHeight =
            context.initialRange.y[0] - context.initialRange.y[1];
          swipe.dataX = (swipe.pageX / g.plotter_.area.w) * dataWidth;
          swipe.dataY = (swipe.pageY / g.plotter_.area.h) * dataHeight;
          var xScale, yScale;

          // The residual bits are usually split into scale & rotate bits, but we split
          // them into x-scale and y-scale bits.
          if (touches.length == 1) {
            xScale = 1.0;
            yScale = 1.0;
          } else if (touches.length >= 2) {
            var initHalfWidth = initialTouches[1].pageX - c_init.pageX;
            var nowHalfWidth = touches[1].pageX - c_now.pageX;
            // limit minimum distance between touches to prevent too much blowup
            nowHalfWidth = Math.max(Math.abs(nowHalfWidth), 50);
            initHalfWidth = Math.max(Math.abs(initHalfWidth), 50);
            xScale = nowHalfWidth / initHalfWidth;

            var initHalfHeight = initialTouches[1].pageY - c_init.pageY;
            var nowHalfHeight = touches[1].pageY - c_now.pageY;
            // limit minimum distance between touches to prevent too much blowup
            nowHalfHeight = Math.max(Math.abs(nowHalfHeight), 50);
            initHalfHeight = Math.max(Math.abs(initHalfHeight), 50);
            yScale = nowHalfHeight / initHalfHeight;
          }

          var didZoom = false;
          //if (context.touchDirections.x) {
          g.dateWindow_ = [
            c_init.dataX -
              swipe.dataX +
              (context.initialRange.x[0] - c_init.dataX) / xScale,
            c_init.dataX -
              swipe.dataX +
              (context.initialRange.x[1] - c_init.dataX) / xScale,
          ];
          didZoom = true;
          //}

          //if (context.touchDirections.y) {
          for (i = 0; i < 1 /*g.axes_.length*/; i++) {
            var axis = g.axes_[i];
            var logscale = g.attributes_.getForAxis("logscale", i);
            if (logscale) {
              // TODO(danvk): implement
            } else {
              axis.valueRange = [
                c_init.dataY -
                  swipe.dataY +
                  (context.initialRange.y[0] - c_init.dataY) / yScale,
                c_init.dataY -
                  swipe.dataY +
                  (context.initialRange.y[1] - c_init.dataY) / yScale,
              ];
              didZoom = true;
            }
          }
          //}

          g.drawGraph_(false);

          // We only call zoomCallback on zooms, not pans, to mirror desktop behavior.
          if (
            didZoom &&
            touches.length > 1 &&
            g.getFunctionOption("zoomCallback")
          ) {
            var viewWindow = g.xAxisRange();
            g.getFunctionOption("zoomCallback").call(
              g,
              viewWindow[0],
              viewWindow[1],
              g.yAxisRanges()
            );
          }

          // -------------------------------------------------------------------

          var xpoint = Math.floor(g.getArea().w / 2);
          var idx = this.dygraph.findClosestRow(xpoint);
          this.dygraph.setSelection(idx);
          window.setTimeout(() =>
            this.$emit("update:highlightPos", this.dygraph.getValue(idx, 0))
          );
        },
        touchend: (event, g, context) => {
          if (g.draggingLimitBars === false) {
            Dygraph.defaultInteractionModel.touchend(event, g, context);

            var xpoint = Math.floor(g.getArea().w / 2);
            var idx = this.dygraph.findClosestRow(xpoint);
            this.dygraph.setSelection(idx);
            let x = this.dygraph.getValue(idx, 0);
            window.setTimeout(() => {
              this.compileAndApplyReadings(g);
              this.$emit("update:highlightPos", x);
              this.emitHighlightEvent(x);
            });
          }
          g.draggingLimitBars = false;
        },
      },
    };
  },
  methods: {
    initGraph(commonOptions) {
      var dgOptions = Object.assign(
        {
          drawPoints: false,
          showRoller: false,
          legend: "never",
          showRangeSelector: true,

          interactionModel: this.interactionModel,
          highlightCallback: this.graphHighlight,
          unhighlightCallback: this.graphHighlight,
          drawCallback: this.drawCallback,
          drawHighlightPointCallback: this.drawHighlightPoint,
          customBars: true,
        },
        commonOptions
      );

      Vue.set(
        this,
        "dygraph",
        new Dygraph(this.$refs.graphDiv, this.currentGroup.readings, dgOptions)
      );

      Vue.set(this.dygraph, "limitBars", this.currentGroup.limits);
      Vue.set(this.dygraph, "draggingLimitBars", false);
      Vue.set(this.dygraph, "editingLimitBars", false);
      Vue.set(this.dygraph, "markerPosition", this.markerPosition);

      // this callback is called from dygraph/src/plugins/range-selector.js
      // and is used so we know when the range selector has altered the
      // graph.
      Vue.set(
        this.dygraph,
        "rangeSelectorCallback",
        this.rangeSelectorCallback
      );

      this.dygraph.ready(() => {
        console.log("Graph", this.controlIndex, "loaded!");
        this.$emit("loaded");
      });
    },
    limitInputKeyPressHandler(evt) {
      if (evt.key == "Enter") {
        Vue.set(
          this.dygraph.limitBars,
          this.dygraph.editingLimitBars,
          parseFloat(document.getElementsByClassName("limitInputBox")[0].value)
        );
        removeElementsByClass("limitInputBox");
        this.dygraph.updateOptions({});
        return false;
      }
      return true;
    },
    limitInputSubmitHandler(evt) {
      this.showLimitDialog = false;
      this.dygraph.updateOptions({});
    },
    onGetLimitBarClick() {
      let [first, second] = this.dygraph.yAxisRange(0);
      let min = Math.min(first, second);
      let max = Math.max(first, second);
      this.dygraph.limitBars.forEach((element, idx) => {
        // check if the limit bar is out of range, NaN, or the same value as one of the other limit bars
        if (
          element > max ||
          element < min ||
          isNaN(element) ||
          this.dygraph.limitBars.some(
            (value, index) => value == element && index != idx
          )
        ) {
          let step = Math.abs(max - min) / (this.dygraph.limitBars.length + 1);
          Vue.set(this.dygraph.limitBars, idx, min + (idx + 1) * step);
        }
      });
      this.dygraph.updateOptions({});
    },
    onHideLimitBarClick() {
      this.dygraph.limitBars.forEach((element, idx) => {
        Vue.set(this.dygraph.limitBars, idx, NaN);
      });
      this.dygraph.updateOptions({});
    },
    onGroupChange(index) {
      this.$store.commit("setChartIndex", {
        control: this.controlIndex,
        group: index,
      });
      this.$store.commit("incrementLogVersion");
      this.showTraceMenu = false;
    },
    graphHighlight(event, x, points, row, seriesName) {
      // event: the JavaScript mousemove event
      // x: the x-coordinate of the highlighted points
      // points: an array of highlighted points: [ {name: 'series', yval: y-value}, … ]
      // row: integer index of the highlighted row in the data table, starting from 0
      // seriesName: name of the highlighted series, only present if highlightSeriesOpts is set.

      if (this.highLightTimer) {
        clearTimeout(this.highLightTimer);
      }
      // this is  a 'lighter' event which should only be used for syncing the
      // selection between 2 graphs.
      window.setTimeout(() => this.$emit("update:highlightPos", x));
      // this is  a heavier event which updates the table view.
      this.highLightTimer = setTimeout(() => {
        this.emitHighlightEvent(x);
      }, 50);
    },

    emitHighlightEvent(x) {
      if (
        this.dygraph.draggingLimitBars !== false ||
        this.legendDivInterval !== null
      ) {
        this.highLightTimer = setTimeout((x) => {
          this.emitHighlightEvent(x);
        }, 50);
      } else {
        this.$emit("highlightrow", x);
      }
    },

    eventIsOnMarkerBox(event, g) {
      if (g.markerPosition !== false) {
        var textarea = this.getMarkerTextArea(g);
        var eventCoords = getEventCanvasCoords(event, g);
        if (pointIsInRect(eventCoords, textarea)) {
          return true;
        }
      }
      return false;
    },

    eventIsOnLimitTextBox(event, g) {
      if (g.limitBars) {
        for (var i = 0; i < g.limitBars.length; i++) {
          var textarea = this.getLimitTextArea(g, i);
          var eventCoords = getEventCanvasCoords(event, g);
          if (pointIsInRect(eventCoords, textarea)) {
            return i;
          }
        }
      }
      return false;
    },

    getLimitTextArea(graph, limitBarNumber) {
      var pos = graph.toDomCoords(
        graph.xAxisRange()[0],
        graph.limitBars[limitBarNumber]
      );
      var textarea = { x: pos[0] + 30, y: pos[1] - 10, width: 50, height: 20 };

      return textarea;
    },

    getMarkerTextArea(graph, ctx) {
      if (ctx == null) {
        ctx = this.limitBarContext;
      }
      var text = formatDate.methods.fullDateTime(
        new Date(graph.markerPosition)
      );
      const offsetFromTop = 5;
      const textPadding = 7;
      var pos = graph.toDomCoords(graph.markerPosition, graph.yAxisRange()[1]);
      var alignment = ctx.textAlign;
      ctx.textAlign = "center";
      var metrics = ctx.measureText(text);
      ctx.textAlign = alignment;
      var textarea = {
        x: pos[0] - Math.abs(metrics.actualBoundingBoxLeft) - textPadding,
        y: pos[1] + offsetFromTop,
        width:
          Math.abs(metrics.actualBoundingBoxRight) +
          Math.abs(metrics.actualBoundingBoxLeft) +
          textPadding * 2,
        height:
          Math.abs(metrics.actualBoundingBoxDescent) +
          Math.abs(metrics.actualBoundingBoxAscent) +
          textPadding * 2,
        text,
        baseline:
          pos[1] +
          Math.abs(metrics.actualBoundingBoxAscent) +
          offsetFromTop +
          textPadding,
        alignstart: pos[0],
      };

      return textarea;
    },
    handleLimitInteractionStart(event, g, context) {
      removeElementsByClass("limitInputBox");
      g.editingLimitBars = this.eventIsOnLimitTextBox(event, g);

      if (g.editingLimitBars === false) {
        g.draggingLimitBars = eventIsOnLimitBar(event, g);
        if (g.draggingLimitBars !== false) {
          // prevents mouse drags from selecting page text.
          if (event.preventDefault) {
            event.preventDefault(); // Firefox, Chrome, etc.
          } else {
            event.returnValue = false; // IE
            event.cancelBubble = true;
          }
          //isDrawing = true;
        } else if (this.eventIsOnMarkerBox(event, g)) {
          this.$store.commit("setMarkerPosition", false);
        } else {
          return false;
        }
      } else {
        if (event.touches) {
          event.preventDefault();
          // this is a touch initiated edit, so use the modal
          setTimeout(() => {
            this.showLimitDialog = true;
            setTimeout(() => {
              this.$refs.limitFormInput.focus();
            });
          });
        } else {
          g.draggingLimitBars = false;
          var textArea = this.getLimitTextArea(g, g.editingLimitBars);
          var textBox = document.createElement("input");
          textBox.classList.add("limitInputBox");
          textBox.type = "number";
          textBox.style.display = "block";
          textBox.style.position = "absolute";
          textBox.style.top = textArea.y - 5 + "px";
          textBox.style.left = textArea.x - 2 + "px";
          textBox.style.width = textArea.width + 20 + "px";
          textBox.style.height = textArea.height + 10 + "px";
          textBox.style.backgroundColor = "white";
          textBox.style.border = "2px solid red";
          textBox.style.boxShadow = "none";
          textBox.value = g.limitBars[g.editingLimitBars].toFixed(1);
          this.$refs.graphDiv.appendChild(textBox);
          textBox.addEventListener("keypress", this.limitInputKeyPressHandler);
          setTimeout(function () {
            textBox.focus();
          }, 0);
        }
      }
      return true;
    },
    handleLimitInteractionMove(event, g, context) {
      if (g.draggingLimitBars !== false) {
        let xy = getEventDataCoords(event, g);
        Vue.set(g.limitBars, g.draggingLimitBars, xy[1]);
        //g.updateOptions({});
        this.drawLimitBars(g);
        return true;
      } else {
        if (this.eventIsOnLimitTextBox(event, g) !== false) {
          g.graphDiv.style.cursor = "text";
        } else if (eventIsOnLimitBar(event, g) !== false) {
          g.graphDiv.style.cursor = "ns-resize";
        } else if (this.eventIsOnMarkerBox(event, g)) {
          g.graphDiv.style.cursor = "url('/img/close.svg') 16 16, auto";
        } else {
          g.graphDiv.style.cursor = "default";
        }
      }
      return false;
    },
    drawHighlightPoint(g, seriesName, ctx, cx, cy, color, pointSize) {
      // g: the reference graph
      // seriesName: the name of the series
      // ctx: the canvas context to draw on
      // cx: center x coordinate
      // cy: center y coordinate
      // color: series color
      // pointSize: the radius of the image.
      // idx: the row-index of the point in the data.

      ctx.save();

      // draw the marker
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 1.0;

      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, ctx.canvas.clientHeight);
      ctx.stroke();

      ctx.restore();
    },
    compileAndApplyReadings(g, otherDygraphOptions = {}, sendEvent = true) {
      if (!this.isVisible) return;
      if (!this.$refs.graphDiv) return; // if the dom is not present for some reason, then don't bother.

      var viewWindow = (
        otherDygraphOptions.dateWindow || g.xAxisRange()
      ).slice(); // use slice to clone the array.

      if (sendEvent) {
        this.$emit("update:dateWindow", viewWindow);
      }

      this.currentGroup.readings = this.compileReadings(
        this.$store.state.log,
        this.currentGroup.traceNames,
        viewWindow[0],
        viewWindow[1],
        this.$refs.graphDiv.offsetWidth
      );

      let newOptions = Object.assign(
        {
          file: this.currentGroup.readings,
          //dateWindow: newVal,
          valueRange: this.dygraph.yAxisRange(),
        },
        otherDygraphOptions
      );

      if (this.currentGroup.readings.length > 0){
        // don't update the graph with empty data, it complains.
        g.updateOptions(newOptions);
      }

      if (this.highlightPos) {
        var idx = getNearestRowForX(g, this.highlightPos);
        g.setSelection(idx);
      }
    },
    drawCallback(graph) {
      this.drawLimitBars(graph);
    },
    drawLimitBars(graph) {
      if (!graph.limitBars) return;

      var area = graph.getArea();
      if (!this.limitBarCanvas) {
        // create a new canvas and attach it to the same div as the graph.
        this.limitBarCanvas = document.createElement("canvas");
        this.limitBarCanvas.style.position = "absolute";
        this.limitBarCanvas.style.pointerEvents = "none";
        this.limitBarCanvas.classList.add("limitbarcanvass"); // just to be able to identify it for DEBUG
        this.limitBarContext = this.limitBarCanvas.getContext("2d");

        //set dimensions
        this.limitBarCanvas.width = area.x + area.w;
        this.limitBarCanvas.height = area.y + area.h;
        this.limitBarCanvas.style.left = "0";
        this.limitBarCanvas.style.top = "0";
        // add it to the same div that the graph is in to ensure the same position.
        this.$refs.graphDiv.appendChild(this.limitBarCanvas);
      } else {
        // the canvas is constructed, so
        // check if the size and location are still appropriate
        let ca = this.limitBarCanvas;
        if (
          this.limitBarCanvas.width != area.w + area.x ||
          this.limitBarCanvas.height != area.h + area.y
        ) {
          // the dimensions have changed, so update the canvas
          this.limitBarCanvas.width = area.x + area.w;
          this.limitBarCanvas.height = area.y + area.h;
        }
      }

      var ctx = this.limitBarContext;

      //clear the canvas before drawing anything
      let entireCanvas = [
        0,
        0,
        this.limitBarCanvas.width,
        this.limitBarCanvas.height,
      ];
      ctx.clearRect(...entireCanvas);

      //draw the lines first
      this.drawLines(ctx, area, graph);
      /*
            var c = Dygraph.toRGB_(graph.getColors()[0]);
            c.r = Math.floor(255 - 0.5 * (255 - c.r));
            c.g = Math.floor(255 - 0.5 * (255 - c.g));
            c.b = Math.floor(255 - 0.5 * (255 - c.b));
            var color = 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
            ctx.strokeStyle = color;
            */
      ctx.strokeStyle = this.limitBarColor;
      ctx.lineWidth = 1.0;
      ctx.font = "14px sans-serif";
      ctx.textAlign = "start";

      for (var i = 0; i < graph.limitBars.length; i++) {
        var text = graph.limitBars[i].toFixed(1);
        var textarea = this.getLimitTextArea(graph, i);
        var points = [
          [textarea.x, textarea.y],
          [textarea.x, textarea.y + textarea.height],
          [textarea.x + textarea.width, textarea.y + textarea.height],
          [textarea.x + textarea.width, textarea.y],
        ];
        ctx.fillStyle = "white";
        ctx.fillRect(textarea.x, textarea.y, textarea.width, textarea.height);
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (var j = 1; j < points.length; j++) {
          ctx.lineTo(points[j][0], points[j][1]);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.fillText(text, textarea.x + 3, textarea.y + textarea.height - 5);
      }

      if (graph.markerPosition !== 0) {
        //var text = graph.limitBars[i].toFixed(1);
        var textarea = this.getMarkerTextArea(graph, ctx);
        var points = [
          [textarea.x, textarea.y],
          [textarea.x, textarea.y + textarea.height],
          [textarea.x + textarea.width, textarea.y + textarea.height],
          [textarea.x + textarea.width, textarea.y],
        ];
        ctx.fillStyle = "white";
        ctx.fillRect(textarea.x, textarea.y, textarea.width, textarea.height);

        ctx.strokeStyle = "rgba(46, 204, 113, 0.5)";
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (var j = 1; j < points.length; j++) {
          ctx.lineTo(points[j][0], points[j][1]);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.fillText(textarea.text, textarea.alignstart, textarea.baseline);
      }
      ctx.restore();
    },
    drawLines(ctx, area, g) {
      if (typeof g == "undefined") return; // won't be set on the initial draw.
      if (!g.limitBars) return;
      var xrange = g.xAxisRange();
      /*
            var c = Dygraph.toRGB_(g.getColors()[0]);
            c.r = Math.floor(255 - 0.5 * (255 - c.r));
            c.g = Math.floor(255 - 0.5 * (255 - c.g));
            c.b = Math.floor(255 - 0.5 * (255 - c.b));
            var color = 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
            */
      var color = this.limitBarColor;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.0;
      for (var i = 0; i < g.limitBars.length; i++) {
        var x1 = xrange[0];
        var y1 = g.limitBars[i];
        var x2 = xrange[1];
        var y2 = g.limitBars[i];

        var p1 = g.toDomCoords(x1, y1);
        var p2 = g.toDomCoords(x2, y2);

        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.closePath();
        ctx.stroke();
      }

      if (g.markerPosition !== false) {
        // draw the marker
        var yrange = g.yAxisRange();
        ctx.strokeStyle = "rgba(46, 204, 113, 0.5)";
        ctx.lineWidth = 3.0;

        var x1 = g.markerPosition;
        var y1 = yrange[0];
        var x2 = g.markerPosition;
        var y2 = yrange[1];

        var p1 = g.toDomCoords(x1, y1);
        var p2 = g.toDomCoords(x2, y2);

        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    },
    /*
    onMouseEnterLegendDiv(event) {
      event.target.blur();
      // move the legend out from under the cursor when required

      // abort if there is any ongoing animation
      if (this.legendDivInterval) {
        return;
      }

      let pixelsPerFrame = 50; // higher numbers cause faster animation.

      let targetLeftMargin = 170;
      let targetRightMargin = 5;

      if (!this.legendRightMargin) {
        this.legendLeftMargin = 0;
        this.legendRightMargin =
          this.$refs.graphDiv.clientWidth -
          targetLeftMargin -
          event.target.offsetWidth;
      } else {
        this.legendRightMargin = 0;
        this.legendLeftMargin =
          this.$refs.graphDiv.clientWidth -
          targetRightMargin -
          event.target.offsetWidth;
      }

      this.legendDivInterval = setInterval(() => {
        if (!this.legendRightMargin) {
          if (this.legendLeftMargin <= targetLeftMargin) {
            clearInterval(this.legendDivInterval);
            this.legendDivInterval = null;
          } else {
            this.legendLeftMargin = Math.max(
              this.legendLeftMargin - pixelsPerFrame,
              targetLeftMargin
            );
          }
        } else {
          if (this.legendRightMargin <= targetRightMargin) {
            clearInterval(this.legendDivInterval);
            this.legendDivInterval = null;
          } else {
            this.legendRightMargin = Math.max(
              this.legendRightMargin - pixelsPerFrame,
              targetRightMargin
            );
          }
        }
      }, 40);
    },
    */
    setupGraphWithData() {
      // does the selected graph index exist?
      if (!this.currentGroup) {
        //if not, then request that this graph be hidden.
        console.log(
          `Selected group (${this.currentGroup}) for graph control ${this.controlIndex} does not exist!. Requesting hide of graph.`
        );
        //this.$emit("hideClicked");
        return;
      }

      let createFormatter = (suffix, precision) => {
        return (y) => y.toFixed(precision) + " " + suffix;
      };

      let createAxisFormatter = (suffix, precision) => {
        let rounder = Math.pow(10, precision);
        return (y) => {
          // see https://stackoverflow.com/a/41716722/5434939
          y = Math.round( y * rounder + Number.EPSILON ) / rounder;
          return y + " " + suffix;
        };
      };

      // NOTE: this struture is for options that can change between redraws
      // and updates of the graph content.  Constant options (that do not change
      // for the life of the control) should be set in initGraph.
      var commonOptions = {
        file: this.currentGroup.readings,
        series: this.currentGroup.series,
        labels: this.currentGroup.columns,
        dateWindow: null,
        defaultValueRange: this.currentGroup.range || [null, null],
        valueRange: this.currentGroup.range || [null, null],

        // the axes formatting functions change when the
        // group is changed so the axes options are defined here.
        axes: {
          y: {
            axisLabelFormatter: createAxisFormatter(
              this.currentGroup.units[0],
              this.currentGroup.precision[0]
            ), // we just use the units from the first trace, so they all need to have the same units.
            valueFormatter: createFormatter(
              this.currentGroup.units[0],
              this.currentGroup.precision[0]
            ), // we just use the units from the first trace, so they all need to have the same units.
          },
          x: {
            valueFormatter: this.fullDateTime,
            axisLabelFormatter: Dygraph.dateAxisLabelFormatter,
            ticker: Dygraph.dateTicker,
          },
        },
      };

      if (!this.dygraph) {
        this.initGraph(commonOptions);
      } else {
        this.dygraph.updateOptions(commonOptions);
      }

      // trigger a resize event so that the components redraw
      // I'm just using setTimeout to add the event after the call stack.
      window.setTimeout(() => {
        // chrome/ff
        //window.dispatchEvent(new Event('resize'));

        // IE/chrome/ff
        var resizeEvent = window.document.createEvent("UIEvents");
        resizeEvent.initUIEvent("resize", true, false, window, 0);
        window.dispatchEvent(resizeEvent);
      });
    },
    onClickVisibility(index) {
      this.dygraph.setVisibility(index, this.currentGroup.visibility[index]);
    },
    rangeSelectorCallback(actionType) {
      this.compileAndApplyReadings(this.dygraph);
    },
    extractCurrentGroup() {
      if (this.$store.state.log && this.$store.state.log.readings) {
        let group = this.extractLogGroup(
          this.$store.state.log,
          this.$store.state.chartIndex[this.controlIndex],
          this.$refs.graphDiv.offsetWidth
        );
        this.$store.commit("setChartGroup", {
          control: this.controlIndex,
          group: group,
        });
      } else {
        this.$store.commit("setChartGroup", {
          control: this.controlIndex,
          group: null,
        });
      }
    },
  },
  mounted() {
    this.extractCurrentGroup();
    if (this.$store.state.log && this.$store.state.log.readings) {
      this.setupGraphWithData();
    }

    // listen to the window resize event
    // and recompile data
    window.addEventListener('resize', ()=>{
      if (this.dygraph){
        this.compileAndApplyReadings(this.dygraph);
      }
    });
  },
  watch: {
    modelVersion: function (newval, oldval) {
      console.log(
        `Graph ${this.controlIndex} modelVersion changed from ${oldval} to ${newval}.`
      );
      this.extractCurrentGroup();

      if (!this.isVisible) return;
      if (this.$store.state.log && this.$store.state.log.readings) {
        this.setupGraphWithData();
      }
    },
    markerPosition: function (newVal, oldval) {
      this.dygraph.markerPosition = newVal;

      if (!this.isVisible) return;

      //this.drawLimitBars(this.dygraph);
      this.dygraph.resetZoom();
      this.compileAndApplyReadings(this.dygraph);
    },
    "currentGroup.visibility": {
      handler(newValue, oldValue) {
        if (newValue && this.dygraph) {
          newValue.forEach((val, index) => {
            this.dygraph.setVisibility(index, val);
          });
        }
      },
      deep: true,
    },
    highlightPos: function (newVal, oldVal) {
      if (!this.isVisible) return;

      if (newVal == null) {
        this.dygraph.clearSelection();
      } else {
        var idx = getNearestRowForX(this.dygraph, newVal);
        if (idx !== null) {
          this.dygraph.setSelection(idx); //, seriesName);
        }

        let nearestIdx = this.getNearestIndexForX(
          this.$store.state.log.readings,
          newVal
        );
        let realHighlightedRow = this.extractRow(
          this.$store.state.log,
          nearestIdx,
          this.currentGroup.traceNames
        );
        this.realHighlightedRow = realHighlightedRow;
      }
    },
    dateWindow: function (newVal, oldVal) {
      if (!this.isVisible) return;

      if (newVal.length == 2) {
        let currentWindow = this.dygraph.xAxisRange();

        if (currentWindow[0] != newVal[0] || currentWindow[1] != newVal[1]) {
          if (false) {
            // unused.  This way of updating the view is too slow.
            this.dygraph.updateOptions({
              dateWindow: newVal,
              valueRange: this.dygraph.yAxisRange(),
            });
          } else if (false) {
            // hack.  This breaks encapsulation, but performs
            // many times better than the above method.
            // it was used when the graph animations were
            // synchronised, and the data was not recompiled
            // on dateWindow change.
            this.dygraph.dateWindow_ = newVal;
            this.dygraph.drawGraph_(false);
          } else {
            this.compileAndApplyReadings(
              this.dygraph,
              { dateWindow: newVal },
              false
            );
          }
        }
      }
    },
  },
  computed: {
    limitBarOutOfRange() {
      if (!this.dygraph) return false;
      let [first, second] = this.dygraph.yAxisRange(0);
      let min = Math.min(first, second);
      let max = Math.max(first, second);
      let outOfRange = false;
      this.dygraph.limitBars.forEach((element) => {
        if (element > max || element < min || isNaN(element)) {
          outOfRange = true;
        }
      });
      return outOfRange;
    },
    legendLeftMarginText() {
      if (this.legendLeftMargin) {
        return this.legendLeftMargin + "px";
      }
      return "";
    },
    legendRightMarginText() {
      if (this.legendRightMargin) {
        return this.legendRightMargin + "px";
      }
      return "";
    },
    markerPosition() {
      return this.$store.state.markerPosition;
    },
    selectedIndex() {
      return this.$store.getters.selectedIndex;
    },
    currentGroup() {
      return this.$store.state.chartGroup[this.controlIndex];
    },
    limitEditValue: {
      get() {
        if (this.dygraph && this.dygraph.editingLimitBars !== false) {
          return this.dygraph.limitBars[this.dygraph.editingLimitBars].toFixed(
            1
          );
        }
        return 0;
      },
      set(value) {
        if (this.dygraph && this.dygraph.editingLimitBars !== false) {
          this.dygraph.limitBars[this.dygraph.editingLimitBars] = parseFloat(
            value
          );
        }
      },
    },
  },
};
</script>

<style>
</style>
