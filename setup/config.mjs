import { mkdirSync, readdir, readFile, readFileSync, statSync, writeFile } from 'fs';
import { basename, dirname, join } from 'path';

class Cascade extends Array {
	
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
		
		//const { constructor: { get, geti }, ignoresCase, length } = this;
		//let i,v, method;
		//
		//i = -1, method = ignoresCase ? geti : get;
		//while (++i < length) if ((v = method(this[i], ...keys)) !== undefined) return v;
		
		return this[Cascade.$get](Cascade.get, false, arguments);
		
	}
	getAll() {
		
		//const { constructor: { get, geti }, length } = this, values = [];
		//let i,i0, v, method;
		//
		//i = i0 = -1, method = ignoresCase ? geti : get;
		//while (++i < length) (v = method(this[i], ...keys)) !== undefined && (values[++i0] = v);
		//
		//return values;
		
		return this[Cascade.$get](Cascade.get, true, arguments);
		
	}
	geti() {
		
		return this[Cascade.$get](Cascade.geti, false, arguments);
		
	}
	getiAll() {
		
		return this[Cascade.$get](Cascade.geti, true, arguments);
		
	}
	merge() {
		
		//const { iterator } = Symbol, values = this.getAll(...arguments).reverse(), valuesLength = values.length;
		//let i, v;
		//
		//i = -1;
		//while (++i < valuesLength && !((v = values[i]) && typeof v === 'object'));
		//
		//if (i === valuesLength) return v;
		//else if (typeof v[iterator] === 'function') {
		//	
		//	const merged = [];
		//	
		//	i = -1;
		//	while (++i < valuesLength) typeof (v = values[i])[iterator] === 'function' && merged.push(...v);
		//	
		//	return merged;
		//	
		//} else return Object.assign({}, ...values);
		
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

const	path = new Cascade(JSON.parse(process.argv[3])),
		replace = (target, cascade, outerRx, innerRx) => {
			
			const keys = [];
			let i, replaced, lastIndex;
			
			i = -1, replaced = '', lastIndex = 0;
			for (const matched of target.matchAll(outerRx)) {
				
				i = -1, keys.length = 0;
				for (const matched0 of matched[1].matchAll(innerRx)) keys[++i] = matched0[1].trim();
				
				i === -1 ||	(v = cascade.geti(...keys)) === undefined ||
					(
						replaced += target.substring(lastIndex, matched.index) + v,
						lastIndex = matched.index + matched[0].length
					);
				
			}
			
			return replaced + target.substring(lastIndex);
			
		},
		confirm = (path, callback, asFile, ...args) => {
			
			let stat;
			
			try {
				
				stat = statSync(path);
				
			} catch (error) {}
			
			stat?.['is' + (asFile ? 'File' : 'Directory')]() ?
				callback(path, ...args) : asFile || callback(mkdirSync(path, { recursive: true }), ...args);
			
		},
		paths = [ process.cwd() ],
		settings = new Cascade(),
		placeholderRx = /<\s*?(\[.*?\])\s*?>/gm,
		bracketRx = /\s*?\[\s*?([^\s\[\]]+?)\s*?\]\s*?/gm;
let i,l,i0, k,v, filePath;

v = paths[i = 0];
while (v !== (v = dirname(v))) paths[++i] = v;
paths[++i] = path.geti('installed');

i = i0 = -1, l = paths.length;
while (++i < l) {
	
	try {
		
		v = JSON.parse(replace(readFileSync(join(paths[i], 'gw.placeholder.json'), 'utf8'), path, placeholderRx, bracketRx)),
		(settings[++i0] = v).path = path[0];
		
	} catch (error) {}
	
}

const preset = settings.mergei('preset');
console.log(settings);
for (k in preset) {
	
	readFile(
		filePath = (v = preset[k]).path,
		'utf8',
		((preset, filePath) => (error, file) => {
			
			if (!error) {
				
				confirm(
					preset.dst,
					(path, preset) =>
						writeFile(
								join(path, basename(filePath).replace(new RegExp(...preset.renameRx[0]), preset.renameRx[1])),
								replace(file, settings, placeholderRx, bracketRx),
								error => error && console.error(error)
							),
					false,
					preset
				);
				
			}
			
		})(v, filePath)
	);
	
}