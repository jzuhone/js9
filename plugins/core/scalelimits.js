/*
 * scale clipping limits plugin (August 17, 2018)
 */

/*jslint bitwise: true, plusplus: true, sloppy: true, vars: true, white: true, browser: true, devel: true, continue: true, unparam: true, regexp: true */
/*global $, JS9, sprintf */

// create our namespace, and specify some meta-information and params
JS9.ScaleLimits = {};
JS9.ScaleLimits.CLASS = "JS9";      // class of plugins (1st part of div class)
JS9.ScaleLimits.NAME = "Scale";     // name of this plugin (2nd part of div class)
JS9.ScaleLimits.WIDTH = 512;	      // width of light window
JS9.ScaleLimits.HEIGHT = 400;	      // height of light window
JS9.ScaleLimits.WIDTHOFFSET = 40;   // width offset where plot canvas starts
JS9.ScaleLimits.HEIGHTOFFSET = 210; // height offset where plot canvas starts
JS9.ScaleLimits.BASE = JS9.ScaleLimits.CLASS + JS9.ScaleLimits.NAME;
// default scaling
JS9.ScaleLimits.XSCALE="linear";
JS9.ScaleLimits.YSCALE="log";
// number of points in the distribution
JS9.ScaleLimits.NDIST=512;
// timeout hack for cleaning up flot
JS9.ScaleLimits.TIMEOUT=250;
// size of limits marker for annotation 
JS9.ScaleLimits.CARET=4;
// size of xval text in pixels
JS9.ScaleLimits.XTEXTHEIGHT=14;
// font for xval text without size
JS9.ScaleLimits.XTEXTFONT="Ariel";
// font for xval text without size
JS9.ScaleLimits.XTEXTCOLOR="black";
// display of float data
JS9.ScaleLimits.FLOATFORMAT = "%.6f";
// plot colors
JS9.ScaleLimits.PLOTCOLOR = "#888888";
JS9.ScaleLimits.XLOCOLOR = "#FF0000";
JS9.ScaleLimits.XHICOLOR = "#00FF00";
// ever-present fudge for dealing with mouse positions
JS9.ScaleLimits.FUDGE = 1;
// data options
JS9.ScaleLimits.dataOpts = {
    color: "#888888",
    data:[]
};
// plot options
JS9.ScaleLimits.plotOpts = {
    zoomStack: {
	enabled: false
    },
    selection: {
	mode: "x"
    },
    series: {
	clickable: true,
	hoverable: true,
	bars:  {show: true, align: "left", barWidth: 1}
    },
    grid: {
	hoverable: true
    }
};

JS9.ScaleLimits.scalelimsHTML="<div class='JS9ScaleLinegroup'>$header</div><div class='JS9ScaleLinegroup'>$scales&nbsp;&nbsp;$limits&nbsp;&nbsp;$axes</div><p><div class='JS9ScaleLinegroup'>$plot</div><p><div class='JS9ScaleLinegroup'><span class='JS9ScaleSpan' style='float: left'>&nbsp;&nbsp;$lo&nbsp;&nbsp;&nbsp;&nbsp;$hi</span></div>";

JS9.ScaleLimits.headerHTML='Set clipping limits via the Data Limits menu, or by selecting part of the Pixel Distribution plot, or by changing the Low and/or High Limit.';

JS9.ScaleLimits.scalesHTML='<select class="JS9ScaleSelect" onchange="JS9.ScaleLimits.xsetscale(\'%s\', \'%s\', this)">%s</select>';

JS9.ScaleLimits.limitsHTML='<select class="JS9ScaleSelect" onchange="JS9.ScaleLimits.xsetlims(\'%s\', \'%s\', this)"><option selected disabled>Data Limits</option><option value="dataminmax">data min/max</option><option value="zscale_z1_z2">zscale z1/z2</option><option value="zscale_z1_datamax">zscale z1/max</option></select>';

