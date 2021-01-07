<template>
    <v-btn text class="secondary--text text--darken-3 ml-3" dense @click="(evt)=>$emit('click', evt)">
        <v-icon left>{{icon}}</v-icon>
        <slot></slot>
    </v-btn>
</template>

<script>
export default {
    props:{
        icon:String,
    }
}
</script>

<style>

</style>
