if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';
	
	function NearestTextureSampler() {
	}
	
	NearestTextureSampler.prototype = {
		getPixel: function(colorOut, texture, u, v) {
			var w = texture.width;
			var h = texture.height;
			var x = Math.floor(u * w + 0.5);
			var y = Math.floor(v * h + 0.5);
			if (x < 0) {x = 0;}
			if (y < 0) {y = 0;}
			if (x >= w) {x = w - 1;}
			if (y >= h) {y = h - 1;}
			
			var pos = ((y * w) + x) << 2;
			colorOut.r = texture.color[pos++];
			colorOut.g = texture.color[pos++];
			colorOut.b = texture.color[pos++];
			colorOut.a = texture.color[pos  ];
		}
	};
	
	pkg.NearestTextureSampler = NearestTextureSampler;
})(window.smallworld3d);
