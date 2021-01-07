<template>
    <v-text-field
        v-model="model.values[name]"
        :error-messages="model.validation[name]"
        @keyup="model.validation[name] = []"
        :rules="model.rules[name] ? model.rules[name](model) : []"
        :label="label"
        :required="required"
        :disabled="model.status.disabled || disabled"
        :type="type"
    ></v-text-field>
</template>

<script>
export default {
    props:{
        name:String,
        label:String,
        model:Object,
        type:String,
        disabled:{
            type:Boolean,
            default:false,
        },
        required:{
            type:Boolean,
            default:false
        },
    }
}
</script>

<style>

</style>
