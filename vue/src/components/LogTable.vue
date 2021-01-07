<template>
  <v-card tile height="calc(100vh - 112px)">
    <div>
      <v-simple-table dense ref="headingTable">
        <template v-slot:default>
          <thead>
            <tr>
              <th
                v-for="(heading, index) in headings"
                :key="heading"
                :class="{'dateCell': index==0, 'valueCell':index != 0}"
                class="titleCell"
                :style="{color:index == 0 ? '' : series[heading].color}"
              >{{heading}}</th>

              <!-- to fill out the width of the scroll bar -->
              <th
                ref="fillerCell"
                class="titleCell"
                :style="{width:scrollBarFillWidth+'px'}"
                style="width:14px;padding:0; margin:0;"
              ></th>
            </tr>
          </thead>
        </template>
      </v-simple-table>
    </div>

    <div
      ref="viewPort"
      style="overflow-y:scroll; height:calc(100vh - 112px - 32px);"
      v-scroll:debounce="{fn: onScroll, debounce: 50 }"
    >
      <div ref="contentDiv" :style="{height:contentHeight + 'px'}">
        <v-simple-table dense ref="itemTable" :style="{transform: tableViewTranslateY}">
          <template v-slot:default>
            <tbody>
              <tr
                v-for="(row, rowIndex) in rows"
                :key="row[0]"
                :style="{backgroundColor:rowIndex == highlightedRow ? '#eee' : ''}"
              >
                <td
                  v-for="(col, index) in row"
                  :key="index + ' ' + col"
                  :class="{'dateCell': index==0, 'valueCell':index != 0}"
                  :style="{color:index == 0 ? '' : series[headings[index]].color}"
                  class="itemCell"
                >{{index == 0 ? fullDateTime(col) : col}}</td>
              </tr>
            </tbody>
          </template>
        </v-simple-table>
      </div>
    </div>
  </v-card>
</template>


<script>
import dateFormat from "../mixins/format-date.js";
import usbRequest from "../mixins/usb-request.js";

export default {
  mixins: [dateFormat, usbRequest],
  props: {
    numGraphs: Number // to identify when the bottom chart has been hidden.
  },
  data() {
    return {
      scrollBarFillWidth: 15,
      contentHeight: 0,
      viewPortPosition: 0,
      rowHeight: 28, // change CSS if you change this.
      topGroup: null,
      bottomGroup: null,
      topControlIndex: 0, // NOTE: this is CONTROL index, not chart index.
      bottomControlIndex: 1 // NOTE: this is CONTROL index, not chart index.
    };
  },
  mounted() {
    this.updateContentSize();
  },
  methods: {
    onScroll(e, pos) {
      this.viewPortPosition = pos.scrollTop;
    },
    updateContentSize() {
      if (this.headings.length == 0) return;

      this.$refs.fillerCell.width =
        this.$refs.headingTable.width - this.$refs.itemTable.width;

      // set height.
      let numReadings = this.$store.state.log.readings.length;
      this.contentHeight = numReadings * this.rowHeight;
    }
  },
  watch: {
    headings(newVal, oldVal) {
      this.updateContentSize();
      this.$emit("resize");
    },
    selectedTimestamp(newVal, oldVal) {
      let startTime = this.$store.state.log.readings[0][0];
      let length = this.$store.state.log.readings.length;
      let endTime = this.$store.state.log.readings[length - 1][0];
      let msecPerReading = (endTime - startTime) / (length - 1);
      let highlightScrollPosition =
        ((newVal - startTime) / msecPerReading) * this.rowHeight -
        this.$refs.viewPort.clientHeight / 2 +
        this.rowHeight;
      this.$refs.viewPort.scrollTop = highlightScrollPosition;
    }
  },
  computed: {
    bottomChartGroup() {
      return this.$store.state.chartGroup[this.bottomControlIndex];
    },
    topChartGroup() {
      return this.$store.state.chartGroup[this.topControlIndex];
    },
    tableViewTranslateY() {
      let tablepos =
        (Math.floor(this.viewPortPosition / this.rowHeight) - 30) *
        this.rowHeight;
      if (tablepos < 0) tablepos = 0;
      return "translateY(" + tablepos + "px)";
    },
    selectedTimestamp() {
      return this.$store.state.selectedTimestamp;
    },
    highlightedRow() {
      if (!this.selectedTimestamp) return 0;
      return this.getNearestIndexForX(this.rows, this.selectedTimestamp);
    },
    headings() {
      if (this.$store.state.log) {
        var topChartHeadings = this.topChartGroup.columns.filter(
          (value, index) =>
            index == 0 || this.topChartGroup.visibility[index - 1]
        );

        if (this.numGraphs > 1) {
          var bottomChartHeadings = this.bottomChartGroup.columns.filter(
            (value, index) =>
              index > 0 && this.bottomChartGroup.visibility[index - 1]
          );

          return topChartHeadings.concat(bottomChartHeadings);
        }

        return topChartHeadings;
      }
      return [];
    },
    series() {
      let result = this.$store.state.chartGroup[this.topControlIndex].series;
      if (this.numGraphs > 1) {
        Object.assign(
          result,
          this.$store.state.chartGroup[this.bottomControlIndex].series
        );
      }
      return result;
    },
    rows() {
      if (!this.$store.state.log) return [];

      // grab 30 rows before the start of the viewport.
      let firstRow = Math.floor(this.viewPortPosition / this.rowHeight) - 30;
      if (firstRow < 0) {
        firstRow = 0;
      }

      var topChartGroup = this.$store.state.chartGroup[this.topControlIndex];
      var bottomChartGroup = this.$store.state.chartGroup[ this.bottomControlIndex ];

      let result = [];
      for (let index = firstRow; (index < firstRow + 90) && (index < this.$store.state.log.readings.length); index++) {
        let topCells = this.extractRow(
          this.$store.state.log,
          index,
          topChartGroup.traceNames
        ).filter(
          (value, index) => index == 0 || topChartGroup.visibility[index - 1]
        );

        if (this.numGraphs > 1) {
          let bottomCells = this.extractRow(
            this.$store.state.log,
            index,
            bottomChartGroup.traceNames
          ).filter(
            (value, index) =>
              index > 0 && bottomChartGroup.visibility[index - 1]
          );
          //topCells[0] = this.fullDateTime(topCells[0]);

          result.push(topCells.concat(bottomCells));
        } else {
          result.push(topCells);
        }
      }
      return result;
    }
  }
};
</script>

<style scoped>
.itemCell {
  height: 28px; /* change the rowHeight data attribute if you change this. */
  text-align: center;
}

.titleCell {
  height: 32px;
  text-align: center !important;
}

.dateCell {
  width: 200px;
}

.valueCell {
  width: 60px;
}
</style>