JS9.ScaleLimits.axesHTML='<select class="JS9ScaleSelect" onchange="JS9.ScaleLimits.xaxes(\'%s\', \'%s\', this)"><option selected disabled>Plot Axes</option><option disabled>x axis:</option><option value="xlinear">linear</option><option value="xlog">log</option><option disabled>y axis:</option><option value="ylinear">linear</option><option value="ylog">log</option></select>';

JS9.ScaleLimits.plotHTML='<div><center>Pixel Distribution</center></div><div class="JS9ScalePlot" style="width:%spx;height:%spx"></div>';

JS9.ScaleLimits.loHTML='Low Limit:&nbsp;&nbsp;<input type="text" class="JS9ScaleValue" value="%s" onchange="JS9.ScaleLimits.xsetlo(\'%s\', \'%s\', this)" size="20">';

JS9.ScaleLimits.hiHTML='High Limit:&nbsp;&nbsp;<input type="text" class="JS9ScaleValue" value="%s" onchange="JS9.ScaleLimits.xsethi(\'%s\', \'%s\', this)" size="20">';

// change scale
JS9.ScaleLimits.xsetscale = function(did, id, target){
    var im = JS9.lookupImage(id, did);
    if( im ){
	im.setScale(target.value);
    }
};

// change low clipping limit
JS9.ScaleLimits.xsetlo = function(did, id, target){
    var val;
    var im = JS9.lookupImage(id, did);
    if( im ){
	val = parseFloat(target.value);
	im.setScale(val, im.params.scalemax);
    }
};

// change high clipping limit
JS9.ScaleLimits.xsethi = function(did, id, target){
    var val;
    var im = JS9.lookupImage(id, did);
    if( im ){
	val = parseFloat(target.value);
	im.setScale(im.params.scalemin, val);
    }
};

// other ways to determine limits
JS9.ScaleLimits.xsetlims = function(did, id, target){
    var im = JS9.lookupImage(id, did);
    if( im ){
	switch(target.value){
	case "dataminmax":
	    im.setScale("dataminmax", im.raw.dmin, im.raw.dmax);
	    break;
	case "zscale_z1_z2":
	    im.setScale("zscale", im.params.z1, im.params.z2);
	    break;
	case "zscale_z1_datamax":
	    im.setScale("zmax", im.params.z1, im.raw.dmax);
	    break;
	default:
	    break;
	}
    }
};

// log scaling
JS9.ScaleLimits.logfunc = function(v){
    return v === 0 ? v : Math.log(v);
};

// inverse of log scaling
JS9.ScaleLimits.expfunc = function(v){
    return v === 0 ? v : Math.exp(v);
};

// other ways to determine limits
JS9.ScaleLimits.xaxes = function(did, id, target){
    var plugin;
    var im = JS9.lookupImage(id, did);
    if( im ){
	// get current plugin instance
	plugin = im.display.pluginInstances[JS9.ScaleLimits.BASE];
	// sanity check
	if( !plugin || !plugin.plot ){
	    return;
	}
	// change the scale for the specified axis
	switch(target.value){
	case "xlinear":
	    plugin.xscale = "linear";
	    JS9.ScaleLimits.doplot.call(plugin, im);
	    break;
	case "xlog":
	    plugin.xscale = "log";
	    JS9.ScaleLimits.doplot.call(plugin, im);
	    break;
	case "ylinear":
	    plugin.yscale = "linear";
	    JS9.ScaleLimits.doplot.call(plugin, im);
	    break;
	case "ylog":
	    plugin.yscale = "log";
	    JS9.ScaleLimits.doplot.call(plugin, im);
	    break;
	default:
	    break;
	}
    }
    // reset top-level
    $(target).val("Plot Axes").prop("selected", true);
};

JS9.ScaleLimits.getPixelDist = function(im, ndist){
    var i, idx;
    var dist = [];
    var drange = im.raw.dmax - im.raw.dmin;
    var imlen = im.raw.width * im.raw.height;
    for(i=0; i<ndist; i++){
        dist[i] = 0;
    }
    for(i=0; i<imlen; i++){
        idx = Math.floor((im.raw.data[i] / drange) * ndist + 0.5);
        if( idx >= 0 && idx < ndist ){
            dist[idx] += 1;
        }
    }
    return dist;
};

