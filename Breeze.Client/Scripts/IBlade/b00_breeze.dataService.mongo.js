﻿(function(factory) {
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // CommonJS or Node: hard-coded dependency on "breeze"
        factory(require("breeze"));
    } else if (typeof define === "function" && define["amd"] && !breeze) {
        // AMD anonymous module with hard-coded dependency on "breeze"
        define(["breeze"], factory);
    } else {
        // <script> tag: use the global `breeze` object
        factory(breeze);
    }    
}(function(breeze) {
       
    var core = breeze.core;

    var MetadataStore = breeze.MetadataStore;
    var JsonResultsAdapter = breeze.JsonResultsAdapter;
    var AbstractDataServiceAdapter = breeze.AbstractDataServiceAdapter;

    var ajaxImpl;

    var ctor = function () {
        this.name = "mongo";
    };
    ctor.prototype = new AbstractDataServiceAdapter();
    
    ctor.prototype._prepareSaveBundle = function(saveBundle, saveContext) {
        var em = saveContext.entityManager;
        var metadataStore = em.metadataStore;
        var helper = em.helper;

        saveBundle.entities = saveBundle.entities.map(function (e) {
            var rawEntity = helper.unwrapInstance(e);

            var autoGeneratedKey = null;
            if (e.entityType.autoGeneratedKeyType !== AutoGeneratedKeyType.None) {
                autoGeneratedKey = {
                    propertyName: e.entityType.keyProperties[0].nameOnServer,
                    autoGeneratedKeyType: e.entityType.autoGeneratedKeyType.name
                };
            }

            var originalValuesOnServer = helper.unwrapOriginalValues(e, metadataStore);
            rawEntity.entityAspect = {
                entityTypeName: e.entityType.name,
                defaultResourceName: e.entityType.defaultResourceName,
                entityState: e.entityAspect.entityState.name,
                originalValuesMap: originalValuesOnServer,
                autoGeneratedKey: autoGeneratedKey
            };
            return rawEntity;
        });

        saveBundle.saveOptions = { tag: saveBundle.saveOptions.tag };

        return saveBundle;
    }

    ctor.prototype._prepareSaveResult = function (saveContext, data) {
        // HACK: need to change the 'case' of properties in the saveResult
        // but KeyMapping properties internally are still ucase. ugh...
        var keyMappings = data.KeyMappings.map(function (km) {
            var entityTypeName = MetadataStore.normalizeTypeName(km.EntityTypeName);
            return { entityTypeName: entityTypeName, tempValue: km.TempValue, realValue: km.RealValue };
        });
        return { entities: data.Entities, keyMappings: keyMappings, XHR: data.XHR };
    }
    
    ctor.prototype.jsonResultsAdapter = new JsonResultsAdapter({
        name: "mongo",

        visitNode: function (node, mappingContext, nodeContext) {
            return {};
        }
    });    
    
    breeze.config.registerAdapter("dataService", ctor);

}));