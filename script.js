import QuadTree from "./QuadTree.js"

const CURSOR_RADIUS = 300

const canvas = document.querySelector('canvas')
if(!canvas)
	throw new Error('No canvas found')

canvas.width = window.innerWidth * devicePixelRatio
canvas.height = window.innerHeight * devicePixelRatio

const ctx = canvas.getContext('2d')
if(!ctx)
	throw new Error('No context found')


const form = document.querySelector('form')
if(!form)
	throw new Error('No form found')

const numberOfPoints = Math.round(Math.sqrt(window.innerWidth * window.innerHeight))

start(ctx, numberOfPoints, form)

async function start(ctx, count, form) {
	const formData = ui(form)
	const points = Array(count).fill(0).map((_,id) => ({
		id,
		x: Math.random() * ctx.canvas.width,
		y: Math.random() * ctx.canvas.height,
		xSpeed: Math.random() * 2 - 1,
		ySpeed: Math.random() * 2 - 1,
		r: Math.random() * 2 + 1
	}))
	const tree = new QuadTree(0, 0, ctx.canvas.width, ctx.canvas.height)
	points.forEach(point => tree.insert(point))
	const mousePos = {
		x: 200,
		y: 200,
		r: CURSOR_RADIUS,
	}
	const world = {
		points,
		tree,
		mousePos,
		formData,
	}
	trackMousePos(ctx, world.mousePos)
	loop(ctx, world)
}

function ui(form) {
	function getFormData(form) {
		return {
			geometry: form.elements.geometry.checked,
		}
	}
	const formData = getFormData(form)
	form.addEventListener('input', () => {
		Object.assign(formData, getFormData(form))
	})
	return formData
}

function trackMousePos(ctx, mousePos) {
	ctx.canvas.addEventListener('mousemove', e => {
		mousePos.x = e.offsetX * devicePixelRatio
		mousePos.y = e.offsetY * devicePixelRatio
	})
}

async function loop(ctx, world) {
	await frame()
	const data = update(ctx, world)
	draw(ctx, world, data)
	loop(ctx, world)
}

function frame() {
	return new Promise(resolve => requestAnimationFrame(resolve))
}

function update(ctx, world) {
	world.points.forEach(point => {
		point.x += point.xSpeed
		point.y += point.ySpeed
		world.tree.displace(point)
		if(point.x < 0 || point.x > ctx.canvas.width) {
			point.xSpeed *= -1
		}
		if(point.y < 0 || point.y > ctx.canvas.height) {
			point.ySpeed *= -1
		}
	})
	const candidates = world.tree.filter(
		(quadrant) => rectCircleOverlap(quadrant, world.mousePos)
	)
	const points = candidates
		.filter(
			point => Math.hypot(point.x - world.mousePos.x, point.y - world.mousePos.y) < world.mousePos.r
		)
	return {points, candidates}
}

function draw(ctx, world, data) {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
	if (world.formData.geometry) {
		drawTree(ctx, world.tree)
		drawPoints(ctx, world.points)
	}
	drawPoints(ctx, data.candidates, '#808')
	drawPoints(ctx, data.points, '#0f0')
	if (world.formData.geometry) {
		drawMouse(ctx, world.mousePos)
	}
	drawConnections(ctx, data.points, world.tree)
}

function drawConnections(ctx, points, tree) {
	const distance = 60
	ctx.save()
	points.forEach(point => {
		tree
			.filter(
				(quadrant) => rectCircleOverlap(quadrant, {...point, r: distance})
			)
			.filter(
				neighbor => Math.hypot(neighbor.x - point.x, neighbor.y - point.y) < distance
			)
			.forEach(neighbor => {
				ctx.strokeStyle = `rgba(80,0,80,${Math.hypot(neighbor.x - point.x, neighbor.y - point.y) / distance / 2})`
				ctx.beginPath()
				ctx.moveTo(point.x, point.y)
				ctx.lineTo(neighbor.x, neighbor.y)
				ctx.stroke()
			})
	})
	ctx.restore()
}

function rectCircleOverlap(rect, circle) {
	// Find the nearest point on the rectangle to the center of the circle
	const x = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width))
	const y = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height))

	const dx = x - circle.x
	const dy = y - circle.y
	const r = circle.r

	return dx**2 + dy**2 <= r**2
}

function drawMouse(ctx, mousePos) {
	ctx.save()
	ctx.strokeStyle = '#0f0'
	ctx.beginPath()
	ctx.arc(mousePos.x, mousePos.y, mousePos.r, 0, Math.PI * 2)
	ctx.stroke()
	ctx.restore()
}

function drawPoints(ctx, points, color = '#f00') {
	ctx.save()
	ctx.fillStyle = color
	points.forEach(point => {
		ctx.beginPath()
		ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2)
		ctx.fill()
	})
	ctx.restore()
}

function drawTree(ctx, tree) {
	ctx.save()
	ctx.strokeStyle = '#fff3'
	ctx.beginPath()
	ctx.rect(tree.x, tree.y, tree.width, tree.height)
	ctx.stroke()
	if(tree.nodes.length) {
		tree.nodes.forEach(node => {
			drawTree(ctx, node)
		})
	}
	ctx.restore()
}

function drawBranch(ctx, quadrant) {
	drawQuadrant(ctx, quadrant)
	if(quadrant.parent) {
		drawBranch(ctx, quadrant.parent)
	}
}

function drawQuadrant(ctx, quadrant) {
	ctx.save()
	ctx.fillStyle = '#8085'
	// ctx.lineWidth = QuadTree.MAX_DEPTH - quadrant.depth
	ctx.beginPath()
	ctx.rect(quadrant.x, quadrant.y, quadrant.width, quadrant.height)
	ctx.fill()
	ctx.restore()
}
