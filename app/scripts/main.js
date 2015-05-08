'use strict';

$(document).ready(function() {

  var ww = new Wherewolf();
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

});

