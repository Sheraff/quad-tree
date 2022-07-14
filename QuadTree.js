export default class QuadTree {
	static MAX_OBJECTS = 4
	static MAX_DEPTH = 6
	static CURRENT_QUADRANT = Symbol()

	/**
	 * 
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} width 
	 * @param {number} height 
	 * @param {undefined | QuadTree} parent 
	 * @param {undefined | number} depth 
	 */
	constructor(x, y, width, height, parent = undefined, depth = 0) {
		this.x = x
		this.y = y
		this.width = width
		this.height = height
		this.objects = []
		this.nodes = []
		this.parent = parent
		this.depth = depth
	}

	#split() {
		const subWidth = this.width / 2
		const subHeight = this.height / 2
		const x = this.x
		const y = this.y
		this.nodes = [
			new QuadTree(x, y, subWidth, subHeight, this, this.depth + 1),
			new QuadTree(x + subWidth, y, subWidth, subHeight, this, this.depth + 1),
			new QuadTree(x, y + subHeight, subWidth, subHeight, this, this.depth + 1),
			new QuadTree(x + subWidth, y + subHeight, subWidth, subHeight, this, this.depth + 1),
		]
	}

	#getIndex(obj) {
		const indexX = obj.x > this.x + this.width / 2
		const indexY = obj.y > this.y + this.height / 2
		return +indexX + +indexY * 2
	}

	insert(obj) {
		if(this.nodes.length) {
			const index = this.#getIndex(obj)
			this.nodes[index].insert(obj)
			return
		}
		this.objects.push(obj)
		obj[QuadTree.CURRENT_QUADRANT] = this
		if(this.objects.length >= QuadTree.MAX_OBJECTS && this.depth < QuadTree.MAX_DEPTH) {
			this.#split()
		}
	}

	displace(obj) {
		const quadrant = obj[QuadTree.CURRENT_QUADRANT]
		if(quadrant && !quadrant.contains(obj)) {
			quadrant.remove(obj)
			this.insert(obj)
		}
	}


	remove(obj) {
		const index = this.objects.indexOf(obj)
		// if(index === -1) {
		// 	throw new Error('Object not found')
		// }
		this.objects.splice(index, 1)
		if (this.length < QuadTree.MAX_OBJECTS) {
			this.merge()
		}
	}

	merge() {
		if (this.parent && this.parent.length < QuadTree.MAX_OBJECTS) {
			this.parent.merge()
			return
		}
		if (this.nodes.length) {
			this.objects = this.getObjects()
			this.objects.forEach(obj => obj[QuadTree.CURRENT_QUADRANT] = this)
			this.nodes = []
		}
	}

	get length() {
		return this.objects.length + this.nodes.reduce((acc, node) => acc + node.length, 0)
	}

	getObjects() {
		const objects = [...this.objects]
		this.nodes.forEach(node => {
			objects.push(...node.getObjects())
		})
		return objects
	}

	getBranchObjects() {
		const objects = [...this.objects]
		if (this.parent) {
			objects.push(...this.parent.getBranchObjects())
		}
		return objects
	}

	contains(obj) {
		return obj.x >= this.x
			&& obj.x <= this.x + this.width
			&& obj.y >= this.y
			&& obj.y <= this.y + this.height
	}

	filter(callback, quadrants = []) {
		if(!this.nodes.length) {
			quadrants.push(this)
			return quadrants
		}
		this.nodes.forEach(node => {
			if (callback(node)) {
				node.filter(callback, quadrants)
			}
		})
		return quadrants
	}

}