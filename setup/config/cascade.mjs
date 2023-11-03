import * as readline from 'readline';

export default class Cascade extends Array {
	
	static $get = Symbol('Cascade.$get');
	static $merge = Symbol('Cascade.$merge');
	
	static get(object, ...keys) {
		
		return	keys.length ?
						object && typeof object === 'object' ? Cascade.get(object[keys[0]], ...keys.slice(1)) : undefined :
						object;
		
	}
	static geti(object, ...keys) {
		
		if (keys.length) {
			
			if (object && typeof object === 'object') {
				
				const propNames = Object.keys(object), propNamesLength = propNames.length, key = keys[0].toLowerCase();
				let i;
				
				i = -1;
				while (++i < propNamesLength && propNames[i].toLowerCase() !== key);
				
				if (i !== propNamesLength) return Cascade.geti(object[propNames[i]], ...keys.slice(1));
				
			}
			
			return undefined;
			
		}
		
		return object;
		
	}
	
	constructor() { super(...arguments); }
	
	get() {
		
		return this[Cascade.$get](Cascade.get, false, arguments);
		
	}
	getAll() {
		
		return this[Cascade.$get](Cascade.get, true, arguments);
		
	}
	geti() {
		
		return this[Cascade.$get](Cascade.geti, false, arguments);
		
	}
	getiAll() {
		
		return this[Cascade.$get](Cascade.geti, true, arguments);
		
	}
	merge() {
		
		return this[Cascade.$merge](this.getAll, arguments);
		
	}
	mergei() {
		
		return this[Cascade.$merge](this.getiAll, arguments);
		
	}
	merger() {
		
		return new Cascade(...this).reverse().merge(...arguments);
		
	}
	mergeri() {
		
		return new Cascade(...this).reverse().mergei(...arguments);
		
	}
	
}
Cascade.prototype[Cascade.$get] = function (method, all, keys) {
	
	if (typeof method === 'function') {
		
		const { length } = this, values = all && [];
		let i,i0,v;
		
		i = i0 = -1;
		while (++i < length) {
			
			if ((v = method(this[i], ...keys)) !== undefined) {
				
				if (!values) return v;
				
				values[++i0] = v;
				
			}
			
		}
		
		return values || undefined;
		
	}
	
},
Cascade.prototype[Cascade.$merge] = function (method, keys) {
	
	if (typeof method === 'function') {
		
		const { iterator } = Symbol, values = method.apply(this, keys).reverse(), valuesLength = values.length;
		let i, v;
		
		i = -1;
		while (++i < valuesLength && !((v = values[i]) && typeof v === 'object'));
		
		if (i === valuesLength) return v;
		else if (typeof v[iterator] === 'function') {
			
			const merged = [];
			
			i = -1;
			while (++i < valuesLength) typeof (v = values[i])[iterator] === 'function' && merged.push(...v);
			
			return merged;
			
		} else return Object.assign({}, ...values);
		
	}
	
};

export class Placeholder extends Cascade {
	
	static innerRx = /\s*?\[\s*?([^\s\[\]]+?)\s*?\]\s*?/gm;
	static outerRx = /<\s*?(\[.*?\])\s*?>/gm;
	
	constructor(placeholders, outerRx, innerRx) {
		
		Array.isArray(placeholders) || (placeholders = [ placeholders ]),
		
		super(...placeholders);
		
		const { constructor: { innerRx: irx, outerRx: orx } } = this;
		
		this.outerRx = outerRx instanceof RegExp ? outerRx : orx,
		this.innerRx = innerRx instanceof RegExp ? innerRx : irx;
		
	}
	
	replace(str) {
		
		const { innerRx, outerRx } = this, keys = [];
		let i, v, replaced, lastIndex;
		
		i = -1, replaced = '', lastIndex = 0;
		for (const { 0: outer, 1: outerContent, index: outerIndex } of str.matchAll(outerRx)) {
			
			i = -1, keys.length = 0;
			for (const { 1: innerContent } of outerContent.matchAll(innerRx)) keys[++i] = innerContent?.trim?.();
			
			i === -1 ||	(v = this.geti(...keys)) === undefined ||
				(replaced += str.substring(lastIndex, outerIndex) + v, lastIndex = outerIndex + outer.length);
			
		}
		
		return replaced + str.substring(lastIndex);
		
	}
	
}

export class Msg extends Cascade {
	
	constructor(msgs, placeholders, outerRx, innerRx) {
		
		Array.isArray(msgs) || (msgs = [ msgs ]),
		
		super(...msgs);
		
		this.placeholder =
			placeholders instanceof Placeholder ? placeholders : new Placeholder(placeholders, outerRx, innerRx);
		
	}
	
	get() {
		
		return this.placeholder.replace(this[Cascade.$get](Cascade.get, false, arguments));
		
	}
	geti() {
		
		return this.placeholder.replace(this[Cascade.$get](Cascade.geti, false, arguments));
		
	}
	
}

export class RL extends Msg {
	
	constructor(rl, ...args) {
		
		super(...args);
		
		this.rl = rl || readline.createInterface({ input: process.stdin, output: process.stdout });
		
	}
	
	close() {
		
		this.rl.close();
		
	}
	q(callback) {
		
		this.rl.question(this.geti('q'), callback);
		
	}
	w() {
		
		this.write(false, arguments);
		
	}
	wi() {
		
		this.write(true, arguments);
		
	}
	write(ignoresCase, keys) {
		
		this.rl.write(this['get' + (ignoresCase ? 'i' : '')](...keys));
		
	}
	
}