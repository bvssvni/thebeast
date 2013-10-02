
var thebeast_settings = {
	"boxId": "box",
	"moveInterval": 10,
	"renderInterval": 25,
	"playerColor": [0, 0, 255, 255],
	"box1Color": [255, 0, 0, 255],
};
var thebeast_images = null;
var thebeast_image_sources = {
	"thebeast-front": "./images/thebeast-front.png",
	"box1": "./images/box1.png",
};
var thebeast_scene = null;

// These are actions that can be performed on objects.
// An action returns true when it is completed.
// Each object has a list of actions.
// If there is no actions, objects move with their velocity.
var thebeast_actions = {
	setPosition: function(obj, args) {
		// dt, x, y.
		if (typeof args.dt !== "number") {console.log(typeof args.dt);}
		if (typeof args.x !== "number") {console.log(typeof args.x);}
		if (typeof args.y !== "number") {console.log(typeof args.y);}
		if (args.dt > 0) {args.dt--; return false;}
		
		obj.x = args.x;
		obj.y = args.y;
		
		return true;
	},
	wait: function(obj, args) {
		// dt.
		if (typeof args.dt !== "number") {console.log(typeof args.dt);}
		if (args.dt > 0) {args.dt--; return false;}
		
		return true;
	},
	movePosition: function(obj, args) {
		// dt, x, y.
		if (typeof args.dt !== "number") {console.log(typeof args.dt);}
		if (typeof args.x !== "number") {console.log(typeof args.x);}
		if (typeof args.y !== "number") {console.log(typeof args.y);}
		if (args.dt === 0) {return true;}
		
		obj.x += (args.x - obj.x) / args.dt;
		obj.y += (args.y - obj.y) / args.dt;
		args.dt--;
		return false;
	},
	moveWithSpeed: function(obj, args) {
		// x, y, speed.
		if (typeof args.x !== "number") {console.log(typeof args.x);}
		if (typeof args.y !== "number") {console.log(typeof args.y);}
		if (typeof args.speed !== "number") {console.log(typeof args.speed);}
		
		var dx = args.x - obj.x;
		var dy = args.y - obj.y;
		var d = Math.sqrt(dx * dx + dy * dy);
		if (d === 0) {return true;}
		
		var speed = Math.min(args.speed, d);
		obj.x += dx * speed / d;
		obj.y += dy * speed / d;
		return false;
	},
	followWithSpeed: function(obj, args) {
		// target, speed.
		if (typeof args.target !== "object") {console.log(typeof args.target);}
		if (typeof args.speed !== "number") {console.log(typeof args.speed);}
		
		var dx = args.target.x - obj.x;
		var dy = args.target.y - obj.y;
		var d = Math.sqrt(dx * dx + dy * dy);
		if (d === 0) {return true;}
		
		var speed = Math.min(args.speed, d);
		obj.x += dx * speed / d;
		obj.y += dy * speed / d;
		return false;
	},
}

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
	if (typeof sources !== "object") {console.log(typeof sources);}
	if (typeof callback !== "function") {console.log(typeof callback);}

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

function thebeast_compareColors(a, b)
{
	return a[0] === b[0] &&
		a[1] === b[1] &&
		a[2] === b[2] &&
		a[3] === b[3];
}

function thebeast_loadMap(scene, map)
{
	if (typeof scene !== "object") {console.log(typeof scene);}
	if (typeof map !== "object") {console.log(typeof map);}

	var w = map.width;
	var h = map.height;
	
	var canvas = document.createElement("canvas");
	if (typeof canvas !== "object") {console.log(typeof canvas);}
	canvas.width = w;
	canvas.height = h;
	var context = canvas.getContext('2d');
	if (typeof context !== "object") {console.log(typeof context);}
	thebeast_setSmoothing(context, false);
	context.drawImage(map, 0, 0);
	
	var data = context.getImageData(0, 0, w, h).data;
	if (typeof data !== "object") {console.log(typeof data);}
	
	var box1Color = thebeast_getSetting("box1Color");
	var playerColor = thebeast_getSetting("playerColor");
	var units = 64;
	for (var x = 0; x < w; x++)
	{
		for (var y = 0; y < h; y++)
		{
			var i = x + w * y;
			var color = [data[i*4+0], data[i*4+1], data[i*4+2], data[i*4+3]];
			if (thebeast_compareColors(box1Color, color))
			{
				scene.objects.push(thebeast_newObject("box1", x * units, y * units, 0, 0));
			}
			else if (thebeast_compareColors(playerColor, color))
			{
				var player = thebeast_newObject("theBeast", x * units, y * units, 0, 0);
				scene.players.push(player);
			}
		}
	}
	
	scene.onload();
}

