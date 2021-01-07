<template>
    <v-btn
        :disabled="(!model.status.valid) || disabled || model.status.disabled"
        color="primary"
        class="mb-3 secondary--text text--darken-3"
        type="submit"
    >
    <!-- note that this button will submit the form because of its type.  we do not need @click="model.onFormSubmit()" -->

        {{label}}
    </v-btn>
</template>

<script>
export default {
    props:{
        label:String,
        model:Object,
        disabled:{
            type:Boolean,
            default:false,
        },
    }
}
</script>

<style>

</style>
