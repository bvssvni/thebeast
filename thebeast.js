/**
 * thebeast, An open source game in HTML and Javascript about a beast living in the forest.
 *
 * @version 0.000, http://isprogrammingeasy.blogspot.no/2012/08/angular-degrees-versioning-notation.html
 * @license GNU Lesser General Public License, http://www.gnu.org/copyleft/lesser.html
 * @author  Sven Nilsen, http://www.cutoutpro.com
 * @link    http://www.github.com/bvssvni/thebeast
 *
 */

// These settings are set once and not modified during the game.
var thebeast_settings = {
	boxId: "box",
	moveInterval: 10,
	renderInterval: 25,
	playerColor: [0, 0, 255, 255],
	box1Color: [255, 0, 0, 255],
	tree1Color: [0, 255, 0, 255],
	units: 32,
	cameraSpeed: 10,
	playerMaxSpeed: 0.03125,
	playerAcceleration: 0.5,
	playerCollisionOffset: [0.25, 0.8, 0.25, 0],
	treeCollisionOffset: [0.4, 0.8, 0.4, 0],
	box1CollisionOffset: [0, 0, 0, 0],
	// These images are set once through loading.
	images: null,
	imageSources: {
		"thebeast-front": "./images/thebeast-front.png",
		"thebeast-back": "./images/thebeast-back.png",
		"thebeast-left": "./images/thebeast-left.png",
		"thebeast-right": "./images/thebeast-right.png",
		"box1": "./images/box1.png",
		"tree1": "./images/tree1.png",
	},
	keyboardConfig: {
		37: "playerTwo-left",
		38: "playerTwo-up",
		39: "playerTwo-right",
		40: "playerTwo-down",
		65: "playerOne-left",
		68: "playerOne-right",
		83: "playerOne-down",
		87: "playerOne-up",
	},
	objectTypes: {
		box1: true,
		tree1: true,
		theBeast: true,
	},
};

// Contains which keys are pressed at the keyboard.
var thebeast_keyboardState = {};

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
		if (Math.abs(d) < 0.001) {return true;}
		
		var speed = Math.min(args.speed, d);
		obj.x += dx * speed / d;
		obj.y += dy * speed / d;
		return false;
	},
	followWithSpeed: function(obj, args) {
		// target, speed, callback.
		if (typeof args.target !== "object") {console.log(typeof args.target);}
		if (typeof args.speed !== "number") {console.log(typeof args.speed);}
		if (typeof args.callback !== "function") {console.log(typeof args.callback);}
		
		var dx = args.target.x - obj.x;
		var dy = args.target.y - obj.y;
		var d = Math.sqrt(dx * dx + dy * dy);
		if (Math.abs(d) < 0.001) {return args.callback(args.target);}
		
		var speed = Math.min(args.speed, d);
		obj.x += dx * speed / d;
		obj.y += dy * speed / d;
		return args.callback(args.target);
	},
	sendMessage: function(obj, args) {
		// target, title, message.
		if (typeof args.target !== "object") {console.log(typeof args.target);}
		if (typeof args.title !== "string") {console.log(typeof args.title);}
		if (typeof args.message !== "object") {console.log(typeof args.message);}
		
		args.target.messages.push({title: args.title, body: args.message});
		return true;
	},
	waitForMessage: function(obj, args) {
		// title, callback.
		if (typeof args.title !== "string") {console.log(typeof args.title);}
		if (typeof args.callback !== "function") {console.log(typeof args.callback);}
		
		var n = obj.messages.length;
		if (n === 0) {return false;}
		
		var message = obj.messages[0];
		if (message.title !== args.title) {return false;}
		
		obj.messages.splice(0, 1);
		args.callback(message.body);
		return true;
	},
}

function thebeast_getObjectType(settings, str)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof str !== "string") {console.log(typeof str);}
	
	var type = settings.objectTypes[str];
	if (type !== true)
	{
		console.log("Could not find type " + str + " listed in object types");
		console.log(type);
	}
	
	return str;
}

function thebeast_getSetting(settings, id)
{
	if (typeof settings !== "object") {console.log(settings);}
	if (typeof id !== "string") {console.log(id);}

	var setting = settings[id];
	if (setting === null)
	{
		console.log("Setting " + id + " is not listed in settings");
	}
	
	return setting;
}

