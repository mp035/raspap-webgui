<template>
    <v-text-field
        v-model="model.values[name]"
        :error-messages="model.validation[name]"
        @keyup="model.validation[name] = []"
        :rules="model.rules[name](model)"
        :label="label"
        :required="required"
        :disabled="model.status.disabled || disabled"
        :append-icon="
            showPassword ? 'mdi-eye' : 'mdi-eye-off'
        "
        :type="showPassword ? 'text' : 'password'"
        @click:append="showPassword = !showPassword"
        class="mb-3"
        :autocomplete="autocomplete"
    ></v-text-field>
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
        autocomplete:String,
    },
    data(){
        return {
            showPassword : false,
        }
    }
}
</script>

<style>

</style>
