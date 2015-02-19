
var JointPoint = function(point, options) {
	var self = this;

	self.moveRestriction = options['moveRestriction'];

	var _radius = options['radius'] || 9;
	var strokeWidth = options['strokeWidth'] || 1;
	var overlay = options['overlay'];
	var fillColor = options['fillColor'] || '#12335E';
	var strokeColor = options['strokeColor'] || '#0E812E'

	var _circle = new Path.Circle({
		center: point,
		radius: _radius,
		fillColor: fillColor,
		strokeColor: strokeColor,
		strokeWidth: strokeWidth
	});

	if (overlay != undefined) {
		self.overlay = new Raster(overlay);
		self.overlay.position = point;
		self.overlay.scale(0.18);
		self.overlay.rotate(270);	
	}

	var _upScaling = 1.6;
	var _downScaling = 1 / _upScaling;

	var _isDragging = false;
	var _currentScale = -1;
	var _currentRotation = -90;

	var _center = point;
	var _onMoveCbk = [];
	var _onMouseUpCbk = [];

	var _text = new PointText(point);
		
	_text.fillColor = 'white';
	_text.style = {
		font: 'sans-serif',
		fontWeight: 'normal',
		fontSize: 12,
	};	

	_text.bringToFront();

	function centerLabel() {
		var textBounds = _text.bounds;
		_text.position = _circle.position.add(0, 1);

		if (self.overlay) {
			self.overlay.position = _circle.position;
		}
	}

	this.remove = function () {
		_circle.remove();
		_text.remove();
	}

	this.label = function (value) {
		_text.content = value;
		centerLabel();

		return this;
	}

	this.setFinalDestinationPoint = function (point) {
		self.finalDestinationPoint = point;
		return this;
	}

	this.getFinalDestinationPoint = function () {
		return self.finalDestinationPoint;
	}

	this.onMove = function (cbk) {
		_onMoveCbk.push(cbk);
	}

	this.onMouseUp = function (cbk) {
		_onMouseUpCbk.push(cbk);
	}

	this.point = function() {
		return _circle.position;
	}

	this.radius = function () {		
		return _radius;
	}

	this.opacity = function (value) {
		_circle.opacity = value;
	}

	this.setMoved = function (event) {
		_circle.onMouseDrag(event);
	}

	this.setPoint = function (point) {
		_circle.position = point;
		centerLabel();

		for (var cbk in _onMoveCbk) {			
			_onMoveCbk[cbk](_circle.position);
		}
	}

	this.setAngle = function (angle) {		
		if (angle == _currentRotation)
			return;

		if (angle == 0)
			angle = -90;

		if (self.overlay) {
			self.overlay.rotate(-_currentRotation);
			self.overlay.rotate(angle);
		}

		_currentRotation = angle;
	}

	_circle.onMouseDrag = function (event) {
		if (self.moveRestriction == undefined || self.moveRestriction(event.point) == false) {
			return;
		}			

		_circle.position = event.point;		
		centerLabel();

		for (var cbk in _onMoveCbk) {			
			_onMoveCbk[cbk](_circle.position);
		}
	}

	_circle.onMouseDown = function (event) {						
		_isDragging = true;				
	}

	_circle.onMouseUp = function (event) {								
		_isDragging = false;	

		for (var cbk in _onMouseUpCbk) {			
			_onMouseUpCbk[cbk](_circle.position);
		}			
	}

	_text.onMouseUp = _circle.onMouseUp;
	_text.onMouseDown = _circle.onMouseDown;
	_text.onMouseDrag = _circle.onMouseDrag;

	if (self.overlay != undefined) {
		self.overlay.onMouseUp = _circle.onMouseUp;
		self.overlay.onMouseDown = _circle.onMouseDown;
		self.overlay.onMouseDrag = _circle.onMouseDrag;
	}
}