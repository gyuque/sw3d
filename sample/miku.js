(function(){
	var theViewer = null;
	var SCREEN_WIDTH  = 520;
	var SCREEN_HEIGHT = 360;
	
	window.launch = function() {
		var textureLoader = new smallworld3d.CanvasTextureLoader(MIKU_MODEL_SOURCE.texture_data, function(texBuffer) {
			theViewer = new Viewer(document.getElementById("render-target"));
			theViewer.buildMesh(MIKU_MODEL_SOURCE, texBuffer, true);
		
			theViewer.observeMouse(document.body);
		
			theViewer.render();
		});
	};

	function Viewer(targetCanvas) {
		this.rotation = {
			y: 0,
			x: 0,
			mX: new smallworld3d.geometry.M44(),
			mY: new smallworld3d.geometry.M44()
		};
		
		this.canvas = targetCanvas;
		this.canvas.width  = SCREEN_WIDTH;
		this.canvas.height = SCREEN_HEIGHT;
		this.g = this.canvas.getContext('2d');

		this.context = new smallworld3d.RenderingContext(SCREEN_WIDTH, SCREEN_HEIGHT);
		this.mesh = null;

		var directionalLight = new smallworld3d.DirectionalLight();
		directionalLight.direction.x = 1;
		directionalLight.direction.z = -0.5;
		directionalLight.direction.normalize3();
		this.context.addLight(directionalLight);

		this.context.projectionTransform.perspectiveFOV(Math.PI/3.0, SCREEN_WIDTH / SCREEN_HEIGHT, 1, 30);
		this.context.viewTransform.translate(0, -7, -14);
		
		directionalLight.enabled = false;
	}
	
	Viewer.prototype = {
		observeMouse: function(target) {
			var _this = this;
			target.addEventListener("mousemove", function(e) {
				_this.onMouseMove(e);
			}, false);
		},
		
		onMouseMove: function(e) {
			var x = (e.clientX + 100) * 0.01;
			var y = (e.clientY - 100) * 0.002;
			this.rotation.y = x;
			this.rotation.x = -0.1 + y;
			this.render();
		},
		
		buildMesh: function(source, textureBuffer, invertZ)  {
			var mesh = new smallworld3d.Mesh();
			var faceColor = new smallworld3d.RGBAColor(255, 255, 255, 255);
			
			var i;
			var vlist = source.vertices;
			var vlen = vlist.length;
			
			for (i = 0;i < vlen;i++) {
				var vSource = vlist[i];
				var v = new smallworld3d.Vertex3D();
				v.position.x = vSource.p[0];
				v.position.y = vSource.p[1];
				v.position.z = vSource.p[2];
				
				v.N.x = vSource.n[0];
				v.N.y = vSource.n[1];
				v.N.z = vSource.n[2];
				
				v.color.r = faceColor.r;
				v.color.g = faceColor.g;
				v.color.b = faceColor.b;
				v.color.a = faceColor.a;

				// Invert Z for DirectX mesh data
				if (invertZ) {
					v.position.z *= -1;
					v.N.z *= -1;
				}

				if (vSource.uv) {
					v.textureUV.u = vSource.uv[0];
					v.textureUV.v = vSource.uv[1];
				}
				mesh.addVertex(v);
			}
			
			var ilist = source.triangles;
			var ilen = ilist.length / 3;

			for (i = 0;i < ilen;i++) {
				mesh.addTriangle(ilist[i*3], ilist[i*3+1], ilist[i*3+2]);
			}
			
			for (i in source.groups) {
				mesh.addTriangleGroup(source.groups[i]);
			}
			
			mesh.setGroupMaterial(0, new smallworld3d.TexturedMaterial(textureBuffer));
			this.mesh = mesh;
		},
		
		render: function() {
			this.context.imageBuffer.clearZ(1);
			this.context.imageBuffer.clearColor(0, 0, 0);
			
			this.rotation.mX.rotationX(this.rotation.x);
			this.rotation.mY.rotationY(this.rotation.y);
			
			this.context.worldTransform.mul(this.rotation.mX, this.rotation.mY);
			this.mesh.doTransform(this.context);
			
			this.mesh.drawSubset(this.context, 0);
			this.mesh.drawSubset(this.context, 1);
			
			this.context.imageBuffer.emitToCanvas(this.g);
		}
		
	};

})();