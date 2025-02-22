class WrapToClass {
    constructor( type ) {
        return type;
    }
};
 
class Stamp extends WrapToClass {
    #property;
    constructor( type ) {
        super( type );
    }
    static isUnsettable( p ) {
        return typeof p === 'object' && p && #property in p;
    }
    static markAsUnsettable( p ) {
        // Mirror Object.freeze()
        if ( typeof p !== 'object' || !p )
            return p;
        if ( !( #property in p ) ) {
            return new Stamp( p );
        } else {
            return p;
        }
    }
};

const {isUnsettable,markAsUnsettable} = Stamp;


function 
replaceSetters( object ) {
    for ( const [name,descriptor] of Object.entries( Object.getOwnPropertyDescriptors( object ) ) ) {
        const {set} = descriptor;
        if ( typeof set !== 'function' )
            continue;
        descriptor.set = function unsettableSet( value ) {
            if ( isUnsettable( this ) )
                throw new Error( `cannot assign to read-only property ${JSON.stringify(name )}` );
            return set.call( this, value );
        }
        Object.defineProperty( object, name, descriptor ); 
    }
}

const converted = new WeakSet;
function
makeUnsettable( object ) {
    if ( isUnsettable( object ) ) 
        return object;
    for ( let o = object; o = Object.getPrototypeOf( o ); ) {
        if ( converted.has( o ) )
            break;
        replaceSetters( o );
        converted.add( o );
    }
    replaceSetters( object );
    markAsUnsettable( object );
    Object.freeze( object );
    return object; 
}
export const 
isSettable = object => !isUnsettable( object ),
preventSetters = object => makeUnsettable( object ); 

