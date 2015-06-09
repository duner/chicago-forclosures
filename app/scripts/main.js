var ww = new Wherewolf();
var wwPuma = new Wherewolf();

var autocomplete = null;

var data = null;
var pumaData = null
var pumaSeries = [];
var puma = null;
var cca = null;

var map = null;
var svg = null;
var projection = null;
var w = null;
var flashTimeout = null;
var flashPaused = null;
var mapRatio = 0.5;
var mapScaleFactor = 100;
var margin = {top: 0, left: 0, bottom: 0, right: 0};
var path = null;
var quantize = null;
var filingValues = null;
var auctionValues = null;

var chart = null;
var svgChart = null;
var x = null
var y = null;
var xAxis = null;
var yAxis = null;
var line = null;
var chartWidth = null;
var chartHeight = 300;

var pymChild = null;

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

  pymChild = pym.Child({'id': 'pym-container'});

  $('.autocomplete-boxes').hide();
  d3.select(window).on('resize', _.debounce(resize, 30));

  $.getJSON('data/cca.topojson', function(d) {
    $.getJSON('data/pumas_final.geojson', function(p) {
      data = d;
      pumaData = p;

      cca = topojson.feature(data, data.objects.cca);
      var _features = _.pluck(cca.features, 'properties');
      filingValues = _.map(_features, function(d) { return d.filings; });
      auctionValues = _.map(_features, function(d) { return d.auctions; });

      processPumaData(pumaData);

      ww.addAll(data);
      ww.addAll(pumaData);
      drawMap(data);
      drawChart();
    });
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

    var min = d3.min(filingValues);
    var max = d3.max(filingValues);

    quantize = d3.scale.quantize()
        .domain([min,max])
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
        $('.get-location').submit();
      })
      .on('mouseover', function(d) {
        $('#autocomplete').val('');
        if (flashTimeout) {
          clearTimeout(flashTimeout);
        }
        var coords = getCenterOfFeature(d);
        processLatLon(coords);
      })
      .on('mouseout', function(d) {
        removeFlashClass();
      });

    map.append('path')
      .datum(topojson.feature(data, data.objects.cca, function(a, b) { return a !== b; }))
      .attr('class', 'cca-border')
      .attr('d', path);

    $('.loading').removeClass('loading');
    pymChild.sendHeight();

  }

  function drawChart() {
    chartHeight = $('.chart').height() - margin.top - margin.bottom;
    chartWidth = $('.chart').width() - margin.left - margin.right;

    x = d3.time.scale()
      .range([0, chartWidth]);

    y = d3.scale.linear()
      .rangeRound([chartHeight, 0]);

    xAxis = d3.svg.axis()
      .scale(x)
      // .tickFormat(smallDate)
      .orient("bottom");

    yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

    line = d3.svg.line()
      .interpolate('bundle')
      .x(function(d) { return x(d[0]); })
      .y(function(d) { return y(d[1]); })
      .defined(function(d) { return !isNaN(d[1]); });

    x.domain([d3.min(_.map(pumaSeries, _.first)), d3.max(_.map(pumaSeries, _.first))]);
    y.domain([d3.min(_.map(pumaSeries, _.last)), d3.max(_.map(pumaSeries, _.last))]);

    svgChart = d3.select(".chart").append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight);

    chart = svgChart.append('g')
      .attr('class','price-index');

    svgChart.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + chartHeight + ")")
      .call(xAxis);

    svgChart.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Chance of Victory");
  }

  function updatePumaChart(d) {}

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

    moveMap();
    pymChild.sendHeight();
  }

  function moveMap() {
    if ($(window).width() < 650 ) {
      var cityTextHeight = $('.citywide').height() + 25;
      $('#map').css({'margin-top': -cityTextHeight + 'px' });
    } else {
      $('#map').css({'margin-top': 0 + 'px' });
    }
  }

  autocomplete = new google.maps.places.Autocomplete(
      (document.getElementById('autocomplete')),
      { types: ['geocode'] });

  google.maps.event.addListener(autocomplete, 'place_changed', function() {
    $('.get-location').submit();
  });

  $('#geolocate').click(function(e) {
    e.preventDefault();
    $('#geolocate').addClass('loading');
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

        $('#geolocate').removeClass("loading");

        processLatLon(loc);
      });
    }
  }

  function processLatLon(coords) {
    console.log(coords);
    var result = ww.find([coords.longitude, coords.latitude], { wholeFeature: true });
    console.log(result);
    var cca = result.cca;

    if (cca === null) {
      processNotFound(coords);
      return false;
    }

    if (coords.geolocated) {
      $('#autocomplete').val(cca.properties.cca);
    }

    focusOnCCA(cca, puma);
  }

  function processNotFound(coords) {
    if (coords.geolocated) {
      $('div.error').html('<p class="error">Sorry, we were unable to locate you within the City of Chicago. Try searching for an address instead.</p>')
    } else {
      $('div.error').html('<p class="error">Sorry, that location is not within the City of Chicago. Try a different address instead.</p>')
    }

    $('.instructions').hide();
    $('div.error').show();
    $('div.result').hide();
  }

  function focusOnCCA(cca, puma) {

    updatePumaChart(puma);

    $('.instructions').hide();
    $('.error').hide();
    $('.result').show();

    var filingsCount = parseFloat(cca.properties.filings);
    var auctionsCount = parseFloat(cca.properties.auctions);

    $('div.result span.cca-name').text(cca.properties.cca);
    $('div.result span.cca-filings').text(filingsCount.toFixed(2));
    $('div.result span.cca-auctions').text(auctionsCount.toFixed(2));
    $('div.result span.city-avg').text(mean(filingValues).toFixed(2));
    $('div.result span.city-avg-auction').text(mean(auctionValues).toFixed(2));
    $('div.result').show();


    $('div.result p.info span').addClass('flash');
    flashTimeout = setTimeout(removeFlashClass, 300);

    moveMap();

    var active = d3.selectAll('.cca')
      .filter(function(d) { return d.id === cca.id; });

    d3.select('.selected').classed('selected', false);
    active.classed('selected', true);

    d3.select('.cca-border').moveToFront();
    active.moveToFront();
  }

  function removeFlashClass() {
    $('div.result p.info span').removeClass('flash');
  }

  function processPumaData(d) {
    for (var i = 0; i < d.objects.pumas.geometries.length; i++) {
      var feature = d.objects.pumas.geometries[i];
      var dataString = feature.properties.data;
      var splitByYear;

      if (dataString !== undefined) {
        splitByYear = dataString.split('\t');
        for (var j = 0; j < splitByYear.length; j++) {
          splitByYear[j] = splitByYear[j].split(' ');
          splitByYear[j][0] = new Date(splitByYear[j][0]);
          perChange = percentChangeSince2005(parseFloat(splitByYear[0][0]), parseFloat(splitByYear[j][1]));
          splitByYear[j][1] = perChange;

          pumaData.objects.pumas.geometries[i].properties.data = splitByYear;
          pumaSeries.push([splitByYear[j][0], splitByYear[j][1]]);
        }
      } else {
        splitByYear = undefined;
      }
    }
  }

  function percentChangeSince2005(o,c) {
    return (c - o) / o
  }


  function getCenterOfFeature(d) {
    var bounds = d3.geo.bounds(d);
    var coords = {
      longitude: (bounds[0][0] + bounds[1][0]) / 2,
      latitude: (bounds[0][1] + bounds[1][1]) / 2,
      geolocated: false
    };

    if (d.id === "GARFIELD RIDGE") {
      coords = {
        longitude: -87.754367,
        latitude: 41.796959,
        geolocated: false
      };
    }
    return coords;
  }

});