function thebeast_getImage(settings, id)
{
	if (typeof settings !== "object") {console.log(settings);}
	if (typeof id !== "string") {console.log(id);}

	var image = settings.images[id];
	if (image === null)
	{
		console.log("Image " + id + " is not listed among images");
	}
	
	return image;
}

function thebeast_getKeyboardConfig(settings, keyCode)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof keyCode !== "number") {console.log(typeof keyCode);}
	var config = settings.keyboardConfig[keyCode];
	if (config === null) {console.log("key code " + keyCode + " not listed in keyboard configuration");}
	return config;
}

function thebeast_setKey(settings, keyCode, val)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof keyCode !== "number") {console.log(typeof keyCode);}
	if (typeof val !== "boolean") {console.log(typeof val);}
	
	var config = thebeast_getKeyboardConfig(settings, keyCode);
	if (config === null) {return;}
	if (val)
	{
		thebeast_keyboardState[config] = true;
	}
	else
	{
		delete thebeast_keyboardState[config];
	}
}

function thebeast_isKeyPressed(config)
{
	if (typeof config !== "string") {console.log(typeof config);}
	if (config.indexOf("playerOne-") === -1 && config.indexOf("playerTwo-") === -1)
	{
		return thebeast_isKeyPressed("playerOne-" + config) || thebeast_isKeyPressed("playerTwo-" + config);
	}

	var pressed = thebeast_keyboardState[config] ? true : false;
	return pressed;
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

function thebeast_addObjectToScene(settings, scene, obj)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof scene !== "object") {console.log(typeof scene);}
	if (typeof obj !== "object") {console.log(typeof obj);}

	var playerObjectType = thebeast_getObjectType(settings, "theBeast");
	var box1ObjectType = thebeast_getObjectType(settings, "box1");
	var tree1ObjectType = thebeast_getObjectType(settings, "tree1");
	var units = thebeast_getSetting(settings, "units");
	var playerMaxSpeed = thebeast_getSetting(settings, "playerMaxSpeed") * units;
	var playerAcceleration = thebeast_getSetting(settings, "playerAcceleration");
		
	if (obj.type === playerObjectType)
	{
		var player = obj;
	
		// Move object with keyboard.
		player.idle = function() {
			var vx = player.leftRight;
			var vy = player.upDown;
			var v = Math.sqrt(vx * vx + vy * vy) / playerMaxSpeed;
			vx = v === 0 ? 0 : vx / v;
			vy = v === 0 ? 0 : vy / v;
			player.vx += playerAcceleration * (vx - player.vx);
			player.vy += playerAcceleration * (vy - player.vy);
		};
		
		scene.players.push(player);
	}
	else if (obj.type === box1ObjectType)
	{
		scene.objects.push(obj);
	}
	else if (obj.type === tree1ObjectType)
	{
		scene.objects.push(obj);
	}
}

function thebeast_objectTypeFromColor(settings, color)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof color !== "object") {console.log(typeof color);}
	
	var box1Color = thebeast_getSetting(settings, "box1Color");
	var playerColor = thebeast_getSetting(settings, "playerColor");
	var tree1Color = thebeast_getSetting(settings, "tree1Color");
	var box1Type = thebeast_getObjectType(settings, "box1");
	var tree1Type = thebeast_getObjectType(settings, "tree1");
	var playerType = thebeast_getObjectType(settings, "theBeast");
	if (thebeast_compareColors([0, 0, 0, 0], color)) {return null;}
	else if (thebeast_compareColors(box1Color, color)) {return box1Type;}
	else if (thebeast_compareColors(playerColor, color)) {return playerType;}
	else if (thebeast_compareColors(tree1Color, color)) {return tree1Type;}
	else {console.log("Unknown color [" + color[0] + "," + color[1] + "," + color[2] + "," + color[3] + "]");}
}

