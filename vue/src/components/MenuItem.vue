<template>
    <v-list-item @click="$emit('click')" >
        <v-icon left>{{icon}}</v-icon>
        <v-list-item-title>
            <slot>
            </slot>
        </v-list-item-title>
    </v-list-item>
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
