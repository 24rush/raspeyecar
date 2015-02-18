var DependantPoint = function (arrJointPoint, funcDependency) {
	var self = this;
	self._dependecyFunc = funcDependency;

	var _point = self._dependecyFunc();

	for (var i = 0; i < arrJointPoint.length; i++) {		
		arrJointPoint[i].onMove(function () {			
			var newThisPosition = self._dependecyFunc();

			_point.x = newThisPosition.x;
			_point.y = newThisPosition.y;

			for (var cbk in self._onMoveCbk) {							
				self._onMoveCbk[cbk](_point);
			}
		});
	};

	self._onMoveCbk = [];

	this.point = function() {
		return _point;
	}

	this.onMove = function (cbk) {		
		self._onMoveCbk.push(cbk);
	}
}