function thebeast_loadMap(settings, scene, map)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
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
	
	var units = thebeast_getSetting(settings, "units");
	for (var x = 0; x < w; x++)
	{
		for (var y = 0; y < h; y++)
		{
			var i = x + w * y;
			var color = [data[i*4+0], data[i*4+1], data[i*4+2], data[i*4+3]];
			var type = thebeast_objectTypeFromColor(settings, color);
			if (type === null) {continue;}
			var obj = thebeast_newObject(type, x * units, y * units, 0, 0);
			thebeast_addObjectToScene(settings, scene, obj);
		}
	}
	
	scene.onload();
}

function thebeast_setSmoothing(context, val)
{
	if ("mozImageSmoothingEnabled" in context) {context.mozImageSmoothingEnabled = val;}
	else {console.log("Smoothing property not supported for browser");}
}

function thebeast_newScene(width, height, map, onload)
{
	if (typeof width !== "number") {console.log(typeof width);}
	if (typeof height !== "number") {console.log(typeof height);}
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
		"width": width,
		"height": height,
		"paused": false,
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
		type: type,
		x: x,
		y: y,
		oldX: x,
		oldY: y,
		vx: vx,
		vy: vy,
		dirX: 0,
		dirY: 1,
		actions: [],
		messages: [],
		idle: null,
		leftRight: 0,
		upDown: 0,
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
		if (obj.idle !== null) {obj.idle();}
	
		// Move with velocity.
		obj.x += obj.vx;
		obj.y += obj.vy;
	}
}

// Returns the camera view as AABB rectangle.
function thebeast_cameraView(scene, camera)
{
	if (typeof scene !== "object") {console.log(typeof scene);}
	if (typeof camera !== "object") {console.log(typeof camera);}
	
	var x = Math.floor(camera.x - scene.width * 0.5);
	var y = Math.floor(camera.y - scene.height * 0.5);
	return [x, y, x + scene.width, y + scene.height];
}

function thebeast_outsideCameraView(settings, cameraView, obj)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof cameraView !== "object") {console.log(typeof camereaView);}
	if (typeof obj !== "object") {console.log(typeof obj);}
	
	var units = thebeast_getSetting(settings, "units");
	return obj.x + units <= cameraView[0] ||
		obj.y + units <= cameraView[1] ||
		obj.x >= cameraView[2] ||
		obj.y >= cameraView[3];
}

function thebeast_cover(settings, objA, objB)
{
	if (typeof settings !== "object") {console.log(settings);}
	if (typeof objA !== "object") {console.log(typeof objA);}
	if (typeof objB !== "object") {console.log(typeof objB);}
	
	var units = thebeast_getSetting(settings, "units");
	var intersectsX = objA.x + units >= objB.x && objA.x <= objB.x + units;
	var intersectsY = objA.y + units >= objB.y && objA.y <= objB.y + units;
	if (!intersectsX || !intersectsY) {return 0;}
	
	var coverX = units - Math.abs(objA.x - objB.x);
	var coverY = units - Math.abs(objA.y - objB.y);
	coverX /= units;
	coverY /= units;
	return coverX * coverY;
}

function thebeast_playerCover(settings, players, obj)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof players !== "object") {console.log(typeof players);}
	if (typeof obj !== "object") {console.log(typeof obj);}

	var maxCover = 0;
	var n = players.length;
	for (var i = 0; i < n; i++)
	{
		var player = players[i];
		if (player.y > obj.y) {continue;}
		
		var cover = thebeast_cover(settings, player, obj);
		maxCover = Math.max(maxCover, cover);
	}
	
	return maxCover;
}

