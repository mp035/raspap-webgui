<template>
    <v-form v-model="status.valid" ref="form" @submit.prevent="onFormSubmit" lazy-validation >

        <v-snackbar
            class="mt-4"
            v-model="showFormError"
            color="error"
            top
            :vertical="isSystemError"
            :timeout="0"
            >
            <h3 v-if="isSystemError" class="title">
                System Error
            </h3>
            <p class="subtitle-1">
                {{ formErrorText }}
            </p>
            <v-btn dark text icon @click="showFormError = false">
                <v-icon>mdi-close-box</v-icon>
            </v-btn>
        </v-snackbar>

        <slot v-bind:model="{
            values:modelStore,
            status,
            validation:validationData,
            rules,
            onFormSubmit,
            onFormCancel
        }" v-bind:disabled="status.disabled">
        <!-- form components can be placed in the default slot.
        They work the same as a regular input tag, only you use:
        v-model="model.name" instead of name="name"
        You need to pull the model into the slot scope with a
        v-slot attribute on the markup:

            <m-form v-slot="{model}" ><m-form>

        -->
        </slot>

        <!--div class="form-group row">
            <div class="col-xs-6 pr-1 pl-3" style="width:50%">
                <button type="submit"
                    :class="{'btn-success':status.successNotify}"
                    class="form-control btn btn-primary"
                    :disabled="status.disabled"
                >
                        <span v-if="status.successNotify" class="icon-ok-circle"> Success</span>
                        <span v-else-if="status.disabled" class="icon-clock">{{processing_text}}</span>
                        <span v-else>{{submit_text}}</span>
                </button>
            </div>
            <div class="col-xs-6 pl-1 pr-3" style="width:50%">
                <button type="button" class="form-control btn btn-secondary form-cancel"
                    @click="onFormCancel"
                    :disabled="status.disabled">{{cancel_text}}</button>
            </div>
        </div-->

    </v-form>

</template>

<script>

import genIdMixin from '../mixins/generate-id'
import apiMixin from '../mixins/api-request'
import apiEndpoints from '../mixins/api-endpoints'

export default {
    mixins:[
        genIdMixin,
        apiMixin,
        apiEndpoints,
    ],
    props:{
        query:Array,
        params:{
            type:Array,
            default:null,
        },
        rules:Object,
        hiddenInput:{
            type:Object,
            default:()=>{return {};},
        },
        modelSrc:{
            type:Object,
            default:()=>{return {};},
        },
        modelStoreIsolated:{
            type:Boolean,
            default:false,
        },
    },
    data(){
        return {
            showFormError:false,
            isSystemError:true,
            formErrorText:"You should never see this text!",
            validationData:{},
            status:{
                valid:true,
                disabled:false,
                successNotify:false,
                formId:this.generateId(),
            },
            modelStore:{},
        }
    },
    mounted(){
        if (!this.modelStoreIsolated){
            this.modelStore = JSON.parse(JSON.stringify(this.modelSrc)); // json is used to deep copy the modelSrc into model.
            this.$refs.form.resetValidation();

        }
    },

    methods:{
        onFormCancel: function(){
            // restore original content from modelSrc on cancel.
            this.modelStore = JSON.parse(JSON.stringify(this.modelSrc)); // json is used to deep copy the modelSrc into model.
            this.showFormError = false; // hide the error snackbar when the form is cancelled.
            this.$emit('cancel');
        },
        onFormSubmit: function(){
            var formData = {...this.modelStore, ...this.hiddenInput}

            this.showFormError = false;
            this.validationData = {};

            if (!this.$refs.form.validate()) {
                return;
            }

            this.status.disabled = true;

            this.$emit('pre-submit');

            this.apiRequest(this.query, this.params, formData).then(r => {

                if (r.status == 422) { // validation errors
                    this.validationData = r.body.errors;
                    this.status.disabled = false;
                    console.log(r);
                } else if (r.status == 401) { // authentication errors
                    this.isSystemError = false;
                    this.formErrorText = "Autentication failed.   You need to log out and then log in again."
                    this.showFormError = true;
                    this.status.disabled = false;
                    console.log(r);
                } else if (r.status >= 500) { // server errors
                    this.isSystemError = true;
                    this.formErrorText = r.body.message;
                    this.status.disabled = false;
                    this.showFormError = true;
                    console.log(r);
                } else if (r.status >= 200 && r.status <= 299) { // OK
                    this.status.successNotify = true;
                    this.$emit('success', r.body);
                    window.setTimeout(()=>{
                        this.status.disabled = false;
                        this.status.successNotify = false;
                        this.$emit('success-complete', r.body);
                    }, 3000)
                }
                else {
                    this.showFormError = true;
                    this.isSystemError = true;
                    this.formErrorText = "(" + r.status + ") " + (r.body.message || "Unsupported response from server.");
                    this.status.disabled = false;
                    console.log("Unsupported response from server:");
                    console.log(r);
                }
                return r;

            }).catch((err) => {

                console.log("Error in ApiForm.Vue.  Caught in 'catch' function of apiRequest promise");
                console.log(err);
                this.formErrorText = err.message;
                this.showFormError = true;
                this.isSystemError = true;
                console.log(err.response);

            });

        },

    },
    computed:{
    },
    watch: {
        modelSrc: function(newVal, oldVal) { // watch it
            // if we have not isolated the internal model store, then update it from the modelSrc
            if (!this.modelStoreIsolated){
                console.log("Model store updated.");
                this.modelStore = JSON.parse(JSON.stringify(this.modelSrc)); // json is used to deep copy the modelSrc into model.
            }

        },
    }

}
</script>
