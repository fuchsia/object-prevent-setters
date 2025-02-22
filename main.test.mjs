import * as assert from "node:assert/strict";
import {it,describe} from "node:test";
import {preventSetters,isSettable} from "./main.mjs";

it( "should not change the returned object", () => {
    // We probably shouldn't use URL as this mokey patches URL and so affects othes tests.
    const u = new URL( "https://example.com/index.html" );
    const s = preventSetters( u );
    assert.equal( u, s ); 
} );

it( "should throw on attempt to access a setter",  () => {
    // We probably shouldn't use URL as this mokey patches URL and so affects othes tests.
    const u = new URL( "https://example.com/index.html" );
    preventSetters( u );
    assert.throws( () => {
        u.protocol = "http:";
    }, /^Error: cannot assign to read-only property \"protocol\"/ );
} );

it( "should fail on nested modifier", () => {
    // We probably shouldn't use URL as this mokey patches URL and so affects othes tests.
    const u = new URL( "https://example.com/index.html" );
    const s = preventSetters( u );
    assert.throws( () => u.search = "?some=thing", /^Error: cannot assign to read-only property "search"/ );
    u.searchParams.append( "some", "thing" );
    assert.equal( u.toString(), "https://example.com/index.html?some=thing" ); 
} );


it( "should throw on a derived setter",  () => {
    class Base {
        #x = 0;
        get x() { return this.#x  }
        set x(value) { this.#x = value; }
    };
    class Derived extends Base {
        
        translateX( dx ) {
            this.x += dx;
        }
    };
    const d = new Derived;
    preventSetters( d );
    assert.throws( () => {
        d.translateX( 1 );
    }, /^Error: cannot assign to read-only property \"x\"/  );
} );

it( "a derived setter shouldn't interfere with the base",  () => {
    class Base {
        #x = 0;
        get x() { return this.#x  }
        set x(value) { this.#x = value; }
    };
    class Derived extends Base {
        
        translateX( dx ) {
            this.x += dx;
        }
    };
    const d = new Derived;
    preventSetters( d );
    const b = new Base;
    assert.doesNotThrow( () => b.x = 1 );
} );

it( "a derived setter shouldn't interfere with the sibling",  () => {
    class Base {
        #x = 0;
        get x() { return this.#x  }
        set x(value) { this.#x = value; }
    };
    class Derived extends Base {
        
        translateX( dx ) {
            this.x += dx;
        }
    };
    const d1 = new Derived;
    preventSetters( d1 );
    const d2 = new Derived;
    assert.doesNotThrow( () => d2.translateX( 4 ) );
} );

it( "isSettable ought to work for a virgin object",  () => {
    class Base {
        #x = 0;
        get x() { return this.#x  }
        set x(value) { this.#x = value; }
    };
    assert.equal( isSettable( new Base ), true );
} );

it( "isSettable ought to work for an unsetttable",  () => {
    class Class {
        #x = 0;
        get x() { return this.#x  }
        set x(value) { this.#x = value; }
    };
    const c = new Class;
    preventSetters( c ); 
    assert.equal( isSettable( c ), false );
} );

it( "isSettable ought to work for siblings",  () => {
    class Class {
        #x = 0;
        get x() { return this.#x  }
        set x(value) { this.#x = value; }
    };
    const c1 = new Class,
          c2 = new Class;
    preventSetters( c1 ); 
    assert.equal( isSettable( c1 ), false );
    assert.equal( isSettable( c2 ), true );
} );