function thebeast_drawObject(settings, context, scene, obj)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof context !== "object") {console.log(typeof context);}
	if (typeof scene !== "object") {console.log(typeof scene);}
	if (typeof obj !== "object") {console.log(typeof obj);}
	
	var units = thebeast_getSetting(settings, "units");
	var playerType = thebeast_getObjectType(settings, "theBeast");
	var box1Type = thebeast_getObjectType(settings, "box1");
	var tree1Type = thebeast_getObjectType(settings, "tree1");
	if (obj.type === playerType)
	{
		var image = null;
		if (obj.dirY > 0) {image = thebeast_getImage(settings, "thebeast-front");}
		else if (obj.dirY < 0) {image = thebeast_getImage(settings, "thebeast-back");}
		else if (obj.dirX > 0) {image = thebeast_getImage(settings, "thebeast-right");}
		else {image = thebeast_getImage(settings, "thebeast-left");}
		context.drawImage(image, obj.x, obj.y, units, units);
	}
	else if (obj.type === box1Type)
	{
		var image = thebeast_getImage(settings, "box1");
		context.drawImage(image, obj.x, obj.y, units, units);
	}
	else if (obj.type === tree1Type)
	{
		// Detect cover with player.
		var cover = thebeast_playerCover(settings, scene.players, obj);
		var image = thebeast_getImage(settings, "tree1");
		if (cover > 0)
		{
			context.save();
			context.globalAlpha = 1 - 0.5 * cover;
			context.drawImage(image, obj.x, obj.y, units, units);
			context.restore();
		}
		else
		{
			context.drawImage(image, obj.x, obj.y, units, units);
		}
	}
}

function thebeast_paintList(scene)
{
	var list = [];
	var n = scene.objects.length;
	for (var i = 0; i < n; i++)
	{
		var obj = scene.objects[i];
		list.push(obj);
	}
	
	n = scene.players.length;
	for (var i = 0; i < n; i++)
	{
		var player = scene.players[i];
		list.push(player);
	}
	
	list.sort(function(a, b) {
		return a.y - b.y;
	});
	return list;
}

function thebeast_render(settings, canvas, context, scene)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
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
		var x = Math.floor(-camera.x + 0.5 * w);
		var y = Math.floor(-camera.y + 0.5 * h);
		context.translate(x, y);
	}
	
	var paintList = thebeast_paintList(scene);
	var n = paintList.length;
	for (var i = 0; i < n; i++)
	{
		thebeast_drawObject(settings, context, scene, paintList[i]);
	}
	
	context.restore();
}

// co - collision offset.
function thebeast_doesCollide(settings, objA, objB, coA, coB)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof objA !== "object") {console.log(typeof objA);}
	if (typeof objB !== "object") {console.log(typeof objB);}
	if (typeof coA !== "object") {console.log(typeof coA);}
	if (typeof coB !== "object") {console.log(typeof coB);}
	
	var units = thebeast_getSetting(settings, "units");
	var aLeft = objA.x + coA[0] * units;
	var aRight = objA.x + units - coA[2] * units;
	var aTop = objA.y + coA[1] * units;
	var aBottom = objA.y + units - coA[3] * units;
	var bLeft = objB.x + coB[0] * units;
	var bRight = objB.x + units - coB[2] * units;
	var bTop = objB.y + coB[1] * units;
	var bBottom = objB.y + units - coB[3] * units;
	
	return aLeft < bRight &&
		aRight > bLeft &&
		aTop < bBottom &&
		aBottom > bTop;
}

// Computes the separation vector from a point to a line.
function thebeast_separation(px, py, x, y, nx, ny)
{
	var dx = x - px;
	var dy = y - py;
	var dot = dx * nx + dy * ny;
	return {x: dx - dot * nx, y: dy - dot * ny};
}

// Returns the least seperation of four given a displacement.
// Each separation can be computed using 'seperation' function.
// The dot product with the displacement,
// is less for the separation with small magnitue and in opposite direction.
// The seperation returned can be used to correct collision with rectangles.
function thebeast_leastSeparation4(sep1, sep2, sep3, sep4)
{
	var dot1 = sep1.x * sep1.x + sep1.y * sep1.y;
	var dot2 = sep2.x * sep2.x + sep2.y * sep2.y;
	var dot3 = sep3.x * sep3.x + sep3.y * sep3.y;
	var dot4 = sep4.x * sep4.x + sep4.y * sep4.y;
	return dot1 < dot2 ?
		(dot3 < dot4 ?
			(dot1 < dot3 ? sep1 : sep3) :
			(dot1 < dot4 ? sep1 : sep4)
		) :
		(dot3 < dot4 ?
			(dot2 < dot3 ? sep2 : sep3) :
			(dot2 < dot4 ? sep2 : sep4)
		);
}

