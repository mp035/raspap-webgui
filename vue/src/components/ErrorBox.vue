<template>
    <v-snackbar
        class="mt-4"
        v-model="showMe"
        color="error"
        top
        :timeout="0"
        >
        <p class="subtitle-1">
            {{ errorText }}
        </p>
        <v-btn dark text icon @click="showMe = false">
            <v-icon>mdi-close-box</v-icon>
        </v-btn>
    </v-snackbar>
</template>

<script>

export default {
    data(){
        return {
            showMe:false,
            errorText:"You should never see this text!",
        }
    },
    methods:{
        showError: function(message){
            this.errorText = message;
            this.showMe = true;
        },
    },
}
</script>
