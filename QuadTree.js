/** @template T */
export default class QuadTree {
	/** @typedef {{x: number, y: number}} Entity */

	static MAX_OBJECTS = 4
	static MAX_DEPTH = 6

	/** @type {WeakMap<T & Entity, QuadTree<T>>} */
	#objectQuadrantMap

	/** @type {null | [QuadTree<T>, QuadTree<T>, QuadTree<T>, QuadTree<T>]} */
	nodes = null

	/** @type {Set<T & Entity>} */
	objects = new Set()

	/**
	 * @param {number} x 
	 * @param {number} y 
	 * @param {number} width 
	 * @param {number} height 
	 * @param {QuadTree} [parent]
	 * @param {number} [depth]
	 * @param {WeakMap<T & Entity, QuadTree<T>>} [objectQuadrantMap]
	 */
	constructor(x, y, width, height, parent = undefined, depth = 0, objectQuadrantMap = new WeakMap()) {
		this.x = x
		this.y = y
		this.width = width
		this.height = height
		this.parent = parent
		this.depth = depth
		this.#objectQuadrantMap = objectQuadrantMap
	}

	#split() {
		const subWidth = this.width / 2
		const subHeight = this.height / 2
		const x = this.x
		const y = this.y
		this.nodes = [
			new QuadTree(x, y, subWidth, subHeight, this, this.depth + 1, this.#objectQuadrantMap),
			new QuadTree(x + subWidth, y, subWidth, subHeight, this, this.depth + 1, this.#objectQuadrantMap),
			new QuadTree(x, y + subHeight, subWidth, subHeight, this, this.depth + 1, this.#objectQuadrantMap),
			new QuadTree(x + subWidth, y + subHeight, subWidth, subHeight, this, this.depth + 1, this.#objectQuadrantMap),
		]
		this.objects.forEach(obj => this.insert(obj))
		this.objects.clear()
	}

	/** @param {T & Entity} obj */
	#getIndex(obj) {
		const indexX = obj.x > this.x + this.width / 2
		const indexY = obj.y > this.y + this.height / 2
		return +indexX + +indexY * 2
	}

	/** @param {T & Entity} obj */
	insert(obj) {
		if(this.nodes) {
			const index = this.#getIndex(obj)
			this.nodes[index].insert(obj)
			return
		}
		this.objects.add(obj)
		this.#objectQuadrantMap.set(obj, this)
		if(this.objects.size >= QuadTree.MAX_OBJECTS && this.depth < QuadTree.MAX_DEPTH) {
			this.#split()
		}
	}

	/** @param {T & Entity} obj */
	displace(obj) {
		const quadrant = this.#objectQuadrantMap.get(obj)
		if(quadrant && !quadrant.isWithinBounds(obj)) {
			quadrant.remove(obj)
			this.insert(obj)
		}
	}

	/** @param {T & Entity} obj */
	remove(obj) {
		this.objects.delete(obj)
		if (this.length < QuadTree.MAX_OBJECTS) {
			this.merge()
		}
	}

	merge() {
		if (this.parent && this.parent.length < QuadTree.MAX_OBJECTS) {
			this.parent.merge()
			return
		}
		if (this.nodes) {
			this.collectChildrenObjects()
			this.objects.forEach(obj => this.#objectQuadrantMap.set(obj, this))
			this.nodes = null
		}
	}

	get length() {
		return this.objects.size + this.nodes?.reduce((acc, node) => acc + node.length, 0)
	}

	collectChildrenObjects(set = this.objects) {
		if (set !== this.objects) {
			this.objects.forEach(obj => set.add(obj))
		}
		this.nodes?.forEach(node => {
			node.collectChildrenObjects(set)
		})
	}

	/**
	 * @template U
	 * @param {U & Entity} obj
	 */
	isWithinBounds(obj) {
		return obj.x >= this.x
			&& obj.x <= this.x + this.width
			&& obj.y >= this.y
			&& obj.y <= this.y + this.height
	}

	/**
	 * @param {(node: QuadTree<T>) => boolean} callback
	 * @param {Array<T & Entity>} objects
	 */
	filter(callback, objects = []) {
		if(!this.nodes) {
			objects.push(...this.objects)
			return objects
		}
		this.nodes.forEach(node => {
			if (callback(node)) {
				node.filter(callback, objects)
			}
		})
		return objects
	}

}