JS9.ScaleLimits.doplot = function(im){
    var that = this;
    var i, j, s, el, xmin, xmax;
    var distmin, distmax, ntick, tickinc;
    var dist, drange = im.raw.dmax - im.raw.dmin;
    var pobj =  $.extend(true, {}, JS9.ScaleLimits.dataOpts);
    var popts = $.extend(true, {}, JS9.ScaleLimits.plotOpts);
    var gettickinc = function(drange){
	var tickinc;
	if( drange < 10 ){
            tickinc = 1;
	} else if( drange < 50 ){
            tickinc = 5;
	} else if( drange < 100 ){
            tickinc = 10;
	} else if( drange < 500 ){
            tickinc = 50;
	} else if( drange < 1000 ){
            tickinc = 100;
	} else if( drange < 5000 ){
            tickinc = 500;
	} else if( drange < 10000 ){
            tickinc = 1000;
	} else if( drange < 50000 ){
            tickinc = 5000;
	} else if( drange < 100000 ){
            tickinc = 10000;
	} else if( drange < 500000 ){
            tickinc = 50000;
	} else if( drange < 1000000 ){
            tickinc = 100000;
	} else if( drange < 5000000 ){
            tickinc = 500000;
	} else if( drange < 10000000 ){
            tickinc = 1000000;
	} else {
            tickinc = 10000000;
	}
	return tickinc;
    };
    var annotate = function(plot, x, color){
	var ctx = plot.getCanvas().getContext("2d");
	var size = JS9.ScaleLimits.CARET;
	var o = plot.pointOffset({x: x, y: 0});
	ctx.beginPath();
	ctx.moveTo(o.left, o.top);
	ctx.lineTo(o.left - size, o.top - (size*2));
	ctx.lineTo(o.left + size, o.top - (size*2));
	ctx.lineTo(o.left, o.top);
	ctx.fillStyle = color;
	ctx.fill();
    };
    // plot options
    if( this.plotColor ){
	pobj.color = this.plotColor;
    }
    // pixel distribution
    dist = JS9.ScaleLimits.getPixelDist(im, this.ndist);
    // convert to flot data
    for(i=0; i<this.ndist; i++){
        pobj.data[i] = [i, dist[i]];
    }      
    // xaxis
    popts.xaxis = popts.xaxis || {};
    if( this.xscale === "linear"  ){
	popts.xaxis.transform = null;
	popts.xaxis.inverseTransform = null;
	popts.xaxis.ticks = [];
	tickinc = gettickinc(drange);
	ntick = Math.floor(drange/tickinc + 0.5) + 1;
	for(i=0; i<ntick; i++){
            j = i * tickinc;
	    s = String(j);
            popts.xaxis.ticks[i] = [j * (this.ndist/drange), s];
	}
    } else if( this.xscale === "log"  ){
	popts.xaxis.transform = JS9.ScaleLimits.logfunc;
	popts.xaxis.inverseTransform = JS9.ScaleLimits.expfunc;
	popts.xaxis.ticks = [];
	tickinc = gettickinc(drange);
	ntick = Math.log10(Math.floor(drange/tickinc + 0.5)) + 3;
	for(i=0; i<ntick; i++){
            j = i * tickinc;
	    s = j.toExponential(0).replace("e", "E").replace("+", "");
            popts.xaxis.ticks[i] = [j * (this.ndist/drange), s];
	}
    }
    // plot location of current scaling min and max for annotations
    xmin = im.params.scalemin * this.ndist / drange;
    xmax = im.params.scalemax * this.ndist / drange;
    // y axis
    popts.yaxis = popts.yaxis || {};
    if( this.yscale === "linear"  ){
	popts.yaxis.transform = null;
	popts.yaxis.inverseTransform = null;
	popts.yaxis.ticks = null;
    } else if( this.yscale === "log"  ){
	// distribution limits
	for(i=0; i<this.ndist; i++){
            if( distmin === undefined || dist[i] < distmin ){
		distmin = dist[i];
            }
            if( distmax === undefined || dist[i] > distmax ){
		distmax = dist[i];
            }
	}      
	popts.yaxis.transform = JS9.ScaleLimits.logfunc;
	popts.yaxis.inverseTransform = JS9.ScaleLimits.expfunc;
	popts.yaxis.ticks = [];
	ntick = Math.log10(distmax - distmin + 1);
	for(i=0; i<ntick; i++){
            popts.yaxis.ticks[i] = [Math.pow(10, i), "1E"+String(i)];
	}
    }
    el = this.divjq.find(".JS9ScalePlot");
    // this timeout stuff avoids generating plots too quickly in succession
    if( this.timeout ){
	// don't do previous plot
	window.clearTimeout(this.timeout);
	this.timeout = null;
    }
    // select limits
    el.off("plotselected");
    el.on("plotselected", function(event, ranges){
	var start = ranges.xaxis.from - JS9.ScaleLimits.FUDGE;
	var end   = ranges.xaxis.to - JS9.ScaleLimits.FUDGE;
	start = start * drange / that.ndist;
	end   = end   * drange / that.ndist;
	im.setScale("user", start, end);
    });
    el.off("plothover");
    el.on("plothover", function(event, pos) {
	var ctx, text, xval, s, x, y, w, h;
	if( that.plot ){
	    xval = pos.x * drange / that.ndist;
	    s = sprintf(JS9.ScaleLimits.FLOATFORMAT, xval);
	    // display x value in upper right corner of plot
	    ctx = that.plot.getCanvas().getContext("2d");
	    ctx.save();
	    ctx.textBaseline = 'top';
	    ctx.font = JS9.ScaleLimits.XTEXTHEIGHT + "px " +
		       JS9.ScaleLimits.XTEXTFONT;
	    ctx.fillStyle = JS9.ScaleLimits.XTEXTCOLOR || "black";
	    text = ctx.measureText(s);
	    if( !that.xTextWidth ){ that.xTextWidth = 1; }
	    that.xTextWidth = Math.max(text.width, that.xTextWidth);
	    w = that.xTextWidth + 2;
	    h = JS9.ScaleLimits.XTEXTHEIGHT + 2;
	    x = that.plotWidth - Math.floor(w * 1.5);
	    y = Math.floor(1.5 * h);
	    ctx.clearRect(x, y, w, h);
	    ctx.fillText(s, x, y); 
	    ctx.restore();
	}
    });
    this.timeout = window.setTimeout(function(){
	that.plot = $.plot(el, [pobj], popts);
	that.timeout = null;
	annotate(that.plot, xmin, JS9.ScaleLimits.XLOCOLOR);
	annotate(that.plot, xmax, JS9.ScaleLimits.XHICOLOR);
    }, JS9.ScaleLimits.TIMEOUT);
};

