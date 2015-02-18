var JointsAngle = function (line1, line2, name) {
	var self = this;

	var pointL11 = line1.from();
	var pointL12 = line1.to();

	var pointL21 = line2.from();
	var pointL22 = line2.to();

	var center = new Point(0, 0);
	var path = new Path([center, center, center]);
	path.sendToBack();

	var defaultRangeFillColor = 'red';
	//path.fillColor = defaultRangeFillColor;
	path.opacity = 0.6;
	path.strokeColor = 'black';	

	var angleText = new Text(center);	
	angleText.curvature = 0.7;	

	this.ranges = undefined;

	this._onAngleChangedCbk = [];
	this._currentAngle = 0;
	this._name = name;

	this.onAngleChanged = function (cbk) {		
		self._onAngleChangedCbk.push(cbk);
		cbk(this._currentAngle, this._name);

		return this;
	}

	this.remove = function () {		
		path.remove();
		angleText.remove();
	}

	function findCommonPoint() {
		var m1 = [pointL11, pointL12];
		var m2 = [pointL21, pointL22];
		
		for (var i = 0; i < 2; i++) {
			for (var j = 0; j < 2; j++) {
				var p1 = m1[i];
				var p2 = m2[j];
		
				if (p1.x == p2.x && p1.y == p2.y) {				
					return p1;
				}
			}
		}	
	}

	function diff(v1, v2) {
		var xDiff = v1.x - v2.x;
		var yDiff = v1.y - v2.y;

		return new Point(xDiff, yDiff);
	}

	function len(v) {
		return Math.sqrt(v.x * v.x + v.y * v.y);
	}

	this.opacity = function (value) {
		path.opacity = value;
		return this;
	}

	this.setRanges = function (ranges) {
		this.ranges = ranges;
		this.drawAngle();
		
		return this;
	}

	this.drawAngle = function () {
		var common = findCommonPoint();

		if (common == undefined)
			return;

		var destination1 = pointL12;
		var destination2 = pointL22;

		if (common.x == pointL12.x && common.y == pointL12.y)
			destination1 = pointL11;

		if (common.x == pointL22.x && common.y == pointL22.y)
			destination2 = pointL22;
		
		var diff = common.subtract(destination1);
		var v1 = diff.divide(2).multiply(-1);//.add(destination1);

		var diff2 = destination2.subtract(common);
		var v2 = diff2.divide(2);//.add(common);

		var cos = (v1.x * v2.x + v1.y * v2.y) / (Math.sqrt(v1.x * v1.x + v1.y * v1.y) * Math.sqrt(v2.x * v2.x + v2.y * v2.y));
		//console.log(Math.acos(cos) * 180 / Math.PI);
		
		path.removeSegments();		

		var y1 = diff.divide(2).add(destination1);
		var y2 = diff2.divide(2).add(common);

		path.add(y1);		
		path.add(common);
		path.add(y2);			
		
		var mid = new Point((y1.x + y2.x) / 2 + 10, (y1.y + y2.y) / 2 + 10);									
		
		var angle = Math.acos(cos) * 180 / Math.PI;
		angleText.setPosition(mid);

		this._currentAngle = angle.toFixed(1);
		angleText.setText(this._currentAngle);

 		// Notify angle changed
		for (var cbk in self._onAngleChangedCbk) {							
			self._onAngleChangedCbk[cbk](this._currentAngle, this._name);
		}

		if (this.ranges != undefined) {
			path.fillColor = defaultRangeFillColor;
			for (var i in this.ranges) {
				var range = this.ranges[i];
				if (angle >= range['range'][0] && angle <= range['range'][1]) {					
					path.fillColor = range['color'];
					break;
				}
			}
		}
	}

	line1.onLineChanged(function(from, to) {
		pointL11 = from;
		pointL12 = to;
		
		self.drawAngle();
	});

	line2.onLineChanged(function(from, to) {
		pointL21 = from;
		pointL22 = to;

		self.drawAngle();
	});

	this.drawAngle();
}