// co - collision offset.
// Moves object A such that it does not intersect with B.
function thebeast_solveCollision(settings, objA, objB, coA, coB)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof objA !== "object") {console.log(typeof objA);}
	if (typeof objB !== "object") {console.log(typeof objB);}
	if (typeof coA !== "object") {console.log(typeof coA);}
	if (typeof coB !== "object") {console.log(typeof coB);}

	var units = thebeast_getSetting(settings, "units");
	var left = objB.x + coB[0] * units - units + coA[2] * units;
	var top = objB.y + coB[1] * units - units + coA[3] * units;
	var right = objB.x - coB[2] * units + units - coA[0] * units;
	var bottom = objB.y - coB[3] * units + units - coA[1] * units;
	
	var x = objA.x;
	var y = objA.y;
	
	var topSep = thebeast_separation(x, y, left, top, 1, 0);
	var rightSep = thebeast_separation(x, y, right, top, 0, 1);
	var bottomSep = thebeast_separation(x, y, right, bottom, -1, 0);
	var leftSep = thebeast_separation(x, y, left, top, 0, 1);
	
	var minSep = thebeast_leastSeparation4(topSep, rightSep, bottomSep, leftSep);
	
	objA.x += minSep.x;
	objA.y += minSep.y;
	objA.vx += minSep.x;
	objA.vy += minSep.y;
}

function thebeast_collision(settings, scene)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof scene !== "object") {console.log(typeof scene);}

	var players = scene.players;
	var objects = scene.objects;
	var n = players.length;
	var m = objects.length;
	var playerOffset = thebeast_getSetting(settings, "playerCollisionOffset");
	var treeOffset = thebeast_getSetting(settings, "treeCollisionOffset");
	var box1Offset = thebeast_getSetting(settings, "box1CollisionOffset");
	var box1Type = thebeast_getObjectType(settings, "box1");
	var tree1Type = thebeast_getObjectType(settings, "tree1");
	var objOffset = null;
	for (var i = 0; i < n; i++)
	{
		var player = players[i];
		for (var j = 0; j < m; j++)
		{
			var obj = objects[j];
			if (obj.type === tree1Type)
			{
				objOffset = treeOffset;
			}
			else if (obj.type === box1Type)
			{
				objOffset = box1Offset;
			}
			else
			{
				continue;
			}
			
			var collides = thebeast_doesCollide(settings, player, obj, playerOffset, objOffset);
			if (collides)
			{
				thebeast_solveCollision(settings, player, obj, playerOffset, objOffset);
			}
		}
	}
}

function thebeast_physics(settings, scene)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof scene !== "object") {console.log(typeof scene);}
	setInterval(function() {
		if (scene.paused) {return;}
	
		var loaded = scene.loaded;
		var objects = scene.objects;
		if (typeof loaded !== "boolean") {console.log(typeof loaded);}
		if (typeof objects !== "object") {console.log(typeof objects);}
		var players = scene.players;
		if (typeof players !== "object") {console.log(typeof players);}
		var cameras = scene.cameras;
		if (typeof cameras !== "object") {console.log(typeof cameras);}
		if (!loaded) {return;}
	
		// Update old position of objects.
		var n = objects.length;
		for (var i = 0; i < n; i++)
		{
			var obj = objects[i];
			obj.oldX = obj.x;
			obj.oldY = obj.y;
		}
		
		n = players.length;
		for (var i = 0; i < n; i++)
		{
			// Update old position of players.
			var player = players[i];
			player.oldX = player.x;
			player.oldY = player.y;
			
			// Update direction by input.
			if (player.leftRight !== 0 || player.upDown !== 0)
			{
				player.dirX = player.leftRight;
				player.dirY = player.upDown;
			}
		}
		
		// Update old position of cameras.
		n = cameras.length;
		for (var i = 0; i < n; i++)
		{
			var camera = cameras[i];
			camera.oldX = camera.x;
			camera.oldY = camera.y;
		}
		
		// Move objects.
		n = objects.length;
		for (var i = 0; i < n; i++)
		{
			var obj = objects[i];
			thebeast_moveObject(obj);
		}
		
		// Move players.
		n = players.length;
		for (var i = 0; i < n; i++)
		{
			var player = players[i];
			thebeast_moveObject(player);
		}
		
		thebeast_collision(settings, scene);
		
		// Move cameras.
		n = scene.cameras.length;
		for (var i = 0; i < n; i++)
		{
			var camera = cameras[i];
			thebeast_moveObject(camera);
		}
		
		scene.time++;
	}, thebeast_getSetting(settings, "moveInterval"));
}

