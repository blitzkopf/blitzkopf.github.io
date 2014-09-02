const earthRadius = 6731.0;
function Quake(lat,lon,depth,time,size,verified) {
	this.lat = lat;
	this.lon = lon;
	this.depth = depth;
	this.time = time;
	this.size =size;
	this.verified = verified;
};

Quake.prototype.color = function(currentTime) {
	var hours = (time - this.time ) / ( 1000*60*60);
		if (this.size >= 3 && animParams.greenGiant ) {
			return [0.0, 1.0, 0.0 ,1.0 ];
		}
		if ( hours <= 4.0 ) {
			return [ 1.0, 0.0, 0.0, 1.0]; // "#f00";
		} else if(hours <= 12) {
			return [ 1.0, 0.4, 0.0, 1.0]; //"#f60";
		}
		else if(hours <= 24) {
			return [ 1.0, 1.0, 0.0, 1.0]; // "#ff0";
		}
		else if(hours <= 36) {
			return [ 0.2, 0.4, 0.8, 1.0]; // "#36c";
		}
		else {
			return [ 0.0, 0.0, 0.4, 1.0]; // "#006";
		}
};
function calculatePositions(qList,animParams) {
	var params={};
	for(i in qList) {

		qList[i].pos = sphere2Cart(qList[i].lat, qList[i].lon, earthRadius - animParams.depthScale*qList[i].depth)

		if(qList[i].time < params.firstTime || params.firstTime == null) {
			params.firstTime=qList[i].time;
		}
		if(qList[i].time > params.lastTime || params.lastTime == null) {
			params.lastTime=qList[i].time;
		}
	}
	params.duration = params.lastTime - params.firstTime;
	qList.sort(function(a,b){return b.time-a.time});
	return params;
};


 