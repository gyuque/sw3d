if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';
	
	function ImageBuffer(w, h, withZBuffer) {
		this.width  = w;
		this.height = h;
		
		// Allocate buffers
		this.color = this.allocateBuffer(w, h, 'color');
		this.z = withZBuffer ? this.allocateBuffer(w, h, 'depth') : null;
	}
	

	
	ImageBuffer.prototype = {
		allocateBuffer: function(w, h, bufferType) {
			if (bufferType == 'depth') {
				return allocateTypedArray(true, w*h);
			} else {
				return allocateTypedArray(false, w*4 *h);
			}
		},

		clearColor: function(r, g, b) {
			var buf = this.color;
			var pos = 0;
			var len = this.width * this.height;
			for (var i = 0;i < len;i++) {
				buf[pos++] = r;
				buf[pos++] = g;
				buf[pos++] = b;
				buf[pos++] = 255;
			}
		},
		
		clearZ: function(z) {
			var buf = this.z;
			var len = this.width * this.height;
			for (var i = 0;i < len;i++) {
				buf[i] = z;
			}
		},

		emitToCanvas: function(context2d) {
			var w = this.width;
			var h = this.height;
			
			var imageData = context2d.getImageData(0, 0, w, h);
			var dest = imageData.data;
			var source = this.color;
			var pos = 0;
			
			var len = w * h;
			
			for (var i = 0;i < len;++i) {
				dest[pos]   = source[pos++];
				dest[pos]   = source[pos++];
				dest[pos]   = source[pos++];
				dest[pos++] = 255;
			}
			
			context2d.putImageData(imageData, 0, 0);
		}
	};

	function allocateTypedArray(isFloat, length) {
		var a = null;
		
		// Try to allocate typed array
		try {
			var ctor = isFloat ? Float64Array : Uint8Array;
			a = new ctor(length);
		} catch(e) {}
		
		// Fallback to standard array
		if (!a) {
			console.log("WARNING: This environment does not support TypedArray.");
			a = new Array(length);
			for (var i = 0;i < length;i++) { a[i] = 0; }
		}
		
		return a;
	}
	
	pkg.ImageBuffer = ImageBuffer;
})(window.smallworld3d);