function thebeast_setSmoothing(context, val)
{
	if ("mozImageSmoothingEnabled" in context) {context.mozImageSmoothingEnabled = val;}
	else {console.log("Smoothing property not supported for browser");}
}

function thebeast_newScene(map, onload)
{
	if (typeof map !== "string") {console.log(typeof map);}
	if (typeof onload !== "function") {console.log(typeof onload);}

	return {
		"loadedMap": false,
		"loadedImages": false,
		"loaded": false,
		"objects": [],
		"players": [],
		"camera": 0,
		"cameras": [],
		"map": map,
		"onload": onload,
		"time": 0,
	};
}

function thebeast_newObject(type, x, y, vx, vy)
{
	if (typeof type !== "string") {console.log(typeof type);}
	if (typeof x !== "number") {console.log(typeof x);}
	if (typeof y !== "number") {console.log(typeof y);}
	if (typeof vx !== "number") {console.log(typeof vx);}
	if (typeof vy !== "number") {console.log(typeof vy);}
	
	return {
		"type": type,
		"x": x,
		"y": y,
		"vx": vx,
		"vy": vy,
		"actions": [],
	};
}

function thebeast_moveObject(obj)
{
	if (typeof obj !== "object") {console.log(typeof obj);}
	var actions = obj.actions;
	if (typeof actions !== "object") {console.log(typeof obj);}
	
	if (actions.length > 0)
	{
		var action = actions[0];
		var name = action.name;
		if (typeof name !== "string") {console.log(typeof name);}
		
		var f = thebeast_actions[name];
		if (f === null) {console.log("Could not find " + name + " among actions");}
		if (f(obj, action))
		{
			// Remove action since it is complete.
			actions.splice(0, 1);
		}
	}
	else
	{
		// Move with velocity.
		obj.x += obj.vx;
		obj.y += obj.vy;
	}
}

