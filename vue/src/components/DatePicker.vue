<template>
<div>

  <v-date-picker
    :value="dateString"
    :error-messages="model.validation[name]"
    @input="onInput"

    :disabled="model.status.disabled || disabled"
    :min="min"
    :max="max"
  ></v-date-picker>
  <div  v-if="model.validation[name] && model.validation[name].length" class="v-messages error--text pt-3" role="alert">
    <div v-for="(errorText, keyNum) in model.validation[name]" :key="keyNum" class="v-messages__message message-transition-enter-to">
        {{errorText}}
    </div>
  </div>

</div>
</template>

<script>
import dateFormat from "../mixins/format-date";

export default {
  mixins:[dateFormat],
  props: {
    name: String,
    model: Object,
    min: String,
    max: String,
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    value:Number,
  },
  data(){
    return {
      dateString:""
    };
  },
  methods:{
    onInput(newValue){
      // set the control up to use unix timestamps to
      // represent the date

      let dateTime = new Date(newValue + " 00:00:00"); // this will convert the input value to midnight local time on the specified date.
      let timeStamp = Math.floor(dateTime.getTime() / 1000); // convert to unix timestamp.

      //this.$emit('input', timeStamp);// this would be v-model compatible, but we don't use that in apiForm.js
      this.modelValuesName = timeStamp;// this sets the value in the apiform model to the appropriate timestamp.


      // then run validation
      let rules = this.model.rules[this.name] ? this.model.rules[this.name](this.model) : [];
      // clear old errors
      this.model.validation[this.name] = [];

      // validate again
      for (let i = 0; i < rules.length; i++){
        let err = rules[i](timeStamp);
        if (err !== true){
          this.model.validation[this.name].push(err);
        }
      }
    }
  },
  computed:{
    modelValuesName:{
      get(){
        return this.model.values[this.name];
      },
      set(value){
        Vue.set(this.model.values, this.name, value);
      }
    }
  },
  watch:{
    modelValuesName:function(newValue, oldValue){
      // this just updates the datepicker controls value with a new string
      // when the model changes.
      this.dateString = this.localIsoDateOnly(newValue);
    },
  }
};
</script>

<style>
</style>
