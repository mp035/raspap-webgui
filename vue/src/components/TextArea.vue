<template>
    <v-textarea
        v-model="model.values[name]"
        :error-messages="model.validation[name]"
        @keyup="model.validation[name] = []"
        :rules="model.rules[name] ? model.rules[name](model) : []"
        :label="label"
        :required="required"
        :disabled="model.status.disabled || disabled"
    ></v-textarea>
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
        required:{
            type:Boolean,
            default:false
        },
    }
}
</script>

<style>

</style>
