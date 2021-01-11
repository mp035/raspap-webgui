<div class="tab-pane fade" id="advanced">
  <h4> </h4>
  <!-- input type="hidden" id="chxbridgedenable" name="bridgedEnable" value="0" /-->
  <input type="hidden" id="chxwificlientap" name="wifiAPEnable" value="1" />
  <!-- input type="hidden" id="chxhiddenssid" name="hiddenSSID" value="0" /-->
  <input type="hidden" id="chxbeaconinterval" name="beaconintervalEnable" value="1" />
  <input type="hidden" name="beacon_interval" value="{{ $arrConfig['beacon_int']  }}"/>
  <!--input type="hidden" id="chxdisassoclowack" name="disassoc_low_ackEnable" value="0" / -->
  <input type="hidden" id="max_num_sta" name="max_num_sta" value="{{ $arrConfig["max_num_sta"]  }}"/>
  
  <div class="row">
    <div class="form-group col-md-6">
      <label for="cbxhwmode">{{ _("Wireless Mode")  }}</label>
      @include('components.select',[
        'name'=>'hw_mode', 
        'options'=>$arr80211Standard, 
        'selected'=>$selectedHwMode, 
        'id'=>'cbxhwmode', 
        'event'=>'loadChannelSelect', 
        'disabled'=>$hwModeDisabled,
      ])
    </div>
  </div>

  <div class="row">
  <div class="form-group col-md-6">
    <label for="cbxwpa">{{ _("Security type") }}</label>
    @include('components.select', ['name'=>'wpa', 'options'=>$arrSecurity, 'selected'=>$arrConfig['wpa'], 'id'=>'cbxwpa'])
  </div>
  </div>
  <div class="row">
  <div class="form-group col-md-6">
    <label for="cbxwpapairwise">{{ _("Encryption Type") }}</label>
    @include('components.select', ['name'=>'wpa_pairwise', 'options'=>$arrEncType, 'selected'=>$arrConfig['wpa_pairwise'], 'id'=>'cbxwpapairwise'])
  </div>
  </div>
  
  <div class="row">
    <div class="form-group col-md-6">
      <label for="cbxchannel">{{ _("Channel") }}</label>
      {{-- this component is populated via ajax --}}
      @include('components.select', ['name'=>'channel', 'options'=>[], 'id'=>'cbxchannel'])
    </div>
  </div>


</div><!-- /.tab-pane | advanded tab -->
