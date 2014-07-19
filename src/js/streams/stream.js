/**
 * <p>
 *  Constructs a ProAct.Stream. The stream is a simple {@link ProAct.Observable}, without state.
 * </p>
 * <p>
 *  The streams are ment to emit values, events, changes and can be plugged into another observables.
 *  For example you can connect many streams, to merge them and to divide them, to plug them into properties.
 * </p>
 * <p>
 *  The reactive environment consists of the properties and the objects containing them, but
 *  the outside world is not reactive. It is possible to use the ProAct.Streams as connections from the
 *  outside world to the reactive environment.
 * </p>
 * <p>
 *    The transformations can be used to change the events or values emitetted.
 * </p>
 * <p>
 *  ProAct.Stream is part of the streams module of ProAct.js.
 * </p>
 *
 * @class ProAct.Stream
 * @extends ProAct.Observable
 * @param {ProAct.Observable} source
 *      A devfault source of the stream, can be null.
 * @param {Array} transforms
 *      A list of transformation to be used on all incoming chages.
 */
ProAct.Stream = ProAct.S = function (source, transforms) {
  P.Observable.call(this, transforms);

  if (source) {
    this.into(source);
  }
};

ProAct.Stream.prototype = P.U.ex(Object.create(P.Observable.prototype), {

  /**
   * Reference to the constructor of this object.
   *
   * @memberof ProAct.Stream
   * @instance
   * @constant
   * @type {Object}
   * @default ProAct.Stream
   */
  constructor: ProAct.Stream,

  /**
   * Creates the <i>event</i> to be send to the listeners on update.
   * <p>
   *  Streams don't create new events by default, the event is the source.
   * </p>
   *
   * @memberof ProAct.Stream
   * @instance
   * @method makeEvent
   * @param {ProAct.Event} source
   *      The source event of the event. It can be null
   * @return {ProAct.Event}
   *      The event.
   */
  makeEvent: function (source) {
    return source;
  },

  /**
   * Creates the <i>listener</i> of this stream.
   * <p>
   *  The listener of the stream just calls the method {@link ProAct.Stream#trigger} with the incoming event/value.
   * </p>
   *
   * @memberof ProAct.Stream
   * @instance
   * @method makeListener
   * @return {Object}
   *      The <i>listener of this stream</i>.
   */
  makeListener: function () {
    if (!this.listener) {
      var stream = this;
      this.listener = function (event) {
        stream.trigger(event, true);
      };
    }

    return this.listener;
  },

  /**
   * Creates the <i>error listener</i> of this stream.
   * <p>
   *  The listener just calls {@link ProAct.Stream#triggerErr} of <i>this</i> with the incoming error.
   * </p>
   *
   * @memberof ProAct.Stream
   * @instance
   * @method makeErrListener
   * @return {Object}
   *      The <i>error listener of this stream</i>.
   */
  makeErrListener: function () {
    if (!this.errListener) {
      var stream = this;
      this.errListener = function (error) {
        stream.triggerErr(error);
      };
    }

    return this.errListener;
  },

  /**
   * Defers a ProAct.Observable listener.
   * <p>
   *  For streams this means pushing it to active flow using {@link ProAct.Flow#push}.
   *  If the listener is object with 'property' field, it is done using {@link ProAct.Observable#defer}.
   *  That way the reactive environment is updated only once, but the streams are not part of it.
   * </p>
   *
   * @memberof ProAct.Stream
   * @instance
   * @method defer
   * @param {Object} event
   *      The event/value to pass to the listener.
   * @param {Object} listener
   *      The listener to defer. It should be a function or object defining the <i>call</i> method.
   * @return {ProAct.Observable}
   *      <i>this</i>
   * @see {@link ProAct.Observable#willUpdate}
   * @see {@link ProAct.Observable#makeListener}
   * @see {@link ProAct.flow}
   */
  defer: function (event, listener) {
    if (listener.property) {
      P.Observable.prototype.defer.call(this, event, listener);
      return;
    }

    if (P.U.isFunction(listener)) {
      P.flow.push(listener, [event]);
    } else {
      P.flow.push(listener, listener.call, [event]);
    }
  },

  /**
   * <p>
   *  Triggers a new event/value to the stream. Anything that is listening for events from
   *  this stream will get updated.
   * </p>
   *
   * @memberof ProAct.Stream
   * @instance
   * @method trigger
   * @param {Object} event
   *      The event/value to pass to trigger.
   * @param {Boolean} useTransformations
   *      If the stream should transform the triggered value. By default it is true (if not passed)
   * @return {ProAct.Observable}
   *      <i>this</i>
   * @see {@link ProAct.Observable#update}
   */
  trigger: function (event, useTransformations) {
    if (useTransformations === undefined) {
      useTransformations = true;
    }
    return this.go(event, useTransformations);
  },

  /**
   * <p>
   *  Triggers a new error to the stream. Anything that is listening for errors from
   *  this stream will get updated.
   * </p>
   *
   * @memberof ProAct.Stream
   * @instance
   * @method triggerErr
   * @param {Error} err
   *      The error to trigger.
   * @return {ProAct.Observable}
   *      <i>this</i>
   * @see {@link ProAct.Observable#update}
   */
  triggerErr: function (err) {
    return this.update(err, this.errListeners);
  },

  // private
  go: function (event, useTransformations) {
    var i, tr = this.transforms, ln = tr.length;

    if (useTransformations) {
      try {
        event = P.Observable.transform(this, event);
      } catch (e) {
        this.triggerErr(e);
        return this;
      }
    }

    if (event === P.Observable.BadValue) {
      return this;
    }

    return this.update(event);
  },

  /**
   * Creates a new ProAct.Stream instance with source <i>this</i> and mapping
   * the passed <i>mapping function</i>.
   *
   * @memberof ProAct.Stream
   * @instance
   * @method map
   * @param {Object} mappingFunction
   *      Function or object with a <i>call method</i> to use as map function.
   * @return {ProAct.Stream}
   *      A new ProAct.Stream instance with the <i>mapping</i> applied.
   * @see {@link ProAct.Observable#mapping}
   */
  map: function (mappingFunction) {
    return new P.S(this).mapping(mappingFunction);
  },

  /**
   * Creates a new ProAct.Stream instance with source <i>this</i> and filtering
   * the passed <i>filtering function</i>.
   *
   * @memberof ProAct.Stream
   * @instance
   * @method filter
   * @param {Object} filteringFunction
   *      The filtering function or object with a call method, should return boolean.
   * @return {ProAct.Stream}
   *      A new ProAct.Stream instance with the <i>filtering</i> applied.
   * @see {@link ProAct.Observable#filtering}
   */
  filter: function (filteringFunction) {
    return new P.S(this).filtering(filteringFunction);
  },

  /**
   * Creates a new ProAct.Stream instance with source <i>this</i> and accumulation
   * the passed <i>accumulation function</i>.
   *
   * @memberof ProAct.Stream
   * @instance
   * @method accumulate
   * @param {Object} initVal
   *      Initial value for the accumulation. For example '0' for sum.
   * @param {Object} accumulationFunction
   *      The function to accumulate.
   * @return {ProAct.Stream}
   *      A new ProAct.Stream instance with the <i>accumulation</i> applied.
   * @see {@link ProAct.Observable#accumulation}
   */
  accumulate: function (initVal, accumulationFunction) {
    return new P.S(this).accumulation(initVal, accumulationFunction);
  },

  /**
   * Creates a new ProAct.Stream instance that merges this with other streams.
   * The new instance will have new value on value from any of the source streams.
   *
   * @memberof ProAct.Stream
   * @instance
   * @method merge
   * @param [...]
   *      A list of streams to be set as sources.
   * @return {ProAct.Stream}
   *      A new ProAct.Stream instance with the sources this and all the passed streams.
   * @see {@link ProAct.Observable#accumulation}
   */
  merge: function () {
    var sources = [this].concat(slice.call(arguments)),
        result = new P.S();

    return P.S.prototype.into.apply(result, sources);
  }
});

P.U.ex(P.F.prototype, {

  /**
   * Retrieves the errStream for logging errors from this flow.
   * If there is no error stream, it is created.
   *
   * @memberof ProAct.Flow
   * @instance
   * @method errStream
   * @return {ProAct.Stream}
   *      The error stream of the flow.
   */
  errStream: function () {
    if (!this.errStreamVar) {
      this.errStreamVar = new P.S();
    }

    return this.errStreamVar;
  }
});
