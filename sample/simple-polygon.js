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
		observeMouse(document.body.parentNode);
		
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
	
	function observeMouse(target) {
		var _this = this;
		target.addEventListener("mousemove", function(e) {
			angle = e.clientX * 0.01;
			draw();
		}, false);
	}
	
	var positions = [{},{},{},{}];
	function draw() {
		// Generate vertex positions
		for (var i = 0;i < 4;i++) {
			var theta = Math.PI * 2 * (i / 4) + angle;
			positions[i].x =  Math.sin(theta) * 100 + 150;
			positions[i].y = -Math.cos(theta) * 100 + 150;
		}
		
		framebuffer.clearColor(0, 0, 0);
		
		// Draw triangle 1
		rasterizer.setVertexAttribute(0,
			positions[0].x, positions[0].y, 0, 1,
			255, 0, 0, 255);
			
		rasterizer.setVertexAttribute(1,
			positions[1].x, positions[1].y, 0, 1,
			255, 255, 0, 255);

		rasterizer.setVertexAttribute(2,
			positions[2].x, positions[2].y, 0, 1,
			0, 255, 0, 255);
		
		rasterizer.fillTriangle();

		// Draw triangle 2
		rasterizer.setVertexAttribute(0,
			positions[2].x, positions[2].y, 0, 1,
			0, 255, 0, 255);
			
		rasterizer.setVertexAttribute(1,
			positions[3].x, positions[3].y, 0, 1,
			0, 128, 255, 255);

		rasterizer.setVertexAttribute(2,
			positions[0].x, positions[0].y, 0, 1,
			255, 0, 0, 255);
		
		rasterizer.fillTriangle();

		// emit
		framebuffer.emitToCanvas(g);
	}
})();