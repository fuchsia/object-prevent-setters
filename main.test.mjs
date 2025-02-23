import * as assert from "node:assert/strict";
import {it} from "node:test";
import {preventSetters,areSettersBlocked} from "./main.mjs";

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

it( "areSettersBlocked ought to work for a virgin object",  () => {
    class Base {
        #x = 0;
        get x() { return this.#x  }
        set x(value) { this.#x = value; }
    };
    assert.equal( areSettersBlocked( new Base ), false );
} );

it( "areSettersBlocked ought to work for an unsetttable",  () => {
    class Class {
        #x = 0;
        get x() { return this.#x  }
        set x(value) { this.#x = value; }
    };
    const c = new Class;
    preventSetters( c ); 
    assert.equal( areSettersBlocked( c ), true );
} );

it( "areSettersBlocked ought to work for siblings",  () => {
    class Class {
        #x = 0;
        get x() { return this.#x  }
        set x(value) { this.#x = value; }
    };
    const c1 = new Class,
          c2 = new Class;
    preventSetters( c1 ); 
    assert.equal( areSettersBlocked( c1 ), true );
    assert.equal( areSettersBlocked( c2 ), false );
} );

it( "preventSetters should work on undefined",  () => {
    assert.doesNotThrow( () => preventSetters() );
} );
it( "preventSetters should work on null",  () => {
    assert.doesNotThrow( () => preventSetters( null ) );
} );
it( "preventSetters should work on a string literal",  () => {
    assert.doesNotThrow( () => preventSetters( "" ) );
} );
it( "preventSetters should work on a number",  () => {
    assert.doesNotThrow( () => preventSetters( 4 ) );
} );
it( "preventSetters should work on a null derived object",  () => {
    assert.doesNotThrow( () => preventSetters( Object.create( null ) ) );
} );

// These results are just weird.
it( "areSettersBlocked should work on undefined",  () => {
    assert.equal( areSettersBlocked(), false );
} );
it( "areSettersBlocked should work on null",  () => {
    assert.equal( areSettersBlocked(null), false );
} );
it( "areSettersBlocked should work on number",  () => {
    assert.equal( areSettersBlocked(4), false );
} );
it( "areSettersBlocked should work on an object",  () => {
    assert.equal( areSettersBlocked({}), false );
} );

it( "should run the date example in the docs", () => {
    const date = new Date(0);
    assert.equal( date.getUTCHours(), 0 );
    preventSetters( date );
    assert.doesNotThrow( () => date.setUTCHours(1) );     
    assert.equal( date.getUTCHours(), 1 );
} );

it( "should run the motivation example int he docs", () => {
    const u = new URL( "https://example.com/" );
    Object.freeze( u );     
    u.protocol = "http:"; // This works!
    assert.equal( u.protocol, "http:" ); 
    assert.equal( u.toString(), "http://example.com/" ); 
} );

