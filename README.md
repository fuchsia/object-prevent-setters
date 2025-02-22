Object_preventSetters
====================
Freeze an object _and additionally_ alter it so all its setters throw.
  
```js
import {preventSetters,isSettable} from "object-make-unsettable";  
  
const u = new URL( "https://example.com/index.html" );
preventSetters( u );
console.assert( isSettable(u) === false );

u.protocol = "http:"; // ***THROWS****
```
   
Motivation
----------
Many modern objects don't use setters to define properties. So:
  
```js
const u = new URL( "https://example.com" );
Object.freeze( u);     
u.protocol = "http"; // This works!
```  
  
This leads to horrible things like having `DOMRect` and
`DOMReadOnlyRect`. Compare this with C++, say, where you could just do
`const URL url = new URL("https://example.com");` and you'd know the URL
was unwriteable.
  
`preventSetters` solves that by re-writing setters (including those on
the prototype) so they honour a hidden flag on the object which blocks
setting.
  
It's not perfect. But if a class's methods use its own setters, then you
will get readonly protection:
  
```js
import {preventSetters} from "object-make-unsettable";
class Pt {
  #x = 0;
  get x() { return this.#x }
  set x(value) { this.#x = value }
  
  translate( dx ) {
     // Note `this.x` and _not_ `this.#x` 
     this.x += dx;
  }
}

const p = new Pt, q = new Pt;
Object.freeze(p);
p.translate( 1 ); 
console.assert( p.x === 1 );       
preventSetters( q );
q.translate( 1 ); // throws.
```    
  
Installation
------------  
```bash
npm i object-make-unsettable
```        
There's just as single file main.mjs which can be called from the
browser. It exports two functions. 
  
Usage
-----

### preventSetters(object)       
 - `object` Anything.
 - Return: `object`    
   
This takes `object` alters rewrites its setters and all the setters on
its prototype chain and then **freezes it** (with `Object.freeze`). It
return `object` as a convenience.
  
In common with `Object.freeze()` non-object values are ignored.
  
### isSettable(object)
 - `object` anything.
 - Return: `boolean` 
  
Returns false if the `preventSetters()` has been called on the object.
        

Behind the Scenes
-----------------
This _is_ not going to improve your code's performance:
  
 - There is a `WeakSet` containing all the prototypes that have been
   touched by `preventSetters`.  
  
 - The setters on object and every item on it's prototype chain are
   replaced, no doubt breaking lots of optimisations the browser makers
   have carefully crafted.  
  
 - A hidden private field is added to every unsettable object. That
   changes the "shape" of the object which, again, will ruin
   optimisations the engine makes.
   
But if this proves popular, who knows TC39 may decide to implement it
for real. ;)       
  
 
