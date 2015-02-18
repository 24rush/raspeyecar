var SceneUtils = {
	KnownLines : {
		DISTANCE_REF_LINE : 'distanceRefLine',
		HORIZONTAL_REF_LINE : 'horizontalRefLine',
		VERTICAL_REF_LINE : 'verticalRefLine',
		CUSTOM_TOOL : 'customTool',

		ARM_LINE : 'armLine',
		FOREARM_LINE : 'foreArmLine',
		THIGH_LINE : 'thighLine',
		SHIN_LINE : 'shinLine',
		BACK_LINE : 'backLine',
		HIP_TO_WRIST : 'hipToWrist',
	},

	KnownPoints : {
		SHOULDER : 'shoulder',
		ELBOW : 'elbow',
		WRIST : 'wrist',

		HIP : 'hip',
		KNEE : 'knee',
		ANKLE : 'ankle',

		TIBIA : 'tibia',
		SPINDLE : 'spindle',

		LEN_REF_START : 'lenRefStart',
		LEN_REF_END : 'lenRefEnd',

		VERT_REF_START : 'vertRefStart',
		VERT_REF_END : 'vertRefEnd',

		HORIZ_REF_START : 'horizRefStart',
		HORIZ_REF_END : 'horizRefEnd',

		CUST_TOOL_START : 'customToolStart',
		CUST_TOOL_MIDDLE : 'customToolMid',
		CUST_TOOL_END : 'customToolEnd'
	},

	KnownAngles : {
		ARM_FOREARM : 'armForeArm',
		HIP_KNEE_ANGLE : 'hipKneeAngle',
		KNEE_EXTENSION : 'kneeExtension',
		HIP_OPEN : 'hipOpen',
		ARM_PIT : 'armPit',
		BACK_ANGLE : 'backAngle',

		CUSTOM_ANGLE : 'customAngle'
	}
}

