
var JointLine = function (point1, point2, visible, name) {	
	var self = this;

	self.visible = (typeof visible === "undefined") ? true : visible;
	self.name = (typeof name === "undefined") ? undefined : name;
	
	self._onLineChangedCbk = [];

	self._from = point1.point();	
	self._to = point2.point();

	var _path = new Path.Line(self._from, self._to);
	_path.strokeColor = 'black';
	_path.strokeWidth = 0.7;
	_path.sendToBack();

	_path.opacity = this.visible == true ? 1 : 0;
	
	this._onPointsMove = function (evt, ctx) {							
		self._from = (ctx == self._from ? evt : self._from);
		self._to = (ctx == self._to ? evt : self._to);

		_path.removeSegments();
		_path.add(self._from);			
		_path.add(self._to);	
		
		for (var cbk in self._onLineChangedCbk) {			
			self._onLineChangedCbk[cbk](self._from, self._to, self.name);
		}
	}

	this.onLineChanged = function (cbk) {
		self._onLineChangedCbk.push(cbk);
		cbk(self._from, self._to, self.name);
	}

	this.remove = function () {
		_path.remove();
	}

	this.length = function () {		
		return self._from.getDistance(self._to);
	}

	this.opacity = function (value) {
		if (self.visible == false)
			return this;

		_path.opacity = value;
		return this;
	}

	this.horizontalDistance = function () {
		return Math.abs(self._from.x - self._to.x);
	}

	this.verticalDistance = function () {
		return Math.abs(self._from.y - self._to.y);
	}

	self.from = function () {
		return self._from;
	}

	self.to = function () {
		return self._to;
	}

	point1.onMove(function(evt) {		
		self._onPointsMove(evt, self._from);	
	});

	point2.onMove(function(evt) {		
		self._onPointsMove(evt, self._to);
	});
};