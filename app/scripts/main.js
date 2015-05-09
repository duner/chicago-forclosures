'use strict';

$(document).ready(function() {

  var ww = new Wherewolf();
  var autocomplete = new google.maps.places.AutocompleteService();
  $('.autocomplete-boxes').hide();

  var activeBox = null;
  var data = null;
  var cca = null;

  var map = null;
  var svg = null;
  var projection = null;
  var w = null;
  var mapRatio = 0.5;
  var mapScaleFactor = 100;
  var margin = {top: 10, left: 10, bottom: 10, right: 10};
  var path = null;

  d3.select(window).on('resize', _.debounce(resize, 50));

  $.getJSON('data/cca.topojson', function(d) {
    data = d;

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

    cca = topojson.feature(data, data.objects.cca);

    map.selectAll("path")
      .data(cca.features)
    .enter().append("path")
      .attr('class', 'cca')
      .attr('d', path);

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

  $('#geolocate').click(function(e) {
    e.preventDefault();
    setLatLonGeolocation();
  });

  $('.address-search').keydown(function(event) {

    if ($('.address-search').val().length < 2) {
      clearAutocompleteDOM();
    } else {
      if (event.keyCode !== 38 &&
          event.keyCode !== 40 &&
          event.keyCode !== 13) {
        updateAutocompleteData();
        console.log('updat');
      }

      if (event.keyCode === 13) {

        if (activeBox !== null || activeBox !== undefined) {
          var text = $(activeBox).text();
          $('.address-search').val(text);
        }
        $('.get-location').submit();
        clearAutocompleteDOM();
      }

      if (event.keyCode === 40) {
        event.preventDefault();
        if (activeBox === null) {
            activeBox = $('.box-0')[0];
        } else {
            activeBox = $(activeBox).next()[0];
            if (activeBox === undefined) {
              activeBox = $('.box-0')[0];
            }
        }
        updateActiveAutocomplete();
      }

      if (event.keyCode === 38) {
        event.preventDefault();
        if (activeBox === null) {
            activeBox = $('.box-0')[0];
        } else {
            activeBox = $(activeBox).prev()[0];
        }
        if (activeBox === undefined) {
          clearAutocompleteDOM();
          return false;
        }
        updateActiveAutocomplete();
      }
    }
  });

  $('.address-search').change(updateAutocompleteData());



  $('.get-location').submit(function(e) {
    e.preventDefault();
    var data = $('.address-search').val();
    setAddressGeolocation(data);
  });

  function updateAutocompleteData() {
    var data = $('.address-search').val();
    var request = {
      input: data,
    };
    autocomplete.getPlacePredictions(request, updateAutoCompleteDOM);
  }

  $('.address-search').blur(clearAutocompleteDOM);
  $('.autocomplete-boxes').click(function (e) {
      e.stopImmediatePropagation();
  });
  function clearAutocompleteDOM() {
    $('div.autocomplete-boxes').hide();
    $('div.autocomplete-boxes').empty();
  }


  function updateActiveAutocomplete() {

    var $boxes = $('.box');
    for (var i = 0; i < $boxes.length; i++) {
      var c = 'box-' + i;
      var $b = $boxes[i];
      $($b).removeClass('active');

      if ($b.classList.contains(c) && activeBox.classList.contains(c)) {
        $($b).addClass('active');
      }
    }
  }


  function updateAutoCompleteDOM(d) {
    $('div.autocomplete-boxes').show();
    $('div.autocomplete-boxes').empty();

    for (var i = 0; i <= d.length - 1; i++) {
      var dom = '<div class="box box-' + i +'"><i class="fa fa-map-marker"></i><span class="place">' + d[i].description + '</span></div>';
      $('div.autocomplete-boxes').append(dom);
    }
  }

  function setAddressGeolocation(data) {
    var coords = {};
    processLatLon(data);
  }

  function setLatLonGeolocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var loc = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };

        processLatLon(loc);
      });
    }
  }

  function processLatLon(coords) {
    console.log(coords);
  }

});

