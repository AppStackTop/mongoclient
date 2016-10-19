/**
 * Created by RSercan on 2.1.2016.
 */
Template.search.onRendered(function () {
    Template.initializeCodeMirror($('#divSearch'), 'txtSearch');
});

Template.geoHaystackSearchOptions.getOptions = function () {
    var result = {};
    Template.checkAndAddOption("SEARCH", $('#divSearch'), result, GEO_HAYSTACK_SEARCH_OPTIONS);

    if ($.inArray("MAX_DISTANCE", Session.get(Template.strSessionSelectedOptions)) != -1) {
        var maxDistanceValue = $('#inputMaxDistance').val();
        if (maxDistanceValue) {
            result[GEO_HAYSTACK_SEARCH_OPTIONS.MAX_DISTANCE] = parseInt(maxDistanceValue);
        }
    }

    if ($.inArray("LIMIT", Session.get(Template.strSessionSelectedOptions)) != -1) {
        var limitVal = $('#inputLimit').val();
        if (limitVal) {
            result[GEO_HAYSTACK_SEARCH_OPTIONS.LIMIT] = parseInt(limitVal);
        }
    }

    return result;
};