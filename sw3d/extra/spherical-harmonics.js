if(!window.smallworld3d){ window.smallworld3d = {}; }

(function(pkg) {
	'use strict';
	var PI = Math.PI;
	var R2 = Math.sqrt(2);

	var SphericalHarmonics = {
		sanityCheck: function() {
			var n = DirectXResults.length;
			for (var i = 0;i < n;i++) {
				this.compareTestWith( DirectXResults[i] );
			}
		},
	
		KP: {
			0: {
				0: Math.sqrt(1 / (4*PI))
			},

			1: {
				'-1':  Math.sqrt(3 / (8*PI)),
				 0:  Math.sqrt(3 / (4*PI)),
				 1: -Math.sqrt(3 / (8*PI))
			},

			2: {
				'-2': -Math.sqrt(15/ (32*PI)), // XXX: minus?
				'-1':  Math.sqrt(15/ (8*PI)),
				 0:  Math.sqrt(5 / (16*PI)),
				 1: -Math.sqrt(15/ (8*PI)),
				 2:  Math.sqrt(15/ (32*PI))
			},

			3: {
				'-3':  Math.sqrt(35/(64*PI)),
				'-2': -Math.sqrt(105/(32*PI)), // XXX: minus?
				'-1':  Math.sqrt(21 /(64*PI)),
				  0 :  Math.sqrt(7 / (16*PI)),
				  1 : -Math.sqrt(21 /(64*PI)),
				  2 :  Math.sqrt(105/(32*PI)),
				  3 : -Math.sqrt(35/(64*PI))
			},

			4: {
				'-4': -Math.sqrt(315/(512*PI)), // XXX: minus?
				'-3':  Math.sqrt(315/(64*PI)),
				'-2': -Math.sqrt(45 /(128*PI)), // XXX: minus?
				'-1':  Math.sqrt(45 /(64*PI)),
				  0 :  Math.sqrt(9 / (256*PI)),
				  1 : -Math.sqrt(45 /(64*PI)),
				  2 :  Math.sqrt(45 /(128*PI)),
				  3 : -Math.sqrt(315/(64*PI)),
				  4 :  Math.sqrt(315/(512*PI))
			}
		},
		
		projectVector: function(v, theta, phi, dS, order, outCoeffs) {
			var cfs = outCoeffs || new SHCoefficients(order);
			for (var i = 0;i < cfs.n;i++) {
				var lm = SphericalHarmonics.indices[i];
				cfs.vector[i] = SphericalHarmonics.calc(lm[0], lm[1], theta, phi) * v * dS;
			}
			
			return cfs;
		},

		calc: function(l, m, Theta, Phi) {
			var cos = Math.cos;
			var sin = Math.sin;
			var kp = this.KP[l][m];
			if (!kp && kp !== 0){return 0;}

			var e = euler(Phi*m, m > 0);

			switch(l) {
				case 0: return kp;
				case 1:
					switch(m) {
						case -1: return R2 * kp * sin(Theta) * e;
						case  0: return      kp * cos(Theta);
						case  1: return R2 * kp * sin(Theta) * e;
					}
					break;
				case 2:
					switch(m) {
						case -2: return R2 * kp * sin2(Theta) * e;
						case -1: return R2 * kp * sin(Theta)*cos(Theta) * e;
						case  0: return      kp * (3*cos2(Theta) - 1);
						case  1: return R2 * kp * sin(Theta)*cos(Theta) * e;
						case  2: return R2 * kp * sin2(Theta) * e;
					}
					break;
				case 3:
					switch(m) {
						case -3: return R2 * kp * sin3(Theta) * e;
						case -2: return R2 * kp * sin2(Theta)*cos(Theta) * e;
						case -1: return R2 * kp * sin(Theta) * (5*cos2(Theta) - 1) * e;
						case  0: return      kp * (5*cos3(Theta) - 3*cos(Theta));
						case  1: return R2 * kp * sin(Theta) * (5*cos2(Theta) - 1) * e;
						case  2: return R2 * kp * sin2(Theta)*cos(Theta) * e;
						case  3: return R2 * kp * sin3(Theta) * e;
					}
					break;
				case 4:
					switch(m) {
						case -4: return R2 * kp * sin2(Theta)*sin2(Theta) *e;
						case -3: return R2 * kp * sin3(Theta) * cos(Theta) *e;
						case -2: return R2 * kp * sin2(Theta) * (7*cos2(Theta) - 1) *e;
						case -1: return R2 * kp * sin(Theta)*(7*cos3(Theta) - 3*cos(Theta)) *e;
						case  0: return      kp * (35*cos3(Theta)*cos(Theta) - 30*cos2(Theta) + 3);
						case  1: return R2 * kp * sin(Theta)*(7*cos3(Theta) - 3*cos(Theta)) *e;
						case  2: return R2 * kp * sin2(Theta) * (7*cos2(Theta) - 1) *e;
						case  3: return R2 * kp * sin3(Theta) * cos(Theta) *e;
						case  4: return R2 * kp * sin2(Theta)*sin2(Theta) *e;
					}
					break;
			}
		}
	};
	
	function sin2(x) { var s=Math.sin(x); return s*s;}
	function sin3(x) { var s=Math.sin(x); return s*s*s;}
	function cos2(x) { var c=Math.cos(x); return c*c;}
	function cos3(x) { var c=Math.cos(x); return c*c*c;}
	
	function putIndex(a, l, m) { a[ l*(l+1) + m ] = [l, m]; }
	SphericalHarmonics.indices = new Array(25);
	(function(a) {
		for (var l = 0;l <= 4;l++) {
			for (var m = -l;m <= l;m++) {
				putIndex(SphericalHarmonics.indices, l,  m);
			}
		}
	})(SphericalHarmonics.indices);

	// console.log(SphericalHarmonics.indices)

	function euler(x, real) {
		if (real) {
			return Math.cos(x);
		} else {
			return Math.sin(x);
		}
	}

	function SHCoefficients(order) {
		this.order = order;
		this.n = order*order;
		this.vector = new Array(this.n);
	}
	
	SHCoefficients.prototype.fromArray = function(a) {
		var n = this.n;
		for (var i = 0;i < n;i++) { this.vector[i] = a[i]; }
	};

	SHCoefficients.dot = function(a, b) {
		var n = a.n;
		var sum = 0;
		for (var i = 0;i < n;i++) {
			sum += a.vector[i] * b.vector[i];
		}
		
		return sum;
	};
	
	pkg.SHCoefficients = SHCoefficients;
	pkg.SphericalHarmonics = SphericalHarmonics;
})(window.smallworld3d);
