
var thebeast_settings = {
	"boxId": "box",
	"moveInterval": 10,
	"renderInterval": 25,
};
var thebeast_images = null;
var thebeast_image_sources = {
	"thebeast-front": "./images/thebeast-front.png",
	"box1": "./images/box1.png",
};
var thebeast_scene = null;

function thebeast_getSetting(id)
{
	var setting = thebeast_settings[id];
	if (setting === null)
	{
		console.log("Setting " + id + " is not listed in settings");
	}
	
	return setting;
}

function thebeast_getImage(id)
{
	var image = thebeast_images[id];
	if (image === null)
	{
		console.log("Image " + id + " is not listed among images");
	}
	
	return image;
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

function thebeast_newScene()
{
	return {
		"loaded": false,
		"objects": {},
	};
}

function thebeast_newObject(type, x, y, vx, vy)
{
	if (type === null) {console.log("type is null");}
	if (x === null) {console.log("x is null");}
	if (y === null) {console.log("y is null");}
	if (vx === null) {console.log("vx is null");}
	if (vy === null) {console.log("vy is null");}
	
	return {
		"type": type,
		"x": x,
		"y": y,
		"vx": vx,
		"vy": vy,
	};
}

function thebeast_moveObject(obj)
{
	if (obj === null) {console.log("obj is null");}
	
	obj.x += obj.vx;
	obj.y += obj.vy;
}

function thebeast_drawObject(context, obj)
{
	if (context === null) {console.log("context is null");}
	if (obj === null) {console.log("obj is null");}
	if (obj.type === "theBeast")
	{
		var image = thebeast_getImage("thebeast-front");
		context.drawImage(image, obj.x, obj.y, 64, 64);
	}
	if (obj.type === "box1")
	{
		var image = thebeast_getImage("box1");
		context.drawImage(image, obj.x, obj.y, 64, 64);
	}
}

function thebeast_render(canvas, context, objs)
{
	if (canvas === null) {console.log("canvas is null");}
	if (context === null) {console.log("context is null");}
	if (objs === null) {console.log("objs is null");}

	// Clear buffer.
	var w = canvas.width;
	var h = canvas.height;
	context.clearRect(0, 0, w, h);

	var n = objs.length;
	for (var i = 0; i < n; i++)
	{
		thebeast_drawObject(context, objs[i]);
	}
}

function thebeast_physics(scene)
{
	if (scene === null) {console.log("scene is null");}
	setInterval(function() {
		var loaded = scene.loaded;
		var objects = scene.objects;
		if (loaded === null) {console.log("loaded is null");}
		if (objects === null) {console.log("objects is null");}
		if (!loaded) {return;}
	
		var n = objects.length;
		for (var i = 0; i < n; i++)
		{
			var obj = objects[i];
			thebeast_moveObject(obj);
		}
	}, thebeast_getSetting("moveInterval"));
}

function thebeast_graphics(canvas, context, scene)
{
	if (canvas === null) {console.log("canvas is null");}
	if (context === null) {console.log("context is null");}
	if (scene === null) {console.log("scene is null");}
	
	setInterval(function() {
		var loaded = scene.loaded;
		if (!loaded) {return;}
		
		thebeast_render(canvas, context, scene.objects);
	}, thebeast_getSetting("renderInterval"));
}

var thebeast = function()
{
	var boxId = thebeast_getSetting("boxId");
	var canvas = document.getElementById(boxId);
	if (canvas === null) {console.log("canvas is null");}
	var context = canvas.getContext('2d');
	if (context === null) {console.log("context is null");}
	
	// Load objects.
	var scene = thebeast_newScene();
	var player = thebeast_newObject("theBeast", 0, 0, 1, 0);
	var objects = [
		player,
		thebeast_newObject("box1", 0, 0, 0, 0),
	];
	scene.objects = objects;
	
	// Set rendering settings.
	thebeast_setSmoothing(context, false);
	
	// Physics.
	var loaded = false;
	thebeast_physics(scene);
	
	// Graphics.
	thebeast_graphics(canvas, context, scene);
	
	var imageSources = thebeast_image_sources;
	thebeast_loadImages(imageSources, function(images) {
		thebeast_images = images;
		scene.loaded = true;
	});
	
	
}

window.addEventListener("load", thebeast, true);