function thebeast_drawObject(context, obj)
{
	if (typeof context !== "object") {console.log(typeof context);}
	if (typeof obj !== "object") {console.log(typeof obj);}
	
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

function thebeast_render(canvas, context, scene)
{
	if (typeof canvas !== "object") {console.log(typeof canvas);}
	if (typeof context !== "object") {console.log(typeof context);}
	if (typeof scene !== "object") {console.log(typeof scene);}
	var objs = scene.objects;
	if (typeof objs !== "object") {console.log(typeof objs);}

	// Clear buffer.
	var w = canvas.width;
	var h = canvas.height;
	context.clearRect(0, 0, w, h);
	context.save();
	
	// Apply camera position.
	var cameraIndex = scene.camera;
	if (scene.cameras.length > cameraIndex)
	{
		var camera = scene.cameras[cameraIndex];
		var x = Math.floor(camera.x);
		var y = Math.floor(camera.y);
		context.translate(x, y);
	}

	// Draw objects
	var n = objs.length;
	for (var i = 0; i < n; i++)
	{
		thebeast_drawObject(context, objs[i]);
	}
	
	// Draw players.
	n = scene.players.length;
	for (var i = 0; i < n; i++)
	{
		var player = scene.players[i];
		thebeast_drawObject(context, player);
	}
	
	context.restore();
}

function thebeast_physics(scene)
{
	if (typeof scene !== "object") {console.log(typeof scene);}
	setInterval(function() {
		var loaded = scene.loaded;
		var objects = scene.objects;
		if (typeof loaded !== "boolean") {console.log(typeof loaded);}
		if (typeof objects !== "object") {console.log(typeof objects);}
		if (!loaded) {return;}
	
		var n = objects.length;
		for (var i = 0; i < n; i++)
		{
			var obj = objects[i];
			thebeast_moveObject(obj);
		}
		
		n = scene.players.length;
		for (var i = 0; i < n; i++)
		{
			var player = scene.players[i];
			thebeast_moveObject(player);
		}
		
		n = scene.cameras.length;
		for (var i = 0; i < n; i++)
		{
			var camera = scene.cameras[i];
			thebeast_moveObject(camera);
		}
		
		scene.time++;
	}, thebeast_getSetting("moveInterval"));
}

function thebeast_graphics(canvas, context, scene)
{
	if (typeof canvas !== "object") {console.log(typeof canvas);}
	if (typeof context !== "object") {console.log(typeof context);}
	if (typeof scene !== "object") {console.log(typeof scene);}
	
	setInterval(function() {
		var loaded = scene.loaded;
		if (!loaded) {return;}
		
		thebeast_render(canvas, context, scene);
	}, thebeast_getSetting("renderInterval"));
}

function thebeast_updateSceneState(scene)
{
	if (typeof scene !== "object") {console.log(typeof scene);}

	scene.loaded = scene.loadedImages && scene.loadedMap;
}

function thebeast_load(scene)
{
	if (typeof scene !== "object") {console.log(typeof scene);}

	var imageSources = thebeast_image_sources;
	thebeast_loadImages({"map": scene.map}, function(images) {
		var map = images.map;
		thebeast_loadMap(scene, map);
		scene.loadedMap = true;
		thebeast_updateSceneState(scene);
	});
	thebeast_loadImages(imageSources, function(images) {
		thebeast_images = images;
		scene.loadedImages = true;
		thebeast_updateSceneState(scene);
	});
}

function thebeast_setPosition(obj, dt, x, y)
{
	if (typeof obj !== "object") {console.log(typeof obj);}
	if (typeof dt !== "number") {console.log(typeof dt);}
	if (typeof x !== "number") {console.log(typeof x);}
	if (typeof y !== "number") {console.log(typeof y);}
	
	obj.actions.push({name: "setPosition", dt: dt, x: x, y: y});
}

function thebeast_movePosition(obj, dt, x, y)
{
	if (typeof obj !== "object") {console.log(typeof obj);}
	if (typeof dt !== "number") {console.log(typeof dt);}
	if (typeof x !== "number") {console.log(typeof x);}
	if (typeof y !== "number") {console.log(typeof y);}
	
	obj.actions.push({name: "movePosition", dt: dt, x: x, y: y});
}

function thebeast_moveWithSpeed(obj, speed, x, y)
{
	if (typeof obj !== "object") {console.log(typeof obj);}
	if (typeof speed !== "number") {console.log(typeof speed);}
	if (typeof x !== "number") {console.log(typeof x);}
	if (typeof y !== "number") {console.log(typeof y);}
	
	obj.actions.push({name: "moveWithSpeed", x: x, y: y, speed: speed});
}

function thebeast_followWithSpeed(obj, speed, target)
{
	if (typeof obj !== "object") {console.log(typeof obj);}
	if (typeof speed !== "number") {console.log(typeof speed);}
	if (typeof target !== "object") {console.log(typeof target);}
	
	obj.actions.push({name: "followWithSpeed", target: target, speed: speed});
}

function thebeast_wait(obj, dt)
{
	if (typeof obj !== "object") {console.log(typeof obj);}
	if (typeof dt !== "number") {console.log(typeof dt);}
	
	obj.actions.push({name: "wait", dt: dt});
}

function thebeast_addCamera(scene, x, y)
{
	if (typeof scene !== "object") {console.log(typeof scene);}
	if (typeof x !== "number") {console.log(typeof x);}
	if (typeof y !== "number") {console.log(typeof y);}
	
	scene.cameras.push(thebeast_newObject("camera", x, y, 0, 0));
	return scene.cameras.length - 1;
}

var thebeast = function()
{
	var boxId = thebeast_getSetting("boxId");
	var canvas = document.getElementById(boxId);
	if (typeof canvas !== "object") {console.log(typeof canvas);}
	var context = canvas.getContext('2d');
	if (typeof context !== "object") {console.log(typeof context);}
	
	// Load objects.
	var scene = thebeast_newScene("./images/map.png",
	function() {
		// Onload.
		// Add camera.
		thebeast_addCamera(scene, 0, 0);
		var camera = scene.cameras[0];
		var player = scene.players[0];
		
		thebeast_wait(camera, 200);
		// thebeast_movePosition(camera, 100, 100, 100);
		thebeast_followWithSpeed(camera, 0.1, player);
		
		thebeast_moveWithSpeed(player, 1, 100, 100);
		thebeast_moveWithSpeed(player, 1, 200, 100);
	});
	
	// Set rendering settings.
	thebeast_setSmoothing(context, false);
	
	// Physics.
	var loaded = false;
	thebeast_physics(scene);
	
	// Graphics.
	thebeast_graphics(canvas, context, scene);
	
	// Load assets.
	thebeast_load(scene);
}

window.addEventListener("load", thebeast, true);
