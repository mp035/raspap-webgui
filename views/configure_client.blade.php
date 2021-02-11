@extends('layouts.app')
@section('content')
<div class="row">
  <div class="col-lg-12">
    <div class="card">
      <div class="card-header">
        <div class="row">
          <div class="col">
            <i class="fas fa-wifi mr-2"></i>{{ _("WiFi client") }}
          </div>
            <div class="col">
              <button class="btn btn-light btn-icon-split btn-sm service-status float-right">
                <span class="icon"><i class="fas fa-circle service-status-{{$ifaceStatus}}"></i></span>
                <span class="text service-status">{{ strtolower($clientInterface) .' '. _($ifaceStatus) }}</span>
              </button>
            </div>
        </div><!-- /.row -->
      </div><!-- /.card-header -->
      <div class="card-body">
        <?php $status->showMessages(); ?>
        <div class="row">
          <div class="col">
            <h4 class="mb-2">{{ _("Client settings") }}</h4>
          </div>
          <div class="col-xs mr-3 mb-3">
            <button type="button" class="btn btn-info btn-block float-right" data-toggle="modal" data-target="#hiddenClientModal">
              {{_("Connect to Hidden Wifi Network")}}
            </button>
          </div>
          <div class="col-xs mr-3 mb-3">
            <button type="button" class="btn btn-info btn-block float-right js-reload-wifi-stations">{{ _("Rescan") }}</button>
          </div>
        </div>
        <form method="POST" action="wpa_conf" name="wpa_conf_form" class="row">
            {!! CSRFTokenFieldTag() !!}
          <input type="hidden" name="client_settings" ?>
          <div class="row js-wifi-stations w-100 loading-spinner"></div>

          <!-- Modal -->
          <div class="modal fade" id="hiddenClientModal" tabindex="-1" role="dialog" aria-labelledby="ModalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
              <div class="modal-content">
                <div class="modal-header">
                  <div class="modal-title" id="ModalLabel"><i class="fas fa-sync-alt mr-2"></i> {{_("Connect to Hidden Wifi Network")}} </div>
                </div>
                <div class="modal-body">
                  <p>This is where the form will go.</p>
                </div>
                <div class="modal-footer">
                  <input type="submit" class="btn btn-info" value="{{ _("Connect") }}" id="connectHidden" name="connectHidden"/>
                  <button type="button" class="btn btn-outline btn-primary" data-dismiss="modal">{{ _("Cancel") }}</button>
                </div>
              </div>
            </div>
          </div>

        </form>
      </div><!-- ./ card-body -->
      <div class="card-footer">{!! _("<strong>Note:</strong> WEP access points appear as 'Open'. RaspAP does not currently support connecting to WEP") !!}</div>
    </div><!-- /.card -->
  </div><!-- /.col-lg-12 -->
</div><!-- /.row -->
@endsection