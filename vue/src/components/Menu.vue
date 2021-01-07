<template>
    <v-menu offset-y>
            <template v-slot:activator="{ on }">
                <v-btn text class="secondary--text text--darken-3 ml-3" v-on="on" dense>
                    <v-icon left>{{icon}}</v-icon>
                    {{label}}
                </v-btn>
            </template>
            <v-list dense>
                <slot>
                </slot>
            </v-list>
        </v-menu>
</template>

<script>
export default {
    props:{
        icon:String,
        label:String,
    }
}
</script>

<style>

</style>
