/**
 * <p>
 *  Constructs a ProAct.ObjectCore. ProAct.ObjectCore is a {@link ProAct.Core} that manages all the {@link ProAct.Property} instances for a reactive ProAct.js object.
 * </p>
 * <p>
 *  It is responsible for all the {@link ProAct.Property} instances as well initializing them and deciding which type of property corresponds to which field.
 * </p>
 * <p>
 *  ProAct.ObjectCore is part of the properties module of ProAct.js.
 * </p>
 *
 * @class ProAct.ObjectCore
 * @extends ProAct.Core
 * @param {Object} object
 *      The shell objec arrounf this core. This should be plain JavaScript object.
 * @param {Object} meta
 *      Optional meta data to be used to define the observer-observable behavior of the <i>object</i>. For example transformations for its properties.
 * @see {@link ProAct.Property}
 */
ProAct.ObjectCore = P.OC = function (object, meta) {
  this.properties = {};

  P.C.call(this, object, meta); // Super!
};

ProAct.ObjectCore.prototype = P.U.ex(Object.create(P.C.prototype), {

  /**
   * Reference to the constructor of this object.
   *
   * @memberof ProAct.ObjectCore
   * @instance
   * @constant
   * @default ProAct.ObjectCore
   */
  constructor: ProAct.ObjectCore,

  /**
   * A function to be set to the <i>shell</i> object's <b>p</b> field (if it is configured in @{link ProAct.Configuration}).
   * <p>
   *  It uses its <i>p</i> argument if it is string to return the right {@link ProAct.Property} for passed field name.
   * </p>
   * <p>
   *  If the <i>p</i> argument is <b>*</b> or empty <i>this</i> ProAct.ObjectCore instance is returned.
   * </p>
   *
   * @memberof ProAct.ObjectCore
   * @instance
   * @method value
   * @param {String} p
   *      The name of the managed {@link ProAct.Property} to retrieve. It can be set to <b>*</b> or skipped for <i>this</i> itself to be retrieved.
   * @return {Object}
   *      Managed {@link ProAct.Property} instance with field name equal to the passed <i>p</i> parameter or <i>this</i>.
   * @see {@link ProAct.Property}
   */
  value: function (p) {
    if (!p || p === '*') {
      return this;
    }

    return this.properties[p];
  },

  /**
   * Initializes all the {@link ProAct.Property} instances for the <i>shell</i>of <i>this</i> ProAct.ObjectCore.
   * <p>
   *  Using the types of the fields of the <i>shell</i> object the right {@link ProAct.Property} instances are created and stored
   *  in <i>this</i> using {@link ProAct.ObjectCore#makeProp}.
   * </p>
   *
   * @memberof ProAct.ObjectCore
   * @instance
   * @method setup
   * @see {@link ProAct.ObjectCore#makeProp}
   */
  setup: function () {
    var object = this.shell,
        property;

    for (property in object) {
      this.makeProp(property, null, this.meta[property]);
    }
  },
  makeProp: function (property, listeners, meta) {
    var object = this.shell,
        conf = P.Configuration,
        keyprops = conf.keyprops,
        keypropList = conf.keypropList,
        isF = P.U.isFunction,
        isA = P.U.isArrayObject,
        isO = P.U.isObject, result;

    if (meta && (meta === 'noprop' || (meta.indexOf && meta.indexOf('noprop') >= 0))) {
      return;
    }

    if (keyprops && keypropList.indexOf(property) !== -1) {
      throw Error('The property name ' + property + ' is a key word for pro objects! Objects passed to Pro.prob can not contain properties named as keyword properties.');
      return;
    }

    if (object.hasOwnProperty(property) && (object[property] === null || object[property] === undefined)) {
      result = new P.NP(object, property);
    } else if (object.hasOwnProperty(property) && !isF(object[property]) && !isA(object[property]) && !isO(object[property])) {
      result = new P.P(object, property);
    } else if (object.hasOwnProperty(property) && isF(object[property])) {
      result = new P.FP(object, property);
    } else if (object.hasOwnProperty(property) && isA(object[property])) {
      result = new P.AP(object, property);
    } else if (object.hasOwnProperty(property) && isO(object[property])) {
      result = new P.OP(object, property);
    }

    if (listeners) {
      this.properties[property].listeners.change = this.properties[property].listeners.change.concat(listeners);
    }

    if (meta && P.registry) {
      if (!P.U.isArray(meta)) {
        meta = [meta];
      }

      P.registry.setup.apply(P.registry, [result].concat(meta));
    }

    return result;
  },
  set: function (property, value) {
    var object = this.shell;

    object[property] = value;
    if (this.properties[property]) {
      return;
    }

    this.makeProp(property);
  }
});
