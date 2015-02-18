var Text = function (point) {
	var self = this;
	var _text = new PointText(point);
		
	_text.fillColor = 'black';
	_text.style = {
		font: 'sans-serif',
		fontWeight: 'normal',
		fontSize: 16,
	};	

	this._onTextSelect = [];

	_text.sendToBack();

	_text.onMouseEnter = function (evt) {		
		for (var i in self._onTextSelect) {
			var context = self._onTextSelect[i];
			context['f'](this, context['ctx'], true);
		}
	}

	_text.onMouseLeave = function (evt) {		
		for (var i in self._onTextSelect) {
			var context = self._onTextSelect[i];
			context['f'](this, context['ctx'], false);
		}
	}

	this.remove = function () {
		_text.remove();
	}

	this.registerOnTextSelect = function (func, ctx) {
		self._onTextSelect.push({'f' : func, 'ctx' : ctx});
	}

	this.setPosition = function(point) {
		_text.position = point;
	}

	this.setText = function(value) {
		_text.content = value;
		return self;
	}

	this.setStyle = function (style) {	
		for (sKey in Object.keys(style)) {
			_text.style[sKey] = style[sKey];
		}
	}
}