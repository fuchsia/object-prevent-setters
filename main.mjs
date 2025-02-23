class WrapToClass {
    constructor( type ) {
        return type;
    }
};

const 
isStampable = object => typeof object === 'object' && object !== null;
 
class Stamp extends WrapToClass {
    #settable = true;
    constructor( type ) {
        super( type );
    }
    static hasBeenStamped( p ) {
        return isStampable( p ) 
            && #settable in p;
    }
    static areSettersBlocked( p ) {
        return hasBeenStamped( p ) 
            && p.#settable === false;
    }
    static mark( p, settable ) {
        // Mirror Object.freeze()
        if ( typeof p !== 'object' || !p )
            return;
        if ( !( #settable in p ) ) {
            p = new Stamp( p );
        }
        if ( settable )
            return;
         
        p.#settable = false;
    }
};
const {hasBeenStamped,areSettersBlocked,mark} = Stamp;
export {areSettersBlocked};

function 
replaceSetters( object ) {
    for ( const [name,descriptor] of Object.entries( Object.getOwnPropertyDescriptors( object ) ) ) {
        const {set} = descriptor;
        if ( typeof set !== 'function' )
            continue;
        descriptor.set = function unsettableSet( value ) {
            if ( areSettersBlocked( this ) )
                throw new Error( `cannot assign to read-only property ${JSON.stringify(name )}` );
            return set.call( this, value );
        }
        Object.defineProperty( object, name, descriptor ); 
    }
}

export function
preventSetters( object ) {
    if ( !isStampable( object ) || areSettersBlocked( object ) ) 
        return object;
    for ( let o = object; o = Object.getPrototypeOf( o ); ) {
        // First draft used a WeakSet to record which prototypes had been seen
        // and the existance of our property was the boolean that indicated
        // whether preventSetters had been called.
        //
        // I decided to stamp everything, and use its value, to avoid a WeakSet.
        // Discuss.
        if ( hasBeenStamped( o ) )
            break;
        replaceSetters( o );
        mark( o, true );
    }
    replaceSetters( object );
    mark( object, false );
    Object.freeze( object );
    return object;
}
 

