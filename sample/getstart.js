(function(){
	'use strict';
	
	var SCREEN_WIDTH  = 300;
	var SCREEN_HEIGHT = 300;
	
	var framebuffer;
	var rasterizer;
	var g;
	
	var angle = 0;
	
	window.launch = function() {
		setupSW3D();
		draw();
	};
	
	function setupSW3D() {
		framebuffer = new smallworld3d.ImageBuffer(SCREEN_WIDTH, SCREEN_HEIGHT, true);
		rasterizer = new smallworld3d.Rasterizer(framebuffer);
		rasterizer.enableZTest = false;
		
		var canvas = document.getElementById("out-canvas");
		canvas.width  = SCREEN_WIDTH;
		canvas.height = SCREEN_HEIGHT;
		g = canvas.getContext("2d");
	}

	function draw() {
		// draw a triangle
		rasterizer.setVertexAttribute(0,
				10, 10, 0, 1,
				255, 0, 0, 255);

		rasterizer.setVertexAttribute(1,
				290, 20, 0, 1,
				0, 255, 0, 255);

		rasterizer.setVertexAttribute(2,
				80, 290, 0, 1,
				0, 0, 255, 255);

		rasterizer.fillTriangle();

		// emit
		framebuffer.emitToCanvas(g);
	}
})();