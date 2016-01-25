/*
 * All Endpoints need to have at least the following:
 * annotationsList - current list of OA Annotations
 * dfd - Deferred Object
 * init()
 * search(options, successCallback, errorCallback)
 * create(oaAnnotation, successCallback, errorCallback)
 * update(oaAnnotation, successCallback, errorCallback)
 * deleteAnnotation(annotationID, successCallback, errorCallback) (delete is a reserved word)
 * TODO:
 * read() //not currently used
 *
 * Optional, if endpoint is not OA compliant:
 * getAnnotationInOA(endpointAnnotation)
 * getAnnotationInEndpoint(oaAnnotation)
 */
//var accessToken = "tenkrToken";

(function($){

  console.log("Initing Endpoint:");
  //console.log("tgToken = " + tgToken);
  //alert("tgToken = " + tgToken);

  $.TenkrEndpoint = function(options) {

    jQuery.extend(this, {
      dfd:             null,
      annotationsList: [],        //OA list for Mirador use
      windowID:        null,
      parent:          null
    }, options);

    //Test sending/receiving token as custom header
    console.log("doing access token ajax call");
    var getToken = function() {
      jQuery.ajax({
        type: 'GET',
        url: "http://localhost:5000/getAccessToken",
        dataType: 'jsonp',  //use jsonp data type in order to perform cross domain ajax via cookies
        success: gotToken,
        error: function (jqXHR, textStatus, errorThrown) {
          alert(errorThrown);
        }
      });
      console.log("back from access token ajax call");
      // end acccess token test
    };

    var gotToken = function(data){
      console.log("In gotToken / success function");
      console.log ("returned data: " + data);
      /* parse JSON */
      console.log ("parsed returned data.accessToken: " + data.accessToken);
      console.log ("parsed returned data.tokenType: " + data.tokenType);
      accesssToken = data.accessToken;
    };


    this.init();
  };

  $.TenkrEndpoint.prototype = {
    init: function() {
      //whatever initialization your endpoint needs
    },

    //Search endpoint for all annotations with a given URI in options
    search: function(options, successCallback, errorCallback) {
      this.annotationsList = []; //clear out current list
      var _this = this;

      console.log("In Endpoint search:");
      _parent = this.parent;
      console.log("Endpoint::search: canvasId = " + this.parent.currentCanvasID);

      //use options.uri
      jQuery.ajax({
        //this will now return an array of only annotation_ids and service blocks
        //subsequent "success" process will iterate and authenticate as needed
        url: 'http://localhost:5000/getAnnotations?canvas_id=' + _parent.currentCanvasID,
        type: 'GET',
        dataType: 'json',   // this will cause a CORS pre-flight
        crossDomain: true,
        headers: {"auth-token": "tenkrToken"},
        data: { },
        contentType: "application/json; charset=utf-8",
        Connection: "keep-alive",
        success: function(data) {
          console.log("Endpoint search: success");
          //check if a function has been passed in, otherwise, treat it as a normal search
          if (typeof successCallback === "function") {
            successCallback(data);
          } else {
            jQuery.each(data, function(index, value) {
              _this.annotationsList.push(_this.getAnnotationInOA(JSON.parse(value)));
              // check all returned annotations; if it has a service block authn it; save service url if not seen
              //_this.preAuthAnnos(_this.getAnnotationInOA(JSON.parse(value)));
              //alert( "key returned from anno is #{index}");
            });

            console.log("Endpoint::search: _this.annotationsList = " + JSON.stringify(_this.annotationsList));
            _this.dfd.resolve(true);
          }
        },
        error: function(x,e) {
          console.log("Endpoint search: failure: " + e);
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },
    
    //Delete an annotation by endpoint identifier
    deleteAnnotation: function(annotationID, successCallback, errorCallback) {
      console.log("annotationID in deleteAnnotation = " + annotationID);
      var _this = this;        
      jQuery.ajax({
        url: annotationID,
        type: 'DELETE',
        dataType: 'json',
        crossDomain: true,
        headers: { },
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          if (typeof successCallback === "function") {
            successCallback();
          }
        },
        error: function() {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },
    
    //Update an annotation given the OA version
    update: function(oaAnnotation, successCallback, errorCallback) {
      //alert("in tenkr:update");
      var annotation = this.getAnnotationInEndpoint(oaAnnotation),
      _this = this;
      jQuery.ajax({
        url: 'http://localhost:5000/annotation?',
        // shouldn't method be PUT?
        type: 'PUT',
        dataType: 'json',
        headers: { },
        data: JSON.stringify(annotation),
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          if (typeof successCallback === "function") {
            successCallback();
          }
        },
        error: function() {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },

    //takes OA Annotation, gets Endpoint Annotation, and saves
    //if successful, MUST return the OA rendering of the annotation
    create: function(oaAnnotation, successCallback, errorCallback) {
      // oaAnnotation comes in as a JSON object
      var _this = this;
      //alert("in Create Annotation");
      console.log("Create this annotation: "+ JSON.stringify(oaAnnotation));
      oaAnnotation = this.getAnnotationInEndpoint(oaAnnotation);
      console.log("Create this annotation now: "+ JSON.stringify(oaAnnotation));
      jQuery.ajax({
        //url: 'http://localhost:5000/annotations?annotation=' + JSON.stringify(oaAnnotation),
        url: 'http://localhost:5000/annotations?' ,
        type: 'POST',
        dataType: 'json',
        crossDomain: true,
        headers: { },
        data: JSON.stringify(oaAnnotation),
          //data: oaAnnotation,
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          if (typeof successCallback === "function") {
            successCallback(_this.getAnnotationInOA(data));
          }
        },
        error: function() {
          if (typeof errorCallback === "function") {
            errorCallback();
          }
        }
      });
    },

    set: function(prop, value, options) {
      if (options) {
        this[options.parent][prop] = value;
      } else {
        this[prop] = value;
      }
    },

    //Convert Endpoint annotation to OA
    getAnnotationInOA: function(annotation) {
      annotation.on = annotation.on.replace(/=>/g,":");
      annotation.on = JSON.parse(annotation.on);
      annotation.motivation = annotation.motivation.split();
      return annotation;
    },

    // Converts OA Annotation to endpoint format
    // annotation is a JSON object
    getAnnotationInEndpoint: function(oaAnnotation) {
      oaAnnotation.motivation = oaAnnotation.motivation[0];
      // on.scope is not standard, but if we remove it here we need to remote where it is set in osd-canvas-renderer:render->AnnotationSaveEvent
      // we have the xywh values at the end of the on value element
      //delete oaAnnotation.on.scope; //needed in annotationSaveEvent
      console.log("in getAnnotationInEndpoint - oaAnnotation = " + JSON.stringify(oaAnnotation));
      //("oaAnnotation.on: " + oaAnnotation.on);
      return oaAnnotation;
    },

    preAuthAnnos: function(annotation) {
      alert("in preauth");
      //for (var anno in annotationsList) {
        console.log("In preAuth: annotation = " + annotation);
      //}
    }

  };

}(Mirador));