function thebeast_graphics(settings, canvas, context, scene)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof canvas !== "object") {console.log(typeof canvas);}
	if (typeof context !== "object") {console.log(typeof context);}
	if (typeof scene !== "object") {console.log(typeof scene);}
	
	setInterval(function() {
		var loaded = scene.loaded;
		if (!loaded) {return;}
		
		thebeast_render(settings, canvas, context, scene);
	}, thebeast_getSetting(settings, "renderInterval"));
}

function thebeast_updateSceneState(scene)
{
	if (typeof scene !== "object") {console.log(typeof scene);}

	scene.loaded = scene.loadedImages && scene.loadedMap;
}

function thebeast_load(settings, scene)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof scene !== "object") {console.log(typeof scene);}

	var imageSources = settings.imageSources;
	thebeast_loadImages({"map": scene.map}, function(images) {
		var map = images.map;
		thebeast_loadMap(settings, scene, map);
		scene.loadedMap = true;
		thebeast_updateSceneState(scene);
	});
	thebeast_loadImages(imageSources, function(images) {
		settings.images = images;
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

function thebeast_followWithSpeed(obj, speed, target, callback)
{
	if (typeof obj !== "object") {console.log(typeof obj);}
	if (typeof speed !== "number") {console.log(typeof speed);}
	if (typeof target !== "object") {console.log(typeof target);}
	if (typeof callback !== "function") {console.log(typeof callback);}
	
	obj.actions.push({name: "followWithSpeed", target: target, speed: speed, callback: callback});
}

function thebeast_wait(obj, dt)
{
	if (typeof obj !== "object") {console.log(typeof obj);}
	if (typeof dt !== "number") {console.log(typeof dt);}
	
	obj.actions.push({name: "wait", dt: dt});
}

function thebeast_sendMessage(obj, target, title, message)
{
	if (typeof obj !== "object") {console.log(typeof obj);}
	if (typeof target !== "object") {console.log(typeof target);}
	if (typeof title !== "string") {console.log(typeof title);}
	if (typeof message !== "object") {console.log(typeof message);}
	
	obj.actions.push({name: "sendMessage", target: target, title: title, message: message});
}

function thebeast_waitForMessage(obj, title, callback)
{
	if (typeof obj !== "object") {console.log(typeof obj);}
	if (typeof title !== "string") {console.log(typeof title);}
	if (typeof callback !== "function") {console.log(typeof callback);}
	
	obj.actions.push({name: "waitForMessage", title: title, callback: callback});
}

function thebeast_addCamera(scene, x, y, onidle)
{
	if (typeof scene !== "object") {console.log(typeof scene);}
	if (typeof x !== "number") {console.log(typeof x);}
	if (typeof y !== "number") {console.log(typeof y);}
	
	var camera = thebeast_newObject("camera", x, y, 0, 0);
	camera.idle = onidle;
	scene.cameras.push(camera);
	return scene.cameras.length - 1;
}

function thebeast_setCameraToObject(scene, camera, obj)
{
	var x = obj.x - (obj.x % scene.width) + 0.5 * scene.width;
	var y = obj.y - (obj.y % scene.height) + 0.5 * scene.height;
	thebeast_setPosition(camera, 0, x, y);
}

function thebeast_moveCameraToObject(settings, scene, camera, obj)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof scene !== "object") {console.log(typeof scene);}
	if (typeof camera !== "object") {console.log(typeof camera);}
	if (typeof obj !== "object") {console.log(typeof obj);}
	
	var x = obj.x - (obj.x % scene.width) + 0.5 * scene.width;
	var y = obj.y - (obj.y % scene.height) + 0.5 * scene.height;
	var cameraSpeed = thebeast_getSetting(settings, "cameraSpeed");
	thebeast_moveWithSpeed(camera, cameraSpeed, x, y);
}

