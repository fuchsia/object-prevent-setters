Object_preventSetters
====================
`preventSetters()` freezes an object (as per `Object.freeze()`) _and
additionally_ alters it so its setters throw.
  
```js
import {preventSetters,areSettersBlocked} from "object-make-unsettable";  
  
const u = new URL( "https://example.com/index.html" );
preventSetters( u );
areSettersBlocked(u) === true;

u.protocol = "http:"; // ***THROWS****
```
   
Motivation
----------
Modern javascript objects use setters (on the prototype) to define
properties. So `Object.freeze()` is largely ineffectual:
  
```js
const u = new URL( "https://example.com/" );
Object.freeze( u );     
u.protocol = "http:"; // This works!
u.toString() === "http://example.com/"
```  
  
It's for this reason we have abominations like `DOMRectReadOnly`.
Contrast this to, say, C++ where you can just do `const URL url = new
URL("https://example.com");` and know the URL is unwriteable.
  
`preventSetters()` takes a step towards this by re-writing the setters
(including those on the prototype) so they honour a hidden flag on the
object which blocks setting.
  
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
p.x === 1;          

preventSetters( q );
q.translate( 1 ); //< **throws**
```    
  
Installation
------------  
```bash
npm i object-prevent-setters
```        
There's just a single file main.mjs which can be called from the
browser. It exports two functions: `preventSetters()` and
`areSettersBlocked()` 
  
Usage
-----

### preventSetters(object)       
 - `object` Anything.
 - Return: `object`    
   
This takes an `object` and rewrites its own setters, and all the setters
on its prototype chain, so that they _throw_ when used on this object. 
  
It then **freezes the object** (with `Object.freeze()`).
  
In common with `Object.freeze()` non-object values are ignored.  For
convienece, `object` is returned 
    
### areSettersBlocked(object)
 - `object` anything.
 - Return: `boolean` 
  
Returns true iff `preventSetters()` has been called on the object.
Non-objects return false.
        
Limitations and implementation details
-----------------
 - This is trivial to break; for example:
   ```js
        const date = new Date(0);
        assert.equal( date.getUTCHours(), 0 );
        preventSetters( date );
        assert.doesNotThrow( () => date.setUTCHours(1) );     
        assert.equal( date.getUTCHours(), 1 );
   ```
   _(Issue: should we special case date to block this? Are there any
   other obvious classes where we might apply this?)_

   But more subtle cases are possible. For example:
   ```js
        const u = new URL( "https://example.com/index.html" );
        preventSetters( u );
        assert.throws( () => u.search = "?some=thing" );
        u.searchParams.append( "some", "thing" );
        assert.equal( u.toString(), "https://example.com/index.html?some=thing" );  
   ```
  
 - Setters can be inserted onto the object's prototype after
   `preventSetters()` has been called and they won't be blocked.  
  
 - A private field is added to objects passed to `preventSetters()`, in
   addition to its setters being rewritten, and that changes the "shape"
   of the object - which will hurt performance in most engines. It means
   objects which have and haven't been through preventSetters()` will
   have different "shapes" so there's concealed polymorphism.
  
 - The entire prototype chain of an object is monkey-patched with all
   it's setters being rewritten, and each then has the private field
   added. Suffice to say, peformance will suffer. But if this proves
   popular, who knows TC39 may decide to implement it for real. ;)       
  
My recommendation would be:  
  1. Only use `preventSetters()` on your own classes. 
  2. call `preventSetters()` ommediately after the declaraion of a
     class; for example:
  ```js
  class C {
    // ... 
  };
  preventSetters( new C );   
  ```
  This means the changes to the prototype happen before most classes are
  instanced. I might add a class decorator, once this decorators
  become mainstream. 
