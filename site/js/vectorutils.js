var GeometryUtils = {

	AngleBetweenLines : function (src, dest) {
		var common = new Point(0, 0);		

		var line1 = src;
		var line2 = dest;

		var line1From = line1.from();
		var line1To = line1.to();
	
		if (src.from().x > src.to().x) {
			line1From = line1.to();
			line1To = line1.from();
		} 
		
		line1To = line1To.subtract(line1From);

		var line2From = line2.from();
		var line2To = line2.to();
		
		if (dest.from().x > dest.to().x) {
			line2From = line2.from();
			line2To = line2.to();
		}				
				
		line2To = line2To.subtract(line2From);

		var destination1 = line1To;
		var destination2 = line2To;
		
		var diff = common.subtract(destination1);
		var v1 = diff.divide(2);

		var diff2 = destination2.subtract(common);
		var v2 = diff2.divide(2);

		var cos = (v1.x * v2.x + v1.y * v2.y) / (Math.sqrt(v1.x * v1.x + v1.y * v1.y) * Math.sqrt(v2.x * v2.x + v2.y * v2.y));		

		var y1 = diff.divide(2).add(destination1);
		var y2 = diff2.divide(2).add(common);
		
		var angle = Math.acos(cos) * 180 / Math.PI;

		return angle;
	}
}