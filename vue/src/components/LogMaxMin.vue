<template>
  <v-card tile height="calc(100vh - 112px)">
    <div>
      <v-simple-table dense ref="headingTable">
        <template v-slot:default>
          <thead>
            <tr>
              <th class="dateCell titleCell">Date</th>
              <th class="valueCell titleCell"></th>
              <th
                v-for="heading in headings"
                :key="heading"
                class="valueCell titleCell"
                :style="{color:series[heading].color}"
              >{{heading}}</th>
              <th
                ref="fillerCell"
                class="titleCell"
                :style="{width:scrollBarFillWidth+'px'}"
                style="width:14px;padding:0; margin:0;"
              ></th>
              <!-- to fill out the width of the scroll bar -->
            </tr>
          </thead>
        </template>
      </v-simple-table>
    </div>

    <div ref="viewPort" style="overflow-y:scroll; height:calc(100vh - 112px - 32px);">
      <div ref="contentDiv" :style="{height:contentHeight + 'px'}">
        <v-simple-table dense ref="itemTable">
          <template v-slot:default>
            <tbody v-for="row in rows" :key="row.date">
              <tr>
                <td rowspan="2" class="dateCell itemCell">{{typeof(row.date) === "number" ? dateOnly(row.date) : row.date}}</td>
                <td class="valueCell itemCell">Min</td>
                <td
                  v-for="(col,index) in row.min.val"
                  :key="index"
                  class="valueCell itemCell clickableCell"
                  @click="setMarkerPosition(row.min.date[index])"
                  :style="{color:series[headings[index]].color, fontWeight:col == rows[0].min.val[index] ? 'bold' : ''}"
                >{{col.toFixed(precision[index])}}</td>
              </tr>
              <tr>
                <td class="valueCell itemCell">Max</td>
                <td
                  v-for="(col,index) in row.max.val"
                  :key="index"
                  class="valueCell itemCell clickableCell"
                  @click="setMarkerPosition(row.max.date[index])"
                  :style="{color:series[headings[index]].color, fontWeight:col == rows[0].max.val[index] ? 'bold' : ''}"
                >{{col.toFixed(precision[index])}}</td>
              </tr>
              <tr></tr>
              <!-- to make sure the last row has a bottom border.-->
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
    model: Object,
    highlightedIndex: Number
  },
  data() {
    return {
      scrollBarFillWidth: 15,
      contentHeight: 0,
      viewPortPosition: 0,
      rowHeight: 28, // change CSS if you change this.
    };
  },
  mounted() {
    console.log("Component mounted.");
  },
  methods: {
    setMarkerPosition(pos) {
      this.$store.commit("setMarkerPosition", pos);
    }
  },
  watch: {
    headings(newVal, oldVal) {
      this.$emit("resize");
    }
  },
  computed: {
    bottomChartIndex() {
      return this.$store.state.chartIndex[1];
    },
    topChartIndex() {
      return this.$store.state.chartIndex[0];
    },
    visibility(){
      let result = [];
      this.$store.state.chartGroup.forEach(group => {
        result = result.concat(group.visibility);
      });

      return result;
    },
    headings() {
      let result = [];
      this.$store.state.chartGroup.forEach(group => {
        result = result.concat(
          group.columns.filter(
            (value, index) => index > 0 && group.visibility[index - 1]
          )
        );
      });

      return result;
    },
    series() {
      let result = {};
      this.$store.state.chartGroup.forEach(group => {
          Object.assign(result, group.series);
      });
      return result;
    },
    precision(){
      let result = [];
      this.$store.state.chartGroup.forEach(group => {
          result = result.concat(group.precision);
      });
      return result;
    },
    rows() {
      if (!this.$store.state.chartGroup[0]) return [];

      let rows = this.compileMaxMin(this.$store.state.log, this.$store.state.chartGroup[0].traceNames);

      for(let i=1; i < this.$store.state.chartGroup.length; i++){
        let thisRow = this.compileMaxMin(this.$store.state.log, this.$store.state.chartGroup[i].traceNames);
        // combine the rows
        rows.forEach((val, key)=>{
          val.max.date = val.max.date.concat(thisRow[key].max.date);
          val.max.val = val.max.val.concat(thisRow[key].max.val);
          val.min.date = val.min.date.concat(thisRow[key].min.date);
          val.min.val = val.min.val.concat(thisRow[key].min.val);
        });
      }

      rows.forEach((val, key)=>{
          let visFunc = (value, index) => this.visibility[index];
          val.max.date = val.max.date.filter(visFunc);
          val.max.val = val.max.val.filter(visFunc);
          val.min.date = val.min.date.filter(visFunc);
          val.min.val = val.min.val.filter(visFunc);
      });

      return rows;
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

.clickableCell {
  cursor: pointer;
}
.clickableCell:hover {
  text-decoration: underline;
}

tbody:hover {
  background-color: #eee;
}
</style>
