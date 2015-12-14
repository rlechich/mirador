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
(function($){

  console.log("Initing Endpoint");

  $.TenkrEndpoint = function(options) {

    jQuery.extend(this, {
      dfd:             null,
      annotationsList: [],        //OA list for Mirador use
      windowID:        null,
      parent:          null
    }, options);

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
        //url: 'http://localhost:5000/getAnnotations?canvas_id=http://manifests.ydc2.yale.edu/canvas/4ada1a56-c2f1-4a8e-8543-9c8045bd4ba8', //+ CanvasID,
        url: 'http://localhost:5000/getAnnotations?canvas_id=' + this.parent.currentCanvasID,
        type: 'GET',
        dataType: 'json',   // this will cause a CORS pre-flight
        crossDomain: true,
        //headers: { },
        data: { },
        contentType: "application/json; charset=utf-8",
        success: function(data) {
          console.log("Endpoint search: success");
          //check if a function has been passed in, otherwise, treat it as a normal search
          if (typeof successCallback === "function") {
            successCallback(data);
          } else {
            jQuery.each(data, function(index, value) {
              //_this.annotationsList.push(_this.getAnnotationInOA(value));
              //_this.annotationsList.push(JSON.parse(_this.getAnnotationInOA(value)));
              _this.annotationsList.push(_this.getAnnotationInOA(JSON.parse(value)));
            });

            console.log("Endpoint::search: _this.annotationsList = " + JSON.stringify(_this.annotationsList));
            _this.dfd.resolve(true);
            //jQuery.publish('AnnotationListLoaded.'+_this.windowID, _this.annotationsList);
            //jQuery.publish('annotationListLoaded.'+_this.windowID, _this.annotationsList);
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
        //url: 'http://localhost:5000/annotation',
        url: annotationID,
        type: 'DELETE',
        dataType: 'json',
        crossDomain: true,
        headers: { },
        //data: "id=" + annotationID,
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
      var annotation = this.getAnnotationInEndpoint(oaAnnotation),
      _this = this;
      
      jQuery.ajax({
        url: '',
        type: 'POST',
        dataType: 'json',
        headers: { },
        data: '',
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
        //alert("getAnnotationInOA:on = " + annotation.on);
        if (!annotation.on.startsWith("http://")) {
          annotation.on = annotation.on.replace(/=>/g,":");
          //alert("no hashrocket: getAnnotationInOA:on = " + annotation.on);
          annotation.on = JSON.parse(annotation.on);
          //alert("annotation.on JSON.parsed ok");
        }
      return annotation;
    },

    // Converts OA Annotation to endpoint format
    // annotation is a JSON object
    getAnnotationInEndpoint: function(oaAnnotation) {
      oaAnnotation.motivation = oaAnnotation.motivation[0];
      delete oaAnnotation.on.scope;
      console.log("in getAnnotationInEndpoint - oaAnnotation = " + JSON.stringify(oaAnnotation));
      //("oaAnnotation.on: " + oaAnnotation.on);
      return oaAnnotation;
    }
  };

}(Mirador));
