if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';
	
	function generateCube(xSize, ySize, zSize, xDivs, yDivs, zDivs) {
		var undef = void 0;
		
		var vertexBuffer = [];
		var indexBuffer = [];
		
		// Default values
		if (xSize === undef) { xSize = 1; }
		if (ySize === undef) { ySize = 1; }
		if (zSize === undef) { zSize = 1; }
		if (xDivs === undef) { xDivs = 1; }
		if (yDivs === undef) { yDivs = 1; }
		if (zDivs === undef) { zDivs = 1; }
		
		if (xDivs > 999 || yDivs > 999 || zDivs > 999) {
			throw "Divisions must not over 999";
		}
		
		var xNumPoints = xDivs + 1;
		var yNumPoints = yDivs + 1;
		var vmapFront = buildXYFace(xNumPoints, yNumPoints, 0, false);
		vmapFront.generateVertices(vertexBuffer, indexBuffer, xSize, ySize, zSize, xDivs, yDivs, zDivs);
		
		return {
			vertices: vertexBuffer,
			indices: indexBuffer
		};
	}
	
	function buildXYFace(cols, rows, reverseFace) {
		var vertexMap = new VertexMap();
		var i, j;

		var indexOrigins = {
			x: 0, y: 0, z: 0
		};

		var indices = {
			x: 0, y: 0, z: 0
		};
		
		var colAxis = 'x';
		var rowAxis = 'y';

		indices[rowAxis] = indexOrigins[rowAxis];
		for (j = 0;j < (rows-1);j++) {
			indices[colAxis] = indexOrigins[colAxis];
			for (i = 0;i < (cols-1);i++) {
				var vertexIndex1 = vertexMap.requestIndex(indices.x  , indices.y  , indices.z);
				var vertexIndex2 = vertexMap.requestIndex(indices.x+1, indices.y  , indices.z);
				var vertexIndex3 = vertexMap.requestIndex(indices.x  , indices.y+1, indices.z);
				var vertexIndex4 = vertexMap.requestIndex(indices.x+1, indices.y+1, indices.z);
				//console.log(vertexIndex1, vertexIndex2, vertexIndex3, vertexIndex4)
				console.log(
					vertexMap.xOfIndex(vertexIndex1), vertexMap.yOfIndex(vertexIndex1), '',
					vertexMap.xOfIndex(vertexIndex2), vertexMap.yOfIndex(vertexIndex2), '',
					vertexMap.xOfIndex(vertexIndex3), vertexMap.yOfIndex(vertexIndex3), '',
					vertexMap.xOfIndex(vertexIndex4), vertexMap.yOfIndex(vertexIndex4));
				
				vertexMap.faceIndices.push(vertexIndex1, vertexIndex2, vertexIndex3);
				vertexMap.faceIndices.push(vertexIndex3, vertexIndex2, vertexIndex4);
				indices[colAxis] += 1;
			}
			indices[rowAxis] += 1;
		}
		
		return vertexMap;
	}
	
	// ------------------------------------
	
	function VertexMap() {
		this.map = {};
		this.list = [];
		this.faceIndices = [];
	}
	
	VertexMap.prototype = {
		requestIndex: function(ix, iy, iz) {
			var k = this.makeKey(ix, iy, iz);
			if (!this.map.hasOwnProperty(k)) {
				var nextIndex = this.list.length;
				this.map[k] = nextIndex;
				this.list.push(k);
			}
			
			return this.map[k];
		},
		
		xOfIndex: function(i) {
			var k = this.list[i];
			return k % 1000;
		},

		yOfIndex: function(i) {
			var k = this.list[i];
			return Math.floor(k / 1000) % 1000;
		},

		zOfIndex: function(i) {
			var k = this.list[i];
			return Math.floor(k / 1000000) % 1000;
		},
		
		makeKey: function(ix, iy, iz) {
			return ix + (iy * 1000) + (iz * 1000000);
		},
		
		generateVertices: function(vertexBuffer, indexBuffer, xSize, ySize, zSize, xDivs, yDivs, zDivs) {
			var vertexIndexOrigin = vertexBuffer.length;
			var vlen = this.list.length;
			for (var i = 0;i < vlen;i++) {
				var v = this.generateVertex(i, xSize, ySize, zSize, xDivs, yDivs, zDivs);
				vertexBuffer.push(v);
			}
		},
		
		generateVertex: function(index, xSize, ySize, zSize, xDivs, yDivs, zDivs) {
			var ix = this.xOfIndex(index);
			var iy = this.yOfIndex(index);
			var iz = this.zOfIndex(index);
			
			var xOrigin = -xSize * 0.5;
			var yOrigin =  ySize * 0.5;
			var zOrigin =  zSize * 0.5;
			
			var xStep =  xSize / xDivs;
			var yStep = -ySize / yDivs;
			var zStep = -zSize / zDivs;
			
			var v = new smallworld3d.Vertex3D();
			v.position.x = xOrigin + xStep*ix;
			v.position.y = yOrigin + yStep*iy;
			v.position.z = zOrigin + zStep*iz;
			
			return v;
		}
	};
	
	pkg.generateCube = generateCube;
})(window.smallworld3d);