// re-init when a different image is displayed
JS9.ScaleLimits.display = function(){
    if( this.lastimage !== this.display.image ){
	JS9.ScaleLimits.init.call(this);
    }
};

// clear when an image closes
JS9.ScaleLimits.close = function(){
    // ensure that plugin display is reset
    JS9.ScaleLimits.init.call(this, {mode: "clear"});
};

// constructor: add HTML elements to the plugin
JS9.ScaleLimits.init = function(opts){
    var s, im, mopts, imid, dispid;
    var getScales = function(){
	var i;
	var res = "<option selected disabled>Scales</option>";
	for(i=0; i<JS9.scales.length; i++){
	    res += "<option>" + JS9.scales[i] + "</option>";
	}
	return res;
    };
    // on entry, these elements have already been defined:
    // this.div:      the DOM element representing the div for this plugin
    // this.divjq:    the jquery object representing the div for this plugin
    // this.id:       the id ofthe div (or the plugin name as a default)
    // this.display:  the display object associated with this plugin
    // this.dispMode: display mode (for internal use)
    //
    // opts is optional
    opts = opts || {};
    // set width and height of plugin itself
    this.width = this.divjq.attr("data-width");
    if( !this.width  ){
	this.width  = JS9.ScaleLimits.WIDTH;
    }
    this.divjq.css("width", this.width);
    this.width = parseInt(this.divjq.css("width"), 10);
    this.height = this.divjq.attr("data-height");
    if( !this.height ){
	this.height  = JS9.ScaleLimits.HEIGHT;
    }
    this.divjq.css("height", this.height);
    this.height = parseInt(this.divjq.css("height"), 10);
    // set width and height of plot
    this.plotWidth = this.plotWidth || this.divjq.attr("data-plotWidth");
    if( !this.plotWidth  ){
	this.plotWidth  = this.width - JS9.ScaleLimits.WIDTHOFFSET;
    }
    this.plotHeight = this.plotHeight || this.divjq.attr("data-plotHeight");
    if( !this.plotHeight  ){
	this.plotHeight  = this.height - JS9.ScaleLimits.HEIGHTOFFSET;
    }
    // initial scaling
    this.xscale = this.xscale || this.divjq.attr("data-xscale");
    if( !this.xscale ){
	this.xscale  = JS9.ScaleLimits.XSCALE;
    }
    this.yscale = this.yscale || this.divjq.attr("data-yscale");
    if( !this.yscale ){
	this.yscale  = JS9.ScaleLimits.YSCALE;
    }
    // plot color
    this.plotColor = this.plotColor || this.divjq.attr("data-plotColor");
    if( !this.plotColor ){
	this.plotColor  = JS9.ScaleLimits.PLOTCOLOR;
    }
    // set number of distribution points
    this.ndist = this.divjq.attr("data-ndist");
    if( !this.ndist  ){
	this.ndist  = JS9.ScaleLimits.NDIST;
    }
    this.divjq.html("");
    // set up new html
    this.scalelimsContainer = $("<div>")
	.addClass(JS9.ScaleLimits.BASE + "Container")
	.attr("id", this.id + "Container")
        .attr("width", this.width)
        .attr("height", this.height)
	.appendTo(this.divjq);
    // do we have an image?
    im = this.display.image;
    if( im && (opts.mode !== "clear") ){
	// convenience variables
	imid = im.id;
	dispid = im.display.id;
	mopts = [];
	mopts.push({name: "header",
		    value: JS9.ScaleLimits.headerHTML});
	mopts.push({name: "scales",
		    value: sprintf(JS9.ScaleLimits.scalesHTML,
				   dispid, imid, getScales())});
	mopts.push({name: "limits",
		    value: sprintf(JS9.ScaleLimits.limitsHTML,
				   dispid, imid)});
	mopts.push({name: "axes",
		    value: sprintf(JS9.ScaleLimits.axesHTML,
				   dispid, imid)});
	mopts.push({name: "plot",
		    value: sprintf(JS9.ScaleLimits.plotHTML,
				   this.plotWidth, this.plotHeight)});
	mopts.push({name: "lo",
		    value: sprintf(JS9.ScaleLimits.loHTML,
				   im.params.scalemin,
				   dispid, imid)});
	mopts.push({name: "hi",
		    value: sprintf(JS9.ScaleLimits.hiHTML,
				   im.params.scalemax,
				   dispid, imid)});
	s = im.expandMacro(JS9.ScaleLimits.scalelimsHTML, mopts);
	this.lastimage = im;
    } else {
	s = "<p><center>Scale parameters will appear here.</center>";
    }
    this.scalelimsContainer.html(s);
    // set up initial plot, if possible
    if( im ){
	JS9.ScaleLimits.doplot.call(this, im);
    }
};

// add this plugin into JS9
JS9.RegisterPlugin(JS9.ScaleLimits.CLASS, JS9.ScaleLimits.NAME,
		   JS9.ScaleLimits.init,
		   {menu: "scale",
		    menuItem: "Clipping Options ...",
		    onplugindisplay: JS9.ScaleLimits.init,
		    onsetscale: JS9.ScaleLimits.init,
		    onimagedisplay: JS9.ScaleLimits.display,
		    onimageclose: JS9.ScaleLimits.close,
		    help: "help/scalelimits.html",
		    winTitle: "Scale Clipping Limits",
		    winDims: [JS9.ScaleLimits.WIDTH, JS9.ScaleLimits.HEIGHT]});