(function(pkg) {
	'use strict';
	var SCREEN_WIDTH  = 300;
	var SCREEN_HEIGHT = 300;
	var ctx;
	var g;
	
	var viewX = 0;
	var viewY = 0;

	var vertices = (function(){
		var SZ = 5;
		var V = function(red, x, y){
			var v = new smallworld3d.Vertex3D();
			v.position.x = x;
			v.position.y = y;
			v.position.z = 0;
			v.N.x = 0;
			v.N.y = 0;
			v.N.z = 1;
			v.color.r = red;
			v.color.g = 255;
			v.color.b = 0;
			v.color.a = 255;
			return v;
		};
		
		return [
			V(220, -SZ, SZ),
			V(20,  SZ, SZ),
			V(20, -SZ,-SZ),
			V( 0,  SZ,-SZ)
		];
	})();
	
	var transformedVertices = [
		new smallworld3d.TransformedVertex(),
		new smallworld3d.TransformedVertex(),
		new smallworld3d.TransformedVertex(),
		new smallworld3d.TransformedVertex()
	];
	
	window.launch = function() {
		ctx = new smallworld3d.RenderingContext(SCREEN_WIDTH, SCREEN_HEIGHT);
		var canvas = document.getElementById("out-canvas");
		canvas.width  = SCREEN_WIDTH;
		canvas.height = SCREEN_HEIGHT;
		g = canvas.getContext("2d");

		ctx.projectionTransform.perspectiveFOV(Math.PI/3.0, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 30);
		ctx.viewTransform.translate(0, 0, -13);

		var directionalLight = new smallworld3d.DirectionalLight();
		directionalLight.direction.x = 2;
		directionalLight.direction.y = -1;
		directionalLight.direction.z = -1;
		directionalLight.direction.normalize3();
		ctx.addLight(directionalLight);


		observeMouse(document.body.parentNode);
		draw();
	}
	;
	function observeMouse(target) {
		target.addEventListener("mousemove", function(e) {
			viewX = (e.clientX - 150) * 0.05;
			viewY = (150 - e.clientY) * 0.05;
			setView();
			draw();
		}, false);
	}
	
	var vViewFrom = new smallworld3d.geometry.Vec4(0, 0, 0);
	var vViewTo   = new smallworld3d.geometry.Vec4(0, 0, 0);
	var vViewUp   = new smallworld3d.geometry.Vec4(0, 1, 0);
	function setView() {
		vViewFrom.x = viewX;
		vViewFrom.y = viewY;
		vViewFrom.z = 13;
		
		vViewTo.z = viewX/2;
		vViewTo.y = viewY/2;
		ctx.viewTransform.lookAt(vViewFrom, vViewTo, vViewUp);
	}
	
	function draw() {
		ctx.imageBuffer.clearZ(1);
		ctx.imageBuffer.clearColor(0, 0, 0);

		ctx.transformVertices(transformedVertices, vertices);
		ctx.applyViewportTransform(transformedVertices);
		drawIndexedTriangle(transformedVertices, 0, 1, 2);
		drawIndexedTriangle(transformedVertices, 2, 1, 3);
		
		ctx.imageBuffer.emitToCanvas(g);
	}
	
	function drawIndexedTriangle(vlist, i1, i2, i3) {
		var r = ctx.rasterizer;
		var v = vlist[i1];
		r.setVertexAttribute(0,
			v.position.x, v.position.y, v.position.z, 1.0 / v.position.w,
			v.color.r, v.color.g, v.color.b, v.color.a);
			
		v = vlist[i2];
		r.setVertexAttribute(1,
			v.position.x, v.position.y, v.position.z, 1.0 / v.position.w,
			v.color.r, v.color.g, v.color.b, v.color.a);

		v = vlist[i3];
		r.setVertexAttribute(2,
			v.position.x, v.position.y, v.position.z, 1.0 / v.position.w,
			v.color.r, v.color.g, v.color.b, v.color.a);

		r.fillTriangle();
		r.plotPoints()
	}
})();