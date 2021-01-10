export default {
    data(){
      return {
        apiPrefix:"api/",
        //apiServer:"http://192.168.50.1/",  // for local testing with api on the pi.
        apiServer: location.protocol + "//" + location.host + "/",
      }
    },
    methods: {
        loadToken(){
          // this will eventually be used for authentication,
          // but for now, just return null
          return null;
        },
        clearToken(){
          // this will eventually be used to clear the 
          // authentication token (log out)
          // for now do nothing.

        },
        statusCentury(statuscode) {
            return Math.floor(statuscode / 100)
        },
        statusOk(statuscode) {
            return this.statusCentury(statuscode) == 2;
        },

        // use the standard error box ui to display errors.
        checkStatus(response, errorMessage) {
            if (!this.statusOk(response.status)) {
                console.log(response);
                this.showError(errorMessage);
                return false;
            }
            return true;
        },

        // note that if you put headers into fetch options, instead of the headers
        // argument, then ALL default headers will be replaced with those in fetchOptions
        apiRequest: function (method, route, body, headers = {}, fetchOptions = {}) {

          headers['Accept'] = headers['Accept'] || 'application/json';

          let queryParams;
          if (method.toUpperCase() == "GET" || method.toUpperCase() == "DELETE") {
              // get requests can not have a body, so we use the body field to encode
              // query parameters onto the url.
              if (body) {
                  queryParams = new URLSearchParams(body).toString();
              }
              body = null;
          } else {

              // flag that we are sending json unless
              // body is null or FormData, or the headers have a specified Content-Type already
              if (body && (!(body instanceof FormData)) && (headers['Content-Type'] === undefined)) {
                  body = JSON.stringify(body);
                  headers['Content-Type'] = 'application/json';
              }
          }

          // populate authorization headers if logged in
          let userData
          if ((userData = this.loadToken())) {
              headers["Authorization"] = "Bearer " + userData.token;
          }

          let endpoint = this.apiServer + this.apiPrefix + route;

          console.log(endpoint);

          // URLify the address and add query parameters if needed
          endpoint = new URL(endpoint)
          if (queryParams) endpoint.search = queryParams;

          var options = Object.assign({
              method: method,
              headers: headers,
              body: body,
          }, fetchOptions);

          return fetch(endpoint, options).then(r => {

              // if we get 401 back from a request, ditch the token, and
              // navigate us to the login page.
              if (r.status == 401) {
                  this.clearToken();
                  this.$router.push('/');
              }

              // If we get 423 back from a request, the user account has been locked.
              // Navigate to the account locked page.
              if (r.status == 423) {
                  if (this.$route.path != '/locked') {
                      this.$router.push('/locked');
                  }
              }

              // for error reporting.
              let responseClone = r.clone();

              if (headers['Accept'] == 'application/json') {
                  return r.json().then((js) => {
                      return { status: r.status, body: js };
                  }).catch(ex => {
                      console.error("Error decoding JSON response from apiRequest.");
                      console.log(ex);
                      console.error("Content of the response was:");
                      console.log(r);
                      responseClone.text().then(r => { console.error("Text content of the response body was:"); console.log(r); });
                  });
              } else {
                  if (!this.statusOk(r.status)) {
                      console.error(`HTTP Error ${r.status}:`);
                      return r.text().then(txt => console.log(txt));
                  }
                  return r.arrayBuffer().then((bin) => {
                      return { status: r.status, body: bin };
                  }).catch(ex => {
                      console.error("Error decoding Blob response from apiRequest.");
                      console.log(ex);
                      console.error("Content of the response was:");
                      console.log(r);
                      responseClone.text().then(r => { console.error("Text content of the response body was:"); console.log(r); });
                  });
              }
          }).catch((ex) => {
              // errors here indicate some network problem other than HTTP error codes
              console.error("Exception in promise of apiRequest fetch stage:");
              console.error(ex);

          });

      },

    },
};