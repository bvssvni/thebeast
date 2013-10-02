
var thebeast_settings = {
	"boxId": "box"
};

function thebeast_getSetting(id)
{
	var setting = thebeast_settings[id];
	if (setting === null)
	{
		console.log("Setting " + id + " is not listed in settings");
	}
	
	return setting;
}

function thebeast_loadImages(sources, callback)
{
	if (sources === null) {console.log("sources is null");}
	if (callback === null) {console.log("callback is null");}

	var images = {};
	var loadedImages = 0;
	var numImages = Object.keys(sources).length;
	for (var src in sources)
	{
		images[src] = new Image();
		images[src].onload = function() {
			loadedImages++;
			if (loadedImages >= numImages)
			{
				callback(images);
			}
		};
		images[src].src = sources[src];
	}
}

function thebeast_setSmoothing(context, val)
{
	if ("mozImageSmoothingEnabled" in context) {context.mozImageSmoothingEnabled = val;}
	else {console.log("Smoothing property not supported for browser");}
}

var thebeast = function()
{
	var boxId = thebeast_getSetting("boxId");
	var canvas = document.getElementById(boxId);
	if (canvas === null) {console.log("canvas is null");}
	var context = canvas.getContext('2d');
	if (context === null) {console.log("context is null");}
	
	var imageSources = {
		"thebeast-front": "./images/thebeast-front.png"
	};
	
	thebeast_setSmoothing(context, false);
	thebeast_loadImages(imageSources, function(images) {
		context.drawImage(images["thebeast-front"], 0, 0, 32, 32);
	});
}

window.addEventListener("load", thebeast, true);