function thebeast_mousePosition(canvas, scene, event)
{
	if (typeof canvas !== "object") {console.log(typeof canvas);}
	if (typeof scene !== "object") {console.log(typeof scene);}
	event = event || window.event;
	if (typeof event !== "object") {console.log(typeof event);}
	
	var x = event.clientX - canvas.offsetLeft;
	var y = event.clientY - canvas.offsetTop;
	var camera = scene.cameras[scene.camera];
	x += camera.x - 0.5 * scene.width;
	y += camera.y - 0.5 * scene.height;
	return {x: x, y: y};
}

function thebeast_movePlayerToMousePosition(settings, canvas, scene, event)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof canvas !== "object") {console.log(typeof canvas);}
	if (typeof scene !== "object") {console.log(typeof scene);}
	if (typeof event !== "object") {console.log(typeof event);}

	var player = scene.players[0];
	var pos = thebeast_mousePosition(canvas, scene, event);
	var units = thebeast_getSetting(settings, "units");
	var x = pos.x - 0.5 * units;
	var y = pos.y - units;
	player.actions = [];
	thebeast_moveWithSpeed(player, 1, x, y);
}

function thebeast_createSlideCamera(settings, scene)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof scene !== "object") {console.log(typeof scene);}

	var player = scene.players[0];
	thebeast_addCamera(scene, 0, 0, function() {
		var camera = scene.cameras[0];
		var cameraView = thebeast_cameraView(scene, camera);
		var playerOutside = thebeast_outsideCameraView(settings, cameraView, player);
		if (!playerOutside) {return;}
		
		thebeast_moveCameraToObject(settings, scene, camera, player);
	});
	var camera = scene.cameras[0];
	
	thebeast_setCameraToObject(scene, camera, player);
}

function thebeast_updatePlayerInput(scene)
{
	if (typeof scene !== "object") {console.log(typeof scene);}
	if (!scene.loaded) {return;}

	var player = scene.players[0];
	var leftPressed = thebeast_isKeyPressed("left");
	var rightPressed = thebeast_isKeyPressed("right");
	var upPressed = thebeast_isKeyPressed("up");
	var downPressed = thebeast_isKeyPressed("down");
	var leftRight = 0;
	var upDown = 0;
	if (leftPressed) {leftRight--;}
	if (rightPressed) {leftRight++;}
	if (upPressed) {upDown--;}
	if (downPressed) {upDown++;}
	
	player.leftRight = leftRight;
	player.upDown = upDown;
}

function thebeast_keyboard(settings, scene)
{
	if (typeof settings !== "object") {console.log(typeof settings);}
	if (typeof scene !== "object") {console.log(typeof scene);}
	var onkeydown = function(event) {
		var event = event || window.event;
		var keyCode = event.keyCode;
		thebeast_setKey(settings, keyCode, true);
		thebeast_updatePlayerInput(scene);
	};
	window.addEventListener("keydown", onkeydown, false);
	
	var onkeyup = function(event) {
		var event = event || window.event;
		var keyCode = event.keyCode;
		thebeast_setKey(settings, keyCode, false);
		thebeast_updatePlayerInput(scene);
	};
	window.addEventListener("keyup", onkeyup, false);
}

var thebeast = function()
{
	var settings = thebeast_settings;
	var boxId = thebeast_getSetting(settings, "boxId");
	var canvas = document.getElementById(boxId);
	if (typeof canvas !== "object") {console.log(typeof canvas);}
	var context = canvas.getContext('2d');
	if (typeof context !== "object") {console.log(typeof context);}
	
	var onload = function() {
		thebeast_createSlideCamera(settings, scene);
	};
	
	var onmousedown = function(event) {
	
	};
	canvas.addEventListener("mousedown", onmousedown, true);
	
	// Load objects.
	var scene = thebeast_newScene(canvas.width, canvas.height, "./images/map.png", onload);
	
	// Handle keyboard input.
	thebeast_keyboard(settings, scene);
	
	// Set rendering settings.
	thebeast_setSmoothing(context, false);
	
	// Physics.
	var loaded = false;
	thebeast_physics(settings, scene);
	
	// Graphics.
	thebeast_graphics(settings, canvas, context, scene);
	
	// Load assets.
	thebeast_load(settings, scene);
}

window.addEventListener("load", thebeast, true);
