(function(pkg) {
	'use strict';
	var SCREEN_WIDTH  = 300;
	var SCREEN_HEIGHT = 300;
	var ctx;
	var g;
	
	var testQ = new smallworld3d.geometry.Quaternion(-0.066681, 0.026894, 0.054463, 0.995922);
	
	window.launch = function() {
		ctx = new smallworld3d.RenderingContext(SCREEN_WIDTH, SCREEN_HEIGHT);
		var canvas = document.getElementById("out-canvas");
		canvas.width  = SCREEN_WIDTH;
		canvas.height = SCREEN_HEIGHT;
		g = canvas.getContext("2d");
		
		var v = new smallworld3d.geometry.Vec4(0, 1, 0);
		var v2 = new smallworld3d.geometry.Vec4();
		testQ.multiplyVec3(v2, v);
		
		console.log(v2.x, v2.y, v2.z);
		console.log(v2.norm3());
	};
	
	
})();