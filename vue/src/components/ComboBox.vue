<template>
    <v-combobox
        :search-input.sync="model.values[name]"
        :error-messages="model.validation[name]"
        @keyup="model.validation[name] = []"
        :rules="model.rules[name] ? model.rules[name](model) : []"
        :label="label"
        :required="required"
        :disabled="model.status.disabled || disabled"
        :items="items"
    ></v-combobox>
</template>

<script>
export default {
    props:{
        items:Array,
        name:String,
        label:String,
        model:Object,
        disabled:{
            type:Boolean,
            default:false,
        },
        required:{
            type:Boolean,
            default:false
        },
    },
}
</script>

<style>

</style>
