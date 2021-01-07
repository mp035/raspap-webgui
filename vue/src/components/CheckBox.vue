<template>
    <v-checkbox
        v-model="model.values[name]"
        :error-messages="model.validation[name]"
        :rules="model.rules[name] ? model.rules[name](model) : []"
        :label="label"
        :disabled="model.status.disabled || disabled"
        class="pa-0 ma-0"
    ></v-checkbox>

</template>

<script>
export default {
    props:{
        name:String,
        label:String,
        model:Object,
        disabled:{
            type:Boolean,
            default:false,
        },
        dense:{
            type:Boolean,
            default:false,
        },
    }
}
</script>

<style>

</style>
