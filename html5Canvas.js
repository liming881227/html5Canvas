/**
 * @author liming
 * html5 canvas
 *
 */

(function(context) {
  "use strict";

  if(typeof module === 'object' && module.exports) {
    module.exports = Drawer;
  } else if(typeof define === 'function' && define.amd) {
    define(function() {
      return Drawer;
    });
  } else if(typeof context === 'object') {
    context.Drawer = Drawer;
  }

  function _getAbsolutePosition(el) {
    var x = el.offsetLeft;
    var y = el.offsetTop;
    var offsetParent = el.offsetParent;
    while((el = el.parentNode) && el.scrollLeft !== undefined) {
      x -= el.scrollLeft;
      y -= el.scrollTop;
      if (el === offsetParent)
      {
        x += el.offsetLeft;
        y += el.offsetTop;
        offsetParent = el.offsetParent;
      }
    }
    return {
      "x": x,
      "y": y
    };
  };

  function Drawer(canvasId,options) {
    this.isDrawing = false;
    this.hasDrawing = false;
    options = options || [];
    this.options = options;
    this.init(canvasId);
    this.bindEvents();
  }


  Drawer.prototype.bindEvents = function() {
    var _self = this;
    this.canvas.addEventListener('touchstart', this.drawstart.bind(_self), false);
    this.canvas.addEventListener('mousedown',  this.drawstart.bind(_self), false);
    this.canvas.addEventListener('touchmove',  this.drawmove.bind(_self), false);
    this.canvas.addEventListener('mousemove',  this.drawmove.bind(_self), false);
    this.canvas.addEventListener('touchend',   this.drawend.bind(_self), false);
    this.canvas.addEventListener('mouseup',    this.drawend.bind(_self), false);
  };


  Drawer.prototype.init = function(canvasId) {
    var canvas;
    canvas = document.getElementById(canvasId);
    this.canvas = canvas;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    this.that = this;
    this.context = canvas.getContext('2d');
    this.preDrawArr = [];
    this.nextDrawArr = [];
    this.middleDrawArr = [];

    this.fillStyle = this.options.fillStyle || 'rgba(0, 0, 0, 0.26)';

    var auto = true,
        devicePixelRatio = window.devicePixelRatio || 1,
        backingStoreRatio = this.context.webkitBackingStorePixelRatio ||
            this.context.mozBackingStorePixelRatio ||
            this.context.msBackingStorePixelRatio ||
            this.context.oBackingStorePixelRatio ||
            this.context.backingStorePixelRatio || 1,
        ratio = devicePixelRatio / backingStoreRatio;

    // upscale the canvas if the two ratios don't match
    if (devicePixelRatio !== backingStoreRatio) {
      var oldWidth = canvas.width;
      var oldHeight = canvas.height;
      canvas.width = oldWidth * ratio;
      canvas.height = oldHeight * ratio;
      canvas.style.width = oldWidth + 'px';
      canvas.style.height = oldHeight + 'px';
      this.context.scale(ratio, ratio);
    }

    var _drawContext = this.context;
    // var image = new Image();
    // image.src = "img/test.png";
    // image.onload = function () {
    //    _drawContext.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
    // };
    console.log(this.fillStyle);
    this.context.fillStyle = this.fillStyle;
    this.context.fillRect (0, 0, canvas.width, canvas.height);
    var preData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    //空绘图表面进栈
    this.middleDrawArr.push(preData);
  };


  Drawer.prototype.getCoors = function(event) {
    event.preventDefault();
    var coors,offset;
    try{
      offset = _getAbsolutePosition(this.canvas);
      coors = {
        x: event.touches ? (event.touches[0].pageX - offset.x) : ( event.pageX - offset.x ),
        y: event.touches ? (event.touches[0].pageY - offset.y) : ( event.pageY - offset.y )
      };
    } catch(e) {
      console.log(e);
    }
    return coors;
  };

  Drawer.prototype.drawstart = function(event) {
    var coors = this.getCoors(event),
        _self = this,
        preData;
    _self.context.lineWidth = 4;
    _self.context.beginPath();
    _self.context.moveTo(coors.x, coors.y);
    preData = _self.context.getImageData(0, 0, _self.canvas.width, _self.canvas.height);
    _self.preDrawArr.push(preData);
    _self.isDrawing = true;
  };

  Drawer.prototype.drawmove = function(event) {
    var _self = this;
    var coors = _self.getCoors(event);
    if (_self.isDrawing) {
      _self.context.lineTo(coors.x, coors.y);
      _self.context.stroke();
    }
  };

  Drawer.prototype.drawend = function(event) {
    var _self = this,
        coors = _self.getCoors(event),
        preData;
    if (_self.isDrawing) {
      _self.isDrawing = false;
    }

    preData = _self.context.getImageData(0, 0, _self.canvas.width, _self.canvas.height);
    if(_self.nextDrawArr.length == 0) {
      _self.middleDrawArr.push(preData);
    } else {
      _self.middleDrawArr = [];
      _self.middleDrawArr = _self.middleDrawArr.concat(_self.preDrawArr);
      _self.middleDrawArr.push(preData);
      _self.nextDrawArr = [];
    }
  };

  /**
   * reset prev precess
   */
  Drawer.prototype.cleanLastStep = function() {
    var popData, midData;
    var _self = this;
    if (_self.preDrawArr.length > 0) {
      popData = _self.preDrawArr.pop();
      midData = _self.middleDrawArr[_self.preDrawArr.length + 1];
      _self.nextDrawArr.push(midData);
      _self.context.putImageData(popData, 0, 0);
    }
  };

  /**
   * reset next precess
   * @returns {boolean}
   */
  Drawer.prototype.resetNextStep = function() {
    var popData, midData;
    var _self = this;
    if (_self.nextDrawArr.length) {
      popData = _self.nextDrawArr.pop();
      if(!popData) return false;
      midData = _self.middleDrawArr[_self.middleDrawArr.length - _self.nextDrawArr.length - 2];
      _self.preDrawArr.push(midData);
      _self.context.putImageData(popData, 0, 0);
    }
  };

  /**
   * clean all map
   */
  Drawer.prototype.cleanAll = function() {
    var _self = this;
    _self.context.fillStyle = _self.fillStyle;
    _self.context.fillRect (0, 0, _self.canvas.width, _self.canvas.height);
    _self.hasDrawing = false;
    var popData, midData;
    if (_self.preDrawArr.length > 0) {
      popData = _self.preDrawArr.pop();
      midData = _self.middleDrawArr[_self.preDrawArr.length + 1];
      _self.nextDrawArr.push(midData);
    }
  };

})(this.window);