var Scene =  function (paperScope, width, height) {
	var self = this;

	this.tbStartLeft = 35;
	this.tbStartTop = 35;

	this.paddingRight = 14;
	this.textHeight = 6;
	this.rowPadding = 25;

	this.scenePoints = [];
	this.sceneLines = [];
	this.sceneAngles = [];
	this.sceneTexts = [];

	this.lineChangedCbks = [];

	this.view = paper.View._viewsById[paperScope];

	this.animationDuration = 500;
	this.animationStart = undefined;
	this.animationEnded = false;

	var backImgSize = [775, 775];

	this.height = height;
	this.width = width;	

	this.backImgScaling = backImgSize[0] / backImgSize[1];

	this.originalPaddingLeft = 212;
	this.scalingX = this.height * this.backImgScaling / 775;				
	this.scalingY = this.height / 775;

	$('.toolbox').css('left', 25);
	$('.toolbox').css('top', this.tbStartTop);

	this.getLine = function(name) {
		return self.sceneLines[name];
	}

	this.getJointPoint = function (pointName) {		
		return self.scenePoints[pointName];
	}

	this.restartAnimation = function () {
		self.animationStart = undefined;
		self.animationEnded = false;
	}

	this.animateJoints = function (event) {		
		if (this.animationEnded == true) {
			return;
		}			

		if (self.animationStart == undefined) {
			self.animationStart = event.time * 1000;
			return;
		}

		for (var pointName in self.scenePoints) {
			var point = self.scenePoints[pointName];

			if (point.requiresAnimation === false)
				continue;

			var oldPos = self.scenePoints[pointName].getFinalDestinationPoint().clone();
			
			var progress = (event.time * 1000 - self.animationStart) / self.animationDuration;

			if (progress > 1) {
				progress = 1;

				point.requiresAnimation = false;
				this.animationEnded = true
			}

			oldPos.x *= progress;
			oldPos.y *= progress;	

			self.scenePoints[pointName].opacity(progress <= 0.9 ? progress : 0.9);
			self.scenePoints[pointName].setMoved({'point': oldPos});		
		}

		if (this.animationEnded == true) {
			this.drawLines();
		}		
	};

	this.getTextPoint = function (index) {			
		return new Point(this.tbStartLeft + this.paddingRight, this.tbStartTop + index * this.rowPadding);
	}

	this.update = function () {
		for (var pointName in self.scenePoints) {
			self.scenePoints[pointName].setMoved({'point' :self.scenePoints[pointName].point()});
		}
	}

	this.updateRanges = function(ranges) {
		for (var idx in ranges) {
			self.sceneAngles[ranges[idx]['name']].setRanges(ranges[idx]['ranges']);
		}
	}

	this.drawLines = function () {
		this.view._project.activate();

		for (var line in self.sceneLines) {
			self.sceneLines[line].opacity(1);
		}

		for (var angle in self.sceneAngles) {
			self.sceneAngles[angle].opacity(0.6);
		}

		// For posterity - computation of thigh extension
		var hipPoint = self.scenePoints[SceneUtils.KnownPoints.HIP];
		var kneePoint = self.scenePoints[SceneUtils.KnownPoints.KNEE];

		var lineHip = new JointLine(kneePoint, new DependantPoint([hipPoint, kneePoint], function () {				
			return kneePoint.point().subtract(hipPoint.point()).add(kneePoint.point());
		}));		
	}

	this.onLineLengthChanged = function (cbk, lineName) {
		if (self.getLine(lineName) != undefined) {
			self.getLine(lineName).onLineChanged(cbk);
			return;
		}
	}	

	this.applyScaling = function (point) {
		point.x -= this.originalPaddingLeft;
		point.x *= this.scalingX;
		point.x += (this.width - this.height) / 2;

		point.y *= this.scalingY;

		return point;
	}

	this.applyUnscaling = function (point) {
		point.y /= this.scalingY;

		point.x -= (this.width - this.height) / 2;
		point.x /= this.scalingX;
		point.x += this.originalPaddingLeft;

		return point;
	}

	this.unload = function (pointIds, lineIds, angleIds, textIds) {
		this.view._project.activate();

		for (var i = 0; i < pointIds.length; i++) {
			var point = self.scenePoints[pointIds[i]];
			point.remove();

			delete point;
		}

		for (var i = 0; i < lineIds.length; i++) {
			var line = self.sceneLines[lineIds[i]];
			line.remove();
			
			delete line;
		}

		for (var i = 0; i < angleIds.length; i++) {
			var angle = self.sceneAngles[angleIds[i]];
			angle.remove();
			
			delete angle;
		}
	}

	this.load = function (points, lines, angles, texts) {
		var self = this;

		this.view._project.activate();

		for (var i = 0; i < points.length; i++) {
			var point = points[i];
			var pointName = point['name'];

			if (point['scale'] == false) {
				var finalDestinationPoint = new Point(point['x'], point['y']);
				self.scenePoints[pointName] = new JointPoint(finalDestinationPoint).label(point['label']).setFinalDestinationPoint(finalDestinationPoint);
				continue;
			}
			
			var scaledPoint = new Point(point['x'], point['y']);
			this.applyScaling(scaledPoint)	

			self.scenePoints[pointName] = new JointPoint(scaledPoint).label(point['label']).setFinalDestinationPoint(scaledPoint);	
		}

		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			self.sceneLines[line['name']] = new JointLine(this.getJointPoint(line['points'][0]), this.getJointPoint(line['points'][1]), line['visible'] == undefined ? true : false, line['name']).opacity(0);

			if (line['onLineLengthChanged'] != undefined) {
				console.log('set'+line['name']);
				self.onLineLengthChanged(line['onLineLengthChanged'], line['name']);
			}
		}

		for (var i = 0; i < angles.length; i++) {
			var angle = angles[i];	
			self.sceneAngles[angle['name']] = new JointsAngle(self.sceneLines[angle['side_first']], self.sceneLines[angle['side_second']], angle['name']).setRanges(angle['ranges']).opacity(0).onAngleChanged(angle['onAngleChanged']);
		}

		for (var i = 0; i < texts.length; i++) {
			var text = texts[i];
			new Text(new Point(text['x'], text['y'])).setText(text['text']);	
		}

		self.restartAnimation();
	
		function onTextSelect(target, ctx, state) {
			if (state == true) {
				self.scenePoints[ctx].enlarge();
				target.setStyle({'fontWeight' : 'bold'});
			}
			else {
				self.scenePoints[ctx].reduce();
				target.setStyle({'fontWeight' : 'normal'});
			}
		};

		function unscaledPosition(index) {
			return new Point(points['X'][index], points['Y'][index]);
		};

		$('#btnDump').click(function () {
			for (var i in self.scenePoints)
				console.log('dump ' + self.scenePoints[i].point().x + ' ' + self.scenePoints[i].point().y);
		});			
	}

	return this;
}		