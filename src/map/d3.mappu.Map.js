﻿d3.mappu = d3.mappu || {};
/*
 * d3.mappu.Map is the central class of the API - it is used to create a map.
 */
 
/* d3.mappu.Map(element, config)

element = dom object
options: 
center: [long,lat]                  default = [0,0]
zoom: zoomlevel                     default = 0.0
layers: [layer]                     default = null
minZoom: zoomlevel                  default = 0.0
maxZoom: zoomlevel                  default = 13.0
maxView: [[long,lat],[long,lat]]    default = [[-180,90],[180,-90]]
projection: projection              default = d3.geo.mercator()
*/


d3.mappu.Map = function(id, config) {
    return d3_mappu_Map(id, config);
};

d3_mappu_Map = function(id, config) {
    
    var map = {};
	var _layers = [];
	var _mapdiv;
	//check if elem is a dom-element or an identifier
	if (typeof(id) == 'object'){
	    _mapdiv = id;
	}
	else {
	    _mapdiv = document.getElementById(id);
	}
	
	//TODO: how to get the size of the map
	var _width = _mapdiv.clientWidth || 1024;
	var _height = _mapdiv.clientHeight || 768;
	
	//TODO: check if SVG?
	var _svg = d3.select(_mapdiv).append('svg')
		.attr("width", _width)
		.attr("height", _height);

	//TODO parse config;
	var _center = config.center || [0,0];
	var _projection = config.projection || d3.geo.mercator();
	var _zoom = config.zoom || 10;
	var _maxZoom = config.maxZoom || 24;
	var _minZoom = config.minZoom || 15;
	var _maxView = config.maxView || [[-180,90],[180,-90]];
	
	var draw = function(){
	    //Calculate tile set
        _tiles = _tile.scale(_zoombehaviour.scale())
          .translate(_zoombehaviour.translate())();
        //Calculate projection
        _projection
              .scale(_zoombehaviour.scale() / 2 / Math.PI)
              .translate(_zoombehaviour.translate());
        //Refresh layers
        _layers.forEach(function(d){
                d.refresh();
        });
    };
	
	_projection.scale(( _zoom << 12 || 1 << 12) / 2 / Math.PI)
        .translate([_width / 2, _height / 2]);
	
    var _projcenter = _projection(_center);     
    
    //TODO: reset this on projection change
    var _path = d3.geo.path()
        .projection(_projection);    
        
	var _zoombehaviour = d3.behavior.zoom()
        .scale(_projection.scale() * 2 * Math.PI)
        .scaleExtent([1 << _minZoom, 1 << _maxZoom])
        .translate([_width - _projcenter[0], _height - _projcenter[1]])
        .on("zoom", draw);
	_svg.call(_zoombehaviour);
	
	
    _projection
        .scale(1 / 2 / Math.PI)
        .translate([0, 0])
        .rotate([0, 0])
        .clipExtent([[0,0], [width, height]]);
    
    var _tile = d3.geo.tile()
        .size([_width,_height]);

    var _tiles = _tile.scale(_zoombehaviour.scale())
          .translate(_zoombehaviour.translate())();
    
   
// exposed functions

////getter/setter functions
	 Object.defineProperty(map, 'svg', {
        get: function() {
            return _svg;
        },
        set: function() {
            console.log("do not touch the svg");
        }
    });
    
    Object.defineProperty(map, 'size', {
            get: function(){return [_height, _width];},
            set: function(val){
                _height = val[0];
                _width = val[1];
                _tile = d3.geo.tile()
                    .size([_width,_height]);
                d3.select(_mapdiv).select('svg')
                    .attr("width", _width)
                    .attr("height", _height);
                map.draw();
            }
    });
     
    Object.defineProperty(map, 'mapdiv', {
        get: function() {
            return _mapdiv;
        },
        set: function() {
            console.log("do not touch the mapdiv");
        }
    }); 
     
// .zoom : (zoomlevel)
    Object.defineProperty(map, 'zoom', {
        get: function() {
            return _zoom;
        },
        set: function(val) {
            _zoom = val;
        }
    });

// .minZoom : (zoomlevel)
    Object.defineProperty(map, 'minZoom', {
        get: function() {
            return _minZoom;
        },
        set: function(val) {
            _minZoom = val;
        }
    });
// .maxZoom : (zoomlevel)
    Object.defineProperty(map, 'maxZoom', {
        get: function() {
            return _maxZoom;
        },
        set: function(val) {
            _maxZoom = val;
        }
    });
// .maxView : ([[long,lat],[long,lat]])
    Object.defineProperty(map, 'maxView', {
        get: function() {
            return _maxView;
        },
        set: function(val) {
            _maxView = val;
        }
    });
// .center : ([long,lat])
    Object.defineProperty(map, 'center', {
        get: function() {
            return _center;
        },
        set: function(val) {
            _center = val;
        }
    });
// .projection : ({projection})
    Object.defineProperty(map, 'projection', {
        get: function() {
            return _projection;
        },
        set: function(obj) {
          _projection = obj;
          _path = d3.geo.path()
            .projection(_projection);
          //TODO: redraw
        }
    });
    
    Object.defineProperty(map, 'path', {
            get: function(){return _path;},
            set: function(){console.warn('No setting allowed for path');}
    });
    
    Object.defineProperty(map, 'tiles', {
            get: function(){return _tiles;},
            set: function(){console.warn('No setting allowed for tile');}
    });
    
    Object.defineProperty(map, 'zoombehaviour', {
            get: function(){return _zoombehaviour;},
            set: function(){console.warn('No setting allowed for zoombehaviour');}
    });
    
    Object.defineProperty(map, 'layers', {
            get: function(){return _layers;},
            set: function(){console.warn('No setting allowed for layers');}
    });
    
	
////singular functions

    var addLayer = function(layer){
        if (!layer.id){
            console.warn('Not a valid layer. (No ID)');
            return false;
        }
        //Replace existing ID
        _layers.forEach(function(d){
            if (d.id == layer.id){
                d = layer; //TODO: can you replace an array item like this?
                return map;
            }
        });
        _layers.push(layer);
        layer._onAdd(map);
        return map;
    };
    var removeLayer = function(id){
        _layers.forEach(function(d,i){
            if (d.id == id){
                // ?? d.onRemove(self);
                _layers.splice(i,1);
                return map;
            }
        });
        return map;
    };   

// .removeLayers([{layer}])

// .refresh()
    
    
    map.addLayer = addLayer;
    map.removeLayer = removeLayer;
    map.draw = draw;
    
    return map;
};

//                                                                          マップ
