'use strict';

var ww = new Wherewolf();
var autocomplete = null;

var data = null;
var cca = null;

var map = null;
var svg = null;
var projection = null;
var w = null;
var mapRatio = 0.5;
var mapScaleFactor = 100;
var margin = {top: 0, left: 0, bottom: 0, right: 0};
var path = null;
var quantize = null;
var auctionValues = null;

var AlbanyPark = {
  filings: 8.146775654,
  auctions: 11.168966623
};

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

var mean = function(array) {
  var sum = 0;
  for (var i = 0; i < array.length; i++) {
    sum += parseFloat(array[i]);
  }
  return sum / array.length;
};

$(document).ready(function() {

  $('.autocomplete-boxes').hide();
  d3.select(window).on('resize', _.debounce(resize, 50));

  $.getJSON('data/cca.topojson', function(d) {
    data = d;

    cca = topojson.feature(data, data.objects.cca);
    var _features = _.pluck(cca.features, 'properties');
    auctionValues = _.map(_features, function(d) { return d.auctions; });

    ww.addAll(data);
    drawMap(data);
  });

  function drawMap(data) {
    w = $('#map').width();

    var width = w - margin.left - margin.right;
    var height = width * mapRatio * 2;

    projection = d3.geo.mercator()
      .scale(mapScaleFactor * width)
      .center([-87.7321, 41.834029785067884])
      .translate([width/2,height/2]);

     path = d3.geo.path()
        .projection(projection);

    svg = d3.select('#map').append('svg')
        .attr('width', width)
        .attr('height', height);

    map = svg.append('g')
        .attr('class','features');

    quantize = d3.scale.quantize()
        .domain([d3.min(auctionValues), d3.max(auctionValues)])
        .range(d3.range(19).map(function(i) { return "q" + i + "-19"; }));

    map.selectAll('path')
      .data(cca.features)
    .enter().append('path')
      .attr('class', function(d) {
        return 'cca ' + quantize(d.properties.filings);
      })
      .attr('d', path)
      .on('click', function(d) {
        $('#autocomplete').val(d.properties.cca);
        d3.select('.cca-border').moveToFront();
        d3.select(this).moveToFront();
        focusOnCCA(d);
      })
      .on('mouseover', function(d) {
        focusOnCCA(d);
        d3.select('.cca-border').moveToFront();
        d3.select(this).moveToFront();
      });

    map.append('path')
      .datum(topojson.feature(data, data.objects.cca, function(a, b) { return a !== b; }))
      .attr('class', 'cca-border')
      .attr('d', path);
  }

  function resize() {
    w = parseInt(d3.select('#map').style('width'));
    var width = w - margin.left - margin.right;
    var height = width * mapRatio * 2;

    projection
        .translate([width / 2, height / 2])
        .scale(mapScaleFactor * width);

    // resize the map container
    svg
        .style('width', width + 'px')
        .style('height', height + 'px');

    map
        .style('width', width + 'px')
        .style('height', height + 'px');

    // resize the map
    map.selectAll('.cca').attr('d', path);
    map.selectAll('.cca-border').attr('d', path);

  }

  autocomplete = new google.maps.places.Autocomplete(
      (document.getElementById('autocomplete')),
      { types: ['geocode'] });

  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    $('.get-location').submit();
  });

  $('#geolocate').click(function(e) {
    e.preventDefault();
    setLatLonGeolocation();
  });

  $('.get-location').submit(function(e) {
    e.preventDefault();
    var place = autocomplete.getPlace();
    setLatLonAddressSearch(place);
  });

  function geolocate() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var geolocation = new google.maps.LatLng(
            position.coords.latitude, position.coords.longitude);
        var circle = new google.maps.Circle({
          center: geolocation,
          radius: position.coords.accuracy
        });
        autocomplete.setBounds(circle.getBounds());
      });
    }
  }

  function setLatLonAddressSearch(place) {
    if (place === undefined) {
      return false;
    }
    var coords = {
      latitude: place.geometry.location.A,
      longitude: place.geometry.location.F,
      geolocated: false
    };
    processLatLon(coords);
  }

  function setLatLonGeolocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          geolocated: true
        };

        processLatLon(loc);
      });
    }
  }

  function processLatLon(coords) {
    var result = ww.find([coords.longitude, coords.latitude], { wholeFeature: true });
    var cca = result.cca;

    if (cca === null) {
      processNotFound(coords);
      return false;
    }

    focusOnCCA(cca);
  }

  function processNotFound(coords) {
    // if (coords.geolocated) {
    //   $('div.result').append('<p class="error">Sorry, we were unable to locate you within the City of Chicago. Try searching for an address instead.</p>')
    // } else {
    //   $('div.result').append('<p class="error">Sorry, that location is not within the City of Chicago. Try a different address instead.</p>')
    // }
  }

  function focusOnCCA(cca) {

    $('.instructions').hide();

    var ccaCount = parseFloat(cca.properties.filings);
    var albanyCount = AlbanyPark.filings;

    var comparator = function() {
      if (ccaCount.toFixed(0) === albanyCount.toFixed(0)) {
        return 'about the same as';
      } else if (ccaCount >= albanyCount) {
        return 'greater than';
      } else if (ccaCount < albanyCount) {
        return 'less than';
      }
    };

    $('div.result span.cca-name').text(cca.properties.cca);
    $('div.result span.cca-filings').text(ccaCount.toFixed(2));
    $('div.result span.albany-filings').text(albanyCount.toFixed(2));
    $('div.result span.comparison-word').text(comparator);
    $('div.result span.city-avg').text(mean(auctionValues).toFixed(2));
    $('div.result').show();

    var active = d3.selectAll('.cca')
      .filter(function(d) { return d.id === cca.id; });

    d3.select('.selected').classed('selected', false);
    active.classed('selected', true);

    d3.select('.cca-border').moveToFront();
    active.moveToFront();
  }

});

