if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';
	
	function CanvasTextureLoader(sourceURL, callback) {
		this.callback = callback;
		this.img = new Image();
		this.canvas = null;
		
		var _this = this;
		this.img.onload = function() { _this.onImageLoad(); };
		this.img.src = sourceURL;
	}
	
	CanvasTextureLoader.prototype = {
		onImageLoad: function() {
			this.copyImage();
			if (this.callback) {
				this.callback(this);
			}
		},
		
		copyImage: function() {
			var img = this.img;
			this.canvas = document.createElement("canvas");
			this.canvas.width  = img.width;
			this.canvas.height = img.height;
			
			var g = this.canvas.getContext("2d");
			g.drawImage(img, 0, 0);
			console.log(g)
		}
	};
	
	pkg.CanvasTextureLoader = CanvasTextureLoader;
})(window.smallworld3d);