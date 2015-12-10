(function($) {

  $.AnnotationTooltip = function(options) {

    jQuery.extend(this, {
      element:   null,
      parent:    null,
      annotations: [],
      windowId:  ""
    }, options);

    this.init();
  };

  $.AnnotationTooltip.prototype = {

    init: function() {
      this.bindEvents();
    },

    bindEvents: function() {
      var _this = this;
    },
    
    getEditor: function(annotation) {
      var annoText = "",
      tags = [],
      _this = this;

      if (!jQuery.isEmptyObject(annotation)) {
        if (jQuery.isArray(annotation.resource)) {
          jQuery.each(annotation.resource, function(index, value) {
            if (value['@type'] === "oa:Tag") {
              tags.push(value.chars);
            } else {
              annoText = value.chars;
            }
          });
        } else {
          annoText = annotation.resource.chars;
        }
      }

      return this.editorTemplate({content : annoText,
        tags : tags.join(" "),
        id : jQuery.isEmptyObject(annotation) ? "" : annotation['@id'],
        windowId : _this.windowId
      });
    },

    getViewer: function(annotations) {
        //alert("In annotationTooltip:getViewer: annotations count = " + annotations.length);
      var annoText,
      tags = [],
      _this = this,
      htmlAnnotations = [],
      id;

      jQuery.each(annotations, function(index, annotation) {
        tags = [];
        if (jQuery.isArray(annotation.resource)) {
          jQuery.each(annotation.resource, function(index, value) {
            if (value['@type'] === "oa:Tag") {
              tags.push(value.chars);
            } else {
              annoText = value.chars;
            }
          });
        } else {
          annoText = annotation.resource.chars;
        }
        var username = "";
        if (annotation.annotatedBy && annotation.annotatedBy.name) {
          username = annotation.annotatedBy.name;
        }
        //if it is a manifest annotation, don't allow editing or deletion
        //otherwise, check annotation in endpoint
        var showUpdate = false;
          if (typeof annotation.endpoint !== "undefined") { // [jrl]
              if (annotation.endpoint !== 'manifest') {
                  showUpdate = annotation.endpoint.userAuthorize('update', annotation);
              }
              var showDelete = false;
              if (annotation.endpoint !== 'manifest') {
                  showDelete = annotation.endpoint.userAuthorize('delete', annotation);
              }

              //* TEMP: override [jrl] 12-9-15
              showUpdate = true;
              showDelete = true;

          }

        htmlAnnotations.push({
          annoText : annoText,
          tags : tags,
          id : annotation['@id'],
          username : username,
          // temporary [jrl]
          //showUpdate : showUpdate,
          //showDelete : showDelete
        });
      });

      var template = this.viewerTemplate({annotations : htmlAnnotations,
        windowId : _this.windowId});
      return template;
      //return combination of all of them
    },

    //when this is being used to edit an existing annotation, insert them into the inputs
    editorTemplate: Handlebars.compile([
                                       '<form id="annotation-editor-{{windowId}}" class="annotation-editor annotation-tooltip" {{#if id}}data-anno-id="{{id}}"{{/if}}>',
                                       '<textarea class="text-editor" placeholder="{{t "comments"}}…">{{#if content}}{{content}}{{/if}}</textarea>',
                                       '<input id="tags-editor-{{windowId}}" class="tags-editor" placeholder="{{t "addTagsHere"}}…" {{#if tags}}value="{{tags}}"{{/if}}>',
                                       '<div>',
                                       // need to add a delete, if permissions allow
                                       '<div class="button-container">',
                                       '<a href="#cancel" class="cancel"><i class="fa fa-times-circle-o fa-fw"></i>{{t "cancel"}}</a>',
                                       '<a href="#save" class="save"><i class="fa fa-database fa-fw"></i>{{t "save"}}</a>',
                                       '</div>',
                                       '</div>',
                                       '</form>'
    ].join('')),

    viewerTemplate: Handlebars.compile([
                                       '<div class="all-annotations" id="annotation-viewer-{{windowId}}">',
                                       '{{#each annotations}}',
                                       '<div class="annotation-display annotation-tooltip" data-anno-id="{{id}}">',
                                       '<div class="button-container">',
                                         '{{#if showUpdate}}<a href="#edit" class="edit"><i class="fa fa-pencil-square-o fa-fw"></i>{{t "edit"}}</a>{{/if}}',
                                         '{{#if showDelete}}<a href="#delete" class="delete"><i class="fa fa-trash-o fa-fw"></i>{{t "delete"}}</a>{{/if}}',
                                       '</div>',
                                       '<div class="text-viewer">',
                                       '{{#if username}}<p class="user">{{username}}:</p>{{/if}}',
                                       '<p>{{{annoText}}}</p>',
                                       '</div>',
                                       '<div id="tags-viewer-{{windowId}}" class="tags-viewer">',
                                       '{{#each tags}}',
                                       '<span class="tag">{{this}}</span>',
                                       '{{/each}}',
                                       '</div>',
                                       '</div>',
                                       '{{/each}}',
                                       '</div>'                      
    ].join(''))
  };

}(